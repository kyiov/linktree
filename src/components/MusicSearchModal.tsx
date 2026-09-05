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
  source?: 'preset' | 'search' | 'custom';
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
  const [activeTab, setActiveTab] = useState<'search' | 'presets' | 'custom'>('search');
  const [query, setQuery] = useState('');
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchResults, setSearchResults] = useState<Track[]>([]);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [loadingTrackId, setLoadingTrackId] = useState<string | null>(null);

  const [customUrl, setCustomUrl] = useState('');
  const [customTitle, setCustomTitle] = useState('');
  const [customArtist, setCustomArtist] = useState('');

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
      if (!res.ok) throw new Error('Layanan pencarian tidak merespons');

      const data = await res.json();
      if (!data.success || !Array.isArray(data.results) || data.results.length === 0) {
        setSearchResults([]);
        setSearchError('Lagu tidak ditemukan. Coba judul lain atau gunakan tab URL/Preset.');
        return;
      }

      setSearchResults(data.results);
    } catch {
      setSearchError('Gagal memuat hasil pencarian. Periksa koneksi Anda.');
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
      if (track.audioUrl) {
        saveTrackToLocalStorage(track);
        await onSelectTrack(track);
        playCopySuccess();
        onClose();
        return;
      }

      const res = await fetch(`/api/music/play?id=${encodeURIComponent(track.id)}`);
      if (!res.ok) throw new Error('Audio belum dapat dimuat saat ini');

      const data = await res.json();
      if (!data || !data.downloadUrl) throw new Error('Audio tidak dapat diakses');

      const resolvedTrack: Track = {
        ...track,
        audioUrl: data.downloadUrl,
        duration: data.duration || track.duration,
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

  const handleCustomSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const url = customUrl.trim();
    if (!url) return;

    playTactileClick();
    const newTrack: Track = {
      id: `custom-${Date.now()}`,
      title: customTitle.trim() || 'Custom Audio',
      artist: customArtist.trim() || 'Audio URL',
      audioUrl: url,
      source: 'custom',
      thumbnail: '/avatar.jpg',
    };

    saveTrackToLocalStorage(newTrack);
    await onSelectTrack(newTrack);
    playCopySuccess();
    onClose();
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
            <h2 className="text-white text-sm font-semibold tracking-tight">Pencarian Musik Lengkap</h2>
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

        <div className="px-4 pt-3 pb-2 border-b border-white/10 bg-black/10 flex gap-2">
          <button
            type="button"
            onClick={() => {
              playTactileClick();
              setActiveTab('search');
            }}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
              activeTab === 'search'
                ? 'bg-[#fcd34d] text-black shadow'
                : 'bg-white/5 text-white/70 hover:text-white hover:bg-white/10'
            }`}
          >
            Cari Lagu
          </button>
          <button
            type="button"
            onClick={() => {
              playTactileClick();
              setActiveTab('presets');
            }}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
              activeTab === 'presets'
                ? 'bg-[#fcd34d] text-black shadow'
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
                ? 'bg-[#fcd34d] text-black shadow'
                : 'bg-white/5 text-white/70 hover:text-white hover:bg-white/10'
            }`}
          >
            URL MP3
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
                  placeholder="Ketik judul lagu lengkap atau artis..."
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
                  <span className="w-5 h-5 border-2 border-white/20 border-t-[#fcd34d] rounded-full animate-spin" />
                  <span>Mencari lagu full length dari awal...</span>
                </div>
              )}

              {!searchLoading && searchResults.length > 0 && (
                <div className="space-y-1.5 text-left">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-[11px] text-white/40 font-mono">Hasil Pencarian (Lagu Penuh dari 00:00):</p>
                    <span className="text-[10px] text-emerald-400 font-mono">Full Audio</span>
                  </div>
                  {searchResults.map((item) => (
                    <div
                      key={item.id}
                      onClick={() => handleSearchTrackClick(item)}
                      className="group flex items-center gap-3 p-2 rounded-xl border border-white/5 bg-white/[0.02] hover:bg-white/[0.08] cursor-pointer transition-colors"
                    >
                      <img
                        src={item.thumbnail || '/avatar.jpg'}
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
                            Putar
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {!searchLoading && searchResults.length === 0 && (
                <div className="py-8 text-center text-white/40 text-xs">
                  <p>Ketik judul lagu untuk mencari musik lengkap.</p>
                  <p className="text-[10px] text-white/30 mt-1 font-mono">Semua lagu dimulai dari detik 00:00 intro hingga akhir.</p>
                </div>
              )}
            </>
          )}

          {activeTab === 'presets' && (
            <div className="space-y-2 text-left">
              <p className="text-[11px] text-white/40 font-mono mb-2">Pilihan Lagu Utama (Full Length):</p>
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

          {activeTab === 'custom' && (
            <form onSubmit={handleCustomSubmit} className="space-y-3 text-left">
              <div className="p-3 bg-white/[0.03] border border-white/10 rounded-xl">
                <p className="text-xs text-white/80 font-medium">Putar Langsung dari Link Audio</p>
                <p className="text-[11px] text-white/45 mt-0.5 leading-relaxed">
                  Masukkan link langsung file audio (MP3, M4A, AAC) dari internet. Audio akan diputar penuh dari awal.
                </p>
              </div>

              <div>
                <label className="block text-[11px] text-white/60 mb-1 font-mono">URL File Audio (MP3/M4A):</label>
                <input
                  type="url"
                  required
                  value={customUrl}
                  onChange={(e) => setCustomUrl(e.target.value)}
                  placeholder="https://example.com/audio/song.mp3"
                  className="w-full px-3 py-2 bg-black/40 border border-white/15 focus:border-[#fcd34d] rounded-xl text-white text-xs focus:outline-none transition-all font-mono"
                />
              </div>

              <div>
                <label className="block text-[11px] text-white/60 mb-1 font-mono">Judul Lagu:</label>
                <input
                  type="text"
                  value={customTitle}
                  onChange={(e) => setCustomTitle(e.target.value)}
                  placeholder="Judul lagu pilihan Anda"
                  className="w-full px-3 py-2 bg-black/40 border border-white/15 focus:border-[#fcd34d] rounded-xl text-white text-xs focus:outline-none transition-all"
                />
              </div>

              <div>
                <label className="block text-[11px] text-white/60 mb-1 font-mono">Artis (Opsional):</label>
                <input
                  type="text"
                  value={customArtist}
                  onChange={(e) => setCustomArtist(e.target.value)}
                  placeholder="Nama artis atau kreator"
                  className="w-full px-3 py-2 bg-black/40 border border-white/15 focus:border-[#fcd34d] rounded-xl text-white text-xs focus:outline-none transition-all"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2 bg-[#fcd34d] hover:bg-[#fbbf24] text-black font-semibold text-xs rounded-xl transition-colors cursor-pointer"
              >
                Simpan & Putar
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
