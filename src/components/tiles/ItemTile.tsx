import './ItemTile.css';
import { TrackContainer } from '../../data/TrackContainer';
import { ReactNode } from 'react';

export type ContentType = 'playlist' | 'album';

interface ItemTileProps {
  item: TrackContainer;
  contentType: ContentType;
  onDragStart?: (e: React.DragEvent, item: TrackContainer) => void;
  onDragEnd?: () => void;
  isDragging?: boolean;
  controls?: ReactNode;
}

export function ItemTile({ item, contentType, onDragStart, onDragEnd, isDragging = false, controls }: ItemTileProps) {
  //console.log('Rendering item:', item); // Debug log
  
  return (
    <div 
      className={`item-tile ${isDragging ? 'dragging' : ''}`}
      draggable={!!onDragStart}
      onDragStart={onDragStart ? (e) => onDragStart(e, item) : undefined}
      onDragEnd={onDragEnd}
    >
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
      </div>
      {controls && (
        <div className="item-controls">
          {controls}
        </div>
      )}
    </div>
  );
}