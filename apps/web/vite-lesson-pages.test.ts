import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { TOPIC_SUBJECTS, subjectPagePath, topicPagePath } from '../../packages/schema/src/topic-pages';
import { topicPageIssues } from '../../tools/security/scan-dist';
import { LESSON_PAGE_ENTRY, buildSite, sitemapPages, teaser, topicPageFiles, type PageAssets } from './vite-lesson-pages';
import { CONTENT_SECURITY_POLICY } from './vite.config';

const APP_DIR = path.dirname(fileURLToPath(import.meta.url));
const ASSETS_DIR = path.resolve(APP_DIR, '../../assets');
const CONTENT_DIR = path.resolve(APP_DIR, '../../content');
const ASSETS: PageAssets = { script: '/assets/lesson-page-abc123.js', imports: ['/assets/zod-def456.js'], styles: ['/assets/lesson-page-abc123.css'] };

const site = buildSite({ contentDir: CONTENT_DIR, assetsDir: ASSETS_DIR, csp: CONTENT_SECURITY_POLICY });
const html = (pagePath: string, assets: PageAssets = ASSETS): string => {
  const found = site.pages.find((p) => p.path === pagePath);
  if (!found) throw new Error(`no page ${pagePath}`);
  return found.render(assets);
};
const LESSON = topicPagePath({ subject: 'toan', id: 'so-den-100' });

describe('the pages of the build', () => {
  it('has a page per subject and per topic with a quest, each at its own address', () => {
    const paths = site.pages.map((page) => page.path);
    expect(new Set(paths).size).toBe(paths.length);
    expect(paths).toEqual(expect.arrayContaining(TOPIC_SUBJECTS.map((subject) => subjectPagePath(subject))));
    expect(paths).toContain(LESSON);
    expect(paths.length).toBeGreaterThanOrEqual(20);
    expect(paths.every((p) => /^\/hoc\/[a-z0-9-]+\/(?:[a-z0-9-]+\/)?$/.test(p))).toBe(true);
  });

  it('points each page at its preview card, and every card is in the asset manifest', () => {
    const manifest = JSON.parse(readFileSync(path.join(ASSETS_DIR, 'manifest.json'), 'utf8')) as { generated: Array<{ path: string }> };
    const listed = new Set(manifest.generated.map((file) => file.path));
    const subjectPaths = new Set(TOPIC_SUBJECTS.map((subject) => subjectPagePath(subject)));
    for (const page of site.pages) {
      const card = subjectPaths.has(page.path) ? 'miu-world' : (page.path.split('/')[3] ?? '');
      expect(listed.has(`generated/share-cards/${card}.png`), `${card}: run pnpm assets:cards`).toBe(true);
      expect(html(page.path)).toContain(`/game-assets/generated/share-cards/${card}.png?v=`);
    }
  });
});

