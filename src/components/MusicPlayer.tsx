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
  const [barHeights, setBarHeights] = useState<number[]>([2.5, 2.5, 2.5, 2.5]);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const sourceNodeRef = useRef<MediaElementAudioSourceNode | null>(null);
  const rafIdRef = useRef<number | null>(null);

  const setupWebAudio = () => {
    const audio = audioRef.current;
    if (!audio) return;
    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) return;
      if (!audioCtxRef.current) {
        audioCtxRef.current = new AudioCtx();
      }
      if (audioCtxRef.current.state === 'suspended') {
        audioCtxRef.current.resume().catch(() => {});
      }
      if (!sourceNodeRef.current && audioCtxRef.current) {
        const analyser = audioCtxRef.current.createAnalyser();
        analyser.fftSize = 64;
        analyser.smoothingTimeConstant = 0.8;
        const source = audioCtxRef.current.createMediaElementSource(audio);
        source.connect(analyser);
        analyser.connect(audioCtxRef.current.destination);
        analyserRef.current = analyser;
        sourceNodeRef.current = source;
      }
    } catch (err) {
      console.debug('Web Audio API notice:', err);
    }
  };

  useEffect(() => {
    if (!isPlaying) {
      if (rafIdRef.current) {
        cancelAnimationFrame(rafIdRef.current);
        rafIdRef.current = null;
      }
      setBarHeights([2.5, 2.5, 2.5, 2.5]);
      return;
    }

    setupWebAudio();

    const dataArray = new Uint8Array(32);
    let prev = [3, 4, 3, 2];

    const renderFrame = () => {
      let hasRealData = false;
      let b0 = 2.5;
      let b1 = 2.5;
      let b2 = 2.5;
      let b3 = 2.5;

      if (analyserRef.current) {
        analyserRef.current.getByteFrequencyData(dataArray);
        const maxVal = Math.max(...dataArray);
        if (maxVal > 0) {
          hasRealData = true;
          const bass = (dataArray[1] + dataArray[2]) / 2;
          const lowMid = (dataArray[3] + dataArray[4] + dataArray[5]) / 3;
          const highMid = (dataArray[6] + dataArray[7] + dataArray[8]) / 3;
          const treble = (dataArray[10] + dataArray[11] + dataArray[12]) / 3;

          b0 = 2.5 + (bass / 255) * 11.5;
          b1 = 2.5 + (lowMid / 255) * 11.5;
          b2 = 2.5 + (highMid / 255) * 11.5;
          b3 = 2.5 + (treble / 255) * 11.5;
        }
      }

      if (!hasRealData) {
        const t = performance.now() * 0.007;
        b0 = 3 + (Math.sin(t * 2.1) * 0.5 + 0.5) * 8 + Math.sin(t * 0.9) * 2;
        b1 = 4.5 + (Math.sin(t * 2.9 + 1.1) * 0.5 + 0.5) * 9.5;
        b2 = 3.5 + (Math.sin(t * 2.4 + 2.2) * 0.5 + 0.5) * 8.5;
        b3 = 3 + (Math.sin(t * 3.6 + 0.7) * 0.5 + 0.5) * 6.5;
      }

      const s0 = Math.max(2.5, Math.min(14, prev[0] * 0.55 + b0 * 0.45));
      const s1 = Math.max(2.5, Math.min(14, prev[1] * 0.55 + b1 * 0.45));
      const s2 = Math.max(2.5, Math.min(14, prev[2] * 0.55 + b2 * 0.45));
      const s3 = Math.max(2.5, Math.min(14, prev[3] * 0.55 + b3 * 0.45));

      prev = [s0, s1, s2, s3];
      setBarHeights([
        Math.round(s0 * 10) / 10,
        Math.round(s1 * 10) / 10,
        Math.round(s2 * 10) / 10,
        Math.round(s3 * 10) / 10,
      ]);

      rafIdRef.current = requestAnimationFrame(renderFrame);
    };

    rafIdRef.current = requestAnimationFrame(renderFrame);

    return () => {
      if (rafIdRef.current) {
        cancelAnimationFrame(rafIdRef.current);
        rafIdRef.current = null;
      }
    };
  }, [isPlaying]);

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
          .catch(() => {});
      };

      cleanupAutoplayListeners = () => {
        window.removeEventListener('pointerdown', triggerPlay);
        window.removeEventListener('click', triggerPlay);
        window.removeEventListener('touchstart', triggerPlay);
        window.removeEventListener('keydown', triggerPlay);
        window.removeEventListener('scroll', triggerPlay);
      };

      triggerPlay();

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
      try {
        audio.pause();
        audio.currentTime = 0;
      } catch {}
      audio.src = track.audioUrl;
      audio.load();
      try {
        await audio.play();
        setIsPlaying(true);
        onTogglePlay?.(true);
      } catch {
        audio.oncanplay = () => {
          try {
            audio.currentTime = 0;
          } catch {}
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
        crossOrigin="anonymous"
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
          if (audioRef.current && audioRef.current.crossOrigin) {
            audioRef.current.removeAttribute('crossOrigin');
            if (currentTrack?.audioUrl) {
              audioRef.current.src = currentTrack.audioUrl;
              audioRef.current.play().catch(() => {});
              return;
            }
          }
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
              <circle cx="6" r="3" cy="18" />
              <circle cx="18" r="3" cy="16" />
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
                <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor">
                  <rect x="5" y="4" width="4" height="16" rx="1" />
                  <rect x="15" y="4" width="4" height="16" rx="1" />
                </svg>
              ) : (
                <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor">
                  <polygon points="5 3 19 12 5 21 5 3" />
                </svg>
              )}
            </button>

            <div
              className="flex items-end justify-center gap-[2px] h-3.5 px-0.5 cursor-pointer select-none"
              onClick={togglePlay}
              title={isPlaying ? 'Live visualizer (klik untuk jeda)' : 'Audio dijeda (klik untuk putar)'}
            >
              {barHeights.map((h, i) => (
                <span
                  key={i}
                  className="w-[2.5px] rounded-full transition-all duration-75 ease-out"
                  style={{
                    height: `${h}px`,
                    backgroundColor: isPlaying ? '#fcd34d' : 'rgba(255,255,255,0.25)',
                  }}
                />
              ))}
            </div>

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
