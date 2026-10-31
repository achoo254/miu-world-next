import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { QuestSummary } from '@miu/schema/game';
import type { PlayerData } from '../player/player-data';
import { questListWithLesson } from '../player/test-fixtures';
import { DailyLessonCard, DailyLessonChip, dailyLessonOf, todaysLesson } from './daily-lesson';

afterEach(cleanup);

/** The fixture's learning quest, moved to `region` with its own id and progress. */
function lessonAt(region: string, id: string, state: QuestSummary['state'] = 'open'): QuestSummary {
  const base = questListWithLesson().quests.find((q) => q.quest.id === 'tv2-t01-b01');
  if (base?.quest.status !== 'active') throw new Error('the fixture has no active lesson');
  return { ...base, quest: { ...base.quest, id, region }, state, progress: { ...base.progress, questId: id } };
}

const DAY = Date.parse('2026-10-09T03:00:00Z');

describe('Bài hôm nay', () => {
  it('picks a learning quest away from home, never a home quest or a chapter of a story', () => {
    const quests = [...questListWithLesson().quests.filter((q) => q.quest.id !== 'tv2-t01-b01'), lessonAt('nha-cua-be', 'home-lesson'), lessonAt('cho-phien', 'market-lesson')];
    expect(todaysLesson(quests, DAY)?.quest.id).toBe('market-lesson');
    expect(todaysLesson(quests.filter((q) => q.quest.id !== 'market-lesson'), DAY)).toBeNull();
  });

  it('shows the lesson, its map and the way there on Home', () => {
    const data = { character: { name: 'Mochi' }, quests: [lessonAt('cho-phien', 'market-lesson', 'in-progress')] } as unknown as PlayerData;
    render(
      <MemoryRouter>
        <DailyLessonCard data={data} />
      </MemoryRouter>,
    );
    expect(screen.getByText('Bài hôm nay')).toBeTruthy();
    expect(document.querySelector('[data-id="home-daily-map"]')?.textContent).toBe('Làm tiếp ở Chợ phiên');
    expect(document.querySelector('[data-id="home-daily-lesson"]')?.textContent).toBe('Sâu Xanh đến trường');
    expect(screen.getByRole('link', { name: 'Tới Chợ phiên' }).getAttribute('href')).toBe('/play?region=cho-phien&quest=market-lesson');
  });

  it('shows nothing once every lesson away from home is finished', () => {
    const data = { character: { name: 'Mochi' }, quests: [lessonAt('cho-phien', 'market-lesson', 'completed')] } as unknown as PlayerData;
    render(
      <MemoryRouter>
        <DailyLessonCard data={data} />
      </MemoryRouter>,
    );
    expect(document.querySelector('[data-id="home-daily"]')).toBeNull();
  });

  it("shows the server's pick and the streak for a signed-in player, even a lesson she finished", () => {
    const quests = [lessonAt('cho-phien', 'market-lesson'), lessonAt('nui-tuyet', 'snow-lesson', 'completed')];
    const daily = { day: '2026-10-31', questId: 'snow-lesson', done: true, streak: 3, best: 5 };
    expect(dailyLessonOf(quests, daily)?.quest.id).toBe('snow-lesson');
    // Loading: nothing yet; no server pick (a guest): the page's own.
    expect(dailyLessonOf(quests, null)).toBeNull();
    expect(dailyLessonOf(quests, undefined)?.quest.id).toBe(todaysLesson(quests)?.quest.id);
    const data = { character: { name: 'Mochi' }, quests } as unknown as PlayerData;
    render(
      <MemoryRouter>
        <DailyLessonCard data={data} daily={daily} />
      </MemoryRouter>,
    );
    expect(document.querySelector('[data-id="home-daily-done"]')?.textContent).toBe('Đã xong hôm nay');
    expect(document.querySelector('[data-id="home-daily-streak-count"]')?.textContent).toBe('Chuỗi 3 ngày');
    expect(document.querySelector('[data-id="home-daily-best"]')?.textContent).toBe('Kỷ lục 5 ngày');
  });

  it('takes her there from the chip over the game at home', () => {
    const lesson = lessonAt('nui-tuyet', 'snow-lesson');
    const onGo = vi.fn();
    render(<DailyLessonChip lesson={lesson} onGo={onGo} />);
    fireEvent.click(screen.getByRole('button', { name: /Tới Núi tuyết/ }));
    expect(onGo).toHaveBeenCalledWith(lesson);
  });
});
