import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { REPO_ROOT } from '../assets/asset-lib';
import { FORBIDDEN_IN_CONTENT, checkBookOrGradeWording, htmlText, jsonStrings, wordingIssues } from './no-book-or-grade-wording';

describe('book or grade wording', () => {
  it('finds a grade, a textbook, the series, a lesson number or a page', () => {
    for (const text of [
      'Ôn Toán lớp 2 qua trò chơi',
      'Sâu Xanh vào lớp Hai',
      'cửa sổ lớp 2A',
      'Grade 2 Maths',
      'Học SGK qua trò chơi',
      'không thay thế sách giáo khoa',
      'bộ Kết nối tri thức với cuộc sống',
      'Bài 1. Tôi là học sinh',
      'Trang 10–12',
      'xem trang 25',
      'các em lớp 1 rụt rè',
      'chào lớp Một',
      'Toán 2 nâng cao',
      'sách tập một',
      'ôn bài Tiếng Việt 2',
      'cuối học kì 1',
      'Vietnamese for second grade',
      'Year 2 maths',
    ]) {
      expect(wordingIssues('x', text), text).toHaveLength(1);
    }
  });

  it('leaves ordinary words alone', () => {
    for (const text of ['Bài hôm nay', 'Bài học ở từng khu', 'trang trí nhà', 'Trang chủ', 'lớp học', 'lớp 20 người', 'lớp 10 tuổi', 'kết nối mạng', 'Chủ đề Số đến 100', 'grade 25', 'toán 20', 'tập múa', 'year 2026']) {
      expect(wordingIssues('x', text), text).toEqual([]);
    }
  });

  it('says where and quotes the words around the match', () => {
    expect(wordingIssues('vi.json seo.title', 'Miu World — game 3D vừa chơi vừa ôn Toán và Tiếng Việt lớp 2')).toEqual([
      'vi.json seo.title: a grade ("lớp 2") in "Toán và Tiếng Việt lớp 2"',
    ]);
  });

  it('reads every string of a JSON file and the words of an HTML page', () => {
    expect(jsonStrings({ a: 'x', b: ['y', { c: 'z' }], n: 1 })).toEqual([
      { at: 'a', text: 'x' },
      { at: 'b[0]', text: 'y' },
      { at: 'b[1].c', text: 'z' },
    ]);
    expect(htmlText('<title>A</title><!-- lớp 2 --><script>x("SGK")</script><p>B <a href="/bai/">C</a></p>').trim()).toBe('A B C');
  });

  it('passes on what the repo shows today, every quest included', () => {
    expect(checkBookOrGradeWording({ repoRoot: REPO_ROOT, contentDir: path.join(REPO_ROOT, 'content') })).toEqual([]);
  });

  it('holds the story (characters, map things, quests) to grade and textbook words only', () => {
    for (const text of ['hồi lớp Hai', 'em bé lớp Một', 'Class 2A', 'since first grade', 'Year Two cheers', 'đọc SGK']) {
      expect(wordingIssues('x', text, FORBIDDEN_IN_CONTENT), text).toHaveLength(1);
    }
    for (const text of ['trang 12 của cuốn sổ', 'tập một mình dưới trăng', 'Tập hai đang chờ', 'Bài 3. trong sổ', 'Sparrow class', 'lớp Chim Sẻ']) {
      expect(wordingIssues('x', text, FORBIDDEN_IN_CONTENT), text).toEqual([]);
    }
  });
});
