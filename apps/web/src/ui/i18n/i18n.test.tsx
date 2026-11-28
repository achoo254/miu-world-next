import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { ApiError, errorMessage } from '../api-client';
import { LanguageSetting, VoiceSpeedSetting } from '../system/language-setting';
import { readVoiceSpeed } from '../system/voice-setting';
import { bindLangProfile, contentText, format, getLangMode, inline, joinBoth, linesOf, mapBoth, pairOf, same, setLangMode, t, twin, writeText } from './i18n';
import enLocale from './locales/en.json';
import viLocale from './locales/vi.json';
import zhLocale from './locales/zh-CN.json';
import { Bi, T } from './use-t';

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  act(() => {
    bindLangProfile(null);
    setLangMode('vi');
  });
  window.localStorage.clear();
});

const placeholders = (text: string): string[] => [...text.matchAll(/\{(\w+)\}/g)].map((m) => m[1] ?? '').sort();

describe('locales', () => {
  it.each([
    ['en', enLocale],
    ['zh-CN', zhLocale],
  ] as const)('has a %s line for every Vietnamese key, with the same placeholders and pool sizes', (name, locale) => {
    const translated: Record<string, unknown> = locale;
    for (const [key, value] of Object.entries(viLocale)) {
      const other = translated[key];
      expect(other, `${name}.json lacks ${key}`).toBeDefined();
      if (Array.isArray(value)) {
        expect(Array.isArray(other) && other.length, `${key}: pool size`).toBe(value.length);
        value.forEach((line, i) => expect(placeholders((other as string[])[i] ?? ''), `${key}[${i}]`).toEqual(placeholders(line)));
      } else {
        expect(typeof other === 'string' && other.trim() !== '', `${key}: empty`).toBe(true);
        expect(placeholders(other as string), key).toEqual(placeholders(value));
      }
    }
    expect(Object.keys(locale).filter((key) => !(key in viLocale))).toEqual([]);
  });
});

describe('the sign-in-again confirmation for voice chat', () => {
  const KEYS = ['playerCare.voiceChatHintExtra', 'playerCare.voiceReauth', 'playerCare.voiceReauthButton', 'errors.reauthRequired', 'errors.idpReauth', 'auth.callback.reauth'] as const;

  it('says it in every language without parent, PIN or child wording', () => {
    const vi: Record<string, unknown> = viLocale;
    const en: Record<string, unknown> = enLocale;
    const zh: Record<string, unknown> = zhLocale;
    for (const key of KEYS) {
      expect(typeof vi[key], key).toBe('string');
      expect(String(vi[key]), key).not.toMatch(/phụ huynh|PIN|bố mẹ|cha mẹ|trẻ|học sinh/i);
      expect(String(en[key]), key).not.toMatch(/parent|PIN|child|kid|student/i);
      expect(String(zh[key]), key).not.toMatch(/家长|父母|PIN|孩子|儿童|学生/);
    }
  });

  it('maps the server codes to their messages', () => {
    expect(errorMessage(new ApiError(403, 'reauth-required'))).toBe(viLocale['errors.reauthRequired']);
    expect(errorMessage(new ApiError(401, 'idp-reauth'))).toBe(viLocale['errors.idpReauth']);
  });
});

