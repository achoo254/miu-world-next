import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { readTopicPageData } from '../../../apps/web/lesson-page-data';
import { CONTENT_SECURITY_POLICY } from '../../../apps/web/vite.config';
import { TOPIC_SUBJECTS, subjectPagePath, topicPagePath } from '../../../packages/schema/src/topic-pages';

const conf = readFileSync(new URL('./nginx-prod.conf', import.meta.url), 'utf8');
const lines = conf.split('\n');

/** `add_header <Name> "<value>" always;` (or a `$variable` value) lines of the config, with their line index. */
const headers = lines.flatMap((line, index) => {
  const match = /^\s*add_header\s+(\S+)\s+(?:"([^"]*)"|(\$\w+))\s+always;\s*$/.exec(line);
  return match ? [{ index, name: match[1] ?? '', value: match[2] ?? match[3] ?? '' }] : [];
});

const directives = (policy: string): Map<string, string> =>
  new Map(
    policy
      .split(';')
      .map((d) => d.trim())
      .filter(Boolean)
      .map((d) => {
        const [name = '', ...values] = d.split(/\s+/);
        return [name, values.join(' ')] as const;
      }),
  );

describe('production nginx security headers', () => {
  it('sends each header once, with `always` so error pages carry it too', () => {
    expect(lines.filter((line) => /^\s*add_header\s/.test(line)).length).toBe(headers.length);
    expect(headers.map((h) => h.name).sort()).toEqual(
      ['Access-Control-Allow-Origin', 'Content-Security-Policy', 'Permissions-Policy', 'Referrer-Policy', 'Strict-Transport-Security', 'X-Content-Type-Options', 'X-Frame-Options'].sort(),
    );
  });

  it('declares them in `location /` only, ahead of its nested locations, so the nested ones inherit them and /api/ (helmet) gets none', () => {
    const root = lines.findIndex((line) => /^\s*location \/ \{\s*$/.test(line));
    expect(root).toBeGreaterThan(-1);
    const firstNested = lines.findIndex((line, i) => i > root && /^\s*location\s/.test(line));
    expect(firstNested).toBeGreaterThan(root);
    for (const { index } of headers) {
      expect(index).toBeGreaterThan(root);
      expect(index).toBeLessThan(firstNested);
    }
    const api = lines.findIndex((line) => /^\s*location \/api\/ \{\s*$/.test(line));
    expect(api).toBeGreaterThan(-1);
    expect(api).toBeLessThan(root);
  });

  it("allows everything the pages' meta policy allows, and adds only frame-ancestors and manifest-src", () => {
    const header = directives(headers.find((h) => h.name === 'Content-Security-Policy')?.value ?? '');
    const meta = directives(CONTENT_SECURITY_POLICY);
    for (const [name, value] of meta) expect(header.get(name), name).toBe(value);
    expect([...header.keys()].filter((name) => !meta.has(name)).sort()).toEqual(['frame-ancestors', 'manifest-src']);
    expect(header.get('frame-ancestors')).toBe("'none'");
    expect(header.get('manifest-src')).toBe("'self'");
  });

  it('pins HTTPS for a year without joining the preload list', () => {
    expect(headers.find((h) => h.name === 'Strict-Transport-Security')?.value).toBe('max-age=31536000; includeSubDomains');
  });
});

describe('production nginx CORS for the app', () => {
  /** The `map` block whose result is `$variable`, as its entries (key → value). */
  const mapEntries = (variable: string): Map<string, string> => {
    const block = new RegExp(`^map [^\\n]+ \\$${variable} \\{\\n([\\s\\S]*?)^\\}`, 'm').exec(conf)?.[1] ?? '';
    return new Map(
      [...block.matchAll(/^\s*("[^"]*"|\S+)\s+("[^"]*"|\S+);\s*$/gm)].map((m) => [(m[1] ?? '').replace(/^"|"$/g, ''), (m[2] ?? '').replace(/^"|"$/g, '')] as const),
    );
  };

  it('opens /game-assets/ to every origin, one cacheable answer, and nothing else', () => {
    const entries = mapEntries('miu_asset_cors');
    expect(entries.get('default')).toBe('');
    expect([...entries.keys()].filter((key) => key !== 'default')).toEqual(['~^/game-assets/']);
    expect(entries.get('~^/game-assets/')).toBe('*');
  });

  it('never allows credentials and does not vary the cached files by Origin', () => {
    expect(conf).not.toMatch(/Access-Control-Allow-Credentials/);
    expect(conf).not.toMatch(/add_header\s+Vary/);
  });
});

describe('production nginx: the former lesson pages', () => {
  const include = readFileSync(new URL('./nginx-bai-redirects.conf', import.meta.url), 'utf8');
  /** The redirect table: former address → topic or subject page. */
  const table = new Map(
    [...(/^map \$uri \$miu_bai_redirect \{\n([\s\S]*?)^\}/m.exec(include)?.[1] ?? '').matchAll(/^\s*(\S+)\s+(\S+);\s*$/gm)].map((m) => [m[1] ?? '', (m[2] ?? '').replace(/^"|"$/g, '')] as const),
  );
  /** Every page the web build writes under /hoc/. */
  const built = new Set([
    ...TOPIC_SUBJECTS.map((subject) => subjectPagePath(subject)),
    ...readTopicPageData(fileURLToPath(new URL('../../../content', import.meta.url))).map((page) => topicPagePath(page.topic)),
  ]);

  it('is included by the server config at the http level, before any server block', () => {
    const at = conf.indexOf('include /etc/nginx/miu-bai-redirects.conf;');
    expect(at).toBeGreaterThan(-1);
    expect(at).toBeLessThan(conf.indexOf('server {'));
    expect(readFileSync(new URL('./setup-prod-host.sh', import.meta.url), 'utf8')).toContain('install -m 644 "$HERE/nginx-bai-redirects.conf" /etc/nginx/miu-bai-redirects.conf');
  });

  it('sends every former page, with or without its trailing slash, to one page the build writes', () => {
    expect(table.get('default')).toBe('');
    const former = [...table.keys()].filter((key) => key !== 'default');
    // Two subject pages and the 70 lesson pages that were live, each in both spellings.
    expect(former).toHaveLength(72 * 2);
    for (const key of former) {
      expect(key).toMatch(/^\/bai\/[a-z0-9-]+\/?$/);
      const target = table.get(key) ?? '';
      expect(built.has(target), `${key} → ${target}`).toBe(true);
      expect(table.get(key.endsWith('/') ? key.slice(0, -1) : `${key}/`), key).toBe(target);
    }
  });

  it('sends each former page to the topic its quest teaches', () => {
    expect(table.get('/bai/toan-2/')).toBe('/hoc/toan/');
    expect(table.get('/bai/tieng-viet-2/')).toBe('/hoc/tieng-viet/');
    expect(table.get('/bai/toan-2-bai-1-on-tap-cac-so-den-100/')).toBe('/hoc/toan/so-den-100/');
    expect(table.get('/bai/toan-2-bai-3-cac-thanh-phan-cua-phep-cong-phep-tru/')).toBe('/hoc/toan/thanh-phan-phep-tinh/');
    expect(table.get('/bai/tieng-viet-2-bai-1-toi-la-hoc-sinh-lop-2/')).toBe('/hoc/tieng-viet/doc-truyen/');
  });

  it('answers 301 with the query kept, and a real 404 for any other /bai/ address', () => {
    const block = /location \/bai\/ \{\n([\s\S]*?)\n {8}\}/.exec(conf)?.[1] ?? '';
    expect(block).toContain('return 301 $miu_bai_redirect$is_args$args;');
    expect(block).toMatch(/return 404;\s*error_page 404 \/404\.html;/);
  });
});
