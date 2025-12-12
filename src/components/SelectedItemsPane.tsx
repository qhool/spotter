import { ReactNode } from 'react';
import { TrackContainer } from '../data/TrackContainer';
import { ItemTile, ContentType } from './ItemTile';
import { TrashSolid } from 'iconoir-react';
import './SelectedItemsPane.css';

interface SelectedItemsPaneProps {
  items: TrackContainer<any>[];
  onRemoveItem: (itemId: string) => void;
  title?: string;
  emptyMessage?: ReactNode;
  className?: string;
}

const toContentType = (item: TrackContainer<any>): ContentType =>
  item.type === 'album' ? 'album' : 'playlist';

export function SelectedItemsPane({
  items,
  onRemoveItem,
  title,
  emptyMessage = 'No items selected',
  className = ''
}: SelectedItemsPaneProps) {
  const classes = ['selected-items-pane', 'playlist-container'];
  if (className) {
    classes.push(className);
  }

  return (
    <div className={classes.join(' ')}>
      {title && (
        <div className="selected-items-pane__header">
          <h3>{title}</h3>
          {items.length > 0 && (
            <span className="selected-items-pane__count">{items.length}</span>
          )}
        </div>
      )}

      {items.length === 0 ? (
        <div className="selected-items-pane__empty">{emptyMessage}</div>
      ) : (
        <div className="selected-items-pane__list">
          {items.map(item => (
            <ItemTile
              key={item.id}
              item={item}
              contentType={toContentType(item)}
              controls={
                <button
                  className="control-button remove-button"
                  onClick={() => onRemoveItem(item.id)}
                  aria-label={`Remove ${item.name}`}
                >
                  <TrashSolid />
                </button>
              }
            />
          ))}
        </div>
      )}
    </div>
  );
}