describe('t and pairs', () => {
  it('fills params, leaving {name} for the character name filled later', () => {
    expect(pairOf('common.progress', { done: 2, total: 5 })).toEqual({ vi: 'Hoàn thành 2/5', en: 'Done 2/5', zh: '已完成 2/5' });
    expect(format('Chào {name}, còn {n}', { n: 3 })).toBe('Chào {name}, còn 3');
    expect(pairOf('support.answerNote').vi).toContain('{name}');
  });

  it('fills a bilingual param with its own side in each language', () => {
    expect(pairOf('reward.goal.claim', { tier: { vi: 'Rương', en: 'Chest', zh: '宝箱' } })).toEqual({ vi: 'Rương đã sẵn sàng, mở ngay nào!', en: 'Chest is ready, open it now!', zh: '宝箱准备好了，快打开吧！' });
  });

  it('shows Vietnamese, English, Chinese or both inline, once when the two are the same', () => {
    const pair = pairOf('common.close');
    expect(inline(pair, 'vi')).toBe('Đóng');
    expect(inline(pair, 'en')).toBe('Close');
    expect(inline(pair, 'zh-CN')).toBe('关闭');
    expect(inline(pair, 'both')).toBe('Đóng / Close');
    expect(inline(same('Bài 1'), 'both')).toBe('Bài 1');
    expect(inline(pairOf('common.menu'), 'both')).toBe('Menu');
  });

  it('falls back to Vietnamese when an English line is missing or blank, and Chinese to the English', async () => {
    vi.resetModules();
    vi.doMock('./locales/en.json', () => ({ default: { 'common.close': '', 'loop.found': ['Found it, {name}!'] } }));
    // Without its own Chinese a line reads the English it falls back to.
    vi.doMock('./locales/zh-CN.json', () => ({ default: { 'common.back': ' ' } }));
    const fresh = await import('./i18n');
    expect(fresh.pairOf('common.close')).toEqual({ vi: 'Đóng', en: 'Đóng', zh: 'Đóng' });
    expect(fresh.pairOf('common.back')).toEqual({ vi: 'Quay lại', en: 'Quay lại', zh: 'Quay lại' });
    const found = fresh.linesOf('loop.found');
    expect(found[0]?.en).toBe('Found it, {name}!');
    expect(found[0]?.zh).toBe('Found it, {name}!');
    expect(found[1]).toEqual({ vi: 'A ha! {who} đây rồi.', en: 'A ha! {who} đây rồi.', zh: 'A ha! {who} đây rồi.' });
    vi.doUnmock('./locales/en.json');
    vi.doUnmock('./locales/zh-CN.json');
    vi.resetModules();
  });

  it('gives content with only an English twin its English in Chinese', () => {
    expect(contentText({ vi: 'Rừng', en: 'Forest' })).toEqual({ vi: 'Rừng', en: 'Forest', zh: 'Forest' });
    expect(twin('Bài 1', null)).toEqual(same('Bài 1'));
    expect(inline(contentText({ vi: 'Rừng', en: 'Forest' }), 'zh-CN')).toBe('Forest');
  });

  it('pairs pools line by line and maps or joins both sides', () => {
    const pool = linesOf('loop.tryAgain');
    expect(pool.length).toBe(5);
    expect(mapBoth(pool[0] ?? same(''), (line) => line.replace('{name}', 'Mochi'))).toEqual({ vi: 'Gần đúng rồi, Mochi thử lại nhé!', en: 'Almost, Mochi! Try again.', zh: '差一点点，Mochi！再试一次吧。' });
    expect(joinBoth([pairOf('common.close'), pairOf('common.back')], ' · ')).toEqual({ vi: 'Đóng · Quay lại', en: 'Close · Back', zh: '关闭 · 返回' });
  });

  it('follows the mode: t() and the game-side writer', () => {
    const button = document.createElement('button');
    setLangMode('en');
    expect(t('game.run')).toBe('Run');
    writeText(button, 'game.run');
    expect(button.textContent).toBe('Run');
    setLangMode('both');
    expect(t('game.run')).toBe('Chạy / Run');
    writeText(button, 'game.run');
    expect(button.classList.contains('bi')).toBe(true);
    expect(button.querySelector('.bi-en')?.textContent).toBe('Run');
    setLangMode('zh-CN');
    expect(t('game.run')).toBe('跑');
    writeText(button, 'game.run');
    expect(button.textContent).toBe('跑');
    expect(button.classList.contains('bi')).toBe(false);
    setLangMode('vi');
    writeText(button, 'game.run');
    expect(button.textContent).toBe('Chạy');
    expect(button.classList.contains('bi')).toBe(false);
  });
});

describe('the mode setting', () => {
  it('is Vietnamese by default and kept per device and per child profile', () => {
    expect(getLangMode()).toBe('vi');
    bindLangProfile('child-a');
    setLangMode('both');
    expect(window.localStorage.getItem('miu.lang.child-a')).toBe('both');
    bindLangProfile('child-b');
    // Child B has no choice of her own yet: the device's last one.
    expect(getLangMode()).toBe('both');
    setLangMode('en');
    bindLangProfile('child-a');
    expect(getLangMode()).toBe('both');
    bindLangProfile('child-b');
    expect(getLangMode()).toBe('en');
  });

  it('keeps 中文 picked in the shared cookie after a reload', async () => {
    window.localStorage.clear();
    document.cookie = 'hd_lang=zh-CN; Path=/';
    vi.resetModules();
    document.documentElement.lang = 'vi';
    const reloaded = await import('./i18n');
    expect(reloaded.getLangMode()).toBe('zh-CN');
    // The first read also labels the page: the HTML ships as Vietnamese.
    expect(document.documentElement.lang).toBe('zh-CN');
    vi.resetModules();
  });

  it('shares Simplified Chinese with the other hoandat.com apps and sets the page language', () => {
    document.cookie = 'hd_lang=zh-CN; Path=/';
    bindLangProfile('child-z');
    expect(getLangMode()).toBe('zh-CN');
    setLangMode('en');
    expect(document.cookie).toContain('hd_lang=en');
    setLangMode('zh-CN');
    expect(document.cookie).toContain('hd_lang=zh-CN');
    expect(document.documentElement.lang).toBe('zh-CN');
    setLangMode('both');
    expect(document.documentElement.lang).toBe('vi');
  });

  it('shares Vietnamese or English with the other hoandat.com apps, keeping Song ngữ and a profile choice its own', () => {
    // Picked in another app: the device follows it.
    document.cookie = 'hd_lang=en; Path=/';
    bindLangProfile('child-c');
    expect(getLangMode()).toBe('en');
    setLangMode('vi');
    expect(document.cookie).toContain('hd_lang=vi');
    // Song ngữ is Miu's own: the shared cookie keeps the last single language.
    setLangMode('both');
    expect(document.cookie).toContain('hd_lang=vi');
    bindLangProfile(null);
    expect(getLangMode()).toBe('both');
    // A child's own choice wins over a language picked elsewhere later.
    bindLangProfile('child-c');
    document.cookie = 'hd_lang=en; Path=/';
    bindLangProfile(null);
    bindLangProfile('child-c');
    expect(getLangMode()).toBe('both');
  });

  it('still works when the browser blocks storage', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('blocked');
    });
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('blocked');
    });
    setLangMode('en');
    expect(getLangMode()).toBe('en');
  });
});

