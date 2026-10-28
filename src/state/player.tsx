import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { Alert } from 'react-native';
import { setAudioModeAsync, useAudioPlayer, useAudioPlayerStatus } from 'expo-audio';
import { Track, canPlay } from '../models/track';
import { useLibrary } from './library';

type PlayerContextValue = {
  current: Track | null;
  playing: boolean;
  position: number;
  duration: number;
  isLive: boolean;
  error: string | null;
  play: (track: Track) => void;
  toggle: () => void;
  skip: (direction: number) => void;
  seek: (seconds: number) => void;
  stop: () => void;
};

const PlayerContext = createContext<PlayerContextValue | null>(null);

export function PlayerProvider({ children }: { children: React.ReactNode }) {
  const [currentId, setCurrentId] = useState<string | null>(null);
  const player = useAudioPlayer(null, { updateInterval: 350 });
  const status = useAudioPlayerStatus(player);
  const tracks = useLibrary(state => state.tracks);
  const markPlayed = useLibrary(state => state.markPlayed);
  const current = tracks.find(track => track.id === currentId) ?? null;

  useEffect(() => {
    setAudioModeAsync({ playsInSilentMode: true, shouldPlayInBackground: true, interruptionMode: 'doNotMix' }).catch(console.warn);
  }, []);

  const play = (track: Track) => {
    if (!canPlay(track)) { Alert.alert('Трек недоступен', 'Для этой записи пока нет разрешённого источника аудио.'); return; }
    try {
      player.replace(track.uri!);
      setCurrentId(track.id);
      player.setActiveForLockScreen(true, {
        title: track.title, artist: track.artist, albumTitle: track.album || 'NOIR Music',
        ...(track.artwork ? { artworkUrl: track.artwork } : {}),
      }, { isLiveStream: track.source === 'stream', showNextTrack: true, showPreviousTrack: true });
      player.play();
      void markPlayed(track.id);
    } catch (error) { Alert.alert('Не удалось воспроизвести', String(error)); }
  };

  const skip = (direction: number) => {
    const playable = tracks.filter(canPlay);
    if (!playable.length) return;
    const index = Math.max(0, playable.findIndex(track => track.id === currentId));
    play(playable[(index + direction + playable.length) % playable.length]);
  };
  const toggle = () => current && (status.playing ? player.pause() : player.play());
  const seek = (seconds: number) => { if (status.duration > 0) void player.seekTo(Math.min(status.duration, Math.max(0, seconds))); };
  const stop = () => { player.pause(); setCurrentId(null); player.setActiveForLockScreen(false); };

  const nextRef = useRef(skip);
  useEffect(() => { nextRef.current = skip; });
  useEffect(() => {
    if (status.didJustFinish) requestAnimationFrame(() => nextRef.current(1));
  }, [status.didJustFinish]);

  const value: PlayerContextValue = {
    current, playing: status.playing, position: status.currentTime,
    duration: status.duration, isLive: status.isLive, error: status.error,
    play, toggle, skip, seek, stop,
  };

  return <PlayerContext.Provider value={value}>{children}</PlayerContext.Provider>;
}

export function usePlayer() {
  const context = useContext(PlayerContext);
  if (!context) throw new Error('usePlayer must be used inside PlayerProvider');
  return context;
}
