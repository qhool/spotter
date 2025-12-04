import { Track } from '@spotify/web-api-ts-sdk';
import { TrackContainer } from '../data/TrackContainer';
import { useState, useEffect } from 'react';
import { RefreshDouble } from 'iconoir-react';
import './TrackList.css';

interface TrackListProps {
  trackContainer: TrackContainer<any>;
  refreshTrigger: number;
}

export function TrackList({ trackContainer, refreshTrigger }: TrackListProps) {
  const [tracks, setTracks] = useState<Track[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
        
        return (
          <div key={`${track.id || 'unknown'}-${index}`} className="track-item">
            <div className="track-info">
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