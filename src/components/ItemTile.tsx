import './ItemTile.css';
import { TrackContainer } from '../data/TrackContainer';

export type ContentType = 'playlist' | 'album';

interface ItemTileProps {
  item: TrackContainer;
  contentType: ContentType;
  onDragStart?: (e: React.DragEvent, item: TrackContainer) => void;
  onDragEnd?: () => void;
  isDragging?: boolean;
  showRemoveButton?: boolean;
  onRemove?: (itemId: string) => void;
}

export function ItemTile({ item, contentType, onDragStart, onDragEnd, isDragging = false, showRemoveButton = false, onRemove }: ItemTileProps) {
  console.log('Rendering item:', item); // Debug log
  
  return (
    <div 
      className={`item-tile ${isDragging ? 'dragging' : ''}`}
      draggable={!!onDragStart}
      onDragStart={onDragStart ? (e) => onDragStart(e, item) : undefined}
      onDragEnd={onDragEnd}
    >
      {showRemoveButton && (
        <button 
          className="remove-button"
          onClick={() => onRemove?.(item.id)}
          aria-label="Remove item"
        >
          ×
        </button>
      )}
      <div className="item-image">
        {item.coverImage ? (
          <img 
            src={item.coverImage.url} 
            alt={`${item.name} cover`}
            className="cover-image"
          />
        ) : (
          <div className="placeholder-image">
            {item.type === 'liked-songs' ? '♥' : (contentType === 'playlist' ? '♪' : '♫')}
          </div>
        )}
      </div>
      <div className="item-content">
        <h3 className="item-title">{item.name}</h3>
        {item.description && (
          <p className="item-description">{item.description}</p>
        )}
        <div className="item-metadata">
          <span className="item-type">{item.type}</span>
        </div>
      </div>
    </div>
  );
}