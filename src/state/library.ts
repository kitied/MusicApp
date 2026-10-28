import { create } from 'zustand';
import { Track } from '../models/track';
import * as db from '../services/library';

type LibraryState = {
  tracks: Track[];
  loaded: boolean;
  load: () => Promise<void>;
  add: (track: Track) => Promise<void>;
  remove: (id: string) => Promise<void>;
  toggleLike: (id: string) => Promise<void>;
  markPlayed: (id: string) => Promise<void>;
};

export const useLibrary = create<LibraryState>((set, get) => ({
  tracks: [], loaded: false,
  load: async () => { set({ tracks: await db.listTracks(), loaded: true }); },
  add: async track => { await db.addTrack(track); set({ tracks: [track, ...get().tracks] }); },
  remove: async id => { await db.deleteTrack(id); set({ tracks: get().tracks.filter(t => t.id !== id) }); },
  toggleLike: async id => {
    const track = get().tracks.find(t => t.id === id);
    if (!track) return;
    await db.setLiked(id, !track.liked);
    set({ tracks: get().tracks.map(t => t.id === id ? { ...t, liked: !track.liked } : t) });
  },
  markPlayed: async id => {
    await db.recordPlay(id);
    set({ tracks: get().tracks.map(t => t.id === id ? { ...t, playCount: t.playCount + 1, lastPlayed: Date.now() } : t) });
  },
}));
