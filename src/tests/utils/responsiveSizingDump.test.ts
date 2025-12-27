import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { responsiveSizingDump } from '../../utils/responsiveSizingDump';

const origVV = (globalThis as any).visualViewport;
const origMatch = globalThis.matchMedia;

describe('responsiveSizingDump', () => {
  beforeEach(() => {
    (globalThis as any).visualViewport = {
      width: 100,
      height: 200,
      offsetLeft: 1,
      offsetTop: 2,
      pageLeft: 3,
      pageTop: 4,
      scale: 1.5
    };
    globalThis.matchMedia = vi.fn((query: string) => ({
      media: query,
      matches: query.includes('hover'),
      addListener: () => {},
      removeListener: () => {}
    })) as any;
  });

  afterEach(() => {
    (globalThis as any).visualViewport = origVV;
    globalThis.matchMedia = origMatch;
  });

  it('includes visual viewport and media query info when available', () => {
    const dump = responsiveSizingDump();
    expect(dump).toContain('visualViewport_css');
    expect(dump).toContain('"anyHover": true');
    expect(dump).toContain('inner=');
  });

  it('handles missing visualViewport and media query fallbacks', () => {
    (globalThis as any).visualViewport = undefined;
    globalThis.matchMedia = vi.fn(() => ({ matches: false, addListener() {}, removeListener() {} })) as any;
    const dump = responsiveSizingDump();
    expect(dump).toContain('"visualViewport_css": null');
    expect(dump).toContain('"anyHover": false');
  });
});
