import React, { useState } from 'react';
import { ArrowUpRight, Check, Copy } from 'lucide-react';
import { LinkItem } from '../types/linktree';
import { playTactileClick, playCopySuccess } from '../utils/audio';

interface LinkCardProps {
  link: LinkItem;
  index?: number;
}

export const LinkCard: React.FC<LinkCardProps> = ({ link, index = 0 }) => {
  const [copied, setCopied] = useState(false);

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
        <span className="inline-flex items-baseline justify-center">
          <span className="font-semibold text-white tracking-normal text-[15px] sm:text-[16px] inline-flex">
            {mainPart.split('').map((char, cIdx) => (
              <span
                key={cIdx}
                style={{
                  transitionDelay: `${cIdx * 18}ms`,
                }}
                className="inline-block transition-transform duration-200 ease-out group-hover:-translate-y-0.5 group-hover:text-amber-100 will-change-transform"
              >
                {char === ' ' ? '\u00A0' : char}
              </span>
            ))}
          </span>
          <span className="font-mono text-white/50 text-[13px] sm:text-[14px] tracking-tight ml-0.5 transition-colors duration-200 group-hover:text-white/70">
            {extPart}
          </span>
        </span>
      );
    }

    return (
      <span className="font-semibold text-white tracking-normal text-[15px] sm:text-[16px] inline-flex">
        {title.split('').map((char, cIdx) => (
          <span
            key={cIdx}
            style={{
              transitionDelay: `${cIdx * 18}ms`,
            }}
            className="inline-block transition-transform duration-200 ease-out group-hover:-translate-y-0.5 group-hover:text-amber-100 will-change-transform"
          >
            {char === ' ' ? '\u00A0' : char}
          </span>
        ))}
      </span>
    );
  };

  const delayMs = 280 + index * 80;

  return (
    <div 
      className="relative w-full group animate-fade-up"
      style={{ animationDelay: `${delayMs}ms` }}
    >
      {copied && (
        <div 
          className="animate-toast absolute -top-9 left-1/2 -translate-x-1/2 z-30 px-3 py-1 bg-black/85 backdrop-blur-md text-white text-[12px] font-medium rounded-full shadow-lg border border-white/15 whitespace-nowrap pointer-events-none flex items-center gap-1.5 select-none"
        >
          <Check size={12} className="text-emerald-400" />
          <span>Tautan disalin!</span>
        </div>
      )}

      <a
        href={link.url}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={link.title}
        onClick={() => playTactileClick(index)}
        className="linktree-pill relative w-full min-h-[64px] sm:min-h-[70px] py-3.5 px-6 sm:px-12 flex items-center justify-center text-center font-dmsans border border-white/10 hover:border-white/20 cursor-pointer select-none"
      >
        {index < 9 && (
          <span className="hidden sm:inline-flex absolute left-4 top-1/2 -translate-y-1/2 items-center justify-center w-5 h-5 rounded-full bg-black/20 border border-white/10 text-white/30 text-[10px] font-mono group-hover:text-white/60 group-hover:border-white/25 transition-colors pointer-events-none">
            {index + 1}
          </span>
        )}

        <div className="flex flex-col items-center justify-center w-full px-2">
          <div className="flex items-center justify-center">
            {renderDualToneTitle(link.title)}
          </div>
          {link.description && (
            <p className="text-[12px] sm:text-[13px] text-white/60 font-normal leading-snug line-clamp-1 mt-0.5 max-w-[90%] transition-colors duration-200 group-hover:text-white/80">
              {link.description}
            </p>
          )}
        </div>

        <span 
          aria-hidden="true"
          className="hidden sm:inline-flex absolute right-4 top-1/2 -translate-y-1/2 text-white/30 group-hover:text-white/75 group-hover:translate-x-0.5 group-hover:-translate-y-[calc(50%+1px)] transition-all duration-200 pointer-events-none"
        >
          <ArrowUpRight size={16} />
        </span>
      </a>

      <button
        type="button"
        onClick={handleCopy}
        aria-label={copied ? "Tautan disalin" : "Salin tautan"}
        title={copied ? "Tautan disalin" : "Salin tautan"}
        className="absolute right-2.5 sm:right-10 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center rounded-full text-white/40 hover:text-white hover:bg-white/10 active:scale-90 transition-all duration-200 opacity-60 sm:opacity-0 sm:group-hover:opacity-100"
      >
        {copied ? (
          <Check size={14} className="text-emerald-400" />
        ) : (
          <Copy size={13} />
        )}
      </button>
    </div>
  );
};
