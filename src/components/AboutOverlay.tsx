import { createPortal } from 'react-dom';
import { LoadingAnimation } from './LoadingAnimation';
import './AboutOverlay.css';

interface AboutOverlayProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AboutOverlay({ isOpen, onClose }: AboutOverlayProps) {
  if (!isOpen) {
    return null;
  }

  const portalTarget = typeof document !== 'undefined' ? document.body : null;
  if (!portalTarget) {
    return null;
  }

  const handleBackdropClick = (event: React.MouseEvent<HTMLDivElement>) => {
    if (event.target === event.currentTarget) {
      onClose();
    }
  };

  return createPortal(
    <div className="about-overlay" onClick={handleBackdropClick}>
      <div className="about-modal" role="dialog" aria-modal="true" aria-labelledby="about-title">
        <button className="about-close-button" onClick={onClose} aria-label="Close about dialog">
          ×
        </button>
        <LoadingAnimation label="Always tuning playlists" width={180} />
        <h2 id="about-title" className="about-title">Spotter</h2>
        <p className="about-description">
          Spotter remixes your playlists, pulls in albums you love, and keeps exports smooth so you can
          spend more time discovering tracks and less time managing them.
        </p>
      </div>
    </div>,
    portalTarget
  );
}
