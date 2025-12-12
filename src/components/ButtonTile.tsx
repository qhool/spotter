import './ItemTile.css';
import './ButtonTile.css';

interface ButtonTileProps {
  name: string;
  onClick: () => void;
  disabled?: boolean;
}

export function ButtonTile({ name, onClick, disabled = false }: ButtonTileProps) {
  return (
    <div 
      className={`item-tile button-tile ${disabled ? 'disabled' : ''}`}
      onClick={disabled ? undefined : onClick}
    >
      <div className="button-tile-content">
        <span className="button-tile-text">{name}</span>
      </div>
    </div>
  );
}