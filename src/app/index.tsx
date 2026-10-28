import { useMemo, useState } from 'react';
import { Alert, FlatList, KeyboardAvoidingView, Platform, Pressable, SafeAreaView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import { Directory, File, Paths } from 'expo-file-system';
import { LinearGradient } from 'expo-linear-gradient';
import { useLibrary } from '../state/library';
import { usePlayer } from '../state/player';
import { Track, parseFilename } from '../models/track';
import { readEmbeddedMetadata } from '../services/metadata';
import { TrackArt } from '../components/TrackArt';
import { GlassPanel } from '../components/GlassPanel';
import { MiniPlayer } from '../components/MiniPlayer';

type Filter = 'all' | 'liked' | 'recent';

export default function LibraryScreen() {
  const { tracks, loaded, add, remove, toggleLike } = useLibrary();
  const { current, play, stop } = usePlayer();
  const [filter, setFilter] = useState<Filter>('all');
  const [search, setSearch] = useState('');
  const [adding, setAdding] = useState(false);
  const [streamName, setStreamName] = useState('');
  const [streamUrl, setStreamUrl] = useState('');
  const visible = useMemo(() => {
    let list = tracks.filter(t => `${t.title} ${t.artist} ${t.album}`.toLowerCase().includes(search.toLowerCase()));
    if (filter === 'liked') list = list.filter(t => t.liked);
    if (filter === 'recent') list = list.filter(t => t.lastPlayed).sort((a,b) => (b.lastPlayed ?? 0)-(a.lastPlayed ?? 0));
    return list;
  }, [tracks, search, filter]);

  const importFiles = async () => {
    try {
      const selection = await DocumentPicker.getDocumentAsync({ type: 'audio/*', multiple: true, copyToCacheDirectory: true });
      if (selection.canceled) return;
      const folder = new Directory(Paths.document, 'tracks');
      folder.create({ idempotent: true, intermediates: true });
      for (const asset of selection.assets) {
        const id = `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
        const file = new File(folder, `${id}-${asset.name.replace(/[^a-zA-Z0-9._-]/g, '_')}`);
        await new File(asset.uri).copy(file);
        const { artist, title } = parseFilename(asset.name);
        const metadata = await readEmbeddedMetadata(file, id);
        const track: Track = { id, title: metadata.title || title, artist: metadata.artist || artist, album: metadata.album || '', artwork: metadata.artwork || null, uri: file.uri, source: 'local', liked: false, playCount: 0, lastPlayed: null };
        await add(track);
      }
      setAdding(false);
    } catch (error) { Alert.alert('Ошибка импорта', String(error)); }
  };

  const addStream = async () => {
    const uri = streamUrl.trim();
    if (!/^https?:\/\//i.test(uri)) { Alert.alert('Некорректная ссылка', 'Вставь прямую ссылку на аудио или поток HTTP(S).'); return; }
    try {
      await add({ id: `stream-${Date.now()}`, title: streamName.trim() || 'Новый поток', artist: 'Интернет-аудио', album: '', artwork: null, uri, source: 'stream', liked: false, playCount: 0, lastPlayed: null });
      setStreamName(''); setStreamUrl(''); setAdding(false);
    } catch (error) { Alert.alert('Ошибка сохранения', String(error)); }
  };

  const confirmRemove = (track: Track) => Alert.alert('Удалить из библиотеки?', track.title, [
    { text: 'Отмена', style: 'cancel' },
    { text: 'Удалить', style: 'destructive', onPress: async () => {
      if (current?.id === track.id) stop();
      await remove(track.id);
      if (track.source === 'local' && track.uri) { try { new File(track.uri).delete(); } catch {} }
    } },
  ]);

  return <LinearGradient colors={['#27213E', '#12101D', '#08080E']} style={styles.root}>
    <SafeAreaView style={{ flex: 1 }}><KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
      <View style={styles.header}>
        <View><Text style={styles.kicker}>ТВОЯ МУЗЫКА. ТВОИ ПРАВИЛА.</Text><Text style={styles.logo}>NOIR<Text style={styles.accent}>.</Text></Text></View>
        <TouchableOpacity accessibilityLabel="Добавить музыку" onPress={() => setAdding(!adding)} style={styles.add}><Text style={styles.addIcon}>{adding ? '×' : '+'}</Text></TouchableOpacity>
      </View>
      {adding && <GlassPanel style={styles.addPanel}>
        <Text style={styles.addTitle}>Добавить музыку</Text>
        <TouchableOpacity onPress={importFiles} style={styles.primary}><Text style={styles.primaryText}>↥  Импортировать из «Файлов»</Text></TouchableOpacity>
        <Text style={styles.secondary}>Или добавь прямую ссылку на аудиопоток</Text>
        <TextInput placeholder="Название потока" placeholderTextColor="#8C879E" style={styles.input} value={streamName} onChangeText={setStreamName} />
        <TextInput placeholder="https://example.com/stream.mp3" placeholderTextColor="#8C879E" style={styles.input} autoCapitalize="none" keyboardType="url" value={streamUrl} onChangeText={setStreamUrl} />
        <TouchableOpacity onPress={addStream} style={styles.primary}><Text style={styles.primaryText}>＋  Добавить поток</Text></TouchableOpacity>
      </GlassPanel>}
      <GlassPanel style={styles.searchBox}><Text style={styles.searchIcon}>⌕</Text><TextInput value={search} onChangeText={setSearch} placeholder="Треки, исполнители, альбомы" placeholderTextColor="#968EA7" style={styles.searchInput} /></GlassPanel>
      <View style={styles.section}><Text style={styles.sectionTitle}>Медиатека</Text><Text style={styles.counter}>{tracks.length} треков</Text></View>
      <View style={styles.filters}>
        {([['all','Все'],['liked','♥ Избранное'],['recent','Недавние']] as [Filter,string][]).map(([key,label]) => <Pressable key={key} onPress={() => setFilter(key)} style={[styles.filter, filter === key && styles.filterActive]}><Text style={[styles.filterText, filter === key && styles.filterTextActive]}>{label}</Text></Pressable>)}
      </View>
      <FlatList data={visible} keyExtractor={item => item.id} contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 120 }} ListEmptyComponent={<View style={styles.empty}>
        <Text style={styles.emptyNote}>♫</Text><Text style={styles.emptyTitle}>{!loaded ? 'Загружаем медиатеку…' : filter === 'liked' ? 'Нет избранных треков' : filter === 'recent' ? 'История пока пустая' : 'Здесь пока тихо'}</Text><Text style={styles.secondary}>{filter === 'all' ? 'Нажми + и добавь музыку' : 'Всё появится, когда начнёшь слушать'}</Text>
      </View>} renderItem={({ item }) => <TouchableOpacity style={styles.track} onPress={() => play(item)} onLongPress={() => confirmRemove(item)}>
        <TrackArt track={item} size={55} />
        <View style={styles.trackBody}><Text numberOfLines={1} style={styles.trackTitle}>{item.title}</Text><Text numberOfLines={1} style={styles.trackArtist}>{item.artist}</Text></View>
        <TouchableOpacity accessibilityLabel={item.liked ? 'Убрать из избранного' : 'Добавить в избранное'} onPress={() => toggleLike(item.id)} style={styles.heartButton}><Text style={[styles.heart, item.liked && styles.accent]}>{item.liked ? '♥' : '♡'}</Text></TouchableOpacity>
      </TouchableOpacity>} />
      <MiniPlayer />
    </KeyboardAvoidingView></SafeAreaView>
  </LinearGradient>;
}

const styles = StyleSheet.create({
  root: { flex: 1 }, accent: { color: '#C3B2FF' }, header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 24, paddingTop: 34, paddingBottom: 21 },
  kicker: { color: '#ADA4C7', fontSize: 9, letterSpacing: 1.9, fontWeight: '700' }, logo: { color: 'white', fontSize: 43, fontWeight: '900', letterSpacing: -2 },
  add: { width: 48, height: 48, borderRadius: 18, justifyContent: 'center', alignItems: 'center', backgroundColor: '#FFFFFF17', borderWidth: 1, borderColor: '#FFFFFF22' }, addIcon: { color: '#FFF', fontSize: 30 },
  addPanel: { padding: 17, marginHorizontal: 22, marginBottom: 18, gap: 9 }, addTitle: { color: '#FFF', fontWeight: '800', fontSize: 18 }, primary: { padding: 13, backgroundColor: '#C3B2FF2F', borderRadius: 12 }, primaryText: { textAlign: 'center', fontWeight: '800', color: '#E7DFFF' }, secondary: { fontSize: 12, color: '#A59FB8', lineHeight: 18 }, input: { padding: 13, borderRadius: 13, backgroundColor: '#FFFFFF11', color: '#FFF' },
  searchBox: { marginHorizontal: 22, height: 56, borderRadius: 17, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16 }, searchIcon: { color: '#AEA6BE', fontSize: 24, marginRight: 11 }, searchInput: { flex: 1, color: '#FFF', fontSize: 15 },
  section: { paddingHorizontal: 24, marginTop: 28, marginBottom: 15, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }, sectionTitle: { color: '#FFF', fontSize: 23, fontWeight: '900' }, counter: { color: '#A8A1B7', fontSize: 12 },
  filters: { flexDirection: 'row', gap: 9, paddingHorizontal: 24, marginBottom: 12 }, filter: { paddingHorizontal: 13, paddingVertical: 9, borderRadius: 100, backgroundColor: '#FFFFFF0B', borderWidth: 1, borderColor: '#FFFFFF12' }, filterActive: { backgroundColor: '#C3B2FF25', borderColor: '#C3B2FF67' }, filterText: { color: '#B1AABD', fontSize: 12, fontWeight: '700' }, filterTextActive: { color: '#E4DBFF' },
  track: { flexDirection: 'row', alignItems: 'center', gap: 13, paddingVertical: 11, borderBottomWidth: 1, borderBottomColor: '#FFFFFF12' }, trackBody: { flex: 1, minWidth: 0 }, trackTitle: { color: '#FFF', fontWeight: '800', fontSize: 14 }, trackArtist: { color: '#AAA2B9', marginTop: 4, fontSize: 12 }, heartButton: { padding: 9 }, heart: { fontSize: 25, color: '#6A6478' },
  empty: { marginTop: 35, padding: 31, backgroundColor: '#FFFFFF0D', borderRadius: 25, alignItems: 'center', gap: 8 }, emptyNote: { color: '#C3B2FF', fontSize: 64 }, emptyTitle: { fontSize: 18, color: '#FFF', fontWeight: '800' },
});
