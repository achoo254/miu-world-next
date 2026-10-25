import { act, cleanup, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { bindLangProfile, setLangMode } from './i18n';
import { loadNames, nameOf, nameText, onNameDisplayChange, resetNamesForTest } from './names';
import { Name } from './use-t';

const glossaryLoads = vi.hoisted(() => ({ count: 0 }));

vi.mock('./names-glossary', () => {
  return {
    mergedGlossary: () => {
      glossaryLoads.count += 1;
      return new Map([
        ['Koala Ghép Tranh', 'Puzzle Koala'],
        ['Nói chuyện', 'Talk'],
        ['Khu rừng bí mật', 'Secret Forest'],
        ['Nhà của {name}', "{name}'s Home"],
        ['{who} và {name}', '{who} and {name}'],
        ['Mũ len', 'Wool hat'],
      ]);
    },
  };
});

beforeEach(() => {
  resetNamesForTest();
});

afterEach(() => {
  cleanup();
  act(() => {
    bindLangProfile(null);
    setLangMode('vi');
  });
  window.localStorage.clear();
});

describe('nameOf', () => {
  it('keeps the Vietnamese on both sides before the glossary arrives', () => {
    expect(nameOf('Koala Ghép Tranh')).toEqual({ vi: 'Koala Ghép Tranh', en: 'Koala Ghép Tranh' });
  });

  it('uses the glossary once loaded, and the name’s own English first', async () => {
    await loadNames();
    expect(nameOf('Koala Ghép Tranh')).toEqual({ vi: 'Koala Ghép Tranh', en: 'Puzzle Koala' });
    expect(nameOf('Mũ len', 'Knitted hat')).toEqual({ vi: 'Mũ len', en: 'Knitted hat' });
    expect(nameOf('Mũ len', '')).toEqual({ vi: 'Mũ len', en: 'Wool hat' });
  });

  it('returns an unknown name unchanged', async () => {
    await loadNames();
    expect(nameOf('Tên chưa dịch')).toEqual({ vi: 'Tên chưa dịch', en: 'Tên chưa dịch' });
  });

  it('matches names whose placeholders are already filled in, leaving the filled value as it is', async () => {
    await loadNames();
    expect(nameOf('Nhà của Miu').en).toBe("Miu's Home");
    expect(nameOf('Tí và Tèo').en).toBe('Tí and Tèo');
  });

  it('translates each part of a label built in code', async () => {
    await loadNames();
    expect(nameOf('Koala Ghép Tranh · Nói chuyện').en).toBe('Puzzle Koala · Talk');
    expect(nameOf('Bạn Tí · Nói chuyện').en).toBe('Bạn Tí · Talk');
    expect(nameOf('Bạn Tí · Bạn Tèo').en).toBe('Bạn Tí · Bạn Tèo');
  });

  it('shows the name in the current mode as one string', async () => {
    await loadNames();
    act(() => setLangMode('en'));
    expect(nameText('Khu rừng bí mật')).toBe('Secret Forest');
    act(() => setLangMode('both'));
    expect(nameText('Khu rừng bí mật')).toBe('Khu rừng bí mật / Secret Forest');
    act(() => setLangMode('vi'));
    expect(nameText('Khu rừng bí mật')).toBe('Khu rừng bí mật');
  });
});

describe('loading', () => {
  it('never downloads the glossary while the mode is Tiếng Việt', async () => {
    const before = glossaryLoads.count;
    nameOf('Koala Ghép Tranh');
    const changed = vi.fn();
    const stop = onNameDisplayChange(changed);
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(glossaryLoads.count).toBe(before);
    expect(nameOf('Koala Ghép Tranh').en).toBe('Koala Ghép Tranh');
    stop();
  });

  it('downloads it when English is picked, then tells the game and re-renders React', async () => {
    render(<Name vi="Koala Ghép Tranh" />);
    const changed = vi.fn();
    const stop = onNameDisplayChange(changed);
    expect(screen.getByText('Koala Ghép Tranh')).toBeTruthy();
    await act(async () => {
      setLangMode('en');
      await loadNames();
    });
    expect(changed).toHaveBeenCalled();
    expect(screen.getByText('Puzzle Koala')).toBeTruthy();
    stop();
  });

  it('stacks both names in Song ngữ', async () => {
    await act(async () => {
      setLangMode('both');
      await loadNames();
    });
    render(<Name vi="Mũ len" />);
    expect(screen.getByText('Mũ len')).toBeTruthy();
    expect(screen.getByText('Wool hat')).toBeTruthy();
  });
});
