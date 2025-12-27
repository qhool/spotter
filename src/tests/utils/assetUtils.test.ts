import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { resolveAssetUrl, isLocalAssetUrl } from '../../utils/assetUtils';

describe('assetUtils', () => {
  const originalEnv = { ...import.meta.env };

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    Object.assign(import.meta.env, originalEnv);
  });

  it('resolves asset url in dev with leading slash stripped', () => {
    import.meta.env.DEV = true as any;
    const url = resolveAssetUrl('/images/test.png');
    expect(url).toBe('/images/test.png');
  });

  it('resolves asset url in prod using BASE_URL and normalizes', () => {
    import.meta.env.DEV = false as any;
    import.meta.env.BASE_URL = '/base';
    const url = resolveAssetUrl('/images/test.png');
    expect(url).toBe('/base/images/test.png');
  });

  it('detects local asset urls', () => {
    expect(isLocalAssetUrl('/images/foo.png')).toBe(true);
    expect(isLocalAssetUrl('https://example.com/img.png')).toBe(false);
  });
});
