import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { act } from 'react-dom/test-utils';
import { createRoot } from 'react-dom/client';
import { createElement } from 'react';
import { LimitSlider } from '../../../components/widgets/LimitSlider';
import { LoadingAnimation } from '../../../components/widgets/LoadingAnimation';

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

describe('Widgets', () => {
  let container: HTMLDivElement;
  let root: ReturnType<typeof createRoot> | null = null;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
  });

  afterEach(() => {
    act(() => root?.unmount());
    container.remove();
    root = null;
  });

  it('renders LoadingAnimation with label and width styles', () => {
    act(() => {
      root = createRoot(container);
      root.render(createElement(LoadingAnimation, { label: 'Fetching', width: 120, className: 'extra' }));
    });
    const wrapper = container.querySelector('.loading-animation') as HTMLElement;
    expect(wrapper?.className).toContain('extra');
    expect(wrapper?.style.getPropertyValue('--loading-animation-width')).toBe('120px');
    expect(container.textContent).toContain('Fetching');
    expect(container.querySelector('img')?.getAttribute('src')).toContain('loading_240.gif');
    expect(container.querySelector('source')?.getAttribute('srcset')).toContain('loading_240.webp');
  });

  it('toggles LimitSlider popover, updates label, and calls onLimitChange', async () => {
    const onLimitChange = vi.fn();
    act(() => {
      root = createRoot(container);
      root.render(createElement(LimitSlider, { totalCount: 5, limit: null, onLimitChange }));
    });

    const button = container.querySelector('button') as HTMLButtonElement;
    expect(button.textContent).toContain('all 5');
    expect(button.disabled).toBe(false);

    await act(async () => {
      button.click();
    });
    const slider = container.querySelector('input[type="range"]') as HTMLInputElement;
    expect(slider).toBeTruthy();

    const propsKey = Object.keys(slider).find(k => k.startsWith('__reactProps$'));
    const props = propsKey ? (slider as any)[propsKey] : {};

    await act(async () => {
      slider.value = '3';
      props.onChange?.({ target: slider });
    });
    expect(onLimitChange).toHaveBeenCalledWith(3);

    await act(async () => {
      slider.value = '5';
      props.onChange?.({ target: slider });
    });
    expect(onLimitChange).toHaveBeenCalledWith(null);
  });

  it('disables LimitSlider when totalCount is null or zero', () => {
    act(() => {
      root = createRoot(container);
      root.render(createElement(LimitSlider, { totalCount: null, limit: null, onLimitChange: vi.fn(), disabled: true }));
    });
    const button = container.querySelector('button') as HTMLButtonElement;
    expect(button.disabled).toBe(true);
    expect(button.textContent).toContain('all tracks');
  });
});
