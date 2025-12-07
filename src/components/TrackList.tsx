import { Track } from '@spotify/web-api-ts-sdk';
import { TrackContainer } from '../data/TrackContainer';
import { useState, useEffect } from 'react';
import { RefreshDouble, Computer, CloudSync } from 'iconoir-react';
import './TrackList.css';

interface TrackListProps {
  trackContainer: TrackContainer<any>;
  refreshTrigger: number;
  excludedTrackIds?: Set<string>;
  setExcludedTrackIds?: React.Dispatch<React.SetStateAction<Set<string>>>;
}

export function TrackList({ trackContainer, refreshTrigger, excludedTrackIds = new Set(), setExcludedTrackIds }: TrackListProps) {
  const [tracks, setTracks] = useState<Track[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Handle track exclusion toggle
  const handleTrackClick = (trackId: string) => {
    if (!setExcludedTrackIds) return; // If no setter provided, exclusion is disabled
    
    setExcludedTrackIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(trackId)) {
        newSet.delete(trackId);
      } else {
        newSet.add(trackId);
      }
      return newSet;
    });
  };

  // Load all tracks when trackContainer changes
  useEffect(() => {
    const loadAllTracks = async () => {
      setLoading(true);
      setError(null);
      setTracks([]);
      try {
        const allTracks = await trackContainer.getAllTracks();
        setTracks(allTracks);
      } catch (err) {
        console.error('Failed to load tracks:', err);
        setError('Failed to load tracks');
        setTracks([]);
      } finally {
        setLoading(false);
      }
    };

    if (trackContainer) {
      loadAllTracks();
    }
  }, [trackContainer, refreshTrigger]);
  // Format duration from milliseconds to [HH:]MM:SS.ss
  const formatDuration = (durationMs: number): string => {
    const totalSeconds = durationMs / 1000;
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    // Format seconds with 2 decimal places
    const formattedSeconds = seconds.toFixed(2).padStart(5, '0');
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${formattedSeconds}`;
    } else {
      return `${minutes}:${formattedSeconds}`;
    }
  };

  if (loading) {
    return (
      <div className="track-list">
        <div className="track-loading">
          <RefreshDouble className="loading-spinner" />
          <span>Loading tracks...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="track-list">
        <div className="no-tracks">{error}</div>
      </div>
    );
  }

  if (tracks.length === 0) {
    return (
      <div className="track-list">
        <div className="no-tracks">No tracks available</div>
      </div>
    );
  }

  return (
    <div className="track-list">
      {tracks.map((track, index) => {
        const artistNames = track.artists?.map(artist => artist.name).join(', ') || 'Unknown Artist';
        const albumName = track.album?.name || 'Unknown Album';
        const duration = formatDuration(track.duration_ms);
        const trackId = track.id || `unknown-${index}`;
        const isExcluded = excludedTrackIds.has(trackId);
        const isExcludable = !!setExcludedTrackIds;
        
        // Check if this is a local track or resolved local track
        const isLocalTrack = track.is_local;
        const isResolvedLocal = !!(track as any).original_local; // Has original_local property from ResolvedLocalTrack
        
        // Build CSS classes
        const classes = [
          'track-item',
          isExcluded && 'excluded',
          isExcludable && 'excludable',
          isLocalTrack && 'local-track',
          isResolvedLocal && 'resolved-local'
        ].filter(Boolean).join(' ');
        
        return (
          <div 
            key={`${trackId}-${index}`} 
            className={classes}
            onClick={() => handleTrackClick(trackId)}
          >
            <div className="track-info">
              {/* Local track indicator */}
              {(isLocalTrack || isResolvedLocal) && (
                <div className="track-local-indicator">
                  {isResolvedLocal ? (
                    <CloudSync className="track-icon resolved-icon" />
                  ) : (
                    <Computer className="track-icon local-icon" />
                  )}
                </div>
              )}
              
              <span className="track-name">{track.name}</span>
              <span className="track-separator"> • </span>
              <span className="track-artist">{artistNames}</span>
              <span className="track-separator"> - </span>
              <span className="track-album">{albumName}</span>
            </div>
            <div className="track-duration">{duration}</div>
          </div>
        );
      })}
    </div>
  );
}