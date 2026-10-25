// `pnpm learning:acceptance [<quest id> …]`: the owner's acceptance page for quests rewritten in our own words. For
// each quest, every step shows the version played from the textbook (from git, before the rewrite) next to the new
// one, with the objective it practises, the reading's source and the result of the textbook copy check.
//
// The old column still holds textbook wording, so the page is written to .data/acceptance/ (outside git) and is
// shared privately; it never goes into the web build or the repo.
import { execFileSync } from 'node:child_process';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { readQuestDefinitions } from '../../apps/server/src/content/content-catalog';
import { indexTopics, readTopicFiles } from '../../apps/server/src/content/learning-topics';
import { QuestDefinition, type QuestStep } from '../../packages/schema/src/content';
import { RegionCatalog } from '../../packages/schema/src/region';
import { stepMechanic } from '../content/mechanic-rules';
import { checkRepoTextbookCopy, copiedLines, copiedPassages } from '../content/no-textbook-copy';
import { fingerprintKey, readFingerprints } from './textbook-fingerprints';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
/** The last commit whose quests are still the textbook versions. */
const BEFORE = '90294f44';
const OUT = path.join(ROOT, '.data/acceptance/index.html');
const SAMPLES = ['tv2-t01-b01', 'tv2-t14-b25', 'toan2-cd1-b05', 'toan2-cd2-b09', 'toan2-cd6-b29'];
/** What the reviewer should look at in each sample: choices the writers made that only the owner can settle. */
const NOTES: Record<string, string[]> = {
  'tv2-t01-b01': ['Bài đọc tự viết, cốt truyện khác hẳn bài cũ (cô bé Na và chiếc cặp mới), cùng mục tiêu: chi tiết, việc làm và cảm xúc của nhân vật, thứ tự sự việc, nghĩa từ.', 'Tên mục tiêu trên map còn chữ lớp: đổi khi sinh lại map.'],
  'tv2-t14-b25': ['Bài đọc là truyện kể dân gian "Hai anh em" (lưu truyền ở nhiều nước), kể lại bằng lời mới; khung quest là chị em ong nên nối bằng lời thoại. Nếu muốn một truyện cổ tích Việt về chị em, cần chọn truyện khác.', 'Phần kể chuyện theo tranh là truyện tự viết "chiếc lá che mưa"; game không có giọng kể, nên bước xếp tranh và bước kể dựa trên tranh.'],
  'toan2-cd1-b05': ['Mọi phép tính giữ không nhớ, cùng phạm vi 100; bài toán chuyển sang thế giới bưu điện của Chó Mực.'],
  'toan2-cd2-b09': ['Khung Tóm tắt / Bài giải / Đáp số giữ, câu chữ của khung viết lại.'],
  'toan2-cd6-b29': ['Giờ và tình huống mới, chỉ dùng phút 15 và 30 như mục tiêu chủ đề.', 'Id bước vẫn mang giờ cũ (vd ban-gai-ngu-luc-23-gio, nay 22 giờ): id giữ nguyên để không mất tiến độ, người chơi không thấy id.'],
};

const MECHANIC_NAMES: Record<string, string> = {
  dialogue: 'Hội thoại', search: 'Tìm đồ', read: 'Đọc bài', riddle: 'Câu đố', speak: 'Nói', worksheet: 'Phiếu viết', reward: 'Phần thưởng', next: 'Tiếp nối',
  quiz: 'Trắc nghiệm', 'multi-select': 'Chọn nhiều', classify: 'Phân loại', 'fill-blank': 'Điền chỗ trống', sort: 'Sắp xếp', clock: 'Đồng hồ', calendar: 'Lịch',
  connect: 'Nối điểm', 'drag-drop': 'Kéo thả', 'find-object': 'Tìm vật', decision: 'Lựa chọn', boss: 'Đấu trùm', logic: 'Suy luận',
};
/** Keys that are ids or machine data, not text a player reads. */
const NOT_TEXT = new Set(['id', 'kind', 'mechanic', 'trigger', 'target', 'targets', 'skill', 'textRef', 'objective', 'expression', 'answer', 'type', 'params', 'n', 'mode', 'display', 'en', 'audio']);

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const withName = (html: string) => html.replace(/\{name\}/g, '<span class="who">tên bé</span>').replace(/\{\{([a-z0-9-]+)\}\}/g, '<span class="blank">▢</span>');

/** Every line of a step a player reads, as "label: text" pairs, in order. */
function stepLines(step: QuestStep): Array<{ label: string; text: string }> {
  const lines: Array<{ label: string; text: string }> = [];
  const visit = (value: unknown, label: string): void => {
    if (typeof value === 'string') lines.push({ label, text: value });
    else if (Array.isArray(value)) value.forEach((v) => visit(v, label));
    else if (typeof value === 'object' && value !== null) for (const [k, v] of Object.entries(value)) if (!NOT_TEXT.has(k)) visit(v, label ? `${label} › ${k}` : k);
  };
  visit(step, '');
  return lines;
}

