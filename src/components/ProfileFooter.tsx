import React from 'react';

interface ProfileFooterProps {
  handle: string;
  totalLinks?: number;
}

export const ProfileFooter: React.FC<ProfileFooterProps> = ({ handle, totalLinks = 3 }) => {
  const maxKey = Math.min(totalLinks, 9);
  const keyLabel = maxKey > 1 ? `1-${maxKey}` : '1';

  return (
    <footer className="relative w-full mt-4 pb-12 flex flex-col items-center gap-3 text-center select-none animate-fade-up" style={{ animationDelay: '480ms' }}>
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
        © 2026 {handle.replace('@', '')}
      </p>
    </footer>
  );
};
