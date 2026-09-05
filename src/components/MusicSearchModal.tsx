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
  spotifyId?: string;
  youtubeId?: string;
  source?: 'preset' | 'spotify' | 'youtube' | 'custom';
  description?: string;
  url?: string;
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
  const [activeTab, setActiveTab] = useState<'search' | 'presets' | 'custom'>('search');
  const [query, setQuery] = useState('');
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchResults, setSearchResults] = useState<Track[]>([]);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [resolvingTrackId, setResolvingTrackId] = useState<string | null>(null);

  const [customInput, setCustomInput] = useState('');
  const [customTitle, setCustomTitle] = useState('');
  const [customArtist, setCustomArtist] = useState('');
  const [customLoading, setCustomLoading] = useState(false);

  const searchInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => searchInputRef.current?.focus(), 60);
    }
  }, [isOpen, activeTab]);

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
      if (!res.ok) throw new Error('Gagal menghubungi layanan pencarian');

      const data = await res.json();
      if (!data.success || !Array.isArray(data.results) || data.results.length === 0) {
        setSearchResults([]);
        setSearchError('Lagu tidak ditemukan di Spotify. Coba kata kunci judul lain atau tempel tautan Spotify.');
        return;
      }

      setSearchResults(data.results);
    } catch {
      setSearchError('Gagal memuat pencarian Spotify. Periksa koneksi internet Anda.');
    } finally {
      setSearchLoading(false);
    }
  };

  const handleSelectTrack = async (track: Track) => {
    playTactileClick();

    if (track.audioUrl) {
      saveTrackToLocalStorage(track);
      await onSelectTrack(track);
      playCopySuccess();
      onClose();
      return;
    }

    setResolvingTrackId(track.id);
    setSearchError(null);

    try {
      const paramId = track.spotifyId || track.id;
      const paramQuery = track.url || `${track.title} ${track.artist}`;
      const res = await fetch(`/api/music/play?id=${encodeURIComponent(paramId)}&q=${encodeURIComponent(paramQuery)}`);
      if (!res.ok) throw new Error('Gagal memproses audio dari server');

      const data = await res.json();
      if (!data.success || !data.downloadUrl) {
        throw new Error(data.error || 'Tautan stream audio tidak ditemukan');
      }

      const fullTrack: Track = {
        ...track,
        audioUrl: data.downloadUrl,
        title: data.title || track.title,
        artist: data.artist || track.artist,
        thumbnail: data.cover || track.thumbnail,
        source: 'spotify',
      };

      saveTrackToLocalStorage(fullTrack);
      await onSelectTrack(fullTrack);
      playCopySuccess();
      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Gagal memutar lagu dari Spotify';
      setSearchError(msg);
    } finally {
      setResolvingTrackId(null);
    }
  };

  const handleCustomSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const raw = customInput.trim();
    if (!raw) return;

    playTactileClick();
    setCustomLoading(true);
    setSearchError(null);

    const isSpotify = /open\.spotify\.com\/(track|album|playlist)\/([a-zA-Z0-9]+)/i.test(raw);

    if (isSpotify) {
      try {
        const res = await fetch(`/api/music/play?q=${encodeURIComponent(raw)}`);
        const data = await res.json();
        if (data.success && data.downloadUrl) {
          const newTrack: Track = {
            id: `sp-${Date.now()}`,
            title: customTitle.trim() || data.title || 'Spotify Track',
            artist: customArtist.trim() || data.artist || 'Spotify Artist',
            audioUrl: data.downloadUrl,
            thumbnail: data.cover || '/avatar.jpg',
            source: 'spotify',
            url: data.url || raw,
          };
          saveTrackToLocalStorage(newTrack);
          await onSelectTrack(newTrack);
          playCopySuccess();
          onClose();
          return;
        }
      } catch {}
    }

    const newTrack: Track = {
      id: `custom-${Date.now()}`,
      title: customTitle.trim() || 'Audio Pilihan',
      artist: customArtist.trim() || 'Custom Source',
      audioUrl: raw,
      thumbnail: '/avatar.jpg',
      source: 'custom',
    };

    saveTrackToLocalStorage(newTrack);
    await onSelectTrack(newTrack);
    playCopySuccess();
    onClose();
    setCustomLoading(false);
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
        className="relative z-10 w-full max-w-[480px] max-h-[85vh] bg-[#140c11] border border-white/15 rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-fade-in"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-5 py-3.5 flex items-center justify-between border-b border-white/10 bg-black/30">
          <div className="flex items-center gap-2.5">
            <div className="w-6 h-6 rounded-full bg-[#1DB954]/20 text-[#1DB954] flex items-center justify-center">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z" />
              </svg>
            </div>
            <h2 className="text-white text-sm font-semibold tracking-tight">Spotify Play</h2>
            <span className="px-1.5 py-0.5 rounded text-[9px] font-semibold bg-[#1DB954]/20 text-[#1DB954] border border-[#1DB954]/30">KyioAPI</span>
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

        <div className="px-4 pt-3 pb-2 border-b border-white/10 bg-black/15 flex gap-2">
          <button
            type="button"
            onClick={() => {
              playTactileClick();
              setActiveTab('search');
            }}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
              activeTab === 'search'
                ? 'bg-[#1DB954] text-black font-semibold shadow'
                : 'bg-white/5 text-white/70 hover:text-white hover:bg-white/10'
            }`}
          >
            Cari Spotify
          </button>
          <button
            type="button"
            onClick={() => {
              playTactileClick();
              setActiveTab('presets');
            }}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
              activeTab === 'presets'
                ? 'bg-[#1DB954] text-black font-semibold shadow'
                : 'bg-white/5 text-white/70 hover:text-white hover:bg-white/10'
            }`}
          >
            Tema Pilihan
          </button>
          <button
            type="button"
            onClick={() => {
              playTactileClick();
              setActiveTab('custom');
            }}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
              activeTab === 'custom'
                ? 'bg-[#1DB954] text-black font-semibold shadow'
                : 'bg-white/5 text-white/70 hover:text-white hover:bg-white/10'
            }`}
          >
            Link / URL
          </button>
        </div>

        {activeTab === 'search' && (
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
                  placeholder="Cari lagu Spotify atau tempel link..."
                  className="w-full pl-9 pr-8 py-2 bg-black/50 border border-white/15 focus:border-[#1DB954] rounded-xl text-white text-xs focus:outline-none transition-all placeholder:text-white/35"
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
                className="px-4 py-2 bg-[#1DB954] hover:bg-[#1ed760] disabled:opacity-40 text-black font-semibold text-xs rounded-xl transition-colors cursor-pointer shrink-0"
              >
                {searchLoading ? (
                  <span className="w-3.5 h-3.5 border-2 border-black/30 border-t-black rounded-full animate-spin inline-block" />
                ) : (
                  'Cari'
                )}
              </button>
            </form>
          </div>
        )}

        <div className="flex-1 overflow-y-auto p-4 space-y-2 min-h-[220px] max-h-[50vh]">
          {searchError && (
            <div className="p-3 bg-rose-950/40 border border-rose-800/40 rounded-xl text-rose-300 text-xs text-left">
              {searchError}
            </div>
          )}

          {activeTab === 'search' && (
            <>
              {searchLoading && (
                <div className="py-12 flex flex-col items-center justify-center gap-2 text-white/50 text-xs">
                  <span className="w-5 h-5 border-2 border-white/20 border-t-[#1DB954] rounded-full animate-spin" />
                  <span>Mencari lagu di Spotify...</span>
                </div>
              )}

              {!searchLoading && searchResults.length > 0 && (
                <div className="space-y-1.5 text-left">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-[11px] text-white/40 font-mono">Daftar Lagu Spotify:</p>
                    <span className="text-[10px] text-[#1DB954] font-mono">Full Audio</span>
                  </div>
                  {searchResults.map((item) => {
                    const isResolving = resolvingTrackId === item.id;
                    return (
                      <div
                        key={item.id}
                        onClick={() => !isResolving && handleSelectTrack(item)}
                        className="group flex items-center gap-3 p-2 rounded-xl border border-white/5 bg-white/[0.02] hover:bg-white/[0.08] cursor-pointer transition-colors"
                      >
                        <img
                          src={item.thumbnail || '/avatar.jpg'}
                          alt={item.title}
                          className="w-10 h-10 rounded-lg object-cover bg-black/40 shrink-0"
                        />
                        <div className="flex-1 min-w-0">
                          <h4 className="text-xs font-medium text-white truncate group-hover:text-[#1DB954] transition-colors">
                            {item.title}
                          </h4>
                          <p className="text-[10px] text-white/50 truncate font-mono">
                            {item.artist} {item.duration ? `• ${formatDuration(item.duration)}` : ''}
                          </p>
                        </div>
                        <div className="shrink-0">
                          {isResolving ? (
                            <span className="px-2 py-1 rounded text-[10px] font-medium bg-[#1DB954]/20 text-[#1DB954] flex items-center gap-1.5">
                              <span className="w-2.5 h-2.5 border-2 border-[#1DB954]/30 border-t-[#1DB954] rounded-full animate-spin inline-block" />
                              Memuat...
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-[#1DB954]/20 text-[#1DB954] group-hover:bg-[#1DB954] group-hover:text-black transition-colors">
                              Putar
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {!searchLoading && searchResults.length === 0 && (
                <div className="py-8 text-center text-white/40 text-xs">
                  <p>Ketik judul lagu apa saja untuk mencari langsung di Spotify.</p>
                  <p className="text-[10px] text-white/30 mt-1 font-mono">Lagu diputar penuh dari detik 00:00 (intro) hingga selesai.</p>
                </div>
              )}
            </>
          )}

          {activeTab === 'presets' && (
            <div className="space-y-2 text-left">
              <p className="text-[11px] text-white/40 font-mono mb-2">Tema Pilihan (Full Length):</p>
              {EVALUATED_THEME_TRACKS.map((track) => {
                const isCurrent = currentTrack?.id === track.id;
                return (
                  <div
                    key={track.id}
                    onClick={() => handleSelectTrack(track)}
                    className={`group flex items-center gap-3 p-2.5 rounded-xl border transition-all cursor-pointer ${
                      isCurrent
                        ? 'bg-[#1DB954]/15 border-[#1DB954]/50 ring-1 ring-[#1DB954]/30'
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
                            <span className="w-0.5 bg-[#1DB954] rounded-full animate-[soundwave_0.7s_infinite]" />
                            <span className="w-0.5 bg-[#1DB954] rounded-full animate-[soundwave_0.5s_0.2s_infinite]" />
                            <span className="w-0.5 bg-[#1DB954] rounded-full animate-[soundwave_0.8s_0.4s_infinite]" />
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <h4 className={`text-xs font-medium truncate ${isCurrent ? 'text-[#1DB954]' : 'text-white group-hover:text-[#1DB954]'}`}>
                        {track.title}
                      </h4>
                      <p className="text-[10px] text-white/50 truncate font-mono">
                        {track.artist} {track.duration ? `• ${formatDuration(track.duration)}` : ''}
                      </p>
                    </div>

                    <div className="shrink-0">
                      <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-white/10 group-hover:bg-[#1DB954] text-white group-hover:text-black transition-colors">
                        {isCurrent ? 'Aktif' : 'Putar'}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {activeTab === 'custom' && (
            <form onSubmit={handleCustomSubmit} className="space-y-3 text-left">
              <div className="p-3 bg-white/[0.03] border border-white/10 rounded-xl">
                <p className="text-xs text-white/80 font-medium">Tempel Link Spotify atau Audio MP3</p>
                <p className="text-[11px] text-white/45 mt-0.5 leading-relaxed">
                  Masukkan tautan lagu Spotify (open.spotify.com/track/...) atau link langsung file MP3. Lagu diputar penuh dari awal.
                </p>
              </div>

              <div>
                <label className="block text-[11px] text-white/60 mb-1 font-mono">Link Spotify atau Audio:</label>
                <input
                  type="text"
                  required
                  value={customInput}
                  onChange={(e) => setCustomInput(e.target.value)}
                  placeholder="https://open.spotify.com/track/... atau file MP3"
                  className="w-full px-3 py-2 bg-black/40 border border-white/15 focus:border-[#1DB954] rounded-xl text-white text-xs focus:outline-none transition-all font-mono"
                />
              </div>

              <div>
                <label className="block text-[11px] text-white/60 mb-1 font-mono">Judul Lagu (Opsional):</label>
                <input
                  type="text"
                  value={customTitle}
                  onChange={(e) => setCustomTitle(e.target.value)}
                  placeholder="Judul lagu"
                  className="w-full px-3 py-2 bg-black/40 border border-white/15 focus:border-[#1DB954] rounded-xl text-white text-xs focus:outline-none transition-all"
                />
              </div>

              <div>
                <label className="block text-[11px] text-white/60 mb-1 font-mono">Artis (Opsional):</label>
                <input
                  type="text"
                  value={customArtist}
                  onChange={(e) => setCustomArtist(e.target.value)}
                  placeholder="Nama artis"
                  className="w-full px-3 py-2 bg-black/40 border border-white/15 focus:border-[#1DB954] rounded-xl text-white text-xs focus:outline-none transition-all"
                />
              </div>

              <button
                type="submit"
                disabled={customLoading}
                className="w-full py-2 bg-[#1DB954] hover:bg-[#1ed760] disabled:opacity-50 text-black font-semibold text-xs rounded-xl transition-colors cursor-pointer"
              >
                {customLoading ? 'Memproses...' : 'Simpan & Putar'}
              </button>
            </form>
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