const LABELS: Record<string, string> = {
  title: 'Tên bước', goTo: 'Chỉ đường', prompt: 'Đề', question: 'Câu hỏi', text: 'Lời', 'choices › text': 'Lựa chọn', template: 'Mẫu điền', 'blanks › options › text': 'Ô điền',
  'items › label': 'Thẻ', 'groups › label': 'Nhóm', hints: 'Gợi ý', 'lines › text': 'Lời thoại', 'lines › speaker': 'Người nói', 'support › guide': 'Hướng dẫn',
  'support › hint': 'Gợi ý', 'support › answer › text': 'Đáp án', 'support › answer › explanation': 'Giải thích', 'feedback › right': 'Khen', 'feedback › wrong': 'Nhắc',
  'sheet › title': 'Phiếu', 'sheet › blocks › prompt': 'Phiếu: đề', 'sheet › blocks › text': 'Phiếu: chữ', 'sheet › blocks › hints': 'Phiếu: gợi ý',
};

function linesHtml(step: QuestStep | undefined): string {
  if (!step) return '<p class="muted">(không có)</p>';
  return `<dl>${stepLines(step)
    .map((l) => `<dt>${esc(LABELS[l.label] ?? l.label)}</dt><dd>${withName(esc(l.text)).replace(/\n/g, '<br>')}</dd>`)
    .join('')}</dl>`;
}

function answerOf(step: QuestStep): string {
  if (!('answer' in step) || step.answer === undefined) return '';
  const pick = (id: string) => ('choices' in step ? step.choices.find((c) => 'id' in c && c.id === id)?.text : undefined) ?? id;
  const a = step.answer as Record<string, unknown>;
  if (typeof a.value === 'number') return String(a.value);
  if (typeof a.choice === 'string') return pick(a.choice);
  if (Array.isArray(a.choices)) return a.choices.map((c) => pick(String(c))).join('; ');
  if (typeof a.total === 'number') return `tổng ${a.total}`;
  if (typeof a.hour === 'number') return `${a.hour} giờ ${String(a.minute ?? 0)} phút`;
  if (a.fills && step.kind === 'challenge' && step.mechanic === 'fill-blank') {
    const fills = a.fills as Record<string, string>;
    return step.blanks.map((b) => b.options.find((o) => o.id === fills[b.id])?.text ?? '?').join(' · ');
  }
  if (Array.isArray(a.order) && step.kind === 'challenge' && step.mechanic === 'sort') return a.order.map((id) => step.items.find((i) => i.id === id)?.label ?? id).join(' → ');
  return JSON.stringify(a);
}

const isRecord = (value: unknown): value is Record<string, unknown> => typeof value === 'object' && value !== null && !Array.isArray(value);

/**
 * A quest as it was before the rewrite, readable by today's schema: it still carried the textbook's lesson, inventory
 * references, passage authors and sections, and worksheets printed from a textbook lesson (`lessonId`), none of which
 * the schema keeps any more. Those are dropped (a lesson worksheet becomes a one-line placeholder); the passages'
 * authors are returned apart for the old column.
 */
function legacyQuest(raw: unknown): { quest: QuestDefinition; authors: Map<string, string> } {
  if (!isRecord(raw)) throw new Error('a quest file holds an object');
  const { lesson: _lesson, ...rest } = raw;
  const authors = new Map<string, string>();
  const texts = isRecord(rest.texts)
    ? Object.fromEntries(
        Object.entries(rest.texts).map(([id, text]) => {
          if (!isRecord(text)) return [id, text];
          const { author, section: _section, ...kept } = text;
          if (typeof author === 'string') authors.set(id, author);
          return [id, kept];
        }),
      )
    : rest.texts;
  const steps = Array.isArray(rest.steps)
    ? rest.steps.map((step: unknown) => {
        if (!isRecord(step)) return step;
        const { curriculumRef: _ref, lessonId, ...kept } = step;
        if (kept.kind !== 'worksheet' || kept.sheet !== undefined) return kept;
        const prompt = typeof lessonId === 'string' ? `Phiếu in từ bài ${lessonId} của sách` : 'Phiếu in từ bài của sách';
        return { ...kept, sheet: { title: 'Phiếu viết cũ', blocks: [{ kind: 'activity', prompt, media: [] }] } };
      })
    : rest.steps;
  return { quest: QuestDefinition.parse({ ...rest, texts, steps }), authors };
}

