import React, { useState, useEffect, useRef } from 'react';
import { playTactileClick, playCopySuccess } from '../utils/audio';
import {
  EVALUATED_THEME_TRACKS,
  saveTrackToLocalStorage,
  clearTrackFromLocalStorage,
  saveAudioBlobToDB,
} from '../utils/audioStorage';

export interface Track {
  id: string;
  title: string;
  artist: string;
  duration?: number;
  thumbnail?: string;
  audioUrl?: string;
  source?: 'preset' | 'custom_url' | 'local_file' | 'search';
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
  const [activeTab, setActiveTab] = useState<'theme' | 'url' | 'file' | 'search'>('theme');

  const [customUrl, setCustomUrl] = useState('');
  const [customTitle, setCustomTitle] = useState('');
  const [customArtist, setCustomArtist] = useState('');
  const [urlError, setUrlError] = useState<string | null>(null);

  const [fileName, setFileName] = useState<string | null>(null);
  const [fileLoading, setFileLoading] = useState(false);

  const [query, setQuery] = useState('');
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchResults, setSearchResults] = useState<Track[]>([]);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [loadingTrackId, setLoadingTrackId] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const searchInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (isOpen && activeTab === 'search') {
      setTimeout(() => searchInputRef.current?.focus(), 80);
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

  const handleSelectPreset = async (preset: Track) => {
    playTactileClick();
    saveTrackToLocalStorage(preset);
    await onSelectTrack(preset);
    playCopySuccess();
    onClose();
  };

  const handleCustomUrlSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setUrlError(null);

    const trimmed = customUrl.trim();
    if (!trimmed) {
      setUrlError('Masukkan tautan URL file audio yang valid.');
      return;
    }

    if (!trimmed.startsWith('http://') && !trimmed.startsWith('https://') && !trimmed.startsWith('/')) {
      setUrlError('URL harus diawali dengan http:// atau https://');
      return;
    }

    playTactileClick();

    let inferredTitle = customTitle.trim();
    if (!inferredTitle) {
      try {
        const pathname = new URL(trimmed).pathname;
        const lastPart = pathname.split('/').pop() || 'Custom Audio';
        inferredTitle = decodeURIComponent(lastPart).replace(/\.[^/.]+$/, '');
      } catch {
        inferredTitle = 'Custom Stream';
      }
    }

    const newTrack: Track = {
      id: `custom-url-${Date.now()}`,
      title: inferredTitle,
      artist: customArtist.trim() || 'Custom Audio Link',
      audioUrl: trimmed,
      source: 'custom_url',
      thumbnail: '/avatar.jpg',
    };

    saveTrackToLocalStorage(newTrack);
    await onSelectTrack(newTrack);
    playCopySuccess();
    onClose();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    playTactileClick();
    setFileLoading(true);
    setFileName(file.name);

    try {
      await saveAudioBlobToDB(file, 'active_audio');
      const objectUrl = URL.createObjectURL(file);

      const newTrack: Track = {
        id: `local-file-${Date.now()}`,
        title: file.name.replace(/\.[^/.]+$/, ''),
        artist: 'File Audio Lokal',
        audioUrl: objectUrl,
        source: 'local_file',
        thumbnail: '/avatar.jpg',
      };

      saveTrackToLocalStorage(newTrack);
      await onSelectTrack(newTrack);
      playCopySuccess();
      onClose();
    } catch (err: any) {
      console.error('Failed to process audio file:', err);
    } finally {
      setFileLoading(false);
    }
  };

  const performSearch = async (searchQuery: string) => {
    if (!searchQuery.trim()) return;
    setSearchLoading(true);
    setSearchError(null);
    try {
      const res = await fetch(`/api/music/search?q=${encodeURIComponent(searchQuery.trim())}`);
      if (!res.ok) {
        throw new Error('Pencarian online memerlukan server lokal. Di Netlify, gunakan tab Lagu Tema atau Masukkan URL.');
      }
      const data = await res.json();
      if (data.success && Array.isArray(data.results)) {
        setSearchResults(data.results);
      } else {
        setSearchError('Lagu tidak ditemukan. Coba kata kunci lain.');
      }
    } catch (err: any) {
      setSearchError(err?.message || 'Gagal terhubung ke API pencarian.');
    } finally {
      setSearchLoading(false);
    }
  };

  const handleSearchTrackClick = async (track: Track) => {
    playTactileClick();
    setLoadingTrackId(track.id);
    setSearchError(null);
    try {
      const res = await fetch(`/api/music/play?id=${encodeURIComponent(track.id)}`);
      const data = await res.json();
      if (!data.success || !data.downloadUrl) {
        throw new Error(data.error || 'Gagal memproses audio');
      }

      const streamUrl = `/api/music/stream?url=${encodeURIComponent(data.downloadUrl)}`;
      const resolvedTrack: Track = {
        ...track,
        audioUrl: streamUrl,
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
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-3.5 sm:p-6 select-none animate-fade-in">
      <div
        className="absolute inset-0 bg-black/85 backdrop-blur-md"
        onClick={onClose}
        aria-hidden="true"
      />

      <div
        className="relative z-10 w-full max-w-[500px] max-h-[88vh] bg-[#1a0c14] border border-white/15 rounded-2xl shadow-[0_24px_70px_rgba(0,0,0,0.95)] flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-5 pt-4 pb-3 flex items-center justify-between border-b border-white/10">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-full bg-[#fcd34d]/15 text-[#fcd34d] flex items-center justify-center shrink-0">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 18V5l12-2v13" />
                <circle cx="6" cy="18" r="3" />
                <circle cx="18" cy="16" r="3" />
              </svg>
            </div>
            <div>
              <h2 className="text-white text-[15px] font-semibold tracking-tight">Pengaturan Musik</h2>
              <p className="text-[10px] text-white/45 font-mono">Tersimpan di LocalStorage • Siap Netlify</p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              playTactileClick();
              onClose();
            }}
            aria-label="Tutup modal"
            className="w-7 h-7 rounded-full bg-white/5 hover:bg-white/15 text-white/60 hover:text-white flex items-center justify-center transition-colors text-xs"
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <div className="flex items-center px-4 pt-3 pb-1 gap-1.5 border-b border-white/5 overflow-x-auto text-xs font-medium">
          <button
            type="button"
            onClick={() => {
              playTactileClick();
              setActiveTab('theme');
            }}
            className={`px-3 py-1.5 rounded-lg transition-all shrink-0 flex items-center gap-1.5 ${
              activeTab === 'theme'
                ? 'bg-[#fcd34d] text-black font-semibold shadow-sm'
                : 'text-white/60 hover:text-white hover:bg-white/5'
            }`}
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <circle cx="12" cy="12" r="10" />
              <polygon points="10 8 16 12 10 16 10 8" />
            </svg>
            <span>Lagu Tema</span>
          </button>

          <button
            type="button"
            onClick={() => {
              playTactileClick();
              setActiveTab('url');
            }}
            className={`px-3 py-1.5 rounded-lg transition-all shrink-0 flex items-center gap-1.5 ${
              activeTab === 'url'
                ? 'bg-[#fcd34d] text-black font-semibold shadow-sm'
                : 'text-white/60 hover:text-white hover:bg-white/5'
            }`}
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
              <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
            </svg>
            <span>URL Audio</span>
          </button>

          <button
            type="button"
            onClick={() => {
              playTactileClick();
              setActiveTab('file');
            }}
            className={`px-3 py-1.5 rounded-lg transition-all shrink-0 flex items-center gap-1.5 ${
              activeTab === 'file'
                ? 'bg-[#fcd34d] text-black font-semibold shadow-sm'
                : 'text-white/60 hover:text-white hover:bg-white/5'
            }`}
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="17 8 12 3 7 8" />
              <line x1="12" y1="3" x2="12" y2="15" />
            </svg>
            <span>File Lokal</span>
          </button>

          <button
            type="button"
            onClick={() => {
              playTactileClick();
              setActiveTab('search');
            }}
            className={`px-3 py-1.5 rounded-lg transition-all shrink-0 flex items-center gap-1.5 ${
              activeTab === 'search'
                ? 'bg-[#fcd34d] text-black font-semibold shadow-sm'
                : 'text-white/60 hover:text-white hover:bg-white/5'
            }`}
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <span>Cari Online</span>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-[220px] max-h-[50vh]">
          {activeTab === 'theme' && (
            <div className="space-y-3 animate-fade-in">
              <div className="p-3 bg-white/[0.03] border border-white/10 rounded-xl text-left">
                <p className="text-xs text-white/80 font-medium">Lagu Selaras dengan Tema Visual</p>
                <p className="text-[11px] text-white/45 mt-0.5 leading-relaxed">
                  Lagu-lagu di bawah telah dievaluasi agar cocok dengan karakter <b>Kuriyama Mirai</b> & mobil <b>AE86 senja</b>. File audio tersimpan secara statis di folder lokal sehingga <b>100% dapat diputar di Netlify</b>.
                </p>
              </div>

              <div className="space-y-2">
                {EVALUATED_THEME_TRACKS.map((track) => {
                  const isCurrent = currentTrack?.id === track.id;
                  return (
                    <div
                      key={track.id}
                      onClick={() => handleSelectPreset(track)}
                      className={`group flex items-center gap-3 p-3 rounded-xl border transition-all cursor-pointer ${
                        isCurrent
                          ? 'bg-[#fcd34d]/10 border-[#fcd34d]/50 ring-1 ring-[#fcd34d]/30'
                          : 'bg-white/[0.02] hover:bg-white/[0.07] border-white/10 hover:border-white/20'
                      }`}
                    >
                      <div className="relative w-12 h-12 rounded-lg overflow-hidden shrink-0 bg-black/40 border border-white/10">
                        <img
                          src={track.thumbnail}
                          alt={track.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform"
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

                      <div className="flex-1 min-w-0 text-left">
                        <div className="flex items-center gap-2">
                          <h3 className={`text-xs font-semibold truncate ${isCurrent ? 'text-[#fcd34d]' : 'text-white'}`}>
                            {track.title}
                          </h3>
                          <span className="text-[9px] px-1.5 py-0.2 rounded font-mono font-medium uppercase bg-[#fcd34d]/15 text-[#fcd34d] border border-[#fcd34d]/30 shrink-0">
                            Tema
                          </span>
                        </div>
                        <p className="text-[10px] text-white/50 truncate font-mono mt-0.5">
                          {track.artist} {track.duration ? `• ${formatDuration(track.duration)}` : ''}
                        </p>
                        {track.description && (
                          <p className="text-[10px] text-white/40 truncate mt-1">
                            {track.description}
                          </p>
                        )}
                      </div>

                      <div className="shrink-0">
                        <span className="px-2.5 py-1 rounded-lg text-[10px] font-medium transition-colors bg-white/10 group-hover:bg-[#fcd34d] text-white group-hover:text-black">
                          {isCurrent ? 'Terpilih' : 'Pilih'}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {activeTab === 'url' && (
            <form onSubmit={handleCustomUrlSubmit} className="space-y-3 animate-fade-in text-left">
              <div className="p-3 bg-white/[0.03] border border-white/10 rounded-xl">
                <p className="text-xs text-white/80 font-medium">Gunakan Tautan Audio Langsung</p>
                <p className="text-[11px] text-white/45 mt-0.5 leading-relaxed">
                  Masukkan URL langsung ke file audio (MP3/WAV/M4A) dari server Anda, GitHub Raw, Catbox, atau Discord CDN. Disimpan ke <b>LocalStorage</b> dan berjalan lancar di Netlify.
                </p>
              </div>

              {urlError && (
                <div className="p-2.5 bg-rose-950/40 border border-rose-800/50 rounded-xl text-rose-300 text-xs">
                  {urlError}
                </div>
              )}

              <div className="space-y-2">
                <div>
                  <label className="block text-[11px] text-white/60 mb-1 font-mono">URL File Audio (Wajib):</label>
                  <input
                    type="url"
                    value={customUrl}
                    onChange={(e) => setCustomUrl(e.target.value)}
                    placeholder="https://example.com/audio/music.mp3"
                    className="w-full px-3 py-2 bg-black/40 border border-white/15 focus:border-[#fcd34d] rounded-xl text-white text-xs focus:outline-none transition-all font-mono"
                  />
                </div>

                <div>
                  <label className="block text-[11px] text-white/60 mb-1 font-mono">Judul Lagu (Opsional):</label>
                  <input
                    type="text"
                    value={customTitle}
                    onChange={(e) => setCustomTitle(e.target.value)}
                    placeholder="Contoh: My Sunset Soundtrack"
                    className="w-full px-3 py-2 bg-black/40 border border-white/15 focus:border-[#fcd34d] rounded-xl text-white text-xs focus:outline-none transition-all"
                  />
                </div>

                <div>
                  <label className="block text-[11px] text-white/60 mb-1 font-mono">Nama Artis (Opsional):</label>
                  <input
                    type="text"
                    value={customArtist}
                    onChange={(e) => setCustomArtist(e.target.value)}
                    placeholder="Contoh: Muhar"
                    className="w-full px-3 py-2 bg-black/40 border border-white/15 focus:border-[#fcd34d] rounded-xl text-white text-xs focus:outline-none transition-all"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-2.5 rounded-xl bg-[#fcd34d] hover:bg-[#fbbf24] text-black font-semibold text-xs transition-colors shadow-md flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>Simpan ke LocalStorage & Putar</span>
              </button>
            </form>
          )}

          {activeTab === 'file' && (
            <div className="space-y-3 animate-fade-in text-left">
              <div className="p-3 bg-white/[0.03] border border-white/10 rounded-xl">
                <p className="text-xs text-white/80 font-medium">Pilih File Musik dari Komputer / HP</p>
                <p className="text-[11px] text-white/45 mt-0.5 leading-relaxed">
                  Pilih file MP3 atau audio dari perangkat Anda. Data audio disimpan ke browser storage (IndexedDB) sehingga tetap dapat diputar bahkan saat offline atau di Netlify!
                </p>
              </div>

              <input
                ref={fileInputRef}
                type="file"
                accept="audio/*"
                onChange={handleFileChange}
                className="hidden"
              />

              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-white/20 hover:border-[#fcd34d]/60 rounded-xl p-6 flex flex-col items-center justify-center gap-2 cursor-pointer transition-colors bg-white/[0.01] hover:bg-white/[0.04]"
              >
                <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-white/60">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                    <polyline points="17 8 12 3 7 8" />
                    <line x1="12" y1="3" x2="12" y2="15" />
                  </svg>
                </div>
                <p className="text-xs text-white font-medium">
                  {fileLoading ? 'Memproses file...' : fileName ? `File: ${fileName}` : 'Klik untuk memilih file audio'}
                </p>
                <p className="text-[10px] text-white/40 font-mono">Format yang didukung: MP3, WAV, M4A, OGG</p>
              </div>
            </div>
          )}

          {activeTab === 'search' && (
            <div className="space-y-3 animate-fade-in text-left">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  playTactileClick();
                  performSearch(query);
                }}
                className="flex gap-2"
              >
                <input
                  ref={searchInputRef}
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Ketik judul lagu atau artis..."
                  className="flex-1 px-3 py-2 bg-black/40 border border-white/15 focus:border-[#fcd34d] rounded-xl text-white text-xs focus:outline-none transition-all"
                />
                <button
                  type="submit"
                  disabled={searchLoading || !query.trim()}
                  className="px-4 py-2 bg-[#fcd34d] hover:bg-[#fbbf24] disabled:opacity-40 text-black font-semibold text-xs rounded-xl transition-colors cursor-pointer"
                >
                  {searchLoading ? 'Mencari...' : 'Cari'}
                </button>
              </form>

              {searchError && (
                <div className="p-3 bg-rose-950/40 border border-rose-800/50 rounded-xl text-rose-300 text-xs">
                  {searchError}
                </div>
              )}

              <div className="space-y-2">
                {searchResults.map((item) => (
                  <div
                    key={item.id}
                    onClick={() => handleSearchTrackClick(item)}
                    className="flex items-center gap-3 p-2 rounded-xl border border-white/5 bg-white/[0.02] hover:bg-white/[0.08] cursor-pointer transition-colors"
                  >
                    <img
                      src={item.thumbnail}
                      alt={item.title}
                      className="w-10 h-10 rounded-lg object-cover bg-black/40"
                    />
                    <div className="flex-1 min-w-0">
                      <h4 className="text-xs font-medium text-white truncate">{item.title}</h4>
                      <p className="text-[10px] text-white/50 truncate font-mono">{item.artist} {item.duration ? `• ${formatDuration(item.duration)}` : ''}</p>
                    </div>
                    <div className="shrink-0">
                      {loadingTrackId === item.id ? (
                        <span className="w-3.5 h-3.5 border-2 border-white/20 border-t-[#fcd34d] rounded-full animate-spin inline-block" />
                      ) : (
                        <span className="text-[10px] text-[#fcd34d]">Pilih</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="px-4 py-3 border-t border-white/10 bg-black/40 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2 truncate pr-2">
            <span className="text-[11px] text-white/50">Lagu Aktif:</span>
            <span className="text-[11px] text-white font-medium truncate max-w-[170px]">
              {currentTrack ? currentTrack.title : 'Belum ada lagu'}
            </span>
          </div>

          {currentTrack && (
            <button
              type="button"
              onClick={handleResetSong}
              title="Hapus lagu tersimpan dari LocalStorage"
              className="text-[11px] text-rose-400 hover:text-rose-300 transition-colors cursor-pointer shrink-0 font-medium underline underline-offset-2"
            >
              Hapus Lagu (Reset)
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
