import { describe, expect, it } from 'vitest';
import { Worksheet } from './worksheet';

const sheet = {
  id: 'tv2-t02-b03',
  subject: { id: 'tieng-viet', name: 'Tiếng Việt' },
  topic: { id: 'doc-truyen', title: 'Đọc truyện và kể chuyện' },
  title: 'Cầu vồng sau mưa',
  blocks: [{ kind: 'copy-line', text: 'Ăn chậm nhai kĩ.' }],
};

describe('Worksheet', () => {
  it('belongs to a quest, under its subject and topic, with no book, week or page', () => {
    expect(Worksheet.parse(sheet).blocks).toHaveLength(1);
    expect(Worksheet.parse({ ...sheet, bookId: 'tv2-t1', pages: [1, 2] })).not.toHaveProperty('bookId');
  });

  it('needs at least one block; an inventory reference, when there is one, is never empty', () => {
    expect(Worksheet.safeParse({ ...sheet, blocks: [] }).success).toBe(false);
    expect(Worksheet.safeParse({ ...sheet, blocks: [{ ...sheet.blocks[0], curriculumRef: [] }] }).success).toBe(false);
    expect(Worksheet.safeParse({ ...sheet, blocks: [{ ...sheet.blocks[0], curriculumRef: ['tv2-t1-b03-viet-ung-dung-1'] }] }).success).toBe(true);
  });
});
