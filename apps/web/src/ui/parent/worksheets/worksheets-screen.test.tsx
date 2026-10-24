import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { Worksheet, WorksheetListResponse } from '@miu/schema/worksheet';
import { AccountProvider } from '../../account/account-context';
import { AppRoutes } from '../../app-shell';

const me = (parentGateOpen: boolean) => ({
  parent: { id: '1b0e8e0c-6f1a-4b8e-9a53-1f1c2a3b4c5d', email: 'p@example.vn' },
  consentAccepted: true,
  activePlayerId: null,
  players: [],
  parentGateOpen,
  pinLocked: false,
  pinSet: true,
});

const TV = { id: 'tieng-viet', name: 'Tiếng Việt' };
const MATH = { id: 'toan', name: 'Toán' };
const LIST: WorksheetListResponse = {
  worksheets: [
    { id: 'tv2-t01-b01', subject: TV, topic: { id: 'doc-truyen', title: 'Đọc truyện và kể chuyện' }, title: 'Thỏ Hạt Tiêu đón năm học mới', blockCount: 3 },
    { id: 'tv2-t02-b03', subject: TV, topic: { id: 'doc-truyen', title: 'Đọc truyện và kể chuyện' }, title: 'Cầu vồng sau mưa', blockCount: 2 },
    { id: 'toan2-cd3-b17', subject: MATH, topic: { id: 'khoi-luong-dung-tich', title: 'Ki-lô-gam và lít' }, title: 'Nồi chè to nhất phiên chợ', blockCount: 1 },
  ],
};

const SHEET: Worksheet = {
  id: 'tv2-t01-b01',
  subject: TV,
  topic: { id: 'doc-truyen', title: 'Đọc truyện và kể chuyện' },
  title: 'Thỏ Hạt Tiêu đón năm học mới',
  blocks: [
    { kind: 'letter', prompt: 'Viết chữ hoa A', letters: ['A'] },
    { kind: 'copy-line', text: 'Viết câu: Anh em thuận hoà.', model: ['Anh em thuận hoà.'] },
    { kind: 'dictation', prompt: 'Nghe – viết', title: 'Đoạn mẫu', text: 'Câu thứ nhất.\nCâu thứ hai.' },
    { kind: 'paragraph-prompt', prompt: 'Viết 2 – 3 câu', hints: ['Gợi ý một', 'Gợi ý hai'], lines: 5 },
    { kind: 'activity', prompt: 'Cùng bố mẹ đo', media: [] },
  ],
};

type Handler = () => { status: number; body?: unknown };

function stubApi(routes: Record<string, Handler>) {
  const calls: string[] = [];
  vi.stubGlobal(
    'fetch',
    vi.fn(async (url: string, init?: RequestInit) => {
      const key = `${init?.method ?? 'GET'} ${url}`;
      calls.push(key);
      const out = routes[key]?.() ?? { status: 404, body: { error: 'not-found' } };
      return new Response(JSON.stringify(out.body), { status: out.status });
    }),
  );
  return calls;
}

