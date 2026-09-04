import React, { useState, useRef, useEffect } from 'react';
import { playTactileClick, playCopySuccess } from '../utils/audio';
import { MusicSearchModal, Track } from './MusicSearchModal';
import { MusicConfig } from '../types/linktree';
import {
  getTrackFromLocalStorage,
  getAudioBlobFromDB,
} from '../utils/audioStorage';

interface MusicPlayerProps {
  config: MusicConfig;
  onTogglePlay?: (isPlaying: boolean) => void;
}

export const MusicPlayer: React.FC<MusicPlayerProps> = ({ config, onTogglePlay }) => {
  if (!config.enabled) return null;

  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [currentTrack, setCurrentTrack] = useState<Track | null>(null);
  const [isLoadingAudio, setIsLoadingAudio] = useState(false);

  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    const initTrack = async () => {
      const saved = getTrackFromLocalStorage();
      if (saved) {
        if (saved.source === 'local_file') {
          const blob = await getAudioBlobFromDB('active_audio');
          if (blob) {
            const objectUrl = URL.createObjectURL(blob);
            setCurrentTrack({ ...saved, audioUrl: objectUrl });
            return;
          }
        }
        setCurrentTrack(saved);
        return;
      }

      if (config.defaultTrack) {
        setCurrentTrack({
          id: config.defaultTrack.id,
          title: config.defaultTrack.title,
          artist: config.defaultTrack.artist,
          duration: config.defaultTrack.duration,
          audioUrl: config.defaultTrack.audioUrl,
          thumbnail: config.defaultTrack.thumbnail || '',
        });
      } else {
        setCurrentTrack(null);
      }
    };

    initTrack();

    if (audioRef.current) {
      audioRef.current.volume = config.volume ?? 0.65;
      audioRef.current.loop = config.loop ?? true;
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes(target?.tagName)) return;

      if (e.key.toLowerCase() === 'm') {
        e.preventDefault();
        togglePlay();
      } else if (e.key.toLowerCase() === 's' || e.key === '/') {
        e.preventDefault();
        setIsSearchOpen(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const togglePlay = () => {
    playTactileClick();

    if (!currentTrack || !currentTrack.audioUrl) {
      setIsSearchOpen(true);
      return;
    }

    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      audio.pause();
      setIsPlaying(false);
      onTogglePlay?.(false);
    } else {
      if (!audio.src || audio.src !== currentTrack.audioUrl) {
        audio.src = currentTrack.audioUrl;
      }
      audio
        .play()
        .then(() => {
          setIsPlaying(true);
          onTogglePlay?.(true);
        })
        .catch((err) => {
          console.warn('Audio playback prevented:', err);
          setIsPlaying(false);
        });
    }
  };

  const toggleMute = (e: React.MouseEvent) => {
    e.stopPropagation();
    playTactileClick();
    const audio = audioRef.current;
    if (!audio) return;

    audio.muted = !isMuted;
    setIsMuted(!isMuted);
  };

  const handleSelectTrack = async (track: Track) => {
    setIsLoadingAudio(true);
    const audio = audioRef.current;

    setCurrentTrack(track);

    if (audio && track.audioUrl) {
      audio.src = track.audioUrl;
      try {
        await audio.play();
        setIsPlaying(true);
        onTogglePlay?.(true);
      } catch (playErr) {
        console.warn('Playback error:', playErr);
        audio.oncanplay = () => {
          audio.play().then(() => {
            setIsPlaying(true);
            onTogglePlay?.(true);
          }).catch(() => {});
          audio.oncanplay = null;
        };
      }
    }

    setIsLoadingAudio(false);
    playCopySuccess();
  };

  const handleClearTrack = () => {
    const audio = audioRef.current;
    if (audio) {
      audio.pause();
      audio.removeAttribute('src');
      audio.load();
    }
    setIsPlaying(false);
    onTogglePlay?.(false);
    setCurrentTrack(null);
  };

  return (
    <>
      <audio
        ref={audioRef}
        src={currentTrack?.audioUrl || ''}
        preload="auto"
        loop={config.loop ?? true}
        onPlay={() => {
          setIsPlaying(true);
          onTogglePlay?.(true);
        }}
        onPause={() => {
          setIsPlaying(false);
          onTogglePlay?.(false);
        }}
        onEnded={() => {
          setIsPlaying(false);
          onTogglePlay?.(false);
        }}
        onError={() => {
          setIsPlaying(false);
        }}
      />

      <div className="fixed top-3.5 right-3.5 sm:top-5 sm:right-6 z-50 select-none flex items-center gap-1.5">
        <div
          className={`flex items-center gap-2 pl-3 pr-2 py-1.5 sm:py-2 rounded-full backdrop-blur-md transition-all duration-300 shadow-xl border ${
            isPlaying
              ? 'bg-black/85 border-[#fcd34d]/50 text-white shadow-[#fcd34d]/10 ring-1 ring-[#fcd34d]/20'
              : 'bg-black/60 hover:bg-black/75 border-white/15 hover:border-white/30 text-white/80'
          }`}
        >
          <button
            type="button"
            onClick={togglePlay}
            disabled={isLoadingAudio}
            aria-label={isPlaying ? 'Jeda musik' : 'Putar musik'}
            title={currentTrack ? "Tekan 'M' di keyboard untuk Putar/Jeda" : 'Klik untuk memilih musik'}
            className="flex items-center justify-center h-6 w-6 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors shrink-0 cursor-pointer"
          >
            {isLoadingAudio ? (
              <span className="w-3 h-3 border-2 border-white/30 border-t-[#fcd34d] rounded-full animate-spin" />
            ) : isPlaying ? (
              <div className="flex items-end justify-center gap-[2px] h-3 w-3">
                <span className="w-[2px] bg-[#fcd34d] rounded-full animate-[soundwave_0.8s_ease-in-out_infinite]" />
                <span className="w-[2px] bg-[#fcd34d] rounded-full animate-[soundwave_0.6s_ease-in-out_0.2s_infinite]" />
                <span className="w-[2px] bg-[#fcd34d] rounded-full animate-[soundwave_0.9s_ease-in-out_0.4s_infinite]" />
              </div>
            ) : currentTrack ? (
              <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor">
                <polygon points="5 3 19 12 5 21 5 3" />
              </svg>
            ) : (
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 18V5l12-2v13" />
                <circle cx="6" cy="18" r="3" />
                <circle cx="18" cy="16" r="3" />
              </svg>
            )}
          </button>

          <div
            onClick={() => {
              playTactileClick();
              setIsSearchOpen(true);
            }}
            title="Klik untuk memilih atau mengatur musik"
            className="flex flex-col text-left leading-tight cursor-pointer max-w-[115px] sm:max-w-[160px] pr-1"
          >
            <span className="text-[11px] font-medium tracking-tight truncate">
              {currentTrack ? (
                isPlaying ? (
                  <span className="text-[#fcd34d] font-semibold">{currentTrack.title}</span>
                ) : (
                  <span>{currentTrack.title}</span>
                )
              ) : (
                <span className="text-white/90">Atur Musik</span>
              )}
            </span>
            <span className="text-[9px] text-white/50 font-mono tracking-tighter truncate">
              {currentTrack
                ? isPlaying
                  ? currentTrack.artist
                  : 'Siap diputar'
                : 'Lagu tema • URL (S)'}
            </span>
          </div>

          <button
            type="button"
            onClick={() => {
              playTactileClick();
              setIsSearchOpen(true);
            }}
            title="Buka Pengaturan Musik (Tekan S)"
            aria-label="Pengaturan musik"
            className="w-6 h-6 rounded-full bg-white/10 hover:bg-[#fcd34d] text-white/70 hover:text-black flex items-center justify-center transition-all shrink-0 cursor-pointer"
          >
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
          </button>

          {isPlaying && (
            <button
              type="button"
              onClick={toggleMute}
              title={isMuted ? 'Bunyikan' : 'Senyapkan'}
              className="w-6 h-6 rounded-full hover:bg-white/10 text-white/50 hover:text-white flex items-center justify-center transition-colors shrink-0 cursor-pointer"
            >
              {isMuted ? (
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-rose-400">
                  <line x1="1" y1="1" x2="23" y2="23" />
                  <path d="M9 9v3a3 3 0 0 0 5.12 2.12M15 9.34V4a3 3 0 0 0-5.94-.6" />
                  <path d="M17 16.95A7 7 0 0 1 5 12v-2m14 0v2a7 7 0 0 1-.11 1.23" />
                </svg>
              ) : (
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
                  <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
                </svg>
              )}
            </button>
          )}
        </div>
      </div>

      <MusicSearchModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        onSelectTrack={handleSelectTrack}
        onClearTrack={handleClearTrack}
        currentTrack={currentTrack}
        isPlaying={isPlaying}
      />
    </>
  );
};