function main(): void {
  const ids = process.argv.slice(2).length > 0 ? process.argv.slice(2) : SAMPLES;
  const key = fingerprintKey();
  if (!key) throw new Error('the copy check needs its key (MIU_FINGERPRINT_KEY or the owner iCloud file)');
  const context = { key, fingerprints: readFingerprints(), allowed: new Set<number>() };
  const regions = new Map(RegionCatalog.parse(JSON.parse(readFileSync(path.join(ROOT, 'content/world/regions.json'), 'utf8'))).regions.map((r) => [r.id, r.name]));
  const quests = readQuestDefinitions(path.join(ROOT, 'content/quests'));
  const { topics } = readTopicFiles(path.join(ROOT, 'content/learning/topics'));
  const learning = indexTopics(topics);
  const gate = checkRepoTextbookCopy(quests, topics).issues;
  const sections = ids.map((id) => {
    const quest = quests.find((q) => q.id === id);
    if (!quest || quest.status === 'stub') throw new Error(`no quest ${id}`);
    const { quest: old, authors: oldAuthors } = legacyQuest(JSON.parse(execFileSync('git', ['show', `${BEFORE}:content/quests/${id}.json`], { cwd: ROOT, encoding: 'utf8' })) as unknown);
    if (old.status === 'stub') throw new Error(`${id} was a stub`);
    const topic = quest.topic ? learning.topics.get(quest.topic) : undefined;
    const before = copiedLines(old, context).length + copiedPassages(old, context).length;
    const after = copiedLines(quest, context).length + copiedPassages(quest, context).length;
    const issues = gate.filter((i) => i.includes(`quest ${id} `));
    const passages = Object.entries(quest.texts).map(([tid, t]) => {
      const [wasId, was] = Object.entries(old.texts)[0] ?? [];
      const wasAuthor = wasId === undefined ? undefined : oldAuthors.get(wasId);
      const src = t.source ? (t.source.kind === 'original' ? 'tự viết' : t.source.kind === 'folk' ? `dân gian: ${t.source.title}` : `hết bảo hộ: ${t.source.author} (mất ${t.source.died})`) : 'chưa khai nguồn';
      return `<div class="pair"><div class="old"><h4>Bài đọc cũ: ${esc(was?.title ?? '—')}${wasAuthor ? ` — ${esc(wasAuthor)}` : ''}</h4><p>${esc(was?.body ?? '').replace(/\n/g, '<br>')}</p></div>
        <div class="new"><h4>Bài đọc mới (${esc(tid)}): ${esc(t.title)} <span class="tag">${esc(src)}</span></h4><p>${esc(t.body).replace(/\n/g, '<br>')}</p>${t.glossary?.length ? `<p class="muted">Từ ngữ: ${t.glossary.map((g) => `<b>${esc(g.term)}</b>: ${esc(g.meaning)}`).join('; ')}</p>` : ''}</div></div>`;
    });
    const rows = quest.steps.map((step, i) => {
      const was = old.steps.find((s) => s.id === step.id);
      const objective = 'objective' in step && step.objective ? learning.objectives.get(step.objective) : undefined;
      const expression = 'expression' in step && step.expression !== undefined ? (typeof step.expression === 'string' ? step.expression : Object.entries(step.expression).map(([b, e]) => `${b}: ${e}`).join('; ')) : '';
      const ans = answerOf(step);
      return `<article class="step" id="${esc(id)}-${esc(step.id)}">
        <header><span class="num">${i + 1}</span> <b>${esc(MECHANIC_NAMES[stepMechanic(step)] ?? stepMechanic(step))}</b> <span class="muted">${esc(step.id)}</span>
        ${objective ? `<span class="tag">Mục tiêu: ${esc(objective.objective.text)}</span>` : ''}${ans ? `<span class="tag ans">Đáp án: ${withName(esc(ans))}</span>` : ''}${expression ? `<span class="tag">Tính: ${esc(expression)}</span>` : ''}</header>
        <div class="pair"><div class="old">${linesHtml(was)}</div><div class="new">${linesHtml(step)}</div></div></article>`;
    });
    return `<section class="quest" id="${esc(id)}">
      <h2>${withName(esc(quest.title))}</h2>
      <p class="muted">Trước: ${withName(esc(old.title))} · ${esc(regions.get(quest.region) ?? quest.region)} · chủ đề <b>${esc(topic?.title ?? '?')}</b> · ${quest.steps.length} bước</p>
      <p class="check ${after === 0 && issues.length === 0 ? 'ok' : 'bad'}">Kiểm chống chép: bản cũ ${before} chỗ trùng vân tay sách → bản mới ${after}. ${issues.length === 0 ? 'Cổng nội dung không báo lỗi.' : `Cổng báo: ${issues.map(esc).join(' | ')}`}</p>
      ${(NOTES[id] ?? []).length ? `<ul class="notes">${(NOTES[id] ?? []).map((n) => `<li>${esc(n)}</li>`).join('')}</ul>` : ''}
      ${passages.join('')}
      ${rows.join('\n')}
    </section>`;
  });
  const toc = ids.map((id) => `<li><a href="#${esc(id)}">${withName(esc(quests.find((q) => q.id === id)?.title ?? id))}</a></li>`).join('');
  mkdirSync(path.dirname(OUT), { recursive: true });
  writeFileSync(OUT, template(toc, sections.join('\n')));
  console.log(`${path.relative(ROOT, OUT)}: ${ids.length} quest(s)`);
}

