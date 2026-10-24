import { describe, expect, it } from 'vitest';
import { loadContentCatalog } from '../content/content-catalog';
import { FIXTURE_WORKSHEETS, FIXTURE_WORKSHEET_SOURCES } from '../../test/test-app';
import { buildWorksheets, lettersOf, loadWorksheets, modelOf, worksheetSources } from './worksheet-builder';

describe('worksheet builder', () => {
  const sheets = FIXTURE_WORKSHEETS;

  it('prints the sheet a quest wrote for itself, all its worksheet steps in order, grouped by subject and topic, with no book, lesson or page', () => {
    expect(sheets.get('quest-viet-chu-a')).toEqual({
      id: 'quest-viet-chu-a',
      subject: { id: 'tieng-viet', name: 'Tiếng Việt' },
      topic: { id: 'viet', title: 'Viết chữ hoa và viết đoạn văn' },
      title: 'Phiếu chữ hoa A',
      blocks: [
        { kind: 'letter', prompt: 'Tô và viết chữ hoa A', letters: ['A'] },
        { kind: 'paragraph-prompt', prompt: 'Viết 2 câu về ngày hè.', hints: ['Hè em đi đâu?'], lines: 4 },
      ],
    });
  });

  it('still builds a quest that waits to be rewritten from its inventory lesson, titled after the quest', () => {
    expect(sheets.get('quest-hom-qua')?.blocks).toEqual([
      { kind: 'dictation', prompt: 'Nghe – viết: Ngày hôm qua đâu rồi? (2 khổ thơ đầu)', title: 'Ngày hôm qua đâu rồi?', text: 'Em cầm tờ lịch cũ', curriculumRef: ['tv2-t1-b02-nghe-viet-1'] },
      { kind: 'paragraph-prompt', prompt: 'Viết 2 – 3 câu giới thiệu bản thân.', hints: ['G: Em tên là gì?', 'G: Em học lớp mấy?'], lines: 6, curriculumRef: ['tv2-t1-b02-viet-doan-1'] },
    ]);
    expect(sheets.get('quest-bi-bong')).toMatchObject({ title: 'Cầu vồng sau mưa', blocks: [{ kind: 'letter', letters: ['Ă', 'Â'] }, { kind: 'copy-line', model: ['Ăn chậm nhai kĩ.'] }] });
    // Two worksheet steps handing out the same lesson print it once.
    expect(sheets.get('quest-can-gao')?.blocks).toEqual([{ kind: 'activity', prompt: 'Cân một số đồ vật trong nhà.', media: ['cân đồng hồ', 'túi gạo'], curriculumRef: ['toan2-t1-b17-hoat-dong-1'] }]);
    // A lesson with nothing to write gives no sheet; so does a missing lesson.
    expect(sheets.has('quest-khong-phieu')).toBe(false);
    const legacy = FIXTURE_WORKSHEET_SOURCES[1];
    if (!legacy) throw new Error('fixture');
    expect(buildWorksheets([{ ...legacy, id: 'x', parts: [{ lessonId: 'tv2-t1-b99' }] }]).size).toBe(0);
  });

  it('finds the capitals to write in the prompt, or in the picture of the model when the prompt has none', () => {
    const item = { id: 'x', page: 1, exerciseType: 'viet-chu' as const, readConfidence: 'high' as const };
    expect(lettersOf({ ...item, prompt: 'Viết chữ hoa: I, K' })).toEqual(['I', 'K']);
    expect(lettersOf({ ...item, prompt: 'Viết chữ hoa Ă, Â.' })).toEqual(['Ă', 'Â']);
    const pictured = ['mẫu chữ hoa Ô cỡ vừa trên ô li có đánh số nét 1, 2, 3', 'mẫu chữ hoa Ô cỡ nhỏ', 'mẫu chữ hoa Ơ cỡ vừa'];
    expect(lettersOf({ ...item, prompt: 'Viết chữ hoa:', media: pictured })).toEqual(['Ô', 'Ơ']);
    expect(modelOf('Viết ứng dụng: Dung dăng dung dẻ\nDắt trẻ đi chơi.')).toEqual(['Dung dăng dung dẻ', 'Dắt trẻ đi chơi.']);
    expect(modelOf('Ăn chậm nhai kĩ.')).toEqual(['Ăn chậm nhai kĩ.']);
  });

  it('builds the shipped quests sheets: one per quest that hands one out, each capital block with its letters', () => {
    const content = loadContentCatalog();
    const sources = worksheetSources(content);
    expect(sources.length).toBeGreaterThan(30);
    const shipped = loadWorksheets(content);
    expect(shipped.size).toBeGreaterThan(30);
    for (const sheet of shipped.values()) expect(content.quests.get(sheet.id)?.title).toBeDefined();
    const blocks = [...shipped.values()].flatMap((w) => w.blocks);
    for (const block of blocks.filter((b) => b.kind === 'letter')) expect(block.letters.length, block.curriculumRef?.join()).toBeGreaterThan(0);
    for (const block of blocks) if (block.kind === 'copy-line') for (const line of block.model ?? []) expect(block.text).toContain(line);
  });
});
