import { Image, StyleSheet, Text, View } from 'react-native';
import { Track } from '../models/track';

export function TrackArt({ track, size = 54 }: { track?: Track | null; size?: number }) {
  const radius = Math.round(size * .23);
  if (track?.artwork) return <Image source={{ uri: track.artwork }} style={{ width: size, height: size, borderRadius: radius }} />;
  return <View style={[styles.art, { width: size, height: size, borderRadius: radius }]}>
    <Text style={{ color: '#E8DCFF', fontSize: Math.round(size * .52) }}>{track?.source === 'stream' ? '◉' : '♫'}</Text>
  </View>;
}

const styles = StyleSheet.create({ art: { backgroundColor: '#64518B', alignItems: 'center', justifyContent: 'center' } });
