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
    id: 'theme-sunset-ae86',
    title: 'Twilight Sunset Drive',
    artist: 'Initial D • AE86 Sunset Chill',
    duration: 172,
    audioUrl: '/audio/initial-d-lofi.mp3',
    thumbnail: '/avatar.jpg',
    description: 'Nuansa santai berkendara saat senja bersama AE86',
  },
  {
    id: 'theme-deja-vu',
    title: 'Deja Vu',
    artist: 'Dave Rodgers • Initial D Original',
    duration: 263,
    audioUrl: '/audio/initial-d-eurobeat.mp3',
    thumbnail: '/avatar.jpg',
    description: 'Tema legendaris Initial D Eurobeat',
  }
];
