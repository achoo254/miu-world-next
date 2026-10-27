import { Router } from 'express';
import { ContentId } from '@miu/schema/content';
import { Worksheet, WorksheetListResponse } from '@miu/schema/worksheet';
import { requireParent } from '../auth/auth-context';
import { HttpError } from '../http-error';

export interface WorksheetRouteDeps {
  worksheets: ReadonlyMap<string, Worksheet>;
}

/** Account management, read only: worksheets are printed at home and nothing written on them comes back. */
export function worksheetRoutes({ worksheets }: WorksheetRouteDeps): Router {
  const router = Router();

  router.get('/worksheets', requireParent, (req, res) => {
    const subject = req.query.subject === undefined ? undefined : ContentId.safeParse(req.query.subject);
    if (subject && !subject.success) throw new HttpError(400, 'invalid-subject');
    const list = [...worksheets.values()]
      .filter((w) => !subject || w.subject.id === subject.data)
      .map(({ blocks, ...summary }) => ({ ...summary, blockCount: blocks.length }));
    res.json(WorksheetListResponse.parse({ worksheets: list }));
  });

  router.get('/worksheets/:id', requireParent, (req, res) => {
    const id = ContentId.safeParse(req.params.id);
    const sheet = id.success ? worksheets.get(id.data) : undefined;
    if (!sheet) throw new HttpError(404, 'worksheet-not-found');
    res.json(Worksheet.parse(sheet));
  });

  return router;
}
