import { RemixFunction, RemixInput } from "./TrackContainer";
import { Track } from "@spotify/web-api-ts-sdk";

export type RemixOptions = {
    [key: string]: any;
}

export const concatenateRemix: RemixFunction<undefined> = 
(input: RemixInput<undefined>[]): Track[] =>   {
  return input.reduce((acc, [tracks]) => {
    return acc.concat(tracks);
  }, [] as Track[]);
}

export const shuffleRemix: RemixFunction<undefined> = 
(input: RemixInput<undefined>[]): Track[] =>   {
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
