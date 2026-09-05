import React, { useState, useEffect } from 'react';

interface ProfileFooterProps {
  handle: string;
  totalLinks?: number;
}

export const ProfileFooter: React.FC<ProfileFooterProps> = ({ handle, totalLinks = 3 }) => {
  const [time, setTime] = useState<string>('');

  useEffect(() => {
    const formatWibTime = () => {
      const now = new Date();
      try {
        return new Intl.DateTimeFormat('en-GB', {
          timeZone: 'Asia/Pontianak',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: false,
        }).format(now);
      } catch {
        const utcMs = now.getTime() + now.getTimezoneOffset() * 60000;
        const wibDate = new Date(utcMs + 7 * 3600000);
        const hh = String(wibDate.getHours()).padStart(2, '0');
        const mm = String(wibDate.getMinutes()).padStart(2, '0');
        const ss = String(wibDate.getSeconds()).padStart(2, '0');
        return `${hh}:${mm}:${ss}`;
      }
    };

    const updateTime = () => {
      setTime(formatWibTime());
    };

    updateTime();
    const timer = setInterval(updateTime, 1000);
    return () => clearInterval(timer);
  }, []);

  const maxKey = Math.min(totalLinks, 9);
  const keyLabel = maxKey > 1 ? `1-${maxKey}` : '1';

  return (
    <footer className="relative w-full mt-5 pb-12 flex flex-col items-center gap-3 text-center select-none animate-fade-up" style={{ animationDelay: '480ms' }}>
      <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-black/30 border border-white/10 text-[11px] font-mono text-white/60 tracking-tight shadow-sm">
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
          <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
        </span>
        <span className="text-white/80 font-medium">Pontianak, ID</span>
        <span className="text-white/30">•</span>
        <span className="text-amber-200/90 font-semibold tabular-nums">{time || '--:--:--'} WIB</span>
        <span className="text-white/30">•</span>
        <span className="text-white/40 text-[10px]">0°0′ Equator</span>
      </div>

      <div className="hidden sm:flex items-center gap-2 text-[10px] font-mono text-white/40 tracking-wider">
        {totalLinks > 0 && (
          <>
            <span>Ketik <kbd className="px-1 py-0.5 rounded bg-white/10 border border-white/15 text-white/60 font-semibold">{keyLabel}</kbd> buka link</span>
            <span>•</span>
          </>
        )}
        <span><kbd className="px-1 py-0.5 rounded bg-white/10 border border-white/15 text-white/60 font-semibold">M</kbd> musik</span>
        <span>•</span>
        <span><kbd className="px-1 py-0.5 rounded bg-white/10 border border-white/15 text-white/60 font-semibold">S</kbd> cari lagu</span>
        <span>•</span>
        <span><kbd className="px-1 py-0.5 rounded bg-white/10 border border-white/15 text-white/60 font-semibold">C</kbd> salin</span>
      </div>

      <p className="text-[11px] text-white/30 font-sans tracking-wide">
        © 2026 Muhar ({handle})
      </p>
    </footer>
  );
};
