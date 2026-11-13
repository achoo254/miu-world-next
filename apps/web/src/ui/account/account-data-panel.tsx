import { Link } from 'react-router';
import { AccountExport } from '@miu/schema/account';
import { ACCOUNT_DELETE_URL } from '../../brand';
import { api } from '../api-client';
import { Icon } from '../kit/art';
import { buttonClass } from '../kit/button';
import { T } from '../i18n/use-t';
import { useSubmit } from './use-submit';

/** Hands the export to the browser as a file; nothing is kept in the page. */
function saveJson(data: AccountExport): void {
  const url = URL.createObjectURL(new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' }));
  const link = document.createElement('a');
  link.href = url;
  link.download = `miu-world-du-lieu-${data.exportedAt.slice(0, 10)}.json`;
  link.click();
  // Safari starts the download asynchronously; revoking at once can cancel it.
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function AccountDataPanel() {
  const download = useSubmit(async () => saveJson(await api('GET', '/account/export', AccountExport)));

  return (
    <section className="panel" data-id="parent-data" aria-labelledby="parent-data-title">
      <div className="panel-title">
        <Icon name="heart" size={40} />
        <h2 id="parent-data-title"><T k="parentData.title" /></h2>
      </div>
      <p className="hint">
        Xem chúng tôi lưu gì ở trang <Link to="/privacy"><T k="auth.privacyLink" /></Link>.
      </p>
      <div className="row">
        <button type="button" className={buttonClass('secondary')} data-id="parent-data-export" disabled={download.busy} onClick={() => void download.onSubmit()}>
          <T k="parentData.exportButton" />
        </button>
      </div>
      {/* The account is deleted only at the account service; Miu's data goes with it. */}
      <p className="hint" data-id="parent-data-delete">
        <T k="parentData.deleteAtAccount" /> <a href={ACCOUNT_DELETE_URL}><T k="parentData.deleteAtAccountLink" /></a>
      </p>
      {download.error ? <p role="alert" className="error">{download.error}</p> : null}
    </section>
  );
}
