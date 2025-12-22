import { Track } from "@spotify/web-api-ts-sdk";

export type RemixInput<T> = [Track[], T];
export type RemixFunction<T> = (inputs: RemixInput<T>[]) => Track[];
export type RemixMethod = 'shuffle' | 'concatenate';

export interface RemixOptions {
  excludeFromRemix?: boolean;
}

const buildTrackKey = (track: Track): string => {
  if (track.id) {
    return `id:${track.id}`;
  }
  if (track.uri) {
    return `uri:${track.uri}`;
  }
  const artistNames = track.artists?.map(artist => artist.name).join(',') ?? '';
  const albumName = track.album?.name ?? '';
  return `meta:${track.name}|${artistNames}|${albumName}|${track.duration_ms ?? 0}`;
};

export function getIncludedTracks<T extends RemixOptions>(inputs: RemixInput<T>[]): Track[] {
  const exclusionKeys = new Set<string>();

  for (const [tracks, options] of inputs) {
    if (!options?.excludeFromRemix) {
      continue;
    }
    for (const track of tracks) {
      exclusionKeys.add(buildTrackKey(track));
    }
  }

  const result: Track[] = [];

  for (const [tracks, options] of inputs) {
    if (options?.excludeFromRemix) {
      continue;
    }
    for (const track of tracks) {
      const key = buildTrackKey(track);
      if (!exclusionKeys.has(key)) {
        result.push(track);
      }
    }
  }

  return result;
}

export const concatenateRemix: RemixFunction<RemixOptions> = 
(input: RemixInput<RemixOptions>[]): Track[] =>   {
  return getIncludedTracks(input);
}

export const shuffleRemix: RemixFunction<RemixOptions> = 
(input: RemixInput<RemixOptions>[]): Track[] =>   {
  const allTracks = getIncludedTracks(input);

  // Shuffle using Fisher-Yates algorithm
  for (let i = allTracks.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [allTracks[i], allTracks[j]] = [allTracks[j], allTracks[i]];
  }

  return allTracks;
};

export function getRemixFunction<T extends RemixOptions>(method: RemixMethod): RemixFunction<T> {
  switch (method) {
    case 'concatenate':
      return concatenateRemix;
    case 'shuffle':
      return shuffleRemix;
    default:
      return shuffleRemix; // Default fallback
  }
}
