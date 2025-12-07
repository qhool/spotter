import './ExportProgressOverlay.css';

interface ExportProgressOverlayProps {
  description: string;
  completed: number; // 0.0 to 1.0
  tracksProcessed: number;
  totalTracks: number;
  isVisible: boolean;
  isCompleted?: boolean;
  completionMessage?: string;
  spotifyPlaylistId?: string;
  onDismiss?: () => void;
}

export function ExportProgressOverlay({ 
  description, 
  completed, 
  tracksProcessed, 
  totalTracks, 
  isVisible,
  isCompleted = false,
  completionMessage,
  spotifyPlaylistId,
  onDismiss
}: ExportProgressOverlayProps) {
  if (!isVisible) return null;

  const percentage = Math.round(completed * 100);

  const handleOverlayClick = (e: React.MouseEvent) => {
    // Only dismiss if not clicking on the Spotify link area
    if (isCompleted && onDismiss && e.target === e.currentTarget) {
      onDismiss();
    }
  };

  const handleModalClick = (e: React.MouseEvent) => {
    // Allow dismissal when clicking in the modal but outside the dead zone
    if (isCompleted && onDismiss) {
      const target = e.target as HTMLElement;
      // Don't dismiss if clicking on the Spotify link or close to it
      if (!target.closest('.spotify-link-container')) {
        onDismiss();
      }
    }
  };

  return (
    <div className="export-progress-overlay" onClick={handleOverlayClick}>
      <div className="export-progress-modal" onClick={handleModalClick}>
        <div className="export-progress-content">
          {isCompleted ? (
            // Completion state
            <>
              <h3 className="export-progress-title">Export Complete!</h3>
              
              <div className="export-completion-message">
                {completionMessage || `Successfully exported ${totalTracks} tracks`}
              </div>
              
              {spotifyPlaylistId && (
                <div className="spotify-link-container">
                  <button 
                    className="spotify-link-button"
                    onClick={(e) => {
                      e.stopPropagation();
                      window.open(`https://open.spotify.com/playlist/${spotifyPlaylistId}`, '_blank');
                    }}
                  >
                    🎵 Open in Spotify
                  </button>
                </div>
              )}
              
              <div className="completion-dismiss-hint">
                Click anywhere to dismiss
              </div>
            </>
          ) : (
            // Progress state
            <>
              <h3 className="export-progress-title">Exporting Tracks</h3>
              
              <div className="export-progress-description">
                {description}
              </div>
              
              <div className="export-progress-bar-container">
                <div className="export-progress-bar">
                  <div 
                    className="export-progress-bar-fill"
                    style={{ width: `${percentage}%` }}
                  />
                </div>
                <div className="export-progress-percentage">
                  {percentage}%
                </div>
              </div>
              
              <div className="export-progress-tracks">
                {tracksProcessed} / {totalTracks} tracks
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}