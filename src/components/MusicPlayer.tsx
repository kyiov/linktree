import React, { useState, useRef, useEffect } from 'react';
import { playTactileClick, playCopySuccess } from '../utils/audio';
import { MusicSearchModal, Track } from './MusicSearchModal';
import { MusicConfig } from '../types/linktree';
import { getTrackFromLocalStorage } from '../utils/audioStorage';

interface MusicPlayerProps {
  config: MusicConfig;
  onTogglePlay?: (isPlaying: boolean) => void;
}

export const MusicPlayer: React.FC<MusicPlayerProps> = ({ config, onTogglePlay }) => {
  if (!config.enabled) return null;

  const [isPlaying, setIsPlaying] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [currentTrack, setCurrentTrack] = useState<Track | null>(null);
  const [isLoadingAudio, setIsLoadingAudio] = useState(false);

  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    const saved = getTrackFromLocalStorage();
    let trackToLoad: Track | null = null;
    if (saved && saved.audioUrl) {
      trackToLoad = saved;
    } else if (config.defaultTrack) {
      trackToLoad = {
        id: config.defaultTrack.id,
        title: config.defaultTrack.title,
        artist: config.defaultTrack.artist,
        duration: config.defaultTrack.duration,
        audioUrl: config.defaultTrack.audioUrl,
        thumbnail: config.defaultTrack.thumbnail || '',
      };
    }
    setCurrentTrack(trackToLoad);

    const audio = audioRef.current;
    if (audio) {
      audio.volume = config.volume ?? 0.65;
      audio.loop = config.loop ?? true;
      if (trackToLoad?.audioUrl && !audio.src) {
        audio.src = trackToLoad.audioUrl;
      }
    }

    // Resilient autoplay: try immediate play, fallback to first user gesture
    let cleanupAutoplayListeners = () => {};
    const shouldAutoplay = config.autoplay ?? true;

    if (shouldAutoplay && trackToLoad?.audioUrl) {
      let hasStarted = false;

      const triggerPlay = () => {
        if (hasStarted) return;
        const a = audioRef.current;
        if (!a) return;
        if (!a.src && trackToLoad?.audioUrl) {
          a.src = trackToLoad.audioUrl;
        }
        a.play()
          .then(() => {
            hasStarted = true;
            setIsPlaying(true);
            onTogglePlay?.(true);
            cleanupAutoplayListeners();
          })
          .catch(() => {
            // Autoplay blocked by browser policy; waiting for first interaction
          });
      };

      cleanupAutoplayListeners = () => {
        window.removeEventListener('pointerdown', triggerPlay);
        window.removeEventListener('click', triggerPlay);
        window.removeEventListener('touchstart', triggerPlay);
        window.removeEventListener('keydown', triggerPlay);
        window.removeEventListener('scroll', triggerPlay);
      };

      // 1. Try playing immediately upon mount
      triggerPlay();

      // 2. Attach first interaction listeners if browser blocks direct autoplay
      window.addEventListener('pointerdown', triggerPlay, { once: true, passive: true });
      window.addEventListener('click', triggerPlay, { once: true, passive: true });
      window.addEventListener('touchstart', triggerPlay, { once: true, passive: true });
      window.addEventListener('keydown', triggerPlay, { once: true, passive: true });
      window.addEventListener('scroll', triggerPlay, { once: true, passive: true });
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
      cleanupAutoplayListeners();
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
        .catch(() => {
          setIsPlaying(false);
        });
    }
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
      } catch {
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

      <div className="fixed top-3.5 right-3.5 sm:top-5 sm:right-6 z-50 select-none">
        {!currentTrack ? (
          <button
            type="button"
            onClick={() => {
              playTactileClick();
              setIsSearchOpen(true);
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-black/60 hover:bg-black/80 border border-white/15 hover:border-white/30 backdrop-blur-md text-white/80 hover:text-white transition-all text-xs cursor-pointer shadow-lg"
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 18V5l12-2v13" />
              <circle cx="6" cy="18" r="3" />
              <circle cx="18" cy="16" r="3" />
            </svg>
            <span className="text-[11px] font-medium tracking-tight">Cari Musik</span>
          </button>
        ) : (
          <div
            className={`flex items-center gap-2 pl-2.5 pr-2 py-1.5 rounded-full backdrop-blur-md transition-all duration-300 shadow-xl border ${
              isPlaying
                ? 'bg-black/85 border-[#fcd34d]/40 text-white shadow-[#fcd34d]/10 ring-1 ring-[#fcd34d]/20'
                : 'bg-black/60 hover:bg-black/75 border-white/15 hover:border-white/30 text-white/80'
            }`}
          >
            <button
              type="button"
              onClick={togglePlay}
              disabled={isLoadingAudio}
              aria-label={isPlaying ? 'Jeda' : 'Putar'}
              className="flex items-center justify-center w-6 h-6 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer shrink-0"
            >
              {isLoadingAudio ? (
                <span className="w-3 h-3 border-2 border-white/30 border-t-[#fcd34d] rounded-full animate-spin" />
              ) : isPlaying ? (
                <div className="flex items-end justify-center gap-[2px] h-3 w-3">
                  <span className="w-[2px] bg-[#fcd34d] rounded-full animate-[soundwave_0.8s_ease-in-out_infinite]" />
                  <span className="w-[2px] bg-[#fcd34d] rounded-full animate-[soundwave_0.6s_ease-in-out_0.2s_infinite]" />
                  <span className="w-[2px] bg-[#fcd34d] rounded-full animate-[soundwave_0.9s_ease-in-out_0.4s_infinite]" />
                </div>
              ) : (
                <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor">
                  <polygon points="5 3 19 12 5 21 5 3" />
                </svg>
              )}
            </button>

            <button
              type="button"
              onClick={() => {
                playTactileClick();
                setIsSearchOpen(true);
              }}
              className="text-[11px] font-medium tracking-tight truncate max-w-[120px] sm:max-w-[160px] text-left hover:text-[#fcd34d] transition-colors cursor-pointer"
            >
              <span className={isPlaying ? 'text-[#fcd34d]' : 'text-white/90'}>
                {currentTrack.title}
              </span>
            </button>

            <button
              type="button"
              onClick={() => {
                playTactileClick();
                setIsSearchOpen(true);
              }}
              aria-label="Cari musik"
              className="w-5 h-5 rounded-full hover:bg-white/10 text-white/50 hover:text-white flex items-center justify-center transition-colors cursor-pointer shrink-0"
            >
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
            </button>
          </div>
        )}
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