function renderAt(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <AccountProvider>
        <AppRoutes />
      </AccountProvider>
    </MemoryRouter>,
  );
}
const byId = (id: string) => document.querySelector(`[data-id="${id}"]`);

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe('worksheets in the parent area', () => {
  it('asks for the parent PIN first and loads nothing before it', async () => {
    const calls = stubApi({ 'GET /api/auth/me': () => ({ status: 200, body: me(false) }) });
    renderAt('/parent/worksheets');
    expect(await screen.findByLabelText(/PIN/)).toBeTruthy();
    expect(byId('worksheets-gate')).toBeTruthy();
    expect(calls.some((c) => c.includes('/api/worksheets'))).toBe(false);
  });

  it('lists the sheets by subject and topic, each linking to its sheet, with no book, week or page', async () => {
    stubApi({
      'GET /api/auth/me': () => ({ status: 200, body: me(true) }),
      'GET /api/worksheets': () => ({ status: 200, body: LIST }),
    });
    renderAt('/parent/worksheets');
    expect(await screen.findByRole('heading', { name: 'Tiếng Việt' })).toBeTruthy();
    expect(screen.getAllByRole('heading', { level: 2 }).map((h) => h.textContent)).toEqual(['Tiếng Việt', 'Toán']);
    expect(screen.getAllByRole('heading', { level: 3 }).map((h) => h.textContent)).toEqual(['Đọc truyện và kể chuyện', 'Ki-lô-gam và lít']);
    const tv = byId('worksheet-link-tv2-t01-b01');
    expect(tv?.getAttribute('href')).toBe('/parent/worksheets/tv2-t01-b01');
    expect(tv?.textContent).toBe('Thỏ Hạt Tiêu đón năm học mới3 phần');
    expect(document.body.textContent).not.toMatch(/Tuần|tr\.|Bài \d|SGK|lớp 2/);
  });

  it('shows every block of a sheet under its subject and topic, and prints it', async () => {
    stubApi({
      'GET /api/auth/me': () => ({ status: 200, body: me(true) }),
      'GET /api/worksheets/tv2-t01-b01': () => ({ status: 200, body: SHEET }),
    });
    const print = vi.fn();
    vi.stubGlobal('print', print);
    renderAt('/parent/worksheets/tv2-t01-b01');
    expect(await screen.findByRole('heading', { level: 1, name: SHEET.title })).toBeTruthy();
    for (const id of ['block-letter', 'block-copy-line', 'block-dictation', 'block-paragraph', 'block-activity']) expect(byId(id)).toBeTruthy();
    expect(screen.getByText('Viết chữ hoa A')).toBeTruthy();
    expect(screen.getByText('Tiếng Việt · Đọc truyện và kể chuyện')).toBeTruthy();
    expect(screen.getByText(/Tô theo mẫu chữ hoa trong vở Tập viết/)).toBeTruthy();
    expect(screen.getByText('Viết câu: Anh em thuận hoà.')).toBeTruthy();
    // No model hand installed: no model letters, the note points to the writing book instead.
    expect(document.querySelector('.oli-model')).toBeNull();
    expect(byId('block-dictation')?.querySelector('.sheet-passage')?.textContent).toBe('Câu thứ nhất.\nCâu thứ hai.');
    expect(screen.getByText('Gợi ý hai')).toBeTruthy();
    expect(byId('block-paragraph')?.querySelector('.oli')?.getAttribute('data-rows')).toBe('5');
    fireEvent.click(byId('worksheet-print') as Element);
    expect(print).toHaveBeenCalledTimes(1);
  });

  it('says so when a quest has no sheet', async () => {
    stubApi({ 'GET /api/auth/me': () => ({ status: 200, body: me(true) }) });
    renderAt('/parent/worksheets/khong-co');
    expect(await screen.findByRole('alert')).toBeTruthy();
    expect((byId('worksheet-print') as HTMLButtonElement).disabled).toBe(true);
  });
});

describe('activities on a sheet', () => {
  it('prints a prompt shared by several pictures once, with a line per picture', async () => {
    const shared = 'Đọc cân nặng của mỗi đồ vật.';
    const sheet: Worksheet = {
      id: 'toan2-cd3-b15',
      subject: MATH,
      topic: { id: 'khoi-luong-dung-tich', title: 'Ki-lô-gam và lít' },
      title: 'Chiếc cân đĩa lệch',
      blocks: [
        { kind: 'activity', prompt: shared, media: ['túi gạo'] },
        { kind: 'activity', prompt: shared, media: ['quả bí'] },
        { kind: 'activity', prompt: 'Việc khác', media: [] },
      ],
    };
    stubApi({
      'GET /api/auth/me': () => ({ status: 200, body: me(true) }),
      'GET /api/worksheets/toan2-cd3-b15': () => ({ status: 200, body: sheet }),
    });
    renderAt('/parent/worksheets/toan2-cd3-b15');
    expect(await screen.findAllByText(shared)).toHaveLength(1);
    const [grouped, single, ...rest] = [...document.querySelectorAll('[data-id="block-activity"]')];
    expect(rest).toHaveLength(0);
    expect([...(grouped?.querySelectorAll('.sheet-parts li') ?? [])].map((li) => li.querySelector('.sheet-label')?.textContent)).toEqual([
      'túi gạo',
      'quả bí',
    ]);
    expect(single?.querySelector('.oli')?.getAttribute('data-rows')).toBe('3');
  });
});

describe('model hand on a sheet', () => {
  it('writes the capitals and the sentence in the model hand once the font has loaded', async () => {
    Object.defineProperty(document, 'fonts', { value: { load: vi.fn(async () => [{}]) }, configurable: true });
    stubApi({
      'GET /api/auth/me': () => ({ status: 200, body: me(true) }),
      'GET /api/worksheets/tv2-t01-b01': () => ({ status: 200, body: SHEET }),
    });
    renderAt('/parent/worksheets/tv2-t01-b01');
    expect(await screen.findByText(/Tô theo chữ mẫu/)).toBeTruthy();
    const letter = byId('block-letter');
    expect(letter?.querySelector('.oli')?.getAttribute('data-rows')).toBe('6');
    const letterLines = [...(letter?.querySelectorAll('.oli-model') ?? [])];
    expect(letterLines.map((p) => p.className)).toEqual(['oli-model oli-model--vua', 'oli-model oli-model--nho']);
    expect([...(letterLines[0]?.children ?? [])].map((s) => `${s.textContent}${s.className ? '·trace' : ''}`)).toEqual(['A', 'A·trace', 'A·trace']);
    const sentence = [...(byId('block-copy-line')?.querySelectorAll('.oli-model') ?? [])].map((p) => p.textContent);
    expect(sentence).toEqual(['Anh em thuận hoà.', 'Anh em thuận hoà.']);
    Reflect.deleteProperty(document, 'fonts');
  });
});
