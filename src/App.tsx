import React, { useCallback, useMemo, useState, useEffect } from 'react';
import {
  House, MagnifyingGlass, MusicNotes, Clock,
  Gear, CaretRight, CaretLeft, DotsThreeVertical,
  Play, Pause, Heart, X, Plus, ArrowUp, ArrowDown,
  SkipBack, SkipForward, Shuffle, Repeat, SpeakerHigh, Waveform, CircleNotch
} from 'phosphor-react-native';
import {
  Image,
  ActivityIndicator,
  BackHandler,
  Linking,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { browseMusic, parseLink, searchMusic, trackById } from './music';
import type { SearchItem, Track } from './music';
import { useMonowave } from './useMonowave';
import { useRecommendations } from './useRecommendations';
import { recordSearch } from './services/recommendations';
import type { RecoSection } from './services/recommendations';

type Tab = 'home' | 'search' | 'library' | 'history' | 'settings' | 'player' | 'collection' | 'playlist';
type Filter = 'all' | SearchItem['kind'];
type MainTab = 'home' | 'search' | 'library' | 'history';

const C = {
  bg: '#080812',
  bgRaised: '#0D0D1A',
  panel: '#131326',
  panelSoft: '#18172E',
  panelStrong: '#211D3A',
  text: '#F8F7FF',
  muted: '#AAA5C1',
  faint: '#77728F',
  accent: '#B46BFF',
  accent2: '#8F7CFF',
  accentSoft: '#B46BFF24',
  blue: '#64A8FF',
  pink: '#FF66B7',
  mint: '#58D8C0',
  orange: '#FF9B54',
  line: '#FFFFFF16',
  lineStrong: '#B46BFF55',
  danger: '#FF7A9B',
};

const MOODS = [
  { label: 'Chill', icon: '◌', query: 'chill music', tint: '#183B6D' },
  { label: 'Party', icon: '✦', query: 'party hits', tint: '#57204F' },
  { label: 'Sad', icon: '☾', query: 'sad songs', tint: '#25303D' },
  { label: 'Romance', icon: '♥', query: 'romantic songs', tint: '#6A2448' },
  { label: 'Workout', icon: '◆', query: 'workout music', tint: '#4A2E22' },
  { label: 'Focus', icon: '◎', query: 'focus music', tint: '#2B3D32' },
];

const CATEGORY_FILTERS: { label: string; icon: string; filter: Filter; tint: string }[] = [
  { label: 'Songs', icon: 'library', filter: 'track', tint: '#213B8C' },
  { label: 'Albums', icon: '◉', filter: 'album', tint: '#59217D' },
  { label: 'Artists', icon: '●', filter: 'artist', tint: '#166D67' },
  { label: 'Playlists', icon: '≡', filter: 'playlist', tint: '#8A451E' },
];

function formatTime(value: number) {
  const n = Math.max(0, Math.floor(value));
  return `${Math.floor(n / 60)}:${String(n % 60).padStart(2, '0')}`;
}

function timeAgo(at: number): string {
  const minutes = Math.max(0, Math.floor((Date.now() - at) / 60000));
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hr${hours === 1 ? '' : 's'} ago`;
  const days = Math.floor(hours / 24);
  return `${days} day${days === 1 ? '' : 's'} ago`;
}

function Artwork({ uri, size = 52, radius = 12 }: { uri?: string; size?: number; radius?: number }) {
  if (uri) return <Image source={{ uri }} style={{ width: size, height: size, borderRadius: radius }} />;
  return (
    <View style={[styles.emptyArt, { width: size, height: size, borderRadius: radius }]}>
      <Text style={{ color: C.accent, fontSize: size / 3 }}>♫</Text>
    </View>
  );
}

function BrandHeader({ onHome, onSettings }: { onHome: () => void; onSettings: () => void }) {
  return (
    <View style={styles.topBar}>
      <Pressable onPress={onHome} hitSlop={10} style={styles.brandWrap}>
        <Waveform size={28} color={C.accent} weight="bold" style={{ transform: [{ rotate: '-8deg' }] }} />
        <Text style={styles.brand}>MONOWAVE</Text>
      </Pressable>
      <Pressable onPress={onSettings} hitSlop={12} style={styles.iconButton}>
        <Gear size={24} color={C.text} />
      </Pressable>
    </View>
  );
}

function Action({
  label,
  onPress,
  active = false,
  wide = false,
  danger = false,
}: {
  label: string;
  onPress: () => void;
  active?: boolean;
  wide?: boolean;
  danger?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.action,
        wide && styles.actionWide,
        active && styles.actionActive,
        danger && styles.actionDanger,
        pressed && styles.pressed,
      ]}
    >
      <Text style={[styles.actionText, active && styles.actionTextActive, danger && styles.actionTextDanger]}>{label}</Text>
    </Pressable>
  );
}

function SectionHeader({
  title,
  detail,
  action,
  onAction,
}: {
  title: string;
  detail?: string;
  action?: string;
  onAction?: () => void;
}) {
  return (
    <View style={styles.sectionHeader}>
      <View style={{ flex: 1 }}>
        <Text style={styles.sectionTitle}>{title}</Text>
        {detail ? <Text style={styles.sectionDetail}>{detail}</Text> : null}
      </View>
      {action && onAction ? (
        <Pressable hitSlop={10} onPress={onAction}>
          <View style={{flexDirection: 'row', alignItems: 'center'}}><Text style={styles.sectionAction}>{action}</Text><CaretRight size={14} color={C.accent} weight="bold" /></View>
        </Pressable>
      ) : null}
    </View>
  );
}

function ScreenTitle({ title, detail }: { title: string; detail?: string }) {
  return (
    <View style={styles.screenTitleWrap}>
      <Text style={styles.screenTitle}>{title}</Text>
      {detail ? <Text style={styles.screenSubtitle}>{detail}</Text> : null}
    </View>
  );
}

function TrackLine({
  track,
  onPress,
  onMore,
  trailing,
  meta,
  card = false,
}: {
  track: Track;
  onPress: () => void;
  onMore?: () => void;
  trailing?: React.ReactNode;
  meta?: string;
  card?: boolean;
}) {
  return (
    <View style={[styles.trackLine, card && styles.trackLineCard]}>
      <Pressable style={styles.trackLineMain} onPress={onPress}>
        <Artwork uri={track.cover} size={56} />
        <View style={styles.trackText}>
          <Text numberOfLines={1} style={styles.trackTitle}>{track.title}</Text>
          <Text numberOfLines={1} style={styles.trackArtist}>{track.artist}</Text>
        </View>
      </Pressable>
      {meta ? <Text style={styles.trackMeta}>{meta}</Text> : null}
      {onMore ? (
        <Pressable hitSlop={12} onPress={onMore} style={styles.moreButton}>
          {trailing ? <Text style={styles.ellipsis}>{trailing}</Text> : <DotsThreeVertical size={24} color={C.muted} weight="bold" />}
        </Pressable>
      ) : null}
    </View>
  );
}

function SectionRail({ section, onPlay }: { section: RecoSection; onPlay: (track: Track, list: Track[]) => void }) {
  return (
    <View style={styles.sectionBlock}>
      <SectionHeader title={section.title} detail={section.subtitle} />
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.rail}>
        {section.tracks.map((track, index) => (
          <Pressable
            key={`${track.id}:${index}`}
            style={({ pressed }) => [styles.railCard, pressed && styles.pressed]}
            onPress={() => onPlay(track, section.tracks)}
          >
            <View style={styles.railArtWrap}>
              <Artwork uri={track.cover} size={146} radius={18} />
              <View style={styles.playBadge}><Play size={14} color={C.text} weight="fill" /></View>
            </View>
            <Text numberOfLines={1} style={styles.railTitle}>{track.title}</Text>
            <Text numberOfLines={1} style={styles.railArtist}>{track.artist}</Text>
          </Pressable>
        ))}
      </ScrollView>
    </View>
  );
}

function DiscoverMixPanel({ section, onPlay }: { section: RecoSection; onPlay: (track: Track, list: Track[]) => void }) {
  const artists = [...new Set(section.tracks.map(track => track.artist))].slice(0, 3).join(' · ');
  const covers = section.tracks.slice(0, 3);
  return (
    <Pressable style={({ pressed }) => [styles.mixCard, pressed && styles.pressed]} onPress={() => onPlay(section.tracks[0], section.tracks)}>
      <View style={styles.mixGlow} />
      <Text style={styles.kicker}>MADE FROM YOUR LISTENING</Text>
      <Text style={styles.mixTitle}>{section.title}</Text>
      <Text numberOfLines={2} style={styles.mixSubtitle}>{section.subtitle}{section.context ? ` · ${section.context}` : ''}</Text>
      {!!artists && <Text numberOfLines={1} style={styles.mixArtists}>{artists}</Text>}
      <View style={styles.mixFooter}>
        <View style={styles.mixCovers}>
          {covers.map((track, i) => (
            <View key={`${track.id}:${i}`} style={[styles.miniCoverOverlap, i > 0 && { marginLeft: -12 }]}>
              <Artwork uri={track.cover} size={38} radius={10} />
            </View>
          ))}
        </View>
        <View style={styles.mixPlay}><Play size={22} color={C.bg} weight="fill" /></View>
      </View>
    </Pressable>
  );
}

function SearchBox({
  value,
  onChangeText,
  onSubmit,
  placeholder,
}: {
  value: string;
  onChangeText: (value: string) => void;
  onSubmit: () => void;
  placeholder: string;
}) {
  return (
    <View style={styles.searchBox}>
      <MagnifyingGlass size={24} color={C.muted} weight="bold" />
      <TextInput
        value={value}
        onChangeText={onChangeText}
        onSubmitEditing={onSubmit}
        placeholder={placeholder}
        placeholderTextColor={C.faint}
        style={styles.searchInput}
        returnKeyType="search"
      />
      <Pressable onPress={onSubmit} style={({ pressed }) => [styles.searchSubmit, pressed && styles.pressed]}>
        <MagnifyingGlass size={26} color={C.bg} weight="bold" />
      </Pressable>
    </View>
  );
}

function MiniPlayer({
  track,
  playing,
  position,
  duration,
  onOpen,
  onToggle,
  onLike,
  liked,
}: {
  track: Track;
  playing: boolean;
  position: number;
  duration: number;
  onOpen: () => void;
  onToggle: () => void;
  onLike: () => void;
  liked: boolean;
}) {
  const progress = Math.min(100, duration ? (position / duration) * 100 : 0);
  return (
    <View style={styles.miniPlayerShell}>
      <View style={styles.miniProgress}><View style={[styles.miniProgressFill, { width: `${progress}%` }]} /></View>
      <Pressable onPress={onOpen} style={styles.miniPlayerMain}>
        <Artwork uri={track.cover} size={46} radius={11} />
        <View style={{ flex: 1 }}>
          <Text numberOfLines={1} style={styles.miniTitle}>{track.title}</Text>
          <Text numberOfLines={1} style={styles.miniArtist}>{track.artist}</Text>
        </View>
      </Pressable>
      <Pressable onPress={onToggle} hitSlop={8} style={styles.miniControl}><Text style={styles.miniControlText}>{playing ? <Pause size={20} color={C.text} weight="fill" /> : <Play size={20} color={C.text} weight="fill" />}</Text></Pressable>
      <Pressable onPress={onLike} hitSlop={8} style={styles.miniControl}><Text style={[styles.miniHeart, liked && { color: C.accent }]}>{liked ? <Heart size={22} color={C.accent} weight="fill" /> : <Heart size={22} color={C.muted} />}</Text></Pressable>
    </View>
  );
}

function BottomNav({ active, onChange }: { active: Tab; onChange: (tab: MainTab) => void }) {
  const items: { key: MainTab; icon: string; label: string }[] = [
    { key: 'home', icon: 'home', label: 'Home' },
    { key: 'search', icon: 'search', label: 'Search' },
    { key: 'library', icon: 'library', label: 'Library' },
    { key: 'history', icon: 'history', label: 'History' },
  ];
  return (
    <View style={styles.tabbar}>
      {items.map(item => {
        const selected = active === item.key;
        return (
          <Pressable key={item.key} onPress={() => onChange(item.key)} style={({ pressed }) => [styles.tab, pressed && styles.pressed]}>
            <Text style={[styles.tabIcon, selected && styles.tabIconActive]}>
              {item.key === 'home' && <House size={24} color={selected ? C.accent : C.faint} weight={selected ? 'fill' : 'regular'} />}
              {item.key === 'search' && <MagnifyingGlass size={24} color={selected ? C.accent : C.faint} weight={selected ? 'bold' : 'regular'} />}
              {item.key === 'library' && <MusicNotes size={24} color={selected ? C.accent : C.faint} weight={selected ? 'fill' : 'regular'} />}
              {item.key === 'history' && <Clock size={24} color={selected ? C.accent : C.faint} weight={selected ? 'fill' : 'regular'} />}
            </Text>
            <Text style={[styles.tabLabel, selected && styles.tabLabelActive]}>{item.label}</Text>
            {selected ? <View style={styles.tabIndicator} /> : null}
          </Pressable>
        );
      })}
    </View>
  );
}

function Content() {
  const app = useMonowave();
  const { data, current } = app;
  const [history, setHistory] = useState<Tab[]>(['home']);
  const tab = history[history.length - 1];

  const setTab = useCallback((nextTab: Tab | ((prev: Tab) => Tab)) => {
    if (typeof nextTab === 'function') {
      setHistory(prev => {
        const next = nextTab(prev[prev.length - 1]);
        if (prev[prev.length - 1] === next) return prev;
        return [...prev, next];
      });
    } else {
      setHistory(prev => {
        if (prev[prev.length - 1] === nextTab) return prev;
        return [...prev, nextTab];
      });
    }
  }, []);

  const goBack = useCallback(() => {
    setHistory(prev => (prev.length > 1 ? prev.slice(0, -1) : prev));
  }, []);

  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      if (history.length > 1) {
        setHistory(prev => prev.slice(0, -1));
        return true;
      }
      return false;
    });
    return () => sub.remove();
  }, [history.length]);

  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchItem[]>([]);
  const [filter, setFilter] = useState<Filter>('all');
  const [pending, setPending] = useState(false);
  const [error, setError] = useState('');
  const [collection, setCollection] = useState<SearchItem | null>(null);
  const [children, setChildren] = useState<SearchItem[]>([]);
  const [playlistId, setPlaylistId] = useState('');
  const [actionTrack, setActionTrack] = useState<Track | null>(null);
  const [newList, setNewList] = useState('');
  const [importText, setImportText] = useState('');
  const [barWidth, setBarWidth] = useState(1);
  const reco = useRecommendations(app);
  useEffect(() => {
    if (!actionTrack) return;
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      setActionTrack(null);
      return true;
    });
    return () => sub.remove();
  }, [actionTrack]);


  const find = useCallback(async (term: string) => {
    if (!term.trim()) return;
    recordSearch(term);
    setPending(true);
    setError('');
    setTab('search');
    try {
      setResults(await searchMusic(term.trim()));
    } catch (e) {
      setError(`Search failed: ${String(e)}`);
    } finally {
      setPending(false);
    }
  }, []);

  const openCollection = useCallback(async (item: SearchItem) => {
    setCollection(item);
    setChildren([]);
    setTab('collection');
    setPending(true);
    setError('');
    try {
      setChildren(await browseMusic(item.id));
    } catch (e) {
      setError(`Could not open ${item.title}: ${String(e)}`);
    } finally {
      setPending(false);
    }
  }, []);

  const importLink = useCallback(async () => {
    const link = parseLink(importText);
    if (!link) {
      setError('Paste a YouTube Music track or playlist link.');
      return;
    }
    setPending(true);
    setError('');
    try {
      if (link.kind === 'track') app.playTrack(await trackById(link.id));
      else {
        const imported = (await browseMusic(link.id)).flatMap(item => item.track ? [item.track] : []);
        if (!imported.length) throw new Error('No tracks found in this playlist');
        app.createPlaylist(`Imported · ${link.id}`, imported);
        setTab('library');
      }
      setImportText('');
    } catch (e) {
      setError(`Import failed: ${String(e)}`);
    } finally {
      setPending(false);
    }
  }, [importText, app]);

  const chosen = data.playlists.find(list => list.id === playlistId);
  const tracksInCollection = children.flatMap(item => item.track ? [item.track] : []);
  const playFrom = (track: Track, tracks?: Track[]) => {
    app.playTrack(track, tracks);
    setTab('player');
  };
  const collectionKind = collection?.kind === 'artist' ? 'artist' : collection?.kind === 'album' ? 'album' : 'playlist';

  const recoSections = reco.reco?.sections ?? [];
  const mixSection = recoSections.find(section => section.kind === 'discover-mix');
  const railOrder: RecoSection['kind'][] = ['because-you-played', 'more-from-artist', 'based-on-likes', 'rediscover', 'recently-played'];
  const rails = railOrder
    .map(kind => recoSections.find(section => section.kind === kind))
    .filter((section): section is RecoSection => Boolean(section));
  const coldStart = reco.reco?.status === 'cold' || (!recoSections.length && !reco.refreshing && Boolean(reco.reco));

  const trending = useMemo(() => {
    const names = [...data.history.map(entry => entry.track.title), ...data.liked.map(track => track.title)];
    const unique = [...new Set(names.filter(Boolean))].slice(0, 6);
    return [...unique, 'Chill', 'Indie', 'Workout', 'Focus', 'Party', 'Acoustic'].slice(0, 6);
  }, [data.history, data.liked]);

  const visibleResults = results.filter(item => filter === 'all' || item.kind === filter);
  const isMainTab = (['home', 'search', 'library', 'history'] as Tab[]).includes(tab);

  const openCategory = (next: Filter) => {
    setFilter(next);
    setTab('search');
  };

  return (
    <SafeAreaView style={styles.page} edges={['top', 'bottom']}>
      <StatusBar style="light" />
      <BrandHeader onHome={() => setTab('home')} onSettings={() => setTab((prev: Tab) => prev === 'settings' ? 'home' : 'settings')} />

      {(error || app.message) ? (
        <Pressable onPress={() => setError('')} style={styles.errorBanner}>
          <Text style={styles.errorText}>{error || app.message}</Text>
          <Text style={styles.errorClose}>×</Text>
        </Pressable>
      ) : null}

      <ScrollView
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.scroll, current && tab !== 'player' && isMainTab && { paddingBottom: 164 }]}
        key={tab}
      >
        {tab === 'home' && (
          <>
            <View style={styles.heroArea}>
              <View style={styles.heroOrbA} />
              <View style={styles.heroOrbB} />
              <Text style={styles.hero}>Good to see you{data.name ? `, ${data.name}` : ''}.</Text>
              <Text style={styles.heroKicker}>Your listening space</Text>
              <Text style={styles.heroSub}>Search, save, and play the music you love.</Text>
            </View>

            <Pressable style={({ pressed }) => [styles.discoveryCard, pressed && styles.pressed]} onPress={() => setTab('search')}>
              <View style={styles.discoveryIcon}><MagnifyingGlass size={28} color={C.text} weight="bold" /></View>
              <View style={{ flex: 1 }}>
                <Text style={styles.discoveryTitle}>Find something new</Text>
                <Text style={styles.discoverySub}>Search tracks, albums, artists, and playlists.</Text>
              </View>
              <View style={styles.discoveryArrow}><CaretRight size={24} color={C.text} weight="bold" /></View>
            </Pressable>

            <View style={styles.recoBar}>
              <Text style={styles.recoMeta}>
                {reco.refreshing
                  ? 'Updating recommendations…'
                  : reco.reco
                    ? `Built ${timeAgo(reco.reco.builtAt)} from your listening.`
                    : 'Recommendations grow as you listen.'}
              </Text>
              <Pressable hitSlop={8} onPress={reco.refresh}><Text style={styles.refreshText}>↻ Refresh</Text></Pressable>
            </View>
            {reco.error ? <Text style={styles.inlineError}>{reco.error}</Text> : null}

            {mixSection ? <DiscoverMixPanel section={mixSection} onPlay={playFrom} /> : null}
            {rails.map(section => <SectionRail key={section.kind} section={section} onPlay={playFrom} />)}

            {coldStart ? (
              <View style={styles.emptyStateCard}>
                <View style={styles.emptyStateIcon}><MusicNotes size={32} color={C.accent} weight="fill" /></View>
                <Text style={styles.emptyStateTitle}>Your mixes will appear here</Text>
                <Text style={styles.emptyStateText}>Play a few tracks or save something you like. Monowave builds recommendations from your real listening activity.</Text>
              </View>
            ) : null}

            {!recoSections.length && reco.reco?.status === 'partial' && !reco.refreshing ? (
              <Text style={styles.placeholder}>Fresh recommendations could not be loaded right now. Your saved music is still available.</Text>
            ) : null}

            <SectionHeader title="Liked tracks" detail={`${data.liked.length} saved`} action="Library" onAction={() => setTab('library')} />
            {data.liked.slice(0, 4).map(track => (
              <TrackLine
                key={track.id}
                track={track}
                onPress={() => playFrom(track, data.liked)}
                onMore={() => setActionTrack(track)}
              />
            ))}
            {!data.liked.length && !data.history.length ? <Text style={styles.placeholder}>Your recent tracks appear here after you play one.</Text> : null}
          </>
        )}

        {tab === 'search' && (
          <>
            <ScreenTitle title="Search" detail="Find your next favourite" />
            <SearchBox value={query} onChangeText={setQuery} onSubmit={() => void find(query)} placeholder="What do you want to hear?" />

            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterRow}>
              {(['all', 'track', 'album', 'artist', 'playlist'] as Filter[]).map(value => (
                <Pressable
                  key={value}
                  onPress={() => setFilter(value)}
                  style={({ pressed }) => [styles.filterPill, filter === value && styles.filterPillActive, pressed && styles.pressed]}
                >
                  <Text style={[styles.filterText, filter === value && styles.filterTextActive]}>
                    {value === 'track' ? 'Songs' : value === 'all' ? 'All' : `${value[0].toUpperCase()}${value.slice(1)}${value === 'artist' ? 's' : 's'}`}
                  </Text>
                </Pressable>
              ))}
            </ScrollView>

            {!query.trim() && !results.length ? (
              <>
                <SectionHeader title="Trending searches" />
                <View style={styles.chipGrid}>
                  {trending.map(term => (
                    <Pressable key={term} onPress={() => { setQuery(term); void find(term); }} style={({ pressed }) => [styles.searchChip, pressed && styles.pressed]}>
                      <MagnifyingGlass size={18} color={C.text} weight="bold" />
                      <Text numberOfLines={1} style={styles.searchChipText}>{term}</Text>
                    </Pressable>
                  ))}
                </View>

                <SectionHeader title="Explore by mood" />
                <View style={styles.moodGrid}>
                  {MOODS.map(mood => (
                    <Pressable key={mood.label} onPress={() => { setQuery(mood.query); void find(mood.query); }} style={({ pressed }) => [styles.moodCard, { backgroundColor: mood.tint }, pressed && styles.pressed]}>
                      <Text style={styles.moodIcon}>{mood.icon}</Text>
                      <View style={styles.moodFooter}><Text style={styles.moodLabel}>{mood.label}</Text><CaretRight size={20} color={C.text} weight="bold" /></View>
                    </Pressable>
                  ))}
                </View>

                <SectionHeader title="Browse categories" />
                <View style={styles.categoryGrid}>
                  {CATEGORY_FILTERS.map(category => (
                    <Pressable key={category.label} onPress={() => openCategory(category.filter)} style={({ pressed }) => [styles.categoryCard, { backgroundColor: category.tint }, pressed && styles.pressed]}>
                      <Text style={styles.categoryIcon}>{category.icon}</Text>
                      <Text style={styles.categoryLabel}>{category.label}</Text>
                    </Pressable>
                  ))}
                </View>
              </>
            ) : null}

            {pending ? <View style={{padding: 40, alignItems: 'center'}}><ActivityIndicator color={C.accent} size="large" /><Text style={styles.loadingText}>Searching YouTube Music…</Text></View> : null}
            {!pending && results.length ? <SectionHeader title="Results" detail={`${visibleResults.length} shown`} /> : null}
            {visibleResults.map(item => (
              <TrackLine
                key={`${item.kind}:${item.id}`}
                track={item.track ?? { id: item.id, title: item.title, artist: item.subtitle, cover: item.cover }}
                onPress={() => item.track ? playFrom(item.track) : void openCollection(item)}
                onMore={item.track ? () => setActionTrack(item.track!) : undefined}
                trailing={item.kind === 'track' ? undefined : <CaretRight size={20} color={C.muted} />}
              />
            ))}
            {!pending && query.trim() && !visibleResults.length ? <Text style={styles.placeholder}>No matching results for this filter.</Text> : null}
          </>
        )}

        {tab === 'collection' && (
          <>
            <Pressable onPress={() => setTab('search')} style={styles.backButton}><View style={{flexDirection: 'row', alignItems: 'center'}}><CaretLeft size={18} color={C.accent} weight="bold" /><Text style={styles.backButtonText}>Search</Text></View></Pressable>
            <View style={styles.collectionHero}>
              <Artwork uri={collection?.cover} size={132} radius={24} />
              <View style={styles.collectionCopy}>
                <Text style={styles.kicker}>{collectionKind.toUpperCase()}</Text>
                <Text numberOfLines={3} style={styles.collectionTitle}>{collection?.title}</Text>
                <Text numberOfLines={2} style={styles.collectionSubtitle}>{collection?.subtitle}</Text>
              </View>
            </View>
            {!!tracksInCollection.length ? <Action label="Play all" active wide onPress={() => playFrom(tracksInCollection[0], tracksInCollection)} /> : null}
            {pending ? <View style={{padding: 40, alignItems: 'center'}}><ActivityIndicator color={C.accent} size="large" /><Text style={styles.loadingText}>Loading collection…</Text></View> : null}
            {children.map(item => (
              <TrackLine
                key={`${item.kind}:${item.id}`}
                track={item.track ?? { id: item.id, title: item.title, artist: item.subtitle, cover: item.cover }}
                onPress={() => item.track ? playFrom(item.track, tracksInCollection) : void openCollection(item)}
                onMore={item.track ? () => setActionTrack(item.track!) : undefined}
              />
            ))}
          </>
        )}

        {tab === 'library' && (
          <>
            <ScreenTitle title="Your library" detail="Everything you save, in one place" />
            <View style={styles.statRow}>
              <Pressable onPress={() => {}} style={styles.statCard}>
                <View style={[styles.statIcon, { backgroundColor: '#5D2C7D' }]}><Heart size={20} color={C.text} weight="fill" /></View>
                <View><Text style={styles.statNumber}>{data.liked.length}</Text><Text style={styles.statLabel}>Liked songs</Text></View>
                <CaretRight size={20} color={C.muted} weight="bold" />
              </Pressable>
              <Pressable onPress={() => {}} style={styles.statCard}>
                <View style={[styles.statIcon, { backgroundColor: '#34365F' }]}><MusicNotes size={20} color={C.text} weight="fill" /></View>
                <View><Text style={styles.statNumber}>{data.playlists.length}</Text><Text style={styles.statLabel}>Playlists</Text></View>
                <CaretRight size={20} color={C.muted} weight="bold" />
              </Pressable>
            </View>

            <SectionHeader title="Liked songs" detail={`${data.liked.length} song${data.liked.length === 1 ? '' : 's'}`} />
            {data.liked.slice(0, 5).map(track => (
              <TrackLine key={track.id} track={track} onPress={() => playFrom(track, data.liked)} onMore={() => setActionTrack(track)} />
            ))}
            {!data.liked.length ? <Text style={styles.placeholder}>Songs you like will appear here.</Text> : null}

            <SectionHeader title="Playlists" detail={`${data.playlists.length} playlist${data.playlists.length === 1 ? '' : 's'}`} />
            <View style={styles.createPlaylistCard}>
              <View style={styles.createIcon}><Plus size={24} color={C.accent} weight="bold" /></View>
              <TextInput
                value={newList}
                onChangeText={setNewList}
                placeholder="Create new playlist"
                placeholderTextColor={C.muted}
                style={styles.createPlaylistInput}
                returnKeyType="done"
                onSubmitEditing={() => { if (newList.trim()) { app.createPlaylist(newList); setNewList(''); } }}
              />
              <Pressable onPress={() => { if (newList.trim()) { app.createPlaylist(newList); setNewList(''); } }} style={styles.createButton}>
                <Text style={styles.createButtonText}>Create</Text>
              </Pressable>
            </View>

            {data.playlists.map(list => (
              <Pressable
                key={list.id}
                style={({ pressed }) => [styles.playlistCard, pressed && styles.pressed]}
                onPress={() => { setPlaylistId(list.id); setTab('playlist'); }}
              >
                <View style={styles.playlistArt}><MusicNotes size={28} color={C.accent} weight="fill" /></View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.playlistTitle}>{list.name}</Text>
                  <Text style={styles.playlistMeta}>{list.tracks.length} tracks</Text>
                </View>
                <CaretRight size={24} color={C.muted} weight="bold" />
              </Pressable>
            ))}

            <SectionHeader title="Import a public playlist" detail="Bring a playlist from YouTube Music" />
            <View style={styles.importCard}>
              <View style={styles.importInputWrap}>
                <Plus size={20} color={C.muted} weight="bold" />
                <TextInput
                  value={importText}
                  onChangeText={setImportText}
                  autoCapitalize="none"
                  placeholder="Paste a YouTube Music link"
                  placeholderTextColor={C.faint}
                  style={styles.importInput}
                />
              </View>
              <Action label={pending ? 'Loading…' : 'Import'} active onPress={() => void importLink()} />
            </View>
          </>
        )}

        {tab === 'playlist' && (
          <>
            <Pressable onPress={() => setTab('library')} style={styles.backButton}><View style={{flexDirection: 'row', alignItems: 'center'}}><CaretLeft size={18} color={C.accent} weight="bold" /><Text style={styles.backButtonText}>Library</Text></View></Pressable>
            <ScreenTitle title={chosen?.name ?? 'Playlist'} detail={`${chosen?.tracks.length ?? 0} tracks`} />
            {!!chosen?.tracks.length ? <Action label="Play playlist" active wide onPress={() => playFrom(chosen.tracks[0], chosen.tracks)} /> : null}
            {chosen?.tracks.map(track => (
              <TrackLine
                key={track.id}
                track={track}
                onPress={() => playFrom(track, chosen.tracks)}
                onMore={() => app.removeFromPlaylist(chosen.id, track.id)}
                trailing={<X size={20} color={C.muted} weight="bold" />}
              />
            ))}
            {!chosen?.tracks.length ? <Text style={styles.placeholder}>This playlist is empty.</Text> : null}
            <View style={{ marginTop: 22 }}><Action label="Delete playlist" danger onPress={() => { app.deletePlaylist(playlistId); setTab('library'); }} /></View>
          </>
        )}

        {tab === 'history' && (
          <>
            <View style={styles.historyTitleRow}>
              <ScreenTitle title="Listening history" detail={`${data.history.length} listens · Recently played tracks`} />
              {!!data.history.length ? (
                <Pressable onPress={app.clearHistory} style={styles.clearButton}><Text style={styles.clearButtonText}>⌫  Clear all</Text></Pressable>
              ) : null}
            </View>
            <View style={styles.historyList}>
              {data.history.map((entry, index) => (
                <TrackLine
                  key={`${entry.playedAt}:${index}`}
                  track={entry.track}
                  onPress={() => playFrom(entry.track)}
                  onMore={() => setActionTrack(entry.track)}
                  meta={timeAgo(entry.playedAt)}
                  card
                />
              ))}
            </View>
            {!data.history.length ? (
              <View style={styles.emptyStateCard}>
                <View style={styles.emptyStateIcon}><Clock size={32} color={C.accent} weight="fill" /></View>
                <Text style={styles.emptyStateTitle}>Nothing played yet</Text>
                <Text style={styles.emptyStateText}>Tracks you play will show up here for quick access later.</Text>
              </View>
            ) : null}
          </>
        )}

        {tab === 'player' && (
          <>
            <View style={styles.playerHeader}>
              <Pressable onPress={() => setTab('home')} style={styles.backCircle}><CaretLeft size={24} color={C.text} weight="bold" /></Pressable>
              <View style={{ alignItems: 'center' }}><Text style={styles.playerHeaderKicker}>NOW PLAYING</Text><Text style={styles.playerHeaderTitle}>Monowave</Text></View>
              <Pressable onPress={() => current && setActionTrack(current)} style={styles.backCircle}><DotsThreeVertical size={24} color={C.text} weight="bold" /></Pressable>
            </View>
            <View style={styles.playerGlowA} />
            <View style={styles.playerGlowB} />
            <View style={styles.playerArt}><Artwork uri={current?.cover} size={292} radius={30} /></View>
            <Text style={styles.playerTitle} numberOfLines={2}>{current?.title ?? 'Nothing playing'}</Text>
            <Text style={styles.playerArtist}>{current?.artist}</Text>

            <View onLayout={event => setBarWidth(event.nativeEvent.layout.width)} style={styles.progressArea}>
              <Pressable style={styles.progress} onPress={event => app.seek((event.nativeEvent.locationX / barWidth) * app.duration)}>
                <View style={[styles.progressFill, { width: `${Math.min(100, app.duration ? (app.position / app.duration) * 100 : 0)}%` }]} />
              </Pressable>
              <View style={styles.progressLabels}><Text style={styles.progressTime}>{formatTime(app.position)}</Text><Text style={styles.progressTime}>{formatTime(app.duration || current?.duration || 0)}</Text></View>
            </View>

            <View style={styles.playerControls}>
              <Pressable onPress={app.toggleShuffle} style={styles.secondaryControl}><Shuffle size={24} color={data.shuffle ? C.accent : C.muted} weight="bold" /></Pressable>
              <Pressable onPress={app.previous} style={styles.skipControl}><SkipBack size={32} color={C.text} weight="fill" /></Pressable>
              <Pressable onPress={app.toggle} style={styles.mainPlayControl}><Text style={styles.mainPlayText}>{app.busy ? <ActivityIndicator color={C.bg} size="large" /> : app.playing ? <Pause size={32} color={C.bg} weight="fill" /> : <Play size={32} color={C.bg} weight="fill" />}</Text></Pressable>
              <Pressable onPress={app.next} style={styles.skipControl}><SkipForward size={32} color={C.text} weight="fill" /></Pressable>
              <Pressable onPress={app.cycleRepeat} style={styles.secondaryControl}><Repeat size={24} color={data.repeat !== 'off' ? C.accent : C.muted} weight="bold" /></Pressable>
            </View>

            {!!current ? (
              <Pressable onPress={() => app.like(current)} style={styles.likeNowPlaying}>
                <Text style={[styles.likeNowPlayingIcon, data.liked.some(t => t.id === current.id) && { color: C.accent }]}>{data.liked.some(t => t.id === current.id) ? '♥' : '♡'}</Text>
                <Text style={styles.likeNowPlayingText}>{data.liked.some(t => t.id === current.id) ? 'Liked' : 'Like this track'}</Text>
              </Pressable>
            ) : null}

            <SectionHeader title="Up next" detail={`${data.queue.length} in queue`} />
            {data.queue.map((track, index) => (
              <View key={`${track.id}:${index}`} style={[styles.queueLine, index === data.index && styles.queueLineActive]}>
                <Text style={[styles.queueIndex, index === data.index && { color: C.accent }]}>{index === data.index ? <SpeakerHigh size={16} color={C.accent} weight="fill" /> : index + 1}</Text>
                <Pressable style={{ flex: 1 }} onPress={() => void app.playAt(data.queue, index)}>
                  <Text numberOfLines={1} style={styles.queueTitle}>{track.title}</Text>
                  <Text numberOfLines={1} style={styles.queueArtist}>{track.artist}</Text>
                </Pressable>
                <Pressable onPress={() => app.moveQueued(index, index - 1)}><ArrowUp size={20} color={C.accent} weight="bold" /></Pressable>
                <Pressable onPress={() => app.moveQueued(index, index + 1)}><ArrowDown size={20} color={C.accent} weight="bold" /></Pressable>
                <Pressable onPress={() => app.removeQueued(index)}><X size={20} color={C.accent} weight="bold" /></Pressable>
              </View>
            ))}
          </>
        )}

        {tab === 'settings' && (
          <>
            <ScreenTitle title="Settings" detail="Personalize Monowave" />
            <View style={styles.settingsCard}>
              <Text style={styles.settingsLabel}>DISPLAY NAME</Text>
              <TextInput
                value={data.name}
                onChangeText={app.setName}
                placeholder="Optional name"
                placeholderTextColor={C.faint}
                style={styles.settingsInput}
                maxLength={40}
              />
            </View>
            <SectionHeader title="About Monowave" />
            <View style={styles.aboutCard}>
              <Text style={styles.body}>Monowave stores likes, playlists, queue, and history locally. It uses the Android NewPipe Extractor module to obtain playable streams for videos you select. Streaming needs internet access. The app does not save audio files.</Text>
              <View style={styles.aboutDivider} />
              <Text style={styles.body}>Recommendations are built on this device from finished listens, repeated plays, likes, playlist saves, searches, and skips. Candidate tracks come from YouTube Music related queues, artist pages, and searches.</Text>
              <View style={styles.aboutDivider} />
              <Text style={styles.body}>Search uses YouTube Music's unofficial web interface. Playback availability can change when that service changes, or when a track is restricted.</Text>
            </View>
            <View style={styles.linkStack}>
              <Action label="NewPipe Extractor source  ↗" wide onPress={() => void Linking.openURL('https://github.com/TeamNewPipe/NewPipeExtractor')} />
              <Action label="NØTE reference project  ↗" wide onPress={() => void Linking.openURL('https://github.com/SJbuilds04/NOTE')} />
              <Action label="GPL-3.0 license  ↗" wide onPress={() => void Linking.openURL('https://www.gnu.org/licenses/gpl-3.0.html')} />
            </View>
          </>
        )}
      </ScrollView>

      {current && tab !== 'player' && isMainTab ? (
        <MiniPlayer
          track={current}
          playing={app.playing}
          position={app.position}
          duration={app.duration || current.duration || 0}
          onOpen={() => setTab('player')}
          onToggle={app.toggle}
          onLike={() => app.like(current)}
          liked={data.liked.some(track => track.id === current.id)}
        />
      ) : null}

      {isMainTab ? <BottomNav active={tab} onChange={setTab} /> : null}

      <Modal visible={!!actionTrack} transparent animationType="slide" onRequestClose={() => setActionTrack(null)}>
        <Pressable style={styles.overlay} onPress={() => setActionTrack(null)}>
          <Pressable style={styles.sheet} onPress={event => event.stopPropagation()}>
            <View style={styles.sheetHandle} />
            <View style={styles.sheetTrackHeader}>
              <Artwork uri={actionTrack?.cover} size={66} radius={16} />
              <View style={{ flex: 1 }}>
                <Text numberOfLines={2} style={styles.sheetTitle}>{actionTrack?.title ?? ''}</Text>
                <Text numberOfLines={1} style={styles.sheetSubtitle}>{actionTrack?.artist}</Text>
              </View>
            </View>
            {actionTrack ? (
              <View style={styles.sheetActions}>
                <Action label="Play now" active wide onPress={() => { playFrom(actionTrack); setActionTrack(null); }} />
                <Action label="Play next" wide onPress={() => { app.addNext(actionTrack); setActionTrack(null); }} />
                <Action label="Add to queue" wide onPress={() => { app.enqueue(actionTrack); setActionTrack(null); }} />
                <Action label={data.liked.some(t => t.id === actionTrack.id) ? '♥  Unlike' : '♡  Like'} wide onPress={() => { app.like(actionTrack); setActionTrack(null); }} />
                {data.playlists.map(list => (
                  <Action key={list.id} label={`＋  Add to ${list.name}`} wide onPress={() => { app.addToPlaylist(list.id, actionTrack); setActionTrack(null); }} />
                ))}
              </View>
            ) : null}
          </Pressable>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}

export default function App() {
  return <SafeAreaProvider><Content /></SafeAreaProvider>;
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: C.bg },
  topBar: { height: 64, paddingHorizontal: 22, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: C.bg },
  brandWrap: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  brandMark: { color: C.accent, fontSize: 30, fontWeight: '900', transform: [{ rotate: '-8deg' }] },
  brand: { color: C.accent, fontWeight: '900', letterSpacing: 1.6, fontSize: 16 },
  iconButton: { width: 42, height: 42, borderRadius: 21, alignItems: 'center', justifyContent: 'center', backgroundColor: '#FFFFFF08', borderWidth: 1, borderColor: C.line },
  topIcon: { color: C.text, fontSize: 22 },
  scroll: { paddingHorizontal: 22, paddingTop: 14, paddingBottom: 34 },
  pressed: { opacity: 0.72 },
  kicker: { color: C.accent, fontSize: 11, letterSpacing: 1.8, fontWeight: '800' },

  heroArea: { minHeight: 170, justifyContent: 'center', overflow: 'hidden', marginHorizontal: -22, paddingHorizontal: 22, marginTop: -14 },
  heroOrbA: { position: 'absolute', width: 220, height: 220, borderRadius: 110, right: -70, top: -60, backgroundColor: '#813BFF30' },
  heroOrbB: { position: 'absolute', width: 150, height: 150, borderRadius: 75, right: 55, bottom: -75, backgroundColor: '#1C75FF20' },
  hero: { color: C.text, fontSize: 38, lineHeight: 44, fontWeight: '900', letterSpacing: -1.1, maxWidth: '90%' },
  heroKicker: { color: C.accent, fontSize: 15, fontWeight: '800', marginTop: 10 },
  heroSub: { color: C.muted, fontSize: 14, marginTop: 8 },

  discoveryCard: { marginTop: 18, flexDirection: 'row', alignItems: 'center', padding: 16, borderRadius: 24, backgroundColor: C.panelStrong, borderWidth: 1, borderColor: C.lineStrong, gap: 13 },
  discoveryIcon: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center', backgroundColor: '#FFFFFF0C', borderWidth: 1, borderColor: '#FFFFFF12' },
  discoveryIconText: { color: C.text, fontSize: 29, transform: [{ rotate: '-15deg' }] },
  discoveryTitle: { color: C.text, fontSize: 18, fontWeight: '800' },
  discoverySub: { color: C.muted, fontSize: 13, marginTop: 4, lineHeight: 18 },
  discoveryArrow: { width: 42, height: 42, borderRadius: 21, alignItems: 'center', justifyContent: 'center', backgroundColor: '#B46BFF26', borderWidth: 1, borderColor: '#B46BFF55' },
  discoveryArrowText: { color: C.text, fontSize: 32, marginTop: -3 },

  recoBar: { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 22, marginBottom: 2 },
  recoMeta: { flex: 1, color: C.faint, fontSize: 12.5 },
  refreshText: { color: C.accent, fontWeight: '800', fontSize: 13 },
  inlineError: { color: C.danger, fontSize: 12, marginTop: 8 },

  sectionBlock: { marginTop: 8 },
  sectionHeader: { marginTop: 24, marginBottom: 12, flexDirection: 'row', alignItems: 'flex-end', gap: 12 },
  sectionTitle: { color: C.text, fontSize: 24, fontWeight: '900', letterSpacing: -0.4 },
  sectionDetail: { color: C.muted, fontSize: 13.5, marginTop: 3 },
  sectionAction: { color: C.accent, fontSize: 13.5, fontWeight: '800', paddingBottom: 2 },

  rail: { gap: 14, paddingRight: 6 },
  railCard: { width: 146 },
  railArtWrap: { position: 'relative' },
  playBadge: { position: 'absolute', right: 8, bottom: 8, width: 34, height: 34, borderRadius: 17, backgroundColor: '#11111DDD', borderWidth: 1.5, borderColor: '#FFFFFFCC', alignItems: 'center', justifyContent: 'center' },
  playBadgeText: { color: C.text, fontSize: 13, marginLeft: 2 },
  railTitle: { color: C.text, fontSize: 14, fontWeight: '800', marginTop: 9 },
  railArtist: { color: C.muted, fontSize: 12.5, marginTop: 3 },

  mixCard: { marginTop: 18, padding: 20, borderRadius: 26, overflow: 'hidden', backgroundColor: '#19172F', borderWidth: 1, borderColor: C.lineStrong },
  mixGlow: { position: 'absolute', width: 190, height: 190, borderRadius: 95, right: -55, top: -85, backgroundColor: '#A14BFF38' },
  mixTitle: { color: C.text, fontSize: 28, fontWeight: '900', marginTop: 7 },
  mixSubtitle: { color: C.muted, fontSize: 13.5, lineHeight: 19, marginTop: 6 },
  mixArtists: { color: C.faint, fontSize: 12.5, marginTop: 5 },
  mixFooter: { marginTop: 18, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  mixCovers: { flexDirection: 'row', alignItems: 'center' },
  miniCoverOverlap: { borderRadius: 11, borderWidth: 2, borderColor: '#19172F' },
  mixPlay: { width: 50, height: 50, borderRadius: 25, backgroundColor: C.accent, alignItems: 'center', justifyContent: 'center' },
  mixPlayText: { color: C.bg, fontSize: 18, fontWeight: '900', marginLeft: 3 },

  screenTitleWrap: { marginTop: 2, marginBottom: 18 },
  screenTitle: { color: C.text, fontSize: 36, lineHeight: 42, fontWeight: '900', letterSpacing: -1 },
  screenSubtitle: { color: C.muted, fontSize: 15, marginTop: 5 },

  searchBox: { flexDirection: 'row', alignItems: 'center', minHeight: 66, borderRadius: 22, paddingLeft: 16, backgroundColor: C.panel, borderWidth: 1, borderColor: '#8E6CFF55', overflow: 'hidden' },
  searchIcon: { color: C.muted, fontSize: 28, transform: [{ rotate: '-15deg' }], marginRight: 9 },
  searchInput: { flex: 1, color: C.text, fontSize: 16, paddingVertical: 18 },
  searchSubmit: { width: 60, height: 60, marginRight: 3, borderRadius: 20, backgroundColor: C.accent, alignItems: 'center', justifyContent: 'center' },
  searchSubmitText: { color: C.bg, fontSize: 30, fontWeight: '900', transform: [{ rotate: '-15deg' }] },
  filterRow: { gap: 10, paddingVertical: 18 },
  filterPill: { paddingHorizontal: 20, paddingVertical: 12, borderRadius: 22, backgroundColor: C.panel, borderWidth: 1, borderColor: '#FFFFFF1D' },
  filterPillActive: { backgroundColor: C.accent, borderColor: C.accent },
  filterText: { color: C.text, fontSize: 14, fontWeight: '700' },
  filterTextActive: { color: C.bg },
  chipGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  searchChip: { width: '48%', minHeight: 48, borderRadius: 18, backgroundColor: C.panel, borderWidth: 1, borderColor: C.line, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 13, gap: 9 },
  searchChipIcon: { color: C.text, fontSize: 22, transform: [{ rotate: '-15deg' }] },
  searchChipText: { flex: 1, color: C.text, fontSize: 13, fontWeight: '700' },
  moodGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  moodCard: { width: '48%', height: 116, borderRadius: 22, padding: 16, justifyContent: 'space-between', borderWidth: 1, borderColor: '#FFFFFF16' },
  moodIcon: { color: '#FFFFFFE8', fontSize: 30, fontWeight: '800' },
  moodFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  moodLabel: { color: C.text, fontSize: 16, fontWeight: '800' },
  moodArrow: { color: C.text, fontSize: 26 },
  categoryGrid: { flexDirection: 'row', gap: 10 },
  categoryCard: { flex: 1, minHeight: 108, borderRadius: 20, alignItems: 'center', justifyContent: 'center', gap: 10, borderWidth: 1, borderColor: '#FFFFFF14' },
  categoryIcon: { color: C.text, fontSize: 27, fontWeight: '900' },
  categoryLabel: { color: C.text, fontSize: 13, fontWeight: '800' },
  loadingText: { color: C.accent, fontSize: 13, marginTop: 18, fontWeight: '700' },

  trackLine: { minHeight: 76, flexDirection: 'row', alignItems: 'center', borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: C.line, gap: 8 },
  trackLineCard: { minHeight: 86, marginBottom: 9, borderWidth: 1, borderColor: C.line, borderRadius: 20, backgroundColor: '#0E0F20', paddingHorizontal: 10 },
  trackLineMain: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 13, paddingVertical: 9 },
  trackText: { flex: 1, gap: 4 },
  trackTitle: { color: C.text, fontSize: 15, fontWeight: '800' },
  trackArtist: { color: C.muted, fontSize: 13 },
  trackMeta: { color: C.muted, fontSize: 11.5, minWidth: 68, textAlign: 'right' },
  moreButton: { width: 34, height: 50, alignItems: 'center', justifyContent: 'center' },
  ellipsis: { color: C.muted, fontSize: 23, lineHeight: 26 },
  emptyArt: { backgroundColor: C.panelStrong, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: C.line },

  emptyStateCard: { marginTop: 24, backgroundColor: C.panel, borderWidth: 1, borderColor: C.line, borderRadius: 24, alignItems: 'center', padding: 24 },
  emptyStateIcon: { width: 56, height: 56, borderRadius: 28, backgroundColor: C.accentSoft, alignItems: 'center', justifyContent: 'center', marginBottom: 13 },
  emptyStateIconText: { color: C.accent, fontSize: 25, fontWeight: '900' },
  emptyStateTitle: { color: C.text, fontSize: 18, fontWeight: '900', textAlign: 'center' },
  emptyStateText: { color: C.muted, fontSize: 13.5, lineHeight: 20, textAlign: 'center', marginTop: 7 },
  placeholder: { color: C.muted, marginTop: 18, marginBottom: 8, lineHeight: 21, fontSize: 13.5 },

  backButton: { alignSelf: 'flex-start', paddingVertical: 9, paddingRight: 14, marginBottom: 10 },
  backButtonText: { color: C.accent, fontSize: 14, fontWeight: '800' },
  collectionHero: { flexDirection: 'row', gap: 18, alignItems: 'center', paddingVertical: 12, marginBottom: 14 },
  collectionCopy: { flex: 1, gap: 5 },
  collectionTitle: { color: C.text, fontSize: 28, lineHeight: 32, fontWeight: '900' },
  collectionSubtitle: { color: C.muted, fontSize: 13, lineHeight: 19 },

  statRow: { flexDirection: 'row', gap: 12, marginBottom: 2 },
  statCard: { flex: 1, minHeight: 82, flexDirection: 'row', alignItems: 'center', gap: 11, padding: 12, borderRadius: 20, backgroundColor: C.panel, borderWidth: 1, borderColor: C.line },
  statIcon: { width: 42, height: 42, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  statIconText: { color: C.text, fontSize: 19, fontWeight: '900' },
  statNumber: { color: C.text, fontSize: 16, fontWeight: '900' },
  statLabel: { color: C.muted, fontSize: 11.5, marginTop: 2 },
  statArrow: { marginLeft: 'auto', color: C.muted, fontSize: 24 },
  createPlaylistCard: { minHeight: 74, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, borderRadius: 22, backgroundColor: C.panel, borderWidth: 1, borderColor: C.line, gap: 10 },
  createIcon: { width: 48, height: 48, borderRadius: 14, borderWidth: 1, borderColor: '#8E6CFF66', backgroundColor: '#8E6CFF17', alignItems: 'center', justifyContent: 'center' },
  createIconText: { color: C.accent, fontSize: 27 },
  createPlaylistInput: { flex: 1, color: C.text, fontSize: 15, fontWeight: '700', paddingVertical: 15 },
  createButton: { paddingHorizontal: 12, paddingVertical: 10, borderRadius: 14, backgroundColor: C.accent },
  createButtonText: { color: C.bg, fontWeight: '900', fontSize: 12.5 },
  playlistCard: { minHeight: 82, flexDirection: 'row', alignItems: 'center', padding: 12, borderRadius: 22, backgroundColor: C.panel, borderWidth: 1, borderColor: C.line, marginTop: 10, gap: 13 },
  playlistArt: { width: 54, height: 54, borderRadius: 16, backgroundColor: '#22223C', alignItems: 'center', justifyContent: 'center' },
  playlistArtText: { color: C.accent, fontSize: 23 },
  playlistTitle: { color: C.text, fontSize: 16, fontWeight: '900' },
  playlistMeta: { color: C.muted, fontSize: 12.5, marginTop: 4 },
  playlistArrow: { color: C.muted, fontSize: 26 },
  importCard: { gap: 10, marginBottom: 12 },
  importInputWrap: { minHeight: 58, borderRadius: 18, backgroundColor: C.panel, borderWidth: 1, borderColor: C.line, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14 },
  linkIcon: { color: C.muted, fontSize: 20, marginRight: 9 },
  importInput: { flex: 1, color: C.text, fontSize: 14, paddingVertical: 15 },

  historyTitleRow: { marginBottom: 2 },
  clearButton: { alignSelf: 'flex-start', paddingHorizontal: 14, paddingVertical: 10, borderRadius: 15, backgroundColor: C.panel, borderWidth: 1, borderColor: C.line, marginTop: -5, marginBottom: 4 },
  clearButtonText: { color: C.accent, fontSize: 12.5, fontWeight: '800' },
  historyList: { marginTop: 12 },

  playerHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 },
  backCircle: { width: 42, height: 42, borderRadius: 21, backgroundColor: C.panel, borderWidth: 1, borderColor: C.line, alignItems: 'center', justifyContent: 'center' },
  backCircleText: { color: C.text, fontSize: 25, lineHeight: 28 },
  playerHeaderKicker: { color: C.accent, fontSize: 9.5, letterSpacing: 1.5, fontWeight: '900' },
  playerHeaderTitle: { color: C.text, fontSize: 13, fontWeight: '800', marginTop: 3 },
  playerGlowA: { position: 'absolute', width: 260, height: 260, borderRadius: 130, backgroundColor: '#8D3DFF25', top: 55, left: -100 },
  playerGlowB: { position: 'absolute', width: 220, height: 220, borderRadius: 110, backgroundColor: '#274BFF18', top: 120, right: -100 },
  playerArt: { alignItems: 'center', marginTop: 18, marginBottom: 28 },
  playerTitle: { color: C.text, fontWeight: '900', fontSize: 27, lineHeight: 33, textAlign: 'center', paddingHorizontal: 8 },
  playerArtist: { color: C.muted, fontSize: 15, textAlign: 'center', marginTop: 8 },
  progressArea: { marginTop: 32 },
  progress: { height: 5, backgroundColor: '#FFFFFF16', borderRadius: 3, overflow: 'hidden' },
  progressFill: { backgroundColor: C.accent, height: 5, borderRadius: 3 },
  progressLabels: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 },
  progressTime: { color: C.faint, fontSize: 11.5 },
  playerControls: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginVertical: 27 },
  secondaryControl: { width: 42, height: 42, alignItems: 'center', justifyContent: 'center' },
  secondaryControlText: { color: C.muted, fontSize: 24, fontWeight: '800' },
  skipControl: { width: 52, height: 52, alignItems: 'center', justifyContent: 'center' },
  skipControlText: { color: C.text, fontSize: 21, fontWeight: '900' },
  mainPlayControl: { width: 76, height: 76, borderRadius: 38, backgroundColor: C.accent, alignItems: 'center', justifyContent: 'center', shadowColor: C.accent, shadowOpacity: 0.35, shadowRadius: 22, elevation: 8 },
  mainPlayText: { color: C.bg, fontSize: 27, fontWeight: '900', marginLeft: 2 },
  likeNowPlaying: { alignSelf: 'center', flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 16, paddingVertical: 10, borderRadius: 18, backgroundColor: C.panel, borderWidth: 1, borderColor: C.line },
  likeNowPlayingIcon: { color: C.muted, fontSize: 20 },
  likeNowPlayingText: { color: C.text, fontSize: 12.5, fontWeight: '800' },
  queueLine: { minHeight: 66, flexDirection: 'row', alignItems: 'center', gap: 7, paddingVertical: 8, paddingHorizontal: 8, borderRadius: 14, marginBottom: 4 },
  queueLineActive: { backgroundColor: C.accentSoft },
  queueIndex: { color: C.faint, width: 26, textAlign: 'center', fontSize: 12.5, fontWeight: '700' },
  queueTitle: { color: C.text, fontSize: 13.5, fontWeight: '800' },
  queueArtist: { color: C.muted, fontSize: 11.5, marginTop: 3 },
  smallControl: { color: C.accent, fontSize: 18, paddingHorizontal: 5, paddingVertical: 6 },

  settingsCard: { backgroundColor: C.panel, borderRadius: 22, borderWidth: 1, borderColor: C.line, padding: 16 },
  settingsLabel: { color: C.accent, fontSize: 10.5, fontWeight: '900', letterSpacing: 1.5, marginBottom: 10 },
  settingsInput: { minHeight: 54, borderRadius: 17, backgroundColor: C.bgRaised, borderWidth: 1, borderColor: C.line, color: C.text, paddingHorizontal: 15, fontSize: 15 },
  aboutCard: { backgroundColor: C.panel, borderRadius: 22, borderWidth: 1, borderColor: C.line, padding: 17 },
  body: { color: C.muted, fontSize: 13.5, lineHeight: 21 },
  aboutDivider: { height: 1, backgroundColor: C.line, marginVertical: 15 },
  linkStack: { marginTop: 14 },

  action: { alignSelf: 'flex-start', minHeight: 46, justifyContent: 'center', backgroundColor: C.panel, borderColor: C.line, borderWidth: 1, paddingHorizontal: 16, borderRadius: 15, marginBottom: 8 },
  actionWide: { alignSelf: 'stretch', alignItems: 'center' },
  actionActive: { backgroundColor: C.accent, borderColor: C.accent },
  actionDanger: { backgroundColor: '#3A1723', borderColor: '#FF7A9B44' },
  actionText: { color: C.text, fontSize: 13.5, fontWeight: '800' },
  actionTextActive: { color: C.bg },
  actionTextDanger: { color: C.danger },

  miniPlayerShell: { position: 'absolute', left: 14, right: 14, bottom: 76, minHeight: 68, flexDirection: 'row', alignItems: 'center', backgroundColor: '#19172EF4', borderRadius: 21, borderWidth: 1, borderColor: '#9D7CFF55', paddingHorizontal: 10, overflow: 'hidden', shadowColor: '#000', shadowOpacity: 0.28, shadowRadius: 14, elevation: 9 },
  miniProgress: { position: 'absolute', left: 0, right: 0, top: 0, height: 2, backgroundColor: '#FFFFFF12' },
  miniProgressFill: { height: 2, backgroundColor: C.accent },
  miniPlayerMain: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 11, paddingVertical: 9 },
  miniTitle: { color: C.text, fontSize: 13.5, fontWeight: '800' },
  miniArtist: { color: C.muted, fontSize: 11.5, marginTop: 3 },
  miniControl: { width: 42, height: 52, alignItems: 'center', justifyContent: 'center' },
  miniControlText: { color: C.text, fontSize: 18, fontWeight: '900' },
  miniHeart: { color: C.muted, fontSize: 22 },

  tabbar: { height: 70, flexDirection: 'row', alignItems: 'stretch', borderTopWidth: 1, borderTopColor: C.line, backgroundColor: '#090A16F8', paddingHorizontal: 4 },
  tab: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 3, position: 'relative' },
  tabIcon: { color: C.faint, fontSize: 20, fontWeight: '800' },
  tabIconActive: { color: C.accent },
  tabLabel: { color: C.faint, fontSize: 10.5, fontWeight: '700' },
  tabLabelActive: { color: C.accent, fontWeight: '900' },
  tabIndicator: { position: 'absolute', bottom: 3, width: 32, height: 3, borderRadius: 2, backgroundColor: C.accent },

  errorBanner: { marginHorizontal: 14, marginBottom: 6, backgroundColor: '#3B1625', borderRadius: 14, borderWidth: 1, borderColor: '#FF7A9B44', paddingHorizontal: 13, minHeight: 46, flexDirection: 'row', alignItems: 'center', gap: 10 },
  errorText: { flex: 1, color: '#FFD6E0', fontSize: 12.5, lineHeight: 17 },
  errorClose: { color: '#FFD6E0', fontSize: 20 },

  overlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: '#000000A8' },
  sheet: { backgroundColor: '#111120', borderTopLeftRadius: 30, borderTopRightRadius: 30, paddingHorizontal: 22, paddingTop: 10, paddingBottom: 28, maxHeight: '85%', borderTopWidth: 1, borderColor: C.lineStrong },
  sheetHandle: { width: 42, height: 4, borderRadius: 2, backgroundColor: '#FFFFFF32', alignSelf: 'center', marginBottom: 18 },
  sheetTrackHeader: { flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 18 },
  sheetTitle: { color: C.text, fontSize: 19, lineHeight: 24, fontWeight: '900' },
  sheetSubtitle: { color: C.muted, fontSize: 13, marginTop: 4 },
  sheetActions: { gap: 2 },
});
