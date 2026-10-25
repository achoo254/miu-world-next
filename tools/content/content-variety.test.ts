import { describe, expect, it } from 'vitest';
import { QuestDefinition } from '../../packages/schema/src/content';
import { normaliseWording, varietyIssues } from './content-variety';

const support = (tag: string) => ({ guide: [`Hướng dẫn riêng của ${tag}`], hint: `Gợi ý riêng cho ${tag}`, answer: { text: '2', explanation: `Giải thích riêng của ${tag}` } });

/** A quest whose every line carries its own tag, so two quests never share a line unless a test says so. */
function quest(id: string, tag: string, extra: Record<string, unknown> = {}) {
  return QuestDefinition.parse({
    id,
    region: 'khu-rung-bi-mat',
    chapter: 1,
    title: `Chuyến đi ${tag}`,
    status: 'active',
    summary: `Câu chuyện riêng của ${tag}`,
    review: 'teacher-pending',
    sevenQuestions: { who: 'Vẹt', where: 'Rừng', goal: 'Giúp', play: 'Tìm', learn: 'Cộng', reward: 'XP', next: 'Tiếp' },
    phases: { hook: 'hi', explore: 'find', learn: 'find', challenge: 'add', decision: 'add', finale: 'add', reward: 'add', next: 'add' },
    steps: [
      { id: 'hi', title: 'Chào', kind: 'dialogue', trigger: 'auto', lines: [{ speaker: 'Vẹt', text: `Xin chào, hôm nay ${tag} thật vui!` }] },
      { id: 'find', title: 'Tìm', kind: 'search', targets: ['box'] },
      { id: 'add', title: 'Đố', kind: 'riddle', trigger: 'auto', question: `Câu đố số học của ${tag}`, skill: 'phep-cong', answer: { value: 2 }, support: support(tag) },
    ],
    reward: { xp: 10 },
    ...extra,
  });
}

