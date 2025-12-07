import { SpotifyApi, Track } from '@spotify/web-api-ts-sdk';

/**
 * A resolved local track with the original local track and the matched catalog track
 */
export interface ResolvedLocalTrack extends Track {
  /**
   * The original local track object
   */
  original_local: Track;
}

/**
 * Decompose a local track and attempt to find the best match in Spotify's catalog
 * @param sdk Spotify API instance
 * @param localTrack Local track object with is_local: true
 * @returns The best matching track from Spotify's catalog with original local track, or null if no suitable match is found
 */
export async function resolveLocalTrack(sdk: SpotifyApi, localTrack: Track): Promise<ResolvedLocalTrack | null> {
  // Check if this is actually a local track
  if (!localTrack.is_local) {
    return null;
  }

  const localUri = localTrack.uri;
  console.log('Resolving local track URI:', localUri);
  try {
    // Parse the local URI: spotify:local:artist:album:track:duration
    const parts = localUri.split(':');
    if (parts.length !== 6) {
      console.warn('Invalid local track URI format:', localUri);
      return null;
    }

    // Decode and extract components (skip 'spotify' and 'local' prefixes)
    const encodedArtist = parts[2];
    const encodedAlbum = parts[3];
    const encodedTrack = parts[4];
    // parts[5] is duration in seconds, we can ignore it for matching

    // URI decode the components and normalize for comparison
    const artist = decodeURIComponent(encodedArtist.replace(/\+/g, ' ')).trim();
    const album = decodeURIComponent(encodedAlbum.replace(/\+/g, ' ')).trim();
    const trackName = decodeURIComponent(encodedTrack.replace(/\+/g, ' ')).trim();

    // Build search query - prioritize track name and artist
    const searchQuery = `track:"${trackName}" artist:"${artist}"`;
    
    // Search for the track
    const searchResults = await sdk.search(searchQuery, ['track'], 'US', 20);
    
    if (!searchResults.tracks?.items?.length) {
      console.log(`No search results found for local track: ${artist} - ${trackName}`);
      return null;
    }

    // Find the best match using strict matching criteria
    const bestMatch = findBestMatch(searchResults.tracks.items, artist, album, trackName);
    
    if (bestMatch) {
      console.log(`Resolved local track "${artist} - ${trackName}" to Spotify track: ${bestMatch.id}`);
      // Create ResolvedLocalTrack object with original local track
      const resolvedTrack: ResolvedLocalTrack = {
        ...bestMatch,
        original_local: localTrack
      };
      return resolvedTrack;
    } else {
      console.log(`No suitable match found for local track: ${artist} - ${trackName}`);
      return null;
    }
  } catch (error) {
    console.error('Error resolving local track:', localUri, error);
    return null;
  }
}

/**
 * Find the best matching track from search results using strict matching criteria
 */
function findBestMatch(tracks: Track[], targetArtist: string, targetAlbum: string, targetTrack: string): Track | null {
  // Normalize strings for comparison
  const normalizeString = (str: string): string => {
    return str.toLowerCase().replace(/\s+/g, ' ').trim();
  };

  const normTargetArtist = normalizeString(targetArtist);
  const normTargetAlbum = normalizeString(targetAlbum);
  const normTargetTrack = normalizeString(targetTrack);

  let bestMatch: Track | null = null;
  let bestScore = 0;

  for (const track of tracks) {
    const normTrackName = normalizeString(track.name);
    const normAlbumName = normalizeString(track.album.name);
    
    // Check if track name matches (exact prefix match)
    const trackNameMatches = normTrackName.startsWith(normTargetTrack) || normTargetTrack.startsWith(normTrackName);
    if (!trackNameMatches) {
      continue;
    }

    // Check if any artist matches (exact prefix match)
    const artistMatches = track.artists.some(artist => {
      const normArtistName = normalizeString(artist.name);
      return normArtistName.startsWith(normTargetArtist) || normTargetArtist.startsWith(normArtistName);
    });
    
    if (!artistMatches) {
      continue;
    }

    // Calculate match score (higher is better)
    let score = 0;

    // Exact track name match gets highest priority
    if (normTrackName === normTargetTrack) {
      score += 100;
    } else if (normTrackName.startsWith(normTargetTrack)) {
      score += 80;
    } else if (normTargetTrack.startsWith(normTrackName)) {
      score += 70;
    }

    // Artist match score
    const exactArtistMatch = track.artists.some(artist => 
      normalizeString(artist.name) === normTargetArtist
    );
    if (exactArtistMatch) {
      score += 50;
    } else {
      score += 30; // Partial artist match
    }

    // Album match bonus (optional but preferred)
    if (normAlbumName === normTargetAlbum) {
      score += 20;
    } else if (normAlbumName.startsWith(normTargetAlbum) || normTargetAlbum.startsWith(normAlbumName)) {
      score += 10;
    }

    // Prefer tracks with higher popularity as tiebreaker
    score += track.popularity * 0.1;

    if (score > bestScore) {
      bestScore = score;
      bestMatch = track;
    }
  }

  // Only return a match if it meets minimum quality threshold
  // Require both track name and artist to match reasonably well
  if (bestScore >= 100) { // At least exact track name + partial artist match
    return bestMatch;
  }

  return null;
}