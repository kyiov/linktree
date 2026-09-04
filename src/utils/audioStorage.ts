import { Track } from '../components/MusicSearchModal';

const STORAGE_KEY = 'muhar_music_track';
const DB_NAME = 'muhar_audio_db';
const STORE_NAME = 'audio_files';
const DB_VERSION = 1;

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      reject(new Error('IndexedDB not supported'));
      return;
    }

    const request = window.indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function saveAudioBlobToDB(blob: Blob, key: string = 'active_audio'): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    const req = store.put(blob, key);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

export async function getAudioBlobFromDB(key: string = 'active_audio'): Promise<Blob | null> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const req = store.get(key);
      req.onsuccess = () => resolve(req.result || null);
      req.onerror = () => reject(req.error);
    });
  } catch {
    return null;
  }
}

export async function clearAudioBlobFromDB(key: string = 'active_audio'): Promise<void> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const req = store.delete(key);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch {}
}

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
    clearAudioBlobFromDB().catch(() => {});
  } catch (err) {
    console.warn('Failed to clear track from localStorage:', err);
  }
}

export const EVALUATED_THEME_TRACKS: Track[] = [
  {
    id: 'theme-daisy',
    title: 'Daisy',
    artist: 'STEREO DIVE FOUNDATION',
    duration: 275,
    audioUrl: '/audio/daisy-theme.mp3',
    thumbnail: 'https://raw.githubusercontent.com/kyiov/cdn/main/uploads/mtmumwdb.jpg',
    source: 'preset',
    description: 'Lagu tema resmi Kuriyama Mirai (Kyoukai no Kanata ED) • Sangat aesthetic & melodik',
  },
  {
    id: 'theme-sunset-ae86',
    title: 'Twilight Sunset Drive',
    artist: 'Initial D • AE86 Sunset Chill',
    duration: 172,
    audioUrl: '/audio/initial-d-lofi.mp3',
    thumbnail: '/avatar.jpg',
    source: 'preset',
    description: 'Nuansa santai berkendara saat senja bersama AE86 di pinggir danau',
  }
];