describe('a topic page', () => {
  const page = html(LESSON);

  it('keeps to the game\'s policy and runs no inline script', () => {
    expect(topicPageIssues(page)).toEqual([]);
    expect(page).toContain('<meta http-equiv="Content-Security-Policy" content="default-src &#39;self&#39;;');
    const scripts = [...page.matchAll(/<script\b([^>]*)>/g)].map((m) => m[1] ?? '');
    expect(scripts.filter((attrs) => !attrs.includes('src='))).toEqual([' type="application/ld+json"']);
    expect(scripts.filter((attrs) => attrs.includes('src='))).toEqual([' type="module" crossorigin src="/assets/lesson-page-abc123.js"']);
  });

  it('names its own address and preview, absolute and versioned', () => {
    expect(page).toContain('<link rel="canonical" href="https://miu.hoandat.com/hoc/toan/so-den-100/">');
    expect(page).toMatch(/<meta property="og:image" content="https:\/\/miu\.hoandat\.com\/game-assets\/generated\/share-cards\/so-den-100\.png\?v=[0-9a-f]{12}">/);
    expect(page).toContain('<meta property="og:image:width" content="1200">');
    expect(page).toContain('<meta property="og:image:height" content="630">');
    expect(page).toContain('<meta property="og:locale" content="vi_VN">');
    expect(page).toContain('<meta name="twitter:card" content="summary_large_image">');
    expect(page).toMatch(/<link rel="icon" type="image\/png" sizes="32x32" href="\/game-assets\/generated\/brand\/miu-logo-32\.png\?v=[0-9a-f]{12}">/);
    expect(page).toMatch(/<link rel="apple-touch-icon" href="\/game-assets\/generated\/brand\/miu-logo-180\.png\?v=[0-9a-f]{12}">/);
    expect(page).toContain('<link rel="stylesheet" crossorigin="" href="/assets/lesson-page-abc123.css">');
    expect(page).toContain('<link rel="modulepreload" crossorigin="" href="/assets/zod-def456.js">');
  });

  it('says what the topic practises and what the game offers for it, with no book, grade, lesson number or page', () => {
    expect(page).toContain('<title>Trò chơi luyện Số đến 100 — Toán | Miu World</title>');
    expect(page).toContain('<h1>Trò chơi luyện Số đến 100</h1>');
    expect(page).toContain('<p class="badge">Toán</p>');
    expect(page).toContain('Bảng số bay trong gió');
    expect(page).toContain('>Chơi chủ đề này</a>');
    expect(page).toContain('data-play-region="truong-hoc" data-play-quest="toan2-cd1-b01"');
    expect(page).toContain('href="/hoc/toan/"');
    expect(page).toContain('href="/hoc/toan/thanh-phan-phep-tinh/"');
    expect(page).toContain('<footer class="note lesson-foot" data-id="lesson-foot"><a href="https://hoandat.com">Một app của hoandat.com</a><a href="/privacy">Quyền riêng tư</a></footer>');
    expect(page).not.toContain('Chủ đề trước');
    expect(page).not.toContain('{name}');
    expect(page).not.toMatch(/lớp 2|lớp Hai|SGK|sách giáo khoa|Kết nối tri thức|Bài \d+\.|Trang \d+|\/bai\//i);
  });

  it('lists what the topic practises, in our own words', () => {
    expect((page.match(/<ul class="lesson-objectives">([\s\S]*?)<\/ul>/)?.[1]?.match(/<li>/g) ?? []).length).toBeGreaterThan(0);
  });

  it('carries a LearningResource block that parses and names no grade', () => {
    const block = /<script type="application\/ld\+json">([^<]*)<\/script>/.exec(page)?.[1] ?? '';
    const data = JSON.parse(block) as Record<string, unknown>;
    expect(data).toMatchObject({ '@type': 'LearningResource', inLanguage: 'vi', isAccessibleForFree: true, teaches: 'Số đến 100', about: 'Toán', url: 'https://miu.hoandat.com/hoc/toan/so-den-100/' });
    expect(data).not.toHaveProperty('educationalLevel');
  });

  it('links to the topic before and after it', () => {
    const second = html(topicPagePath({ subject: 'toan', id: 'thanh-phan-phep-tinh' }));
    expect(second).toContain('Chủ đề trước: Số đến 100');
    expect(second).toContain('Chủ đề sau: ');
  });

  it('keeps the description to a length a search result shows', () => {
    const description = /<meta name="description" content="([^"]*)">/.exec(page)?.[1] ?? '';
    expect(description.length).toBeGreaterThan(80);
    expect(description.length).toBeLessThanOrEqual(260);
  });
});

describe('a subject page', () => {
  it('lists every topic of the subject, and keeps to the policy', () => {
    const page = html(subjectPagePath(TOPIC_SUBJECTS[0]));
    expect(topicPageIssues(page)).toEqual([]);
    expect(page).toContain('<link rel="canonical" href="https://miu.hoandat.com/hoc/toan/">');
    expect(page).toContain('<h1>Học Toán qua trò chơi</h1>');
    const topics = site.pages.filter((p) => p.path.startsWith('/hoc/toan/') && p.path !== '/hoc/toan/').length;
    expect((page.match(/href="\/hoc\/toan\/[a-z0-9-]+\/"/g) ?? []).length).toBe(topics);
    expect(topics).toBeGreaterThan(0);
  });
});

describe('the 404 page', () => {
  const page = site.notFound(ASSETS);

  it('keeps to the policy, is kept out of search results and runs no script', () => {
    expect(topicPageIssues(page)).toEqual([]);
    expect(page).toContain('<meta name="robots" content="noindex">');
    expect(page).not.toContain('<script');
    expect(page).not.toContain('canonical');
    expect(page).toContain('<h1>Không tìm thấy trang này</h1>');
  });

  it('leads back to the game and to the subject pages', () => {
    expect(page).toContain('href="/"');
    expect(page).toContain('href="/hoc/toan/"');
    expect(page).toContain('href="/hoc/tieng-viet/"');
  });
});

