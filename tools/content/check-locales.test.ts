import { describe, expect, it } from 'vitest';
import { TRANSLATIONS, checkLocales, localeIssues } from './check-locales';

describe('locale check', () => {
  it('passes on the shipped dictionaries', () => {
    expect(checkLocales()).toEqual([]);
  });

  it('reports a missing or blank English line, other placeholders, a short pool and an English-only key', () => {
    const vi = { a: 'Chào {name}', b: 'Đóng', c: ['Một', 'Hai {who}'], d: 'Còn {n}' };
    const en = { a: 'Hello {name}', b: ' ', c: ['One'], d: 'Left {count}', e: 'Extra' };
    expect(localeIssues(vi, en)).toEqual([
      'locales: b: no English line',
      'locales: c: English pool needs 2 lines',
      'locales: d: placeholders differ ({n} vs {count})',
      'locales: e: in en.json only',
    ]);
    expect(localeIssues({ c: ['Hai {who}'] }, { c: ['Two'] })).toEqual(['locales: c[0]: placeholders differ ({who} vs {})']);
  });

  it('holds the Chinese dictionary to the same rules', () => {
    const chinese = TRANSLATIONS[1];
    const vi = { a: 'Chào {name}', b: 'Đóng', c: ['Một', 'Hai {who}'], d: 'Còn {n}', p: ['Một', 'Hai'] };
    const zh = { a: '你好 {name}', b: '', c: ['一'], d: '剩 {count}', p: ['一', '一'], e: '多余' };
    expect(localeIssues(vi, zh, chinese)).toEqual([
      'locales: b: no Chinese line',
      'locales: c: Chinese pool needs 2 lines',
      'locales: d: placeholders differ ({n} vs {count})',
      'locales: p: zh-CN pool repeats "一"',
      'locales: e: in zh-CN.json only',
    ]);
  });

  it('reads the Chinese dictionary next to the English one', () => {
    expect(TRANSLATIONS.map((lang) => lang.file)).toEqual(['en', 'zh-CN']);
  });

  it('reports a pool that repeats a line, and a loading-tip pool too small to stay fresh', () => {
    expect(localeIssues({ c: ['Một', 'Một'] }, { c: ['One', 'Two'] })).toEqual(['locales: c: vi pool repeats "Một"']);
    expect(localeIssues({ 'loading.tips': ['Một', 'Hai'] }, { 'loading.tips': ['One', 'Two'] })).toEqual(['locales: loading.tips: pool needs at least 20 lines (has 2)']);
  });
});
