import { router } from 'expo-router';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { usePlayer } from '../state/player';
import { GlassPanel } from './GlassPanel';
import { TrackArt } from './TrackArt';

export function MiniPlayer() {
  const { current, playing, toggle, skip } = usePlayer();
  if (!current) return null;
  return <GlassPanel style={styles.panel}>
    <TouchableOpacity onPress={() => router.push('/player')} style={styles.titleButton}>
      <TrackArt track={current} size={47} />
      <View style={{ flex: 1 }}><Text style={styles.title} numberOfLines={1}>{current.title}</Text><Text style={styles.artist} numberOfLines={1}>{current.artist}</Text></View>
    </TouchableOpacity>
    <TouchableOpacity accessibilityLabel={playing ? 'Пауза' : 'Играть'} onPress={toggle} style={styles.control}><Text style={styles.icon}>{playing ? 'Ⅱ' : '▶'}</Text></TouchableOpacity>
    <TouchableOpacity accessibilityLabel="Следующий трек" onPress={() => skip(1)} style={styles.control}><Text style={styles.icon}>⏭</Text></TouchableOpacity>
  </GlassPanel>;
}
const styles = StyleSheet.create({
  panel: { position: 'absolute', left: 12, right: 12, bottom: 13, height: 74, padding: 11, flexDirection: 'row', alignItems: 'center', gap: 3 },
  titleButton: { flex: 1, minWidth: 0, alignItems: 'center', flexDirection: 'row', gap: 11 },
  title: { color: '#FFF', fontSize: 14, fontWeight: '800' }, artist: { color: '#B8B0C6', marginTop: 3, fontSize: 12 },
  control: { width: 42, height: 50, alignItems: 'center', justifyContent: 'center' }, icon: { color: '#FFF', fontSize: 23 },
});
