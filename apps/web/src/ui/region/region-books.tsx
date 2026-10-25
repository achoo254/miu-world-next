// Quick facts under the world map (owner, 03/10/2026: each map shows, on the map screen, what it teaches): a card
// per open region naming each subject its lessons teach, the topics they practise and how many lessons, so anyone
// looking for a topic sees at once where to go. A region without lessons says what it is for instead. Tapping a
// card opens the region.
import { Link } from 'react-router';
import type { CharacterDto, QuestSummary } from '@miu/schema/game';
import { Name, T } from '../i18n/use-t';
import { Icon } from '../kit/art';
import { say } from '../player/player-data';
import { regionSubjects } from './region-board';
import { REGIONS } from './regions';

export function RegionBooks({ quests, character }: { quests: readonly QuestSummary[]; character: CharacterDto }) {
  const open = REGIONS.filter((region) => region.status === 'open');
  return (
    <section className="region-books" aria-labelledby="region-books-title" data-id="map-books">
      <h2 id="region-books-title" className="region-books-title">
        <Icon name="books" size={32} />
        <T k="region.booksTitle" />
      </h2>
      <ul className="region-books-list">
        {open.map((region) => {
          const subjects = regionSubjects(quests, region.id);
          return (
            <li key={region.id}>
              <Link to={`/region/${region.id}`} className="region-books-card" data-id={`map-books-${region.id}`}>
                <span className="region-books-name">
                  <Name vi={region.name} fill={(text) => say(text, character)} />
                </span>
                {subjects.length > 0 ? (
                  subjects.map((s, i) => (
                    <span key={s.subject} className="region-books-row" data-id={`map-books-${region.id}-${i}`}>
                      <strong className="region-books-subject">
                        <Name vi={s.subjectName} />
                      </strong>
                      <span className="region-books-count">
                        <T k="region.lessonCount" params={{ count: s.lessons }} />
                      </span>
                      <span className="region-books-topics">
                        <Name vi={s.topics.join(' · ')} />
                      </span>
                    </span>
                  ))
                ) : (
                  <span className="region-books-row region-books-row--none">{say(region.tagline, character)}</span>
                )}
              </Link>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
