import { Track } from "@spotify/web-api-ts-sdk";

export type RemixInput<T> = [Track[], T];
export type RemixFunction<T> = (inputs: RemixInput<T>[]) => Track[];
export type RemixMethod = 'shuffle' | 'concatenate';

export interface RemixOptions {
}

export const concatenateRemix: RemixFunction<RemixOptions> = 
(input: RemixInput<RemixOptions>[]): Track[] =>   {
  return input.reduce((acc, [tracks]) => {
    // Apply any options if needed
    return acc.concat(tracks);
  }, [] as Track[]);
}

export const shuffleRemix: RemixFunction<RemixOptions> = 
(input: RemixInput<RemixOptions>[]): Track[] =>   {
  const allTracks = input.reduce((acc, [tracks]) => {
    return acc.concat(tracks);
  }, [] as Track[]);

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
