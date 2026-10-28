import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { PlayerProvider } from '../state/player';
import { useLibrary } from '../state/library';

function Bootstrap() {
  const load = useLibrary(state => state.load);
  useEffect(() => { load().catch(console.warn); }, [load]);
  return <Stack screenOptions={{ headerShown: false, animation: 'slide_from_bottom', contentStyle: { backgroundColor: '#08080E' } }} />;
}

export default function RootLayout() {
  return <PlayerProvider><StatusBar style="light" /><Bootstrap /></PlayerProvider>;
}
