import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { act } from 'react-dom/test-utils';
import { createRoot } from 'react-dom/client';
import { createElement } from 'react';
import { RemixWizardPage } from '../../pages/RemixWizardPage';

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

type PaneContext = { panes: { get: (id: string) => { isVisible: boolean } | null } };

let latestSelectedProps: any = null;
let latestWizardProps: any = null;
let latestRemixProps: any = null;
let latestExportProps: any = null;
let remixNotified = false;
let excludedSet = false;

vi.mock('../../components/navigation/Wizard', () => ({
  Wizard: (props: any) => {
    latestWizardProps = props;
    const ctx: PaneContext = {
      panes: {
        get: (id: string) =>
          id === 'search'
            ? { isVisible: props.searchVisible ?? true }
            : id === 'selected-items'
            ? { isVisible: true }
            : null
      }
    };
    return createElement(
      'div',
      { className: 'mock-wizard' },
      props.panes.map((pane: any) =>
        createElement('section', { key: pane.id, 'data-pane': pane.id }, pane.render(ctx))
      )
    );
  }
}));

vi.mock('../../components/panes/SearchPane', () => ({
  SearchPane: (props: any) => {
    return createElement(
      'div',
      { className: 'mock-search-pane' },
      createElement(
        'button',
        {
          onClick: () =>
            props.onAddItem({
              id: 'pl-1',
              name: 'Playlist One',
              type: 'playlist'
            })
        },
        'Add Playlist One'
      )
    );
  }
}));

vi.mock('../../components/panes/SelectedItemsPane', () => ({
  SelectedItemsPane: (props: any) => {
    latestSelectedProps = props;
    return createElement(
      'div',
      { className: 'mock-selected-pane', 'data-disable-drag': props.disableDragToDelete },
      props.items.map((item: any) =>
        createElement(
          'div',
          { key: item.id, className: 'selected-item' },
          createElement('span', { className: 'selected-name' }, item.name),
          createElement(
            'button',
            { className: 'remove', onClick: () => props.onRemoveItem(item.id) },
            'Remove'
          ),
          props.renderItemControls?.(item)
        )
      )
    );
  }
}));

vi.mock('../../components/panes/RemixPane', () => ({
  RemixPane: (props: any) => {
    latestRemixProps = props;
    const dummyContainer = { id: 'remix-container' };
    if (!remixNotified) {
      remixNotified = true;
      props.onRemixContainerChange?.(dummyContainer);
    }
    if (!excludedSet) {
      excludedSet = true;
      props.setExcludedTrackIds?.(new Set(['ex1']));
    }
    return createElement('div', { className: 'mock-remix-pane' }, 'Remix');
  }
}));

vi.mock('../../components/panes/ExportPane', () => ({
  ExportPane: (props: any) => {
    latestExportProps = props;
    return createElement('div', { className: 'mock-export-pane' }, 'Export');
  }
}));

describe('RemixWizardPage interactions', () => {
  let container: HTMLDivElement;
  let root: ReturnType<typeof createRoot> | null;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
    root = null;
    latestSelectedProps = null;
    latestWizardProps = null;
    latestRemixProps = null;
    latestExportProps = null;
    remixNotified = false;
    excludedSet = false;
  });

  afterEach(() => {
    act(() => root?.unmount());
    container.remove();
  });

  const renderPage = async (opts: { searchVisible?: boolean } = {}) => {
    await act(async () => {
      root = createRoot(container);
      root.render(
        createElement(RemixWizardPage, {
          sdk: {} as any,
          navSlot: null,
          syncController: {} as any,
          recentTracksContainer: null
        } as any)
      );
    });
    await act(async () => Promise.resolve());
    return opts;
  };

  it('adds items from search and shows them in selected list', async () => {
    await renderPage();
    const addBtn = container.querySelector('.mock-search-pane button') as HTMLButtonElement;
    await act(async () => addBtn.click());
    const selectedNames = Array.from(container.querySelectorAll('.selected-name')).map(el => el.textContent);
    expect(selectedNames).toContain('Playlist One');

    // duplicate add should not create another entry
    await act(async () => addBtn.click());
    const selectedItems = container.querySelectorAll('.selected-item');
    expect(selectedItems.length).toBe(1);
  });

  it('removes selected items and toggles exclusion control', async () => {
    await renderPage();
    const addBtn = container.querySelector('.mock-search-pane button') as HTMLButtonElement;
    await act(async () => addBtn.click());

    // exclude toggle from renderItemControls
    const excludeBtn = container.querySelector('.exclude-button') as HTMLButtonElement;
    expect(excludeBtn).toBeTruthy();
    await act(async () => excludeBtn.click());
    expect(excludeBtn.className).toContain('is-active');
    expect(latestRemixProps?.itemOptionsById?.['pl-1']?.excludeFromRemix).toBe(true);
    await act(async () => excludeBtn.click());
    expect(excludeBtn.className).not.toContain('is-active');
    expect(latestRemixProps?.itemOptionsById?.['pl-1']).toBeUndefined();

    const removeBtn = container.querySelector('.remove') as HTMLButtonElement;
    await act(async () => removeBtn.click());
    expect(container.querySelector('.selected-item')).toBeNull();
    expect(latestRemixProps?.selectedItems?.length).toBe(0);
  });

  it('passes disableDragToDelete based on search pane visibility', async () => {
    await renderPage();
    expect(latestSelectedProps?.disableDragToDelete).toBe(false);
  });

  it('wires remix container and excluded ids into export pane', async () => {
    await renderPage();
    expect(latestExportProps?.remixContainer?.id).toBe('remix-container');
    expect(Array.from(latestExportProps?.excludedTrackIds ?? [])).toContain('ex1');
  });
});