describe('varietyIssues', () => {
  it('accepts quests that each speak with their own lines', () => {
    expect(varietyIssues([quest('a', 'buổi sáng'), quest('b', 'buổi chiều')])).toEqual([]);
  });

  it('flags a line reused in another quest, support text included', () => {
    const copy = quest('b', 'buổi chiều');
    if (copy.status !== 'active') throw new Error('active');
    const riddle = copy.steps[2];
    if (riddle?.kind !== 'riddle') throw new Error('riddle');
    riddle.support.answer.explanation = 'Giải thích riêng của buổi sáng';
    expect(varietyIssues([quest('a', 'buổi sáng'), copy])).toEqual([
      'quest b steps[2].support.answer.explanation repeats "Giải thích riêng của buổi sáng" (already used by quest a steps[2].support.answer.explanation): write a new line',
    ]);
  });

  it('lets an English twin keep its own Vietnamese line, but not another one', () => {
    const name = 'Chi chi chành chành cái đanh thổi lửa';
    const own = quest('a', 'buổi sáng', { en: { title: 'A trip in the morning', summary: 'A morning story' } });
    if (own.status !== 'active') throw new Error('active');
    const hi = own.steps[0];
    if (hi?.kind !== 'dialogue') throw new Error('dialogue');
    hi.title = name;
    hi.en = { title: name, lines: ['Hello, what a fine morning!'], choices: [] };
    expect(varietyIssues([own])).toEqual([]);
    hi.en = { title: 'A trip in the morning', lines: ['Hello, what a fine morning!'], choices: [] };
    expect(varietyIssues([own])).toEqual(['quest a en.title repeats "A trip in the morning" (already used by quest a steps[0].en.title): write a new line']);
  });

  it('reports an English twin that leaves a line or a choice in Vietnamese', () => {
    const own = quest('a', 'buổi sáng');
    if (own.status !== 'active') throw new Error('active');
    const hi = own.steps[0];
    if (hi?.kind !== 'dialogue') throw new Error('dialogue');
    const line = hi.lines[0]?.text ?? '';
    const choice = 'Mình đi cùng bạn nhé, đợi một chút';
    hi.choices = [{ text: choice }];
    hi.en = { lines: [line], choices: [{ text: choice }] };
    expect(varietyIssues([own])).toEqual([
      `quest a steps[0].en.lines[0] repeats "${line}" (already used by quest a steps[0].lines[0].text): write a new line`,
      `quest a steps[0].en.choices[0].text repeats "${choice}" (already used by quest a steps[0].choices[0].text): write a new line`,
    ]);
  });

  it("lets a boss question's answer layer name its right choice, but not reuse another line", () => {
    const label = (n: number) => `Các bạn nhỏ chơi rồng rắn lên mây ${n}`;
    const bossOf = (tag: string, explanation: string) => ({
      id: 'trum',
      title: 'Đấu trí',
      kind: 'boss',
      trigger: 'auto',
      bossId: 'than-rung',
      bossName: 'Thần Rừng',
      introDialogue: `Ta thách đố ${tag} đây`,
      winDialogue: `Ta chịu thua ${tag} rồi`,
      maxHp: 160,
      damagePerTurn: 80,
      turns: [1, 2].map((n) => ({
        id: `q${n}`,
        prompt: `Câu đố thứ ${n} của ${tag}`,
        skill: 'cau',
        move: n === 1 ? 'gem' : 'charge',
        choices: [{ id: 'a', text: label(n) }, { id: 'b', text: `Khu rừng ${tag} rất yên tĩnh ${n}` }],
        answer: { choice: 'a' },
        support: {
          guide: [`Đọc từng câu của ${tag}, lượt ${n}`],
          hint: `Tìm câu có việc đang làm, ${tag} ${n}`,
          answer: { text: label(n), explanation: n === 1 ? explanation : `Giải thích lượt hai của ${tag}` },
          en: { guide: [`Read each sentence of ${tag}, turn ${n}`], hint: `Look for something being done, ${tag} ${n}`, answer: { text: `Children play a game ${tag} ${n}`, explanation: `Explained for ${tag}, turn ${n}` } },
        },
      })),
    });
    const withBoss = (id: string, tag: string, explanation: string) => {
      const q = quest(id, tag);
      if (q.status !== 'active') throw new Error('active');
      return QuestDefinition.parse({ ...q, steps: [...q.steps, bossOf(tag, explanation)] });
    };
    expect(varietyIssues([withBoss('a', 'buổi sáng', 'Giải thích lượt một của buổi sáng')])).toEqual([]);
    expect(varietyIssues([withBoss('a', 'buổi sáng', 'Giải thích riêng của buổi sáng')])).toEqual([
      'quest a steps[3].turns[0].support.answer.explanation repeats "Giải thích riêng của buổi sáng" (already used by quest a steps[2].support.answer.explanation): write a new line',
    ]);
  });

  it('ignores short labels and graded answers', () => {
    const a = quest('a', 'buổi sáng', { title: 'Đọc bài' });
    const b = quest('b', 'buổi chiều', { title: 'Đọc bài' });
    expect(varietyIssues([a, b])).toEqual([]);
  });

  it('flags two learning quests that play the same sequence of mechanics', () => {
    const learning = (id: string, tag: string, order: 'sort-first' | 'pick-first') => {
      const fb = (n: string) => ({ right: [1, 2, 3].map((i) => `${tag} ${n} khen ${i}`), wrong: [1, 2, 3].map((i) => `${tag} ${n} nhắc ${i}`) });
      const sort = { id: 'sort', title: 'Xếp', kind: 'challenge', mechanic: 'sort', trigger: 'auto', prompt: `Xếp các số của ${tag}`, skill: 'phep-cong', items: [{ id: 'b', label: '9' }, { id: 'a', label: '3' }], answer: { order: ['a', 'b'] }, support: support(`${tag} xếp`), feedback: fb('xếp') };
      const pick = { id: 'pick', title: 'Chọn', kind: 'challenge', mechanic: 'multi-select', trigger: 'auto', prompt: `Chọn số chẵn của ${tag}`, skill: 'phep-cong', choices: [{ id: 'c', text: '2' }, { id: 'd', text: '3' }], answer: { choices: ['c'] }, support: support(`${tag} chọn`), feedback: fb('chọn') };
      const steps = order === 'sort-first' ? [sort, pick] : [pick, sort];
      const [first, second] = steps;
      return quest(id, tag, {
        status: 'draft',
        topic: 'so-den-100',
        steps,
        phases: { hook: first?.id, explore: first?.id, learn: first?.id, challenge: second?.id, decision: second?.id, finale: second?.id, reward: second?.id, next: second?.id },
      });
    };
    const a = learning('toan2-cd1-b01', 'buổi sáng', 'sort-first');
    expect(varietyIssues([a, learning('toan2-cd1-b02', 'buổi chiều', 'pick-first')])).toEqual([]);
    expect(varietyIssues([a, learning('toan2-cd1-b02', 'buổi chiều', 'sort-first')])).toEqual([
      'quest toan2-cd1-b02 plays exactly like toan2-cd1-b01 (sort → multi-select): vary the mechanics or their order',
    ]);
  });
});

describe('normaliseWording', () => {
  it('turns every blank mark into "?" and runs of spaces into one, nothing else', () => {
    expect(normaliseWording('47 {{b1}}  38\n+ 5')).toBe('47 ? 38 + 5');
    expect(normaliseWording('Điền c … k')).toBe('Điền c ? k');
    expect(normaliseWording('■ụ ◻ □')).toBe('?ụ ? ?');
    expect(normaliseWording('Tôi chào mẹ.')).not.toBe(normaliseWording('Toi chao me.'));
  });
});