describe('page hashes', () => {
  it('follow what a page says, not the bundle\'s file names', () => {
    const again = buildSite({ contentDir: CONTENT_DIR, assetsDir: ASSETS_DIR, csp: CONTENT_SECURITY_POLICY });
    expect(again.pages.map((p) => p.hash)).toEqual(site.pages.map((p) => p.hash));
    expect(html(LESSON, { script: '/assets/other.js', imports: [], styles: [] })).not.toBe(html(LESSON));
    expect(new Set(site.pages.map((p) => p.hash)).size).toBe(site.pages.length);
    const changed = buildSite({ contentDir: CONTENT_DIR, assetsDir: ASSETS_DIR, csp: "default-src 'none'" });
    expect(changed.pages[0]?.hash).not.toBe(site.pages[0]?.hash);
  });

  it('are listed for the sitemap with the home page first', () => {
    const pages = sitemapPages(site, path.join(APP_DIR, 'index.html'));
    expect(pages[0]).toMatchObject({ path: '/' });
    expect(pages).toHaveLength(site.pages.length + 1);
    expect(pages.every((p) => /^[0-9a-f]{12}$/.test(p.hash))).toBe(true);
  });
});

describe('teaser', () => {
  it('cuts at a word and marks the cut', () => {
    expect(teaser('Ngắn gọn.', 50)).toBe('Ngắn gọn.');
    expect(teaser('Gió khai trường thổi bay bảng số của lớp, bờm thầy rối tung', 30)).toBe('Gió khai trường thổi bay bảng…');
  });
});

describe('the plugin that writes the pages', () => {
  const run = (bundle: Record<string, unknown>): Array<{ fileName: string; source: string }> => {
    const emitted: Array<{ fileName: string; source: string }> = [];
    const plugin = topicPageFiles(site);
    const hook = plugin.generateBundle;
    const generate = typeof hook === 'function' ? hook : hook?.handler;
    generate?.call({ emitFile: (file: { fileName: string; source: string }) => emitted.push(file) } as never, {} as never, bundle as never, false);
    return emitted;
  };

  it('writes each page at <path>index.html with the entry\'s file names from the bundle', () => {
    const emitted = run({
      'assets/lesson-page-xyz789.js': { type: 'chunk', isEntry: true, name: LESSON_PAGE_ENTRY, fileName: 'assets/lesson-page-xyz789.js', imports: ['assets/zod-aaa111.js'], viteMetadata: { importedCss: new Set(['assets/lesson-page-xyz789.css']) } },
      'assets/zod-aaa111.js': { type: 'chunk', fileName: 'assets/zod-aaa111.js', imports: [], viteMetadata: { importedCss: new Set() } },
      'assets/index-111.js': { type: 'chunk', isEntry: true, name: 'index', fileName: 'assets/index-111.js', imports: [], viteMetadata: { importedCss: new Set() } },
    });
    expect(emitted).toHaveLength(site.pages.length + 1);
    expect(emitted.map((f) => f.fileName)).toEqual(expect.arrayContaining(['hoc/toan/index.html', '404.html']));
    const lesson = emitted.find((f) => f.fileName === 'hoc/toan/so-den-100/index.html')?.source ?? '';
    expect(lesson).toContain('src="/assets/lesson-page-xyz789.js"');
    expect(lesson).toContain('href="/assets/lesson-page-xyz789.css"');
    expect(lesson).toContain('href="/assets/zod-aaa111.js"');
  });

  it('takes the styles of the chunks the entry imports too, theirs first, and every chunk it loads at start once', () => {
    const emitted = run({
      'assets/lesson-page-xyz789.js': { type: 'chunk', isEntry: true, name: LESSON_PAGE_ENTRY, fileName: 'assets/lesson-page-xyz789.js', imports: ['assets/styles-bbb.js', 'assets/zod-aaa111.js'], viteMetadata: { importedCss: new Set(['assets/lesson-page-xyz789.css']) } },
      'assets/styles-bbb.js': { type: 'chunk', fileName: 'assets/styles-bbb.js', imports: ['assets/zod-aaa111.js'], viteMetadata: { importedCss: new Set(['assets/styles-bbb.css', 'assets/tokens-ccc.css']) } },
      'assets/zod-aaa111.js': { type: 'chunk', fileName: 'assets/zod-aaa111.js', imports: [], viteMetadata: { importedCss: new Set() } },
    });
    const lesson = emitted.find((f) => f.fileName === 'hoc/toan/so-den-100/index.html')?.source ?? '';
    const sheets = [...lesson.matchAll(/<link rel="stylesheet"[^>]*href="([^"]+)"/g)].map((m) => m[1]);
    expect(sheets).toEqual(['/assets/styles-bbb.css', '/assets/tokens-ccc.css', '/assets/lesson-page-xyz789.css']);
    expect([...lesson.matchAll(/<link rel="modulepreload"[^>]*href="([^"]+)"/g)].map((m) => m[1])).toEqual(['/assets/zod-aaa111.js', '/assets/styles-bbb.js']);
  });

  it('refuses a bundle without the lesson page entry', () => {
    expect(() => run({ 'assets/index-111.js': { type: 'chunk', isEntry: true, name: 'index', fileName: 'assets/index-111.js', imports: [] } })).toThrow(/lesson-page/);
  });
});
