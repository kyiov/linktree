import React, { useState, useEffect, useRef } from 'react';
import { playTactileClick, playCopySuccess } from '../utils/audio';
import {
  EVALUATED_THEME_TRACKS,
  saveTrackToLocalStorage,
  clearTrackFromLocalStorage,
} from '../utils/audioStorage';

export interface Track {
  id: string;
  title: string;
  artist: string;
  duration?: number;
  thumbnail?: string;
  audioUrl?: string;
  source?: 'preset' | 'search';
  description?: string;
}

interface MusicSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectTrack: (track: Track) => Promise<void> | void;
  onClearTrack?: () => void;
  currentTrack: Track | null;
  isPlaying: boolean;
}

function formatDuration(seconds?: number): string {
  if (!seconds || isNaN(seconds)) return '';
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export const MusicSearchModal: React.FC<MusicSearchModalProps> = ({
  isOpen,
  onClose,
  onSelectTrack,
  onClearTrack,
  currentTrack,
  isPlaying,
}) => {
  const [query, setQuery] = useState('');
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchResults, setSearchResults] = useState<Track[]>([]);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [loadingTrackId, setLoadingTrackId] = useState<string | null>(null);

  const searchInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => searchInputRef.current?.focus(), 60);
    }
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const performSearch = async (searchQuery: string) => {
    const trimmed = searchQuery.trim();
    if (!trimmed) return;

    setSearchLoading(true);
    setSearchError(null);

    try {
      const res = await fetch(`/api/music/search?q=${encodeURIComponent(trimmed)}`);
      if (!res.ok) {
        throw new Error('Gagal memuat hasil pencarian. Coba lagi beberapa saat.');
      }
      const data = await res.json();
      if (data.success && Array.isArray(data.results) && data.results.length > 0) {
        setSearchResults(data.results);
      } else {
        setSearchResults([]);
        setSearchError('Lagu tidak ditemukan. Coba kata kunci yang lain.');
      }
    } catch (err: any) {
      setSearchError(err?.message || 'Gagal terhubung ke layanan musik.');
    } finally {
      setSearchLoading(false);
    }
  };

  const handleSelectPreset = async (preset: Track) => {
    playTactileClick();
    saveTrackToLocalStorage(preset);
    await onSelectTrack(preset);
    playCopySuccess();
    onClose();
  };

  const handleSearchTrackClick = async (track: Track) => {
    playTactileClick();
    setLoadingTrackId(track.id);
    setSearchError(null);

    try {
      let data: any = null;
      try {
        const res = await fetch(`/api/music/play?id=${encodeURIComponent(track.id)}`);
        if (res.ok) {
          const json = await res.json();
          if (json.success && json.downloadUrl) {
            data = json;
          }
        }
      } catch {}

      if (!data) {
        const fb = await fetch(`https://uprising-nugget-dispatch.ngrok-free.dev/api/music/play?id=${encodeURIComponent(track.id)}`, {
          headers: { 'ngrok-skip-browser-warning': '1' }
        });
        if (fb.ok) {
          const json = await fb.json();
          if (json.success && json.downloadUrl) {
            data = json;
          }
        }
      }

      if (!data || !data.downloadUrl) {
        throw new Error('Audio tidak dapat diputar saat ini.');
      }

      const resolvedTrack: Track = {
        ...track,
        audioUrl: data.downloadUrl,
        source: 'search',
      };

      saveTrackToLocalStorage(resolvedTrack);
      await onSelectTrack(resolvedTrack);
      playCopySuccess();
      onClose();
    } catch (err: any) {
      setSearchError(err?.message || 'Gagal memutar trek.');
    } finally {
      setLoadingTrackId(null);
    }
  };

  const handleResetSong = () => {
    playTactileClick();
    clearTrackFromLocalStorage();
    onClearTrack?.();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-3.5 sm:p-6 select-none">
      <div
        className="absolute inset-0 bg-black/80 backdrop-blur-sm transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      <div
        className="relative z-10 w-full max-w-[480px] max-h-[85vh] bg-[#1c0e15] border border-white/15 rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-fade-in"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-5 py-3.5 flex items-center justify-between border-b border-white/10 bg-black/20">
          <div className="flex items-center gap-2.5">
            <div className="w-6 h-6 rounded-full bg-[#fcd34d]/15 text-[#fcd34d] flex items-center justify-center">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
            </div>
            <h2 className="text-white text-sm font-semibold tracking-tight">Pencarian Musik</h2>
          </div>

          <button
            type="button"
            onClick={() => {
              playTactileClick();
              onClose();
            }}
            aria-label="Tutup"
            className="w-7 h-7 rounded-full bg-white/5 hover:bg-white/15 text-white/60 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <div className="p-4 border-b border-white/10 bg-black/10">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              playTactileClick();
              performSearch(query);
            }}
            className="flex gap-2"
          >
            <div className="relative flex-1">
              <input
                ref={searchInputRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Cari lagu atau artis..."
                className="w-full pl-9 pr-8 py-2 bg-black/50 border border-white/15 focus:border-[#fcd34d] rounded-xl text-white text-xs focus:outline-none transition-all placeholder:text-white/35"
              />
              <div className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40 pointer-events-none">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="11" cy="11" r="8" />
                  <line x1="21" y1="21" x2="16.65" y2="16.65" />
                </svg>
              </div>
              {query && (
                <button
                  type="button"
                  onClick={() => setQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-white/40 hover:text-white cursor-pointer"
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
              )}
            </div>

            <button
              type="submit"
              disabled={searchLoading || !query.trim()}
              className="px-4 py-2 bg-[#fcd34d] hover:bg-[#fbbf24] disabled:opacity-40 text-black font-semibold text-xs rounded-xl transition-colors cursor-pointer shrink-0"
            >
              {searchLoading ? (
                <span className="w-3.5 h-3.5 border-2 border-black/30 border-t-black rounded-full animate-spin inline-block" />
              ) : (
                'Cari'
              )}
            </button>
          </form>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-2 min-h-[220px] max-h-[50vh]">
          {searchError && (
            <div className="p-3 bg-rose-950/40 border border-rose-800/40 rounded-xl text-rose-300 text-xs text-left">
              {searchError}
            </div>
          )}

          {searchLoading && (
            <div className="py-12 flex flex-col items-center justify-center gap-2 text-white/50 text-xs">
              <span className="w-5 h-5 border-2 border-white/20 border-t-[#fcd34d] rounded-full animate-spin" />
              <span>Mencari lagu di YouTube Music...</span>
            </div>
          )}

          {!searchLoading && searchResults.length > 0 && (
            <div className="space-y-1.5 text-left">
              <p className="text-[11px] text-white/40 font-mono mb-2">Hasil Pencarian:</p>
              {searchResults.map((item) => (
                <div
                  key={item.id}
                  onClick={() => handleSearchTrackClick(item)}
                  className="group flex items-center gap-3 p-2 rounded-xl border border-white/5 bg-white/[0.02] hover:bg-white/[0.08] cursor-pointer transition-colors"
                >
                  <img
                    src={item.thumbnail}
                    alt={item.title}
                    className="w-10 h-10 rounded-lg object-cover bg-black/40 shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <h4 className="text-xs font-medium text-white truncate group-hover:text-[#fcd34d] transition-colors">
                      {item.title}
                    </h4>
                    <p className="text-[10px] text-white/50 truncate font-mono">
                      {item.artist} {item.duration ? `• ${formatDuration(item.duration)}` : ''}
                    </p>
                  </div>
                  <div className="shrink-0">
                    {loadingTrackId === item.id ? (
                      <span className="w-3.5 h-3.5 border-2 border-white/20 border-t-[#fcd34d] rounded-full animate-spin inline-block" />
                    ) : (
                      <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-[#fcd34d]/15 text-[#fcd34d] group-hover:bg-[#fcd34d] group-hover:text-black transition-colors">
                        Pilih
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {!searchLoading && searchResults.length === 0 && (
            <div className="space-y-2 text-left">
              <p className="text-[11px] text-white/40 font-mono mb-2">Lagu Evaluasi Tema:</p>
              {EVALUATED_THEME_TRACKS.map((track) => {
                const isCurrent = currentTrack?.id === track.id;
                return (
                  <div
                    key={track.id}
                    onClick={() => handleSelectPreset(track)}
                    className={`group flex items-center gap-3 p-2.5 rounded-xl border transition-all cursor-pointer ${
                      isCurrent
                        ? 'bg-[#fcd34d]/10 border-[#fcd34d]/50 ring-1 ring-[#fcd34d]/30'
                        : 'bg-white/[0.02] hover:bg-white/[0.07] border-white/10 hover:border-white/20'
                    }`}
                  >
                    <div className="relative w-10 h-10 rounded-lg overflow-hidden shrink-0 bg-black/40">
                      <img
                        src={track.thumbnail}
                        alt={track.title}
                        className="w-full h-full object-cover"
                      />
                      {isCurrent && isPlaying && (
                        <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                          <span className="flex items-end gap-[2px] h-3">
                            <span className="w-0.5 bg-[#fcd34d] rounded-full animate-[soundwave_0.7s_infinite]" />
                            <span className="w-0.5 bg-[#fcd34d] rounded-full animate-[soundwave_0.5s_0.2s_infinite]" />
                            <span className="w-0.5 bg-[#fcd34d] rounded-full animate-[soundwave_0.8s_0.4s_infinite]" />
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <h4 className={`text-xs font-medium truncate ${isCurrent ? 'text-[#fcd34d]' : 'text-white group-hover:text-[#fcd34d]'}`}>
                        {track.title}
                      </h4>
                      <p className="text-[10px] text-white/50 truncate font-mono">
                        {track.artist} {track.duration ? `• ${formatDuration(track.duration)}` : ''}
                      </p>
                    </div>

                    <div className="shrink-0">
                      <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-white/10 group-hover:bg-[#fcd34d] text-white group-hover:text-black transition-colors">
                        {isCurrent ? 'Aktif' : 'Putar'}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="px-4 py-2.5 border-t border-white/10 bg-black/30 flex items-center justify-between text-xs">
          <div className="flex items-center gap-1.5 truncate pr-2">
            <span className="text-[10px] text-white/40">Lagu aktif:</span>
            <span className="text-[11px] text-white/80 font-medium truncate max-w-[200px]">
              {currentTrack ? currentTrack.title : 'Belum dipilih'}
            </span>
          </div>

          {currentTrack && (
            <button
              type="button"
              onClick={handleResetSong}
              className="text-[10px] text-rose-400 hover:text-rose-300 transition-colors cursor-pointer shrink-0 font-medium"
            >
              Reset Lagu
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
