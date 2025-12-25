import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { resolveAssetUrl, isLocalAssetUrl } from '../../utils/assetUtils';
import { responsiveSizingDump } from '../../utils/responsiveSizingDump';

const originalEnv = { ...import.meta.env };

describe('assetUtils', () => {
  afterEach(() => {
    (import.meta as any).env = { ...originalEnv };
  });

  it('resolves dev asset URLs and detects local asset', () => {
    (import.meta as any).env = { ...originalEnv, DEV: true, BASE_URL: '/' };
    expect(resolveAssetUrl('/images/test.png')).toBe('/images/test.png');
    expect(isLocalAssetUrl('/foo/bar')).toBe(true);
    expect(isLocalAssetUrl('https://x.com')).toBe(false);
  });
});

describe('responsiveSizingDump', () => {
  const originalMatchMedia = window.matchMedia;
  const originalVisualViewport = (window as any).visualViewport;
  const originalDevicePixelRatio = window.devicePixelRatio;

  beforeEach(() => {
    window.matchMedia = vi.fn((query: string) => ({
      matches: query.includes('prefers-reduced-motion') ? true : false,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn()
    })) as any;
    (window as any).visualViewport = { width: 100, height: 200, scale: 1, offsetLeft: 0, offsetTop: 0, pageLeft: 0, pageTop: 0 };
    (window as any).devicePixelRatio = 2;
  });

  afterEach(() => {
    window.matchMedia = originalMatchMedia;
    (window as any).visualViewport = originalVisualViewport;
    (window as any).devicePixelRatio = originalDevicePixelRatio;
  });

  it('emits summary and JSON payload', () => {
    const dump = responsiveSizingDump();
    expect(dump).toContain('inner=');
    expect(dump).toContain('"viewport_css"');
    expect(dump).toContain('"visualViewportScale": 1');
    expect(dump).toContain('"prefersReducedMotion": true');
  });
});
