// `POST /api/analytics/events`: the web app's page views and shares, on their way to Google Analytics. Open without
// sign-in (the landing and topic pages are public) but behind the API's Origin check, a 4 KB body limit (mounted in
// app.ts ahead of the general parser) and two rate limits: a wide one per IP (a school shares one address) and a
// narrow one per GA client id (one browser). Only the two web events pass; every value is checked
// and the page address rebuilt by `sanitizeWebEvent`, so nothing the browser makes up reaches Google. The app's
// events (`inAppRequest`) are checked the same way and then dropped: the app sends nothing to Google Analytics.
import path from 'node:path';
import { Router, type Request } from 'express';
import { GA_CLIENT_ID, WebEventBody, sanitizeWebEvent, type AnalyticsCatalog } from '@miu/schema/analytics';
import { RegionCatalog } from '@miu/schema/region';
import { topicPages } from '@miu/schema/topic-pages';
import { readContentJson, type ContentCatalog } from '../content/content-catalog';
import { CONTENT_DIR } from '../content/content-dir';
import { HttpError } from '../http-error';
import { ipKey, limiter } from '../rate-limit';
import type { EventSink } from './ga4-forwarder';
import { inAppRequest } from './analytics-session';
import { questLabels } from './server-events';

/** Largest body the analytics route reads (its own parser, ahead of the general 32 KB one). */
export const ANALYTICS_BODY_LIMIT = '4kb';

/**
 * Page addresses and topic ids the analytics may name: the regions of `content/world/regions.json`, the topics the
 * quests teach, and the topic pages (one per such topic, named as the static pages are: `@miu/schema/topic-pages`).
 */
export function analyticsCatalog(content: Pick<ContentCatalog, 'quests' | 'subjects' | 'learning'>, contentDir = CONTENT_DIR): AnalyticsCatalog {
  const regions = readContentJson(RegionCatalog, path.join(contentDir, 'world/regions.json')).regions;
  const { topics } = questLabels(content);
  const pages = topicPages([...content.learning.topics.values()], topics);
  return { regions: new Set(regions.map((r) => r.id)), topics, topicPages: new Set(pages.map(({ topic }) => `${topic.subject}/${topic.id}`)) };
}

export interface AnalyticsRouteDeps {
  sink: EventSink;
  catalog: AnalyticsCatalog;
  /** Events per minute per IP. */
  limitPerMinute: number;
  /** Events per minute per GA client id. */
  clientLimitPerMinute: number;
}

/** The body's GA client id when it has the right shape; the IP otherwise (such a body is refused further on). */
function clientKey(req: Request): string {
  const clientId: unknown = (req.body as { client_id?: unknown } | undefined)?.client_id;
  return typeof clientId === 'string' && GA_CLIENT_ID.test(clientId) ? `client:${clientId}` : `ip:${ipKey(req)}`;
}

export function analyticsRoutes({ sink, catalog, limitPerMinute, clientLimitPerMinute }: AnalyticsRouteDeps): Router {
  const router = Router();
  const limitIp = limiter(60_000, limitPerMinute, ipKey);
  const limitClient = limiter(60_000, clientLimitPerMinute, clientKey);

  router.post('/analytics/events', limitIp, limitClient, (req, res) => {
    const body = WebEventBody.safeParse(req.body);
    // The Origin check before this route lets only allowed origins through: it is the base of the page address.
    const origin = req.headers.origin;
    if (!body.success || !origin) throw new HttpError(400, 'invalid-event');
    const result = sanitizeWebEvent(body.data, origin, catalog);
    if (result.ok) {
      if (!inAppRequest()) sink.send(result.hit);
    }
    // A page outside the route table is dropped quietly: the app reports every screen and lets the server choose.
    else if (result.reason === 'invalid') throw new HttpError(400, 'invalid-event');
    res.status(204).end();
  });

  return router;
}