describe('<Bi> and <T>', () => {
  it('renders the bare Vietnamese in Vietnamese mode, so screens read as before', () => {
    const { container } = render(<T k="pause.resume" />);
    expect(container.innerHTML).toBe('Quay lại chơi');
  });

  it('switches at once with the setting: English, then both lines', () => {
    render(
      <p data-testid="line">
        <Bi vi="Xin chào" en="Hello" zh="你好" />
      </p>,
    );
    const line = screen.getByTestId('line');
    act(() => setLangMode('en'));
    expect(line.textContent).toBe('Hello');
    expect(line.querySelector('[lang="en"]')).not.toBeNull();
    act(() => setLangMode('zh-CN'));
    expect(line.textContent).toBe('你好');
    expect(line.querySelector('[lang="zh-CN"]')).not.toBeNull();
    act(() => setLangMode('both'));
    expect(line.querySelector('.bi-vi')?.textContent).toBe('Xin chào');
    expect(line.querySelector('.bi-en')?.textContent).toBe('Hello');
  });

  it('shows untranslated text once in both mode, and bare in Chinese', () => {
    act(() => setLangMode('both'));
    const { container } = render(<Bi {...same('Bài 1')} />);
    expect(container.innerHTML).toBe('Bài 1');
    act(() => setLangMode('zh-CN'));
    expect(container.innerHTML).toBe('Bài 1');
  });

  it('marks content shown in its English twin as English in Chinese', () => {
    act(() => setLangMode('zh-CN'));
    const { container } = render(<Bi {...contentText({ vi: 'Rừng', en: 'Forest' })} />);
    expect(container.querySelector('[lang="en"]')?.textContent).toBe('Forest');
  });
});

describe('LanguageSetting', () => {
  it('offers the four modes and applies the chosen one at once', () => {
    render(
      <>
        <LanguageSetting dataId="lang" />
        <p data-testid="label">
          <T k="settings.title" />
        </p>
      </>,
    );
    const group = screen.getByRole('radiogroup', { name: 'Ngôn ngữ / Language' });
    expect(group).toBeTruthy();
    expect(screen.getByRole('radio', { name: 'Tiếng Việt' }).getAttribute('aria-checked')).toBe('true');
    fireEvent.click(screen.getByRole('radio', { name: 'English' }));
    expect(screen.getByTestId('label').textContent).toBe('Settings');
    expect(screen.getByRole('radio', { name: 'English' }).getAttribute('aria-checked')).toBe('true');
    fireEvent.click(screen.getByRole('radio', { name: '中文' }));
    expect(screen.getByTestId('label').textContent).toBe('设置');
    expect(screen.getByRole('radio', { name: '中文' }).getAttribute('lang')).toBe('zh-CN');
    expect(document.cookie).toContain('hd_lang=zh-CN');
    fireEvent.click(screen.getByRole('radio', { name: 'Song ngữ Both' }));
    expect(screen.getByTestId('label').textContent).toBe('Cài đặt Settings');
    expect(window.localStorage.getItem('miu.lang')).toBe('both');
  });

  it('keeps the read-aloud speed on this device, slow by default', () => {
    render(<VoiceSpeedSetting dataId="voice" />);
    expect(readVoiceSpeed()).toBe('slow');
    expect(screen.getByRole('radio', { name: 'Chậm' }).getAttribute('aria-checked')).toBe('true');
    fireEvent.click(screen.getByRole('radio', { name: 'Vừa' }));
    expect(readVoiceSpeed()).toBe('normal');
    expect(screen.getByRole('radio', { name: 'Vừa' }).getAttribute('aria-checked')).toBe('true');
  });
});
