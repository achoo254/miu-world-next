import { describe, expect, it } from 'vitest';
import { loadContentCatalog } from '../content/content-catalog';
import { FIXTURE_WORKSHEETS } from '../../test/test-app';
import { loadWorksheets, worksheetSources } from './worksheet-builder';

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

  it('gives no sheet to a quest with nothing to write', () => {
    expect(sheets.has('quest-khong-phieu')).toBe(false);
  });

  it('builds the shipped quests sheets: one per quest that hands one out, each capital block with its letters', () => {
    const content = loadContentCatalog();
    const sources = worksheetSources(content);
    expect(sources.length).toBeGreaterThan(30);
    const shipped = loadWorksheets(content);
    expect(shipped.size).toBeGreaterThan(30);
    for (const sheet of shipped.values()) expect(content.quests.get(sheet.id)?.title).toBeDefined();
    const blocks = [...shipped.values()].flatMap((w) => w.blocks.map((block) => ({ sheet: w.id, block })));
    for (const { sheet, block } of blocks) if (block.kind === 'letter') expect(block.letters.length, sheet).toBeGreaterThan(0);
    for (const { block } of blocks) if (block.kind === 'copy-line') for (const line of block.model ?? []) expect(block.text).toContain(line);
  });
});