function template(toc: string, body: string): string {
  // A page fragment: the publishing host wraps it in the document skeleton (charset, viewport, reset).
  return `<title>Nghiệm thu quest mẫu</title>
<meta name="claude:viewport-fit-sides" content="cover">
<style>
:root { --bg: #f4f7ff; --surface: #fff; --ink: #2b2140; --soft: #5e5378; --line: #d5e2ff; --old: #fff4e0; --new: #e6f7ec; --accent: #2f6fdb; --bad: #b3261e; --good: #1f7a3d; }
@media (prefers-color-scheme: dark) { :root:not([data-theme="light"]) { --bg: #17131f; --surface: #221c2e; --ink: #f1ecfa; --soft: #b7abcf; --line: #3a3150; --old: #3a2f1c; --new: #1b3324; --accent: #86b3ff; --bad: #ff8a80; --good: #7fdc9b; color-scheme: dark; } }
:root[data-theme="dark"] { --bg: #17131f; --surface: #221c2e; --ink: #f1ecfa; --soft: #b7abcf; --line: #3a3150; --old: #3a2f1c; --new: #1b3324; --accent: #86b3ff; --bad: #ff8a80; --good: #7fdc9b; color-scheme: dark; }
body { margin: 0; background: var(--bg); color: var(--ink); font: 15px/1.5 system-ui, -apple-system, 'Segoe UI', sans-serif; }
main { max-width: 1200px; margin: 0 auto; padding-block: 16px; padding-left: max(16px, env(safe-area-inset-left, 0px)); padding-right: max(16px, env(safe-area-inset-right, 0px)); }
.old, .new, dd { min-width: 0; overflow-wrap: anywhere; }
a:focus-visible { outline: 2px solid var(--accent); outline-offset: 2px; }
h1 { font-size: 1.6rem; } h2 { margin-top: 2.5rem; border-bottom: 2px solid var(--line); }
.muted { color: var(--soft); } .who { font-weight: 700; color: var(--accent); } .blank { color: var(--accent); }
ul.notes { background: var(--surface); border: 1px dashed var(--line); border-radius: 10px; padding-block: 8px; }
.check { padding: 8px 12px; border-radius: 10px; background: var(--surface); border-left: 4px solid var(--good); } .check.bad { border-color: var(--bad); }
.step { background: var(--surface); border: 1px solid var(--line); border-radius: 12px; margin: 12px 0; padding: 10px 12px; }
.step header { display: flex; flex-wrap: wrap; gap: 6px 10px; align-items: center; margin-bottom: 6px; }
.num { display: inline-grid; place-items: center; width: 26px; height: 26px; border-radius: 50%; background: var(--line); font-weight: 700; }
.tag { font-size: 0.85rem; padding: 2px 8px; border-radius: 999px; background: var(--line); } .tag.ans { background: var(--new); }
.pair { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; } .old, .new { border-radius: 8px; padding: 8px 10px; } .old { background: var(--old); } .new { background: var(--new); }
.old::before { content: 'Bản cũ (theo sách)'; display: block; font-size: 0.8rem; font-weight: 700; color: var(--soft); } .new::before { content: 'Bản mới'; display: block; font-size: 0.8rem; font-weight: 700; color: var(--soft); }
dl { margin: 0; display: grid; grid-template-columns: max-content 1fr; gap: 2px 10px; } dt { color: var(--soft); font-size: 0.85rem; } dd { margin: 0; }
h4 { margin: 4px 0; }
@media (max-width: 760px) { .pair { grid-template-columns: 1fr; } dl { grid-template-columns: 1fr; } }
</style>
<main lang="vi">
<h1>Nghiệm thu quest mẫu: nội dung tự viết</h1>
<p>Mỗi bước đặt bản cũ (chép từ sách in, lấy từ git trước khi viết lại) cạnh bản mới. Id bước, nơi chốn trên map, cơ chế chơi giữ nguyên; chữ, số, bài đọc viết mới. Góp ý ở đây sẽ thành luật viết chung cho 70 quest. Chơi thử trong game sau lần deploy tới (các quest mẫu đã bật), hoặc ở bản chạy trên máy.</p>
<ol>${toc}</ol>
${body}
</main>
`;
}

main();
