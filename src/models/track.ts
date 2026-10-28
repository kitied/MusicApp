export type TrackSource = 'local' | 'stream' | 'yandex';

export type Track = {
  id: string;
  title: string;
  artist: string;
  album: string;
  artwork: string | null;
  uri: string | null;
  source: TrackSource;
  liked: boolean;
  playCount: number;
  lastPlayed: number | null;
};

// An imported Yandex collection item can exist without an audio URL.
// Playback is permitted only for tracks with an actual playable source.
export const canPlay = (track: Track) => Boolean(track.uri);

export function parseFilename(filename: string) {
  const stem = filename.replace(/\.[^.]+$/, '').replace(/_/g, ' ').trim();
  const delimiter = stem.includes(' – ') ? ' – ' : stem.includes(' - ') ? ' - ' : null;
  if (delimiter) {
    const [artist, ...title] = stem.split(delimiter);
    if (artist.trim() && title.join(delimiter).trim()) return { artist: artist.trim(), title: title.join(delimiter).trim() };
  }
  return { artist: 'Неизвестный исполнитель', title: stem || 'Без названия' };
}
