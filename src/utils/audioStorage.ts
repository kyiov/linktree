import { Track } from '../components/MusicSearchModal';

const STORAGE_KEY = 'muhar_music_track';

export function saveTrackToLocalStorage(track: Track): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(track));
  } catch (err) {
    console.warn('Failed to save track to localStorage:', err);
  }
}

export function getTrackFromLocalStorage(): Track | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as Track;
  } catch (err) {
    console.warn('Failed to parse track from localStorage:', err);
    return null;
  }
}

export function clearTrackFromLocalStorage(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (err) {
    console.warn('Failed to clear track from localStorage:', err);
  }
}

export const EVALUATED_THEME_TRACKS: Track[] = [
  {
    id: 'snowfall',
    title: 'snowfall',
    artist: 'Øneheart & reidenshi',
    duration: 125,
    audioUrl: '/audio/snowfall.mp3',
    youtubeId: 'LlN8MPS7KQs',
    thumbnail: 'https://i.ytimg.com/vi/LlN8MPS7KQs/hqdefault.jpg',
    description: 'Lagu tema utama snowfall • Atmospheric ambient',
    source: 'preset'
  },
  {
    id: 'theme-sunset-ae86',
    title: 'Twilight Sunset Drive',
    artist: 'Initial D • AE86 Sunset Chill',
    duration: 172,
    audioUrl: '/audio/initial-d-lofi.mp3',
    thumbnail: '/avatar.jpg',
    description: 'Nuansa santai berkendara saat senja bersama AE86',
    source: 'preset'
  },
  {
    id: 'theme-deja-vu',
    title: 'Deja Vu',
    artist: 'Dave Rodgers • Initial D Original',
    duration: 263,
    audioUrl: '/audio/initial-d-eurobeat.mp3',
    youtubeId: 'dvJ4zK3lPqI',
    thumbnail: '/avatar.jpg',
    description: 'Tema legendaris Initial D Eurobeat',
    source: 'preset'
  }
];
