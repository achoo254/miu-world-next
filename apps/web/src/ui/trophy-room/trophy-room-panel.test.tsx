import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { QuestSummary } from '@miu/schema/game';
import type { TrophyRoomResponse } from '@miu/schema/trophy-room';
import { BOOK_SETS } from '../collection/collection-catalog';
import { questList } from '../player/test-fixtures';
import { TrophyRoomPanel } from './trophy-room-panel';

const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status });

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

const byId = (id: string): HTMLElement => {
  const el = document.querySelector<HTMLElement>(`[data-id="${id}"]`);
  if (!el) throw new Error(`no element with data-id ${id}`);
  return el;
};

const [firstSet, secondSet] = BOOK_SETS.map((s) => s.mapId);
const ROOM: TrophyRoomResponse = {
  badges: [
    { itemId: 'huy-hieu-olympic-vang', earnedAt: '2026-10-06T08:00:00.000Z' },
    { itemId: 'huy-hieu-olympic-bac', earnedAt: null },
  ],
  cups: [
    { mapId: firstSet ?? 'forest-ch1', earnedAt: '2026-10-05T09:30:00.000Z' },
    { mapId: secondSet ?? 'lang-ven-song', earnedAt: null },
  ],
  plaques: [
    { category: 'hoc-tap', claimed: 7, total: 13, stars: 2, lastAt: '2026-10-07T20:00:00.000Z', goTo: { place: 'lesson', region: null } },
    { category: 'su-kien', claimed: 0, total: 5, stars: 0, lastAt: null, goTo: { place: 'event', region: null } },
    { category: 'suu-tam', claimed: 11, total: 11, stars: 3, lastAt: '2026-10-07T08:00:00.000Z', goTo: null },
  ],
};

describe('TrophyRoomPanel', () => {
  it('lists her badges, cups and plaques with the day each was earned, the rest faded', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async (url: string) => (url === '/api/trophies' ? json(ROOM) : json({ error: 'not-found' }, 404))),
    );
    render(<TrophyRoomPanel onClose={() => undefined} />);
    expect(await screen.findByRole('dialog', { name: 'Phòng truyền thống' })).toBeTruthy();
    expect(byId('trophy-summary').textContent).toBe('Đã có 1/2 huy hiệu · 1/2 cúp · 5/9 sao');
    expect(byId('trophy-badge-huy-hieu-olympic-vang').textContent).toContain('Huy hiệu Olympic Toán · Vàng');
    expect(byId('trophy-badge-when-huy-hieu-olympic-vang').textContent).toBe('Nhận ngày 06/10/2026');
    expect(byId('trophy-badge-huy-hieu-olympic-bac').className).toContain('trophy-card--missing');
    expect(byId('trophy-badge-when-huy-hieu-olympic-bac').textContent).toBe('Chưa có');
    expect(byId(`trophy-cup-${secondSet}`).className).toContain('trophy-card--missing');
    // 20:00 UTC on the 7th is already the 8th in Vietnam: the day shown is Vietnam's.
    expect(byId('trophy-plaque-when-hoc-tap').textContent).toBe('Nhận ngày 08/10/2026');
    expect(byId('trophy-plaque-stars-hoc-tap').getAttribute('aria-label')).toBe('2/3');
    expect(byId('trophy-plaque-hoc-tap').textContent).toContain('Đã nhận 7/13 thành tích');
  });

  it('closes from its own close button, not only with Esc', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => json(ROOM)));
    const onClose = vi.fn();
    render(<TrophyRoomPanel onClose={onClose} />);
    fireEvent.click(await screen.findByRole('button', { name: 'Đóng' }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('says when the room cannot be read and tries again', async () => {
    const fetch = vi.fn(async () => json({ error: 'server' }, 500));
    vi.stubGlobal('fetch', fetch);
    render(<TrophyRoomPanel onClose={() => undefined} />);
    expect(await screen.findByRole('alert')).toBeTruthy();
    byId('trophy-retry').click();
    await vi.waitFor(() => expect(fetch).toHaveBeenCalledTimes(2));
  });
  describe('"Đi tới" on what is not hers yet', () => {
    const fixture = questList(0).quests[0];
    if (!fixture || fixture.quest.status !== 'active') throw new Error('fixture has no active quest');
    const fixtureQuest = fixture.quest;
    const lessonIn = (id: string, region: string): QuestSummary => ({ ...fixture, quest: { ...fixtureQuest, id, region }, progress: { ...fixture.progress, questId: id } });
    const cupRegion = secondSet ?? 'lang-ven-song';
    const quests = [lessonIn('lesson-here', 'nha-cua-be'), lessonIn('lesson-cup', cupRegion)];
    const serve = (): void => {
      vi.stubGlobal(
        'fetch',
        vi.fn(async (url: string) => {
          if (url === '/api/trophies') return json(ROOM);
          if (url === '/api/events') return json({ events: [] });
          if (url === '/api/quests?category=side') return json({ quests: [] });
          return json({ error: 'not-found' }, 404);
        }),
      );
    };

    it('shows the button only on pieces not hers, each naming its map, and nothing without a place to go', async () => {
      serve();
      render(<TrophyRoomPanel onClose={() => undefined} travel={{ region: 'nha-cua-be', name: 'Mochi', quests, onGo: () => undefined }} />);
      await screen.findByRole('dialog', { name: 'Phòng truyền thống' });
      const cup = await vi.waitFor(() => byId(`trophy-cup-go-${cupRegion}`));
      expect(cup.tagName).toBe('BUTTON');
      expect(cup.textContent).toBe('Đi tới');
      expect(byId(`trophy-cup-go-${cupRegion}-where`).textContent).toContain('Ở ');
      expect(document.querySelector(`[data-id="trophy-cup-go-${firstSet}"]`)).toBeNull();
      expect(document.querySelector('[data-id="trophy-badge-go-huy-hieu-olympic-vang"]')).toBeNull();
      // No event on now gives the silver badge, and no event is on for the events plaque: nowhere to send her.
      expect(document.querySelector('[data-id="trophy-badge-go-huy-hieu-olympic-bac"]')).toBeNull();
      expect(document.querySelector('[data-id="trophy-plaque-go-su-kien"]')).toBeNull();
      // All three stars: nothing left to earn.
      expect(document.querySelector('[data-id="trophy-plaque-go-suu-tam"]')).toBeNull();
      // A star left on the study plaque: the next lesson, which is on this map.
      expect(byId('trophy-plaque-go-hoc-tap-where').textContent).toBe('Ngay trên map này');
    });

    it('hands the trip to the play screen, by a tap or the keyboard', async () => {
      serve();
      const onGo = vi.fn();
      render(<TrophyRoomPanel onClose={() => undefined} travel={{ region: 'nha-cua-be', name: 'Mochi', quests, onGo }} />);
      const cup = await vi.waitFor(() => byId(`trophy-cup-go-${cupRegion}`));
      fireEvent.click(cup);
      expect(onGo).toHaveBeenCalledWith({ region: cupRegion, quest: quests[1], target: 'parrot-guide', questBound: true });
      // A native button: Enter and Space press it, and it is reached with Tab.
      cup.focus();
      expect(document.activeElement).toBe(cup);
      expect(cup.getAttribute('type')).toBe('button');
    });

    it('offers no trip where the room is only looked at', async () => {
      serve();
      render(<TrophyRoomPanel onClose={() => undefined} />);
      await screen.findByRole('dialog', { name: 'Phòng truyền thống' });
      await vi.waitFor(() => byId('trophy-board'));
      expect(document.querySelector('.go-there')).toBeNull();
    });
  });
});
