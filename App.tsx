import { useEffect, useState } from 'react';
import { Alert, FlatList, KeyboardAvoidingView, Platform, SafeAreaView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useAudioPlayer, useAudioPlayerStatus, setAudioModeAsync } from 'expo-audio';
import * as DocumentPicker from 'expo-document-picker';
import { Directory, File, Paths } from 'expo-file-system';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';

type Track = { id: string; title: string; uri: string; kind: 'file' | 'stream' };
const KEY = 'noir:library:v1';
const PURPLE = '#C2B0FF';
const formatTime = (value: number) => `${Math.floor(value / 60)}:${String(Math.floor(value % 60)).padStart(2, '0')}`;

export default function App() {
  const [tracks, setTracks] = useState<Track[]>([]);
  const [currentId, setCurrentId] = useState<string | null>(null);
  const [fullPlayer, setFullPlayer] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  const [name, setName] = useState('');
  const [url, setUrl] = useState('');
  const [search, setSearch] = useState('');
  const player = useAudioPlayer(null, { updateInterval: 500 });
  const status = useAudioPlayerStatus(player);
  const current = tracks.find(item => item.id === currentId);
  useEffect(() => {
    AsyncStorage.getItem(KEY).then(saved => saved && setTracks(JSON.parse(saved))).catch(console.warn);
    setAudioModeAsync({ playsInSilentMode: true, shouldPlayInBackground: true, interruptionMode: 'doNotMix' }).catch(console.warn);
  }, []);
  const persist = async (list: Track[]) => { await AsyncStorage.setItem(KEY, JSON.stringify(list)); setTracks(list); };
  const play = (item: Track) => {
    try {
      player.replace(item.uri);
      setCurrentId(item.id);
      player.setActiveForLockScreen(true, { title: item.title, artist: item.kind === 'stream' ? 'Аудиопоток' : 'Локальный файл' });
      player.play();
    } catch (e) { Alert.alert('Ошибка воспроизведения', String(e)); }
  };
  const skip = (direction: number) => {
    if (!tracks.length) return;
    const index = Math.max(0, tracks.findIndex(item => item.id === currentId));
    play(tracks[(index + direction + tracks.length) % tracks.length]);
  };
  useEffect(() => { if (status.didJustFinish && currentId) skip(1); }, [status.didJustFinish]);
  const importAudio = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({ type: 'audio/*', multiple: true, copyToCacheDirectory: true });
      if (result.canceled) return;
      const folder = new Directory(Paths.document, 'tracks');
      folder.create({ idempotent: true, intermediates: true });
      const imported: Track[] = [];
      for (const asset of result.assets) {
        const id = `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
        const file = new File(folder, `${id}-${asset.name.replace(/[^a-zA-Z0-9._-]/g, '_')}`);
        await new File(asset.uri).copy(file);
        imported.push({ id, title: asset.name.replace(/\.[^.]+$/, ''), uri: file.uri, kind: 'file' });
      }
      await persist([...tracks, ...imported]);
    } catch (e) { Alert.alert('Не удалось импортировать', String(e)); }
  };
  const addStream = async () => {
    if (!/^https?:\/\//i.test(url.trim())) { Alert.alert('Неверная ссылка', 'Нужен прямой HTTP(S) URL аудиофайла или потока'); return; }
    await persist([...tracks, { id: `stream-${Date.now()}`, title: name.trim() || 'Новый поток', uri: url.trim(), kind: 'stream' }]);
    setName(''); setUrl(''); setAddOpen(false);
  };
  const remove = (item: Track) => Alert.alert('Удалить трек?', item.title, [
    { text: 'Отмена', style: 'cancel' }, { text: 'Удалить', style: 'destructive', onPress: async () => {
      if (item.id === currentId) { player.pause(); setCurrentId(null); }
      await persist(tracks.filter(t => t.id !== item.id));
      if (item.kind === 'file') { try { new File(item.uri).delete(); } catch {} }
    } },
  ]);
  const button = (label: string, onPress: () => void, large = false) => <TouchableOpacity accessibilityRole="button" accessibilityLabel={label} onPress={onPress} style={[styles.button, large && styles.largeButton]}><Text style={[styles.buttonText, large && { color: '#170F28' }]}>{label}</Text></TouchableOpacity>;

  return <LinearGradient colors={['#2A2346', '#11101D', '#07070C']} style={styles.root}>
    <SafeAreaView style={{ flex: 1 }}><KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
      <View style={styles.header}><View><Text style={styles.kicker}>ТВОЯ МУЗЫКА. ТВОИ ПРАВИЛА.</Text><Text style={styles.logo}>NOIR<Text style={{ color: PURPLE }}>.</Text></Text></View>{button('＋', () => setAddOpen(!addOpen))}</View>
      {addOpen && <View style={styles.panel}>
        <Text style={styles.label}>Добавить музыку</Text>
        <TouchableOpacity onPress={importAudio} style={styles.action}><Text style={styles.actionText}>↥  Импортировать из «Файлов»</Text></TouchableOpacity>
        <Text style={styles.muted}>Или добавь прямую ссылку на аудиопоток</Text>
        <TextInput value={name} onChangeText={setName} style={styles.input} placeholder="Название" placeholderTextColor="#888399" />
        <TextInput value={url} onChangeText={setUrl} style={styles.input} placeholder="https://example.com/audio.mp3" autoCapitalize="none" keyboardType="url" placeholderTextColor="#888399" />
        <TouchableOpacity onPress={addStream} style={styles.action}><Text style={styles.actionText}>＋  Добавить поток</Text></TouchableOpacity>
      </View>}
      {fullPlayer && current ? <View style={styles.full}>
        <TouchableOpacity onPress={() => setFullPlayer(false)}><Text style={styles.muted}>⌄  Вернуться в медиатеку</Text></TouchableOpacity>
        <LinearGradient colors={['#7964B1', '#322449']} style={styles.cover}><Text style={styles.coverNote}>♫</Text></LinearGradient>
        <Text style={styles.fullTitle}>{current.title}</Text><Text style={styles.muted}>{current.kind === 'stream' ? 'Аудиопоток' : 'Локальный файл'}</Text>
        <View style={styles.progress}><View style={[styles.progressFill, { width: `${status.duration ? Math.min(100, status.currentTime / status.duration * 100) : 0}%` }]} /></View>
        <View style={styles.times}><Text style={styles.muted}>{formatTime(status.currentTime)}</Text><Text style={styles.muted}>{status.isLive ? 'LIVE' : formatTime(status.duration)}</Text></View>
        <View style={styles.controls}>{button('⏮', () => skip(-1))}{button(status.playing ? 'Ⅱ' : '▶', () => status.playing ? player.pause() : player.play(), true)}{button('⏭', () => skip(1))}</View>
        {!!status.error && <Text style={{ color: '#FFB2B2' }}>{status.error}</Text>}
      </View> : <>
        <TextInput style={styles.search} placeholder="⌕  Поиск в медиатеке" placeholderTextColor="#938CA3" value={search} onChangeText={setSearch} />
        <View style={styles.section}><Text style={styles.label}>Медиатека</Text><Text style={styles.muted}>{tracks.length} треков</Text></View>
        <FlatList data={tracks.filter(t => t.title.toLowerCase().includes(search.toLowerCase()))} keyExtractor={t => t.id} contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 110 }} ListEmptyComponent={<View style={styles.empty}><Text style={styles.coverNote}>♫</Text><Text style={styles.label}>Здесь пока тихо</Text><Text style={styles.muted}>Нажми ＋, чтобы добавить музыку</Text></View>} renderItem={({ item }) => <TouchableOpacity onPress={() => play(item)} onLongPress={() => remove(item)} style={styles.track}>
          <View style={styles.smallCover}><Text style={{ color: PURPLE, fontSize: 25 }}>{item.kind === 'stream' ? '◉' : '♫'}</Text></View><View style={{ flex: 1 }}><Text style={styles.trackTitle} numberOfLines={1}>{item.title}</Text><Text style={styles.muted}>{item.kind === 'stream' ? 'Поток · онлайн' : 'Локальный файл'}</Text></View><Text style={{ color: PURPLE }}>{item.id === currentId ? '♫' : '⋯'}</Text>
        </TouchableOpacity>} />
      </>}
      {!fullPlayer && current && <BlurView intensity={70} tint="dark" style={styles.mini}><TouchableOpacity onPress={() => setFullPlayer(true)} style={{ flex: 1 }}><Text style={styles.trackTitle} numberOfLines={1}>{current.title}</Text><Text style={styles.muted}>Открыть плеер ↑</Text></TouchableOpacity>{button(status.playing ? 'Ⅱ' : '▶', () => status.playing ? player.pause() : player.play())}{button('⏭', () => skip(1))}</BlurView>}
    </KeyboardAvoidingView></SafeAreaView>
  </LinearGradient>;
}

const styles = StyleSheet.create({
  root: { flex: 1 }, header: { padding: 24, paddingTop: 38, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }, kicker: { color: '#AAA0C9', fontSize: 9, letterSpacing: 1.7, fontWeight: '700' }, logo: { color: 'white', fontSize: 43, fontWeight: '900', letterSpacing: -2 },
  button: { paddingHorizontal: 13, height: 46, minWidth: 46, justifyContent: 'center', alignItems: 'center' }, buttonText: { color: 'white', fontSize: 26 }, largeButton: { width: 70, height: 70, borderRadius: 40, backgroundColor: PURPLE },
  panel: { backgroundColor: '#2B2540', marginHorizontal: 22, marginBottom: 16, padding: 17, borderRadius: 22, borderWidth: 1, borderColor: '#FFFFFF2A' }, label: { color: 'white', fontSize: 21, fontWeight: '800' }, muted: { color: '#A7A0B6', fontSize: 12, marginTop: 5 }, input: { backgroundColor: '#FFFFFF12', color: 'white', padding: 12, marginTop: 10, borderRadius: 12 }, action: { marginTop: 12, padding: 12, backgroundColor: '#B9A6FF27', borderRadius: 12 }, actionText: { color: '#D6C9FF', fontWeight: '700', textAlign: 'center' },
  search: { marginHorizontal: 22, backgroundColor: '#FFFFFF13', borderWidth: 1, borderColor: '#FFFFFF18', borderRadius: 17, color: 'white', padding: 16 }, section: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginHorizontal: 24, marginTop: 28, marginBottom: 13 },
  empty: { backgroundColor: '#FFFFFF0C', marginTop: 35, padding: 35, alignItems: 'center', borderRadius: 25, gap: 8 }, coverNote: { fontSize: 90, color: '#D4C4FF' },
  track: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#FFFFFF12' }, smallCover: { width: 50, height: 50, borderRadius: 12, backgroundColor: '#5B4A82', alignItems: 'center', justifyContent: 'center' }, trackTitle: { color: '#FFF', fontSize: 15, fontWeight: '700' },
  mini: { position: 'absolute', bottom: 10, left: 12, right: 12, padding: 12, borderRadius: 20, borderWidth: 1, borderColor: '#FFFFFF35', overflow: 'hidden', flexDirection: 'row', alignItems: 'center' },
  full: { paddingHorizontal: 26, flex: 1, justifyContent: 'center' }, cover: { aspectRatio: 1, borderRadius: 30, marginVertical: 34, alignItems: 'center', justifyContent: 'center' }, fullTitle: { color: 'white', fontSize: 27, fontWeight: '800' },
  progress: { height: 5, borderRadius: 5, marginTop: 30, backgroundColor: '#FFFFFF30', overflow: 'hidden' }, progressFill: { backgroundColor: PURPLE, height: '100%' }, times: { flexDirection: 'row', justifyContent: 'space-between' }, controls: { marginTop: 22, flexDirection: 'row', justifyContent: 'space-evenly', alignItems: 'center' },
});
