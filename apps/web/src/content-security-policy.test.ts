import { describe, expect, it } from 'vitest';
import { CONTENT_SECURITY_POLICY } from '../vite.config';
import { CLOUDFLARE_ANALYTICS } from '../vite-native';

describe('web content security policy', () => {
  const directives = new Map(
    CONTENT_SECURITY_POLICY.split(';').map((d) => {
      const [name = '', ...values] = d.trim().split(/\s+/);
      return [name, values] as const;
    }),
  );

  it('allows scripts and connections from our own origin, and Cloudflare Web Analytics only', () => {
    expect(directives.get('script-src')).toEqual(["'self'", 'https://static.cloudflareinsights.com']);
    expect(directives.get('default-src')).toEqual(["'self'"]);
    expect(directives.get('connect-src')?.every((v) => ["'self'", 'blob:', 'data:', 'https://cloudflareinsights.com'].includes(v))).toBe(true);
  });

  it('plays back a recording made on the device (blob:), from no other host', () => {
    expect(directives.get('media-src')).toEqual(["'self'", 'blob:']);
  });

  it('blocks plugins and base/form hijacking', () => {
    expect(directives.get('object-src')).toEqual(["'none'"]);
    expect(directives.get('base-uri')).toEqual(["'self'"]);
    expect(directives.get('form-action')).toEqual(["'self'"]);
  });

  it('never enables eval or a third-party host other than Cloudflare Web Analytics', () => {
    expect(CONTENT_SECURITY_POLICY).not.toContain('unsafe-eval');
    const hosts = [...CONTENT_SECURITY_POLICY.matchAll(/https?:\/\/[^\s;]+/g)].map((m) => m[0]);
    expect(hosts).toEqual([CLOUDFLARE_ANALYTICS.script, CLOUDFLARE_ANALYTICS.connect]);
  });
});
