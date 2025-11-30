import './PlaceholderTile.css';

interface PlaceholderTileProps {
  text?: string;
}

export function PlaceholderTile({ text = "Item being moved" }: PlaceholderTileProps) {
  return (
    <div className="placeholder-tile">
      <div className="placeholder-content">
        <div className="placeholder-text">{text}</div>
      </div>
    </div>
  );
}