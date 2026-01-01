import { ReactNode, useCallback } from 'react';
import { TrackContainer } from '../../data/TrackContainer';
import { ItemTile, ContentType } from '../tiles/ItemTile';
import { TrashSolid } from 'iconoir-react';
import { DragReorderContainer } from '../containers/DragReorderContainer';
import './SelectedItemsPane.css';

interface SelectedItemsPaneProps {
  items: TrackContainer<any>[];
  setItems: (items: TrackContainer<any>[]) => void;
  onRemoveItem: (itemId: string) => void;
  emptyMessage?: ReactNode;
  className?: string;
  disableDragToDelete?: boolean;
  renderItemControls?: (item: TrackContainer<any>) => ReactNode;
  headerControls?: ReactNode;
}

const toContentType = (item: TrackContainer<any>): ContentType =>
  item.type === 'album' ? 'album' : 'playlist';

export function SelectedItemsPane({
  items,
  setItems,
  onRemoveItem,
  emptyMessage = 'No items selected',
  className = '',
  disableDragToDelete = true,
  renderItemControls,
  headerControls
}: SelectedItemsPaneProps) {
  const classes = ['selected-items-pane'];
  if (className) {
    classes.push(className);
  }

  const getItemId = useCallback((item: TrackContainer<any>) => item.id, []);

  const renderSelectedItem = useCallback(
    (item: TrackContainer<any>) => (
      <ItemTile
        key={item.id}
        item={item}
        contentType={toContentType(item)}
        controls={
          <>
            {renderItemControls?.(item)}
            <button
              className="control-button remove-button"
              onClick={() => onRemoveItem(item.id)}
              aria-label={`Remove ${item.name}`}
            >
              <TrashSolid />
            </button>
          </>
        }
      />
    ),
    [onRemoveItem, renderItemControls]
  );

  return (
    <div className="select-items-container">
      <div className="content-area">
        <div className="right-panel">
          <div className={classes.join(' ')}>
            <div className="selected-items-pane__header">
              <div className="selected-items-pane__header-right">
                {headerControls}
              </div>
            </div>

            <div className="selected-items-pane__body">
              <div className="playlist-container selected-items-pane__list-wrapper">
                {items.length === 0 ? (
                  <div className="selected-items-pane__empty">{emptyMessage}</div>
                ) : (
                  <DragReorderContainer
                    items={items}
                    setItems={setItems}
                    getItemId={getItemId}
                    renderItem={renderSelectedItem}
                    className="selected-items-pane__drag-container"
                    disableDragToDelete={disableDragToDelete}
                  />
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
