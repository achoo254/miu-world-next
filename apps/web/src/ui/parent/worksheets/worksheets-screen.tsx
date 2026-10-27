// Parent area → Phiếu viết: the writing part of each quest that hands one out (capital letters, copying, dictation,
// a few sentences) and the at-home activities, printed on A4, grouped by subject and topic like the lessons. Built by
// the server from the quests; nothing written comes back to the game. Reached from the account area.
import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router';
import { Worksheet, WorksheetListResponse, type WorksheetBlock, type WorksheetSummary } from '@miu/schema/worksheet';
import { api, errorMessage } from '../../api-client';
import { Icon } from '../../kit/art';
import { buttonClass } from '../../kit/button';
import { SkyScene } from '../../kit/sky-scene';
import { OLi, letterSpace, sentenceSpace, useModelHand } from './oli';
import './worksheets.css';

interface TopicSheets {
  topic: WorksheetSummary['topic'];
  sheets: WorksheetSummary[];
}

/** Sheets by subject, then by topic, in the order the server lists them (the topics' order). */
export function groupSheets(sheets: readonly WorksheetSummary[]): Array<{ subject: WorksheetSummary['subject']; topics: TopicSheets[] }> {
  const subjects: Array<{ subject: WorksheetSummary['subject']; topics: TopicSheets[] }> = [];
  for (const sheet of sheets) {
    let subject = subjects.find((s) => s.subject.id === sheet.subject.id);
    if (!subject) {
      subject = { subject: sheet.subject, topics: [] };
      subjects.push(subject);
    }
    let topic = subject.topics.find((t) => t.topic.id === sheet.topic.id);
    if (!topic) {
      topic = { topic: sheet.topic, sheets: [] };
      subject.topics.push(topic);
    }
    topic.sheets.push(sheet);
  }
  return subjects;
}

/** Loads an account-area resource once per `key`; null until it arrives. */
function useParentData<T>(load: () => Promise<T>, key: string): { data: T | null; error: string | null } {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    let live = true;
    load().then(
      (value) => live && setData(value),
      (err: unknown) => live && setError(errorMessage(err)),
    );
    return () => {
      live = false;
    };
    // `load` changes identity every render; `key` names what it loads.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);
  return { data, error };
}

