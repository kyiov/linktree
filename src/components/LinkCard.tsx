import React, { useState } from 'react';
import { LinkItem } from '../types/linktree';
import { playTactileClick, playCopySuccess } from '../utils/audio';

interface LinkCardProps {
  link: LinkItem;
  index?: number;
}

interface AdaptiveTheme {
  accentColor: string;
  glowColor: string;
  badge: string;
  tagline: string;
}

const COLOR_PALETTE = [
  { accentColor: '#fcd34d', glowColor: 'rgba(252, 211, 77, 0.35)' },
  { accentColor: '#9ae6b4', glowColor: 'rgba(154, 230, 180, 0.35)' },
  { accentColor: '#60a5fa', glowColor: 'rgba(96, 165, 250, 0.35)' },
  { accentColor: '#f472b6', glowColor: 'rgba(244, 114, 182, 0.35)' },
  { accentColor: '#a78bfa', glowColor: 'rgba(167, 139, 250, 0.35)' },
  { accentColor: '#38bdf8', glowColor: 'rgba(56, 189, 248, 0.35)' },
  { accentColor: '#fb923c', glowColor: 'rgba(251, 146, 60, 0.35)' },
  { accentColor: '#34d399', glowColor: 'rgba(52, 211, 153, 0.35)' },
];

export const LinkCard: React.FC<LinkCardProps> = ({ link, index = 0 }) => {
  const [copied, setCopied] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  const fallback = COLOR_PALETTE[index % COLOR_PALETTE.length];
  const theme: AdaptiveTheme = {
    accentColor: link.accentColor || fallback.accentColor,
    glowColor: link.glowColor || fallback.glowColor,
    badge: link.badge || (index === 0 ? 'Featured' : 'Link'),
    tagline: link.description || 'Kunjungi link ini',
  };

  const handleCopy = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    navigator.clipboard.writeText(link.url);
    playCopySuccess();
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const renderDualToneTitle = (title: string) => {
    const lastDotIndex = title.lastIndexOf('.');
    const secondLastDotIndex = title.lastIndexOf('.', lastDotIndex - 1);
    
    let splitIndex = lastDotIndex;
    if (title.endsWith('.my.id') || title.endsWith('.web.id')) {
      splitIndex = secondLastDotIndex;
    }

    if (splitIndex > 0) {
      const mainPart = title.slice(0, splitIndex);
      const extPart = title.slice(splitIndex);
      return (
        <span className="inline-flex items-baseline justify-center gap-0.5">
          <span className="font-semibold text-white tracking-normal text-[15px] sm:text-[16px]">
            {mainPart}
          </span>
          <span className="font-mono text-white/50 text-[13px] sm:text-[14px] tracking-tight">
            {extPart}
          </span>
        </span>
      );
    }

    return <span className="font-semibold text-white tracking-normal">{title}</span>;
  };

  const delayMs = 280 + index * 80;

  return (
    <div 
      className={`relative w-full group animate-fade-up ${isHovered ? 'z-40' : 'z-10'}`}
      style={{ animationDelay: `${delayMs}ms` }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {copied && (
        <div 
          className="animate-toast absolute -top-10 left-1/2 -translate-x-1/2 z-30 px-3 py-1 bg-black/90 backdrop-blur-md text-white text-[12px] font-medium rounded-full shadow-xl border border-white/15 whitespace-nowrap pointer-events-none flex items-center gap-1.5 select-none"
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-emerald-400">
            <polyline points="20 6 9 17 4 12" />
          </svg>
          <span>Tautan disalin!</span>
        </div>
      )}

      {isHovered && !copied && (
        <div 
          className="animate-toast hidden sm:flex absolute -top-[70px] left-1/2 -translate-x-1/2 z-50 px-3.5 py-2 bg-[#16060c] border rounded-xl shadow-[0_12px_36px_rgba(0,0,0,0.85)] items-center gap-3 pointer-events-none whitespace-nowrap"
          style={{ borderColor: `${theme.accentColor}55` }}
        >
          <div 
            className="w-2 h-2 rounded-full animate-pulse shrink-0"
            style={{ backgroundColor: theme.accentColor }}
          />
          <div className="flex flex-col text-left">
            <div className="flex items-center gap-1.5">
              <span className="font-mono text-[12px] text-white font-semibold tracking-tight">{link.title}</span>
              <span 
                className="text-[9px] uppercase font-mono px-1.5 py-0.5 rounded border font-semibold"
                style={{ 
                  color: theme.accentColor, 
                  borderColor: `${theme.accentColor}60`,
                  backgroundColor: `${theme.accentColor}20`
                }}
              >
                {theme.badge}
              </span>
            </div>
            <span className="text-[11px] text-white/70 font-sans">{theme.tagline}</span>
          </div>
          <span className="text-white/50 text-xs font-mono pl-0.5">↗</span>
        </div>
      )}

      <a
        href={link.url}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={link.title}
        onClick={() => playTactileClick()}
        style={{
          boxShadow: isHovered 
            ? `0 10px 28px -4px ${theme.glowColor}, 0 4px 14px -2px rgba(0,0,0,0.35)`
            : undefined,
          borderColor: isHovered ? `${theme.accentColor}50` : 'transparent',
        }}
        className="linktree-pill relative w-full min-h-[64px] py-3 px-8 flex items-center justify-center text-center font-dmsans border cursor-pointer select-none"
      >
        {index < 9 && (
          <span className="hidden sm:inline-flex absolute left-5 top-1/2 -translate-y-1/2 items-center justify-center w-5 h-5 rounded bg-black/20 border border-white/10 text-white/30 text-[10px] font-mono group-hover:text-white/60 group-hover:border-white/20 transition-colors pointer-events-none">
            {index + 1}
          </span>
        )}

        <div className="w-full truncate px-4">
          {renderDualToneTitle(link.title)}
        </div>
      </a>

      <button
        type="button"
        onClick={handleCopy}
        aria-label={copied ? "Copied!" : "Copy link"}
        title={copied ? "Copied!" : "Copy link"}
        className="absolute right-3.5 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center rounded-full text-white/50 hover:text-white hover:bg-black/10 transition-all duration-200"
      >
        {copied ? (
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-emerald-400">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        ) : (
          <svg width="3" height="11" viewBox="0 0 3 11" fill="currentColor">
            <circle cx="1.33" cy="1.33" r="1.33" />
            <circle cx="1.33" cy="5.33" r="1.33" />
            <circle cx="1.33" cy="9.33" r="1.33" />
          </svg>
        )}
      </button>
    </div>
  );
};
