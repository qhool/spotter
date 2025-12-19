import { useEffect } from 'react';
import { ArrowRightTagSolid } from 'iconoir-react';
import './PlaylistPicker.css';

export interface PlaylistSummary {
  id: string;
  name: string;
  description?: string | null;
  ownerName?: string | null;
  imageUrl?: string | null;
  trackCount?: number;
}

interface PlaylistPickerProps {
  isOpen: boolean;
  isLoading: boolean;
  error: string | null;
  playlists: PlaylistSummary[];
  onSelect: (playlist: PlaylistSummary) => void;
  onClose: () => void;
  onRetry: () => void;
}

export function PlaylistPicker({
  isOpen,
  isLoading,
  error,
  playlists,
  onSelect,
  onClose,
  onRetry
}: PlaylistPickerProps) {
  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) {
    return null;
  }

  return (
    <div className="playlist-picker-overlay" role="dialog" aria-modal="true">
      <div className="playlist-picker-backdrop" onClick={onClose} aria-hidden="true" />
      <div className="playlist-picker-panel">
        <div className="playlist-picker-header">
          <div>
            <p className="playlist-picker-label">Export destination</p>
            <h3>Select an existing playlist</h3>
          </div>
          <button type="button" className="text-button" onClick={onClose}>
            Cancel
          </button>
        </div>
        <div className="playlist-picker-body">
          {isLoading && <p className="playlist-picker-status">Loading your playlists…</p>}

          {!isLoading && error && (
            <div className="playlist-picker-status">
              <p>{error}</p>
              <button type="button" className="text-button" onClick={onRetry}>
                Try again
              </button>
            </div>
          )}

          {!isLoading && !error && playlists.length === 0 && (
            <p className="playlist-picker-status">You don’t have any playlists yet.</p>
          )}

          {!isLoading && !error && playlists.length > 0 && (
            <ul className="playlist-picker-list">
              {playlists.map(playlist => (
                <li key={playlist.id}>
                  <button
                    type="button"
                    className="playlist-picker-item"
                    onClick={() => onSelect(playlist)}
                  >
                    <div className="playlist-picker-item__info">
                      {playlist.imageUrl ? (
                        <img src={playlist.imageUrl} alt="" role="presentation" />
                      ) : (
                        <div className="playlist-picker-item__thumb-placeholder" aria-hidden="true" />
                      )}
                      <div>
                        <span className="playlist-picker-item__name">{playlist.name}</span>
                        <span className="playlist-picker-item__meta">
                          {playlist.ownerName ? `by ${playlist.ownerName}` : 'Owned by you'}
                          {playlist.trackCount != null && ` • ${playlist.trackCount} tracks`}
                        </span>
                      </div>
                    </div>
                    <ArrowRightTagSolid aria-hidden="true" />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
