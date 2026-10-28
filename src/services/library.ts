import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SQLite from 'expo-sqlite';
import { Track, parseFilename } from '../models/track';

const LEGACY_KEY = 'noir:library:v1';
let databasePromise: Promise<SQLite.SQLiteDatabase> | null = null;

type TrackRow = {
  id: string; title: string; artist: string; album: string; artwork: string | null;
  uri: string | null; source: Track['source']; liked: number; play_count: number; last_played: number | null;
};

const mapRow = (row: TrackRow): Track => ({
  id: row.id, title: row.title, artist: row.artist, album: row.album,
  artwork: row.artwork, uri: row.uri, source: row.source,
  liked: !!row.liked, playCount: row.play_count, lastPlayed: row.last_played,
});

async function getDatabase() {
  if (!databasePromise) databasePromise = (async () => {
    const db = await SQLite.openDatabaseAsync('noir-music.db');
    await db.execAsync(`PRAGMA journal_mode = WAL;
      CREATE TABLE IF NOT EXISTS tracks (
        id TEXT PRIMARY KEY NOT NULL, title TEXT NOT NULL, artist TEXT NOT NULL,
        album TEXT NOT NULL DEFAULT '', artwork TEXT, uri TEXT,
        source TEXT NOT NULL DEFAULT 'local', liked INTEGER NOT NULL DEFAULT 0,
        play_count INTEGER NOT NULL DEFAULT 0, last_played INTEGER
      );`);
    // One-time, non-destructive migration from the v0.1 library.
    const old = await AsyncStorage.getItem(LEGACY_KEY);
    if (old) {
      const tracks: { id: string; title: string; uri: string; kind: 'file' | 'stream' }[] = JSON.parse(old);
      for (const track of tracks) {
        const parsed = parseFilename(track.title);
        await db.runAsync(
          `INSERT OR IGNORE INTO tracks (id,title,artist,album,uri,source) VALUES (?,?,?,?,?,?)`,
          track.id, parsed.title, parsed.artist, '', track.uri, track.kind === 'stream' ? 'stream' : 'local'
        );
      }
      await AsyncStorage.removeItem(LEGACY_KEY);
    }
    return db;
  })().catch(error => { databasePromise = null; throw error; });
  return databasePromise;
}

export async function listTracks(): Promise<Track[]> {
  const db = await getDatabase();
  return (await db.getAllAsync<TrackRow>('SELECT * FROM tracks ORDER BY rowid DESC')).map(mapRow);
}

export async function addTrack(track: Track) {
  const db = await getDatabase();
  await db.runAsync(
    `INSERT OR REPLACE INTO tracks (id,title,artist,album,artwork,uri,source,liked,play_count,last_played) VALUES (?,?,?,?,?,?,?,?,?,?)`,
    track.id, track.title, track.artist, track.album, track.artwork, track.uri, track.source,
    track.liked ? 1 : 0, track.playCount, track.lastPlayed
  );
}

export async function setLiked(id: string, liked: boolean) {
  const db = await getDatabase();
  await db.runAsync('UPDATE tracks SET liked = ? WHERE id = ?', liked ? 1 : 0, id);
}

export async function recordPlay(id: string) {
  const db = await getDatabase();
  await db.runAsync('UPDATE tracks SET play_count = play_count + 1, last_played = ? WHERE id = ?', Date.now(), id);
}

export async function deleteTrack(id: string) {
  const db = await getDatabase();
  await db.runAsync('DELETE FROM tracks WHERE id = ?', id);
}
