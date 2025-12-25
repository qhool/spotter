import { describe, it, expect, beforeEach, afterEach, vi, type Mock } from 'vitest';
import { act } from 'react-dom/test-utils';
import { createRoot } from 'react-dom/client';
import { createElement } from 'react';
import { HamburgerMenu } from '../../../components/navigation/HamburgerMenu';
import { AboutOverlay } from '../../../components/overlays/AboutOverlay';

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

vi.mock('../../../components/overlays/AboutOverlay', () => ({
  AboutOverlay: vi.fn(({ isOpen, onClose }) => isOpen ? createElement('div', { 'data-testid': 'about', onClick: onClose }, 'About') : null)
}));

const mockProfile = {
  display_name: 'Test User',
  followers: { total: 42 },
  images: [{ url: 'avatar.png' }]
};

const makeSdk = () =>
  ({
    currentUser: {
      profile: vi.fn(async () => mockProfile)
    },
    logOut: vi.fn()
  }) as any;

const renderMenu = async (sdk = makeSdk(), props: Partial<React.ComponentProps<typeof HamburgerMenu>> = {}) => {
  const container = document.createElement('div');
  document.body.appendChild(container);
  let root: ReturnType<typeof createRoot> | null = null;
  await act(async () => {
    root = createRoot(container);
    root.render(
      createElement(HamburgerMenu, {
        sdk,
        onTestbedClick: vi.fn(),
        onRemixWizardClick: vi.fn(),
        onRecentTracksClick: vi.fn(),
        ...props
      })
    );
    await Promise.resolve();
  });
  return { container, root: root!, sdk };
};

describe('HamburgerMenu', () => {
  let cleanup: (() => void) | null = null;

  beforeEach(() => {
    cleanup = null;
    vi.useFakeTimers();
    vi.spyOn(window, 'location', 'get').mockReturnValue({ reload: vi.fn() } as any);
  });

  afterEach(() => {
    vi.useRealTimers();
    (AboutOverlay as unknown as Mock).mockClear();
    document.body.innerHTML = '';
    cleanup?.();
  });

  it('opens, closes, and selects menu items', async () => {
    const testbedClick = vi.fn();
    const remixClick = vi.fn();
    const recentClick = vi.fn();
    const { container, root } = await renderMenu(makeSdk(), {
      onTestbedClick: testbedClick,
      onRemixWizardClick: remixClick,
      onRecentTracksClick: recentClick
    });
    cleanup = () => root.unmount();
    await act(async () => {});

    const button = container.querySelector('.hamburger-button') as HTMLButtonElement;
    expect(button.getAttribute('aria-expanded')).toBe('false');

    await act(async () => {
      button.click();
    });
    expect(button.getAttribute('aria-expanded')).toBe('true');
    expect(container.textContent).toContain('Test User');
    expect(container.textContent).toContain('42 followers');

    const getButtons = () => Array.from(container.querySelectorAll('.menu-item')) as HTMLButtonElement[];
    let menuButtons = getButtons();
    expect(menuButtons.length).toBeGreaterThan(0);

    await act(async () => {
      menuButtons[0].click();
    });
    expect(remixClick).toHaveBeenCalledTimes(1);
    expect(button.getAttribute('aria-expanded')).toBe('false');

    await act(async () => {
      button.click();
    });
    menuButtons = getButtons();
    const recentBtn = menuButtons.find(btn => btn.textContent?.includes('Recently Played')) as HTMLButtonElement;
    await act(async () => {
      recentBtn.click();
    });
    expect(recentClick).toHaveBeenCalled();
  });

  it('handles logout and clears tokens', async () => {
    const sdk = makeSdk();
    const reloadSpy = vi.spyOn(window.location, 'reload');
    localStorage.setItem('spotify-sdk-access-token', 'x');
    const { container, root } = await renderMenu(sdk);
    cleanup = () => root.unmount();
    await act(async () => {});
    const button = container.querySelector('.hamburger-button') as HTMLButtonElement;

    await act(async () => button.click());
    const logoutBtn = container.querySelector('.logout-item') as HTMLButtonElement;
    await act(async () => logoutBtn.click());

    expect(sdk.logOut).toHaveBeenCalled();
    expect(localStorage.getItem('spotify-sdk-access-token')).toBeNull();
    expect(reloadSpy).toHaveBeenCalled();
  });

  it('opens About overlay and closes menu', async () => {
    const { container, root } = await renderMenu();
    cleanup = () => root.unmount();
    await act(async () => {});
    const button = container.querySelector('.hamburger-button') as HTMLButtonElement;

    await act(async () => button.click());
    const aboutBtn = Array.from(container.querySelectorAll('.menu-item')).find(btn =>
      btn.textContent?.includes('About')
    ) as HTMLButtonElement;
    await act(async () => aboutBtn.click());

    const calls = (AboutOverlay as unknown as Mock).mock.calls;
    expect(calls[calls.length - 1][0].isOpen).toBe(true);
    expect(button.getAttribute('aria-expanded')).toBe('false');
  });

  it('keeps dropdown within viewport bounds at different widths', async () => {
    const { container, root } = await renderMenu();
    cleanup = () => root.unmount();
    await act(async () => {});
    const button = container.querySelector('.hamburger-button') as HTMLButtonElement;
    const dropdownRect = { top: 10, bottom: 200, left: 10, right: 190, width: 180, height: 190 } as DOMRect;

    Object.defineProperty(HTMLElement.prototype, 'getBoundingClientRect', {
      configurable: true,
      value: function() {
        if (this.classList.contains('hamburger-dropdown')) {
          return dropdownRect;
        }
        return { top: 0, bottom: 0, left: 0, right: 0, width: 0, height: 0 } as DOMRect;
      }
    });

    await act(async () => button.click());
    const dropdown = container.querySelector('.hamburger-dropdown') as HTMLElement;
    expect(dropdown).toBeTruthy();
    const rect = dropdown.getBoundingClientRect();
    expect(rect.left).toBeGreaterThanOrEqual(0);
    expect(rect.right).toBeLessThanOrEqual(window.innerWidth || 1024);
  });
});