export function WorksheetListScreen() {
  const { data, error } = useParentData(() => api('GET', '/worksheets', WorksheetListResponse), 'list');
  const subjects = data ? groupSheets(data.worksheets) : [];
  return (
    <SkyScene>
      <main className="scene-content" data-id="worksheets">
        <header className="page-header">
          <Icon name="scroll" size={48} />
          <h1>Phiếu viết</h1>
          <span className="spacer" />
          <Link to="/parent" className={buttonClass('ghost')}>
            Về Quản lý tài khoản
          </Link>
        </header>
        <p className="hint">Phần viết của mỗi nhiệm vụ học (chữ hoa, câu ứng dụng, nghe – viết, viết vài câu) và việc làm ở nhà. In ra để bé viết tay; bài viết không cần gửi lại vào game.</p>
        {error ? <p role="alert" className="error">{error}</p> : null}
        {!data && !error ? <p role="status">Đang tải phiếu…</p> : null}
        <div className="worksheet-books">
          {subjects.map(({ subject, topics }) => (
            <section key={subject.id} className="panel" aria-labelledby={`subject-${subject.id}`} data-id={`worksheets-${subject.id}`}>
              <h2 id={`subject-${subject.id}`}>{subject.name}</h2>
              {topics.map(({ topic, sheets }) => (
                <div key={topic.id} data-id={`worksheets-topic-${topic.id}`}>
                  <h3 className="worksheet-topic">{topic.title}</h3>
                  <ul className="worksheet-rows">
                    {sheets.map((sheet) => (
                      <li key={sheet.id}>
                        <Link to={`/parent/worksheets/${sheet.id}`} data-id={`worksheet-link-${sheet.id}`}>
                          <span className="worksheet-row-title">{sheet.title}</span>
                          <span className="hint">{sheet.blockCount} phần</span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </section>
          ))}
        </div>
      </main>
    </SkyScene>
  );
}

function Block({ block, modelHand }: { block: WorksheetBlock; modelHand: boolean }) {
  switch (block.kind) {
    case 'letter':
      return (
        <section className="sheet-block" data-id="block-letter">
          <h3>{block.prompt}</h3>
          {modelHand && block.letters.length > 0 ? (
            <>
              <p className="sheet-note">Tô theo chữ mẫu, rồi viết tiếp vào các dòng còn trống.</p>
              <OLi {...letterSpace(block.letters)} />
            </>
          ) : (
            <>
              <p className="sheet-note">Tô theo mẫu chữ hoa trong vở Tập viết, rồi viết tiếp.</p>
              <OLi rows={4} />
            </>
          )}
        </section>
      );
    case 'copy-line':
      return (
        <section className="sheet-block" data-id="block-copy-line">
          <h3>{block.text}</h3>
          {modelHand && block.model?.length ? <OLi {...sentenceSpace(block.model)} /> : <OLi rows={3} />}
        </section>
      );
    case 'dictation':
      return (
        <section className="sheet-block" data-id="block-dictation">
          <h3>{block.prompt}</h3>
          <p className="sheet-note">Nhờ một người đọc chậm từng cụm từ, nghe rồi viết.</p>
          {block.text ? (
            <div className="sheet-read-aloud">
              <p className="sheet-label">Đoạn để đọc{block.title ? ` · ${block.title}` : ''}</p>
              <p className="sheet-passage">{block.text}</p>
            </div>
          ) : null}
          <OLi rows={8} />
        </section>
      );
    case 'paragraph-prompt':
      return (
        <section className="sheet-block" data-id="block-paragraph">
          <h3>{block.prompt}</h3>
          {block.hints.length ? (
            <ul className="sheet-hints">
              {block.hints.map((h) => (
                <li key={h}>{h}</li>
              ))}
            </ul>
          ) : null}
          <OLi rows={block.lines} />
        </section>
      );
    case 'activity':
      return <ActivityBlock prompt={block.prompt} parts={[block.media]} />;
  }
}

/** At-home activity. Where one thing is asked of several pictures or objects, the prompt prints once and each gets its own answer line. */
function ActivityBlock({ prompt, parts }: { prompt: string; parts: ReadonlyArray<readonly string[]> }) {
  const pictured = parts.filter((media) => media.length > 0);
  return (
    <section className="sheet-block" data-id="block-activity">
      <h3>{prompt}</h3>
      <p className="sheet-note">Làm ở nhà, ghi lại kết quả vào đây.</p>
      {pictured.length ? (
        <ol className="sheet-parts">
          {pictured.map((media, i) => (
            <li key={i}>
              <p className="sheet-label">{media.join('; ')}</p>
              <OLi rows={2} />
            </li>
          ))}
        </ol>
      ) : (
        <OLi rows={3} />
      )}
    </section>
  );
}

interface ActivityGroup {
  kind: 'activity-group';
  prompt: string;
  parts: string[][];
}

/** Runs of activities that share a prompt become one block (see ActivityBlock). */
function groupBlocks(blocks: readonly WorksheetBlock[]): Array<WorksheetBlock | ActivityGroup> {
  const out: Array<WorksheetBlock | ActivityGroup> = [];
  for (const block of blocks) {
    const last = out.at(-1);
    const joinsLast = block.kind === 'activity' && (last?.kind === 'activity' || last?.kind === 'activity-group') && last.prompt === block.prompt;
    if (!joinsLast || !last || block.kind !== 'activity') {
      out.push(block);
    } else if (last.kind === 'activity-group') {
      last.parts.push(block.media);
    } else if (last.kind === 'activity') {
      out[out.length - 1] = { kind: 'activity-group', prompt: last.prompt, parts: [last.media, block.media] };
    }
  }
  return out;
}

export function WorksheetSheetScreen() {
  const { id = '' } = useParams();
  const modelHand = useModelHand();
  const { data: sheet, error } = useParentData(() => api('GET', `/worksheets/${encodeURIComponent(id)}`, Worksheet), id);
  return (
    <main className="worksheet-page" data-id="worksheet">
      <nav className="worksheet-toolbar no-print" aria-label="Phiếu viết">
        <Link to="/parent/worksheets" className={buttonClass('ghost')}>
          Danh sách phiếu
        </Link>
        <button type="button" className={buttonClass('primary')} data-id="worksheet-print" disabled={!sheet} onClick={() => window.print()}>
          <Icon name="scroll" size={28} />
          In phiếu
        </button>
      </nav>
      {error ? <p role="alert" className="error no-print">{error}</p> : null}
      {!sheet && !error ? <p role="status" className="no-print">Đang tải phiếu…</p> : null}
      {sheet ? (
        <article className="worksheet-sheet" aria-labelledby="sheet-title">
          <header className="sheet-header">
            <p className="sheet-label">
              {sheet.subject.name} · {sheet.topic.title}
            </p>
            <h1 id="sheet-title">{sheet.title}</h1>
            <p className="sheet-fields">
              <span>Họ và tên: ........................................</span>
              <span>Ngày: ..../..../........</span>
            </p>
          </header>
          {groupBlocks(sheet.blocks).map((block, i) =>
            block.kind === 'activity-group' ? <ActivityBlock key={i} prompt={block.prompt} parts={block.parts} /> : <Block key={i} block={block} modelHand={modelHand} />,
          )}
        </article>
      ) : null}
    </main>
  );
}
