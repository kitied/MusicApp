import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { TrackArt } from '../components/TrackArt';
import { GlassPanel } from '../components/GlassPanel';
import { usePlayer } from '../state/player';
import { useLibrary } from '../state/library';

const formatTime = (seconds: number) => `${Math.floor(seconds / 60)}:${String(Math.floor(seconds % 60)).padStart(2, '0')}`;

export default function PlayerScreen() {
  const { current, playing, position, duration, isLive, error, toggle, skip, seek } = usePlayer();
  const toggleLike = useLibrary(state => state.toggleLike);
  const [progressWidth, setProgressWidth] = useState(1);
  if (!current) return <View style={styles.empty}><TouchableOpacity onPress={() => router.back()}><Text style={styles.white}>Вернуться к медиатеке</Text></TouchableOpacity></View>;
  const progress = duration > 0 ? Math.min(1, position / duration) : 0;
  return <LinearGradient colors={['#30234B', '#18121F', '#08080E']} style={{ flex: 1 }}>
    <SafeAreaView style={{ flex: 1 }}><ScrollView contentContainerStyle={styles.body}>
      <View style={styles.header}><TouchableOpacity accessibilityLabel="Назад" onPress={() => router.back()}><Text style={styles.white}>⌄</Text></TouchableOpacity><Text style={styles.headerTitle}>СЕЙЧАС ИГРАЕТ</Text><Text style={styles.white}>♫</Text></View>
      <View style={styles.coverWrap}><TrackArt track={current} size={300}/></View>
      <View style={styles.titleRow}><View style={{ flex: 1 }}><Text style={styles.songTitle} numberOfLines={2}>{current.title}</Text><Text style={styles.artist}>{current.artist}</Text>{!!current.album && <Text style={styles.album}>{current.album}</Text>}</View>
        <TouchableOpacity accessibilityLabel="Избранное" onPress={() => toggleLike(current.id)} style={styles.like}><Text style={[styles.likeText, current.liked && { color: '#CBBEFF' }]}>{current.liked ? '♥' : '♡'}</Text></TouchableOpacity>
      </View>
      <Pressable accessibilityRole="adjustable" accessibilityLabel="Прогресс воспроизведения" onLayout={event => setProgressWidth(event.nativeEvent.layout.width)} onPress={event => seek(event.nativeEvent.locationX / progressWidth * duration)} style={styles.hitArea}>
        <View style={styles.bar}><View style={[styles.barFill, { width: `${progress * 100}%` }]} /></View>
      </Pressable>
      <View style={styles.duration}><Text style={styles.time}>{formatTime(position)}</Text><Text style={styles.time}>{isLive ? 'LIVE' : duration > 0 ? formatTime(duration) : '--:--'}</Text></View>
      <View style={styles.controls}>
        <TouchableOpacity accessibilityLabel="Предыдущий трек" onPress={() => skip(-1)} style={styles.skip}><Text style={styles.skipText}>⏮</Text></TouchableOpacity>
        <GlassPanel style={styles.playContainer}><TouchableOpacity accessibilityLabel={playing ? 'Пауза' : 'Воспроизвести'} onPress={toggle} style={styles.playButton}><Text style={styles.playIcon}>{playing ? 'Ⅱ' : '▶'}</Text></TouchableOpacity></GlassPanel>
        <TouchableOpacity accessibilityLabel="Следующий трек" onPress={() => skip(1)} style={styles.skip}><Text style={styles.skipText}>⏭</Text></TouchableOpacity>
      </View>
      <Text style={styles.footer}>{current.source === 'local' ? 'СОХРАНЕНО НА IPHONE' : current.source === 'stream' ? 'ПОТОКОВОЕ АУДИО' : 'КОЛЛЕКЦИЯ'}</Text>
      {!!error && <Text style={styles.error}>{error}</Text>}
    </ScrollView></SafeAreaView>
  </LinearGradient>;
}

const styles = StyleSheet.create({
  empty: { flex: 1, backgroundColor: '#12101D', alignItems: 'center', justifyContent: 'center' }, white: { color: '#FFF', fontSize: 27 },
  body: { flexGrow: 1, paddingHorizontal: 26, paddingBottom: 45 }, header: { paddingTop: 20, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }, headerTitle: { fontSize: 11, letterSpacing: 2.2, color: '#CEC3DF', fontWeight: '800' },
  coverWrap: { marginTop: 48, marginBottom: 37, alignItems: 'center', shadowColor: '#9778D0', shadowOpacity: .25, shadowRadius: 30, shadowOffset: { width: 0, height: 10 } },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 13 }, songTitle: { color: '#FFF', fontSize: 25, fontWeight: '900' }, artist: { color: '#BBB1CB', marginTop: 6, fontSize: 16 }, album: { color: '#8F86A2', marginTop: 5, fontSize: 13 },
  like: { padding: 12 }, likeText: { color: '#A69BB9', fontSize: 33 },
  hitArea: { paddingVertical: 17, marginTop: 18 }, bar: { height: 5, backgroundColor: '#FFFFFF35', borderRadius: 100, overflow: 'hidden' }, barFill: { height: '100%', backgroundColor: '#C3B2FF' },
  duration: { flexDirection: 'row', justifyContent: 'space-between' }, time: { color: '#A7A0B7', fontSize: 12 },
  controls: { marginTop: 26, flexDirection: 'row', justifyContent: 'space-evenly', alignItems: 'center' }, skip: { padding: 20 }, skipText: { color: '#EDE5FF', fontSize: 29 }, playContainer: { width: 78, height: 78, borderRadius: 100 }, playButton: { flex: 1, alignItems: 'center', justifyContent: 'center' }, playIcon: { fontSize: 33, color: '#FFF' },
  footer: { textAlign: 'center', marginTop: 40, color: '#8F82A8', fontSize: 10, fontWeight: '800', letterSpacing: 2 }, error: { color: '#FFB4B4', marginTop: 18 },
});
