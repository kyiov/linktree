import React, { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import { X, Copy, Check, Share2, Sparkles } from "lucide-react";
import { ProfileConfig } from '../types/linktree';

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: ProfileConfig;
}

export const ShareModal: React.FC<ShareModalProps> = ({ isOpen, onClose, config }) => {
  const [copied, setCopied] = useState(false);
  const [qrSvg, setQrSvg] = useState<string>('');
  const [shareUrl, setShareUrl] = useState<string>('');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const currentUrl = window.location.href;
      setShareUrl(currentUrl);

      QRCode.toString(currentUrl, {
        type: 'svg',
        margin: 1,
        color: {
          dark: '#00f2fe',
          light: '#050505'
        }
      })
        .then((svg) => setQrSvg(svg))
        .catch((err) => console.error('Failed generating QR code:', err));
    }
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl || window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch (err) {
      console.error('Copy failed:', err);
    }
  };

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${config.name} | Cyber Linktree`,
          text: `Check out ${config.name}'s links and portfolio!`,
          url: shareUrl || window.location.href,
        });
      } catch (err) {
        console.log('Share dismissed or failed:', err);
      }
    } else {
      handleCopy();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div 
        onClick={onClose}
        className="fixed inset-0 bg-black/80 backdrop-blur-md transition-opacity animate-fade-in"
      />

      <div className="relative z-10 w-full max-w-sm rounded-3xl bg-zinc-950/95 border border-white/15 p-6 shadow-[0_0_50px_-10px_var(--accent-glow)] flex flex-col items-center text-center animate-scale-up">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full bg-zinc-900/80 text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
          title="Close Modal"
        >
          <X size={18} />
        </button>

        <div className="flex items-center gap-2 mb-1">
          <Sparkles size={16} className="text-cyan-400" />
          <h3 className="font-space font-bold text-lg text-white">Share Profile</h3>
        </div>
        <p className="text-xs text-zinc-400 font-jakarta mb-5">
          Scan QR code with smartphone or copy the profile link below
        </p>

        <div className="relative p-3 rounded-2xl bg-black border border-cyan-500/30 shadow-[0_0_20px_-3px_var(--accent-glow)] mb-5 group">
          <div 
            className="w-48 h-48 flex items-center justify-center [&>svg]:w-full [&>svg]:h-full"
            dangerouslySetInnerHTML={{ __html: qrSvg }}
          />
          <div className="absolute -bottom-2.5 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded-full bg-zinc-900 border border-white/10 text-[10px] font-mono text-cyan-300">
            {config.handle}
          </div>
        </div>

        <div className="w-full flex items-center gap-2 p-1.5 pl-3 rounded-xl bg-zinc-900/90 border border-white/10 text-xs font-mono text-zinc-300 mb-4">
          <span className="truncate flex-1 text-left text-zinc-400 select-all">
            {shareUrl || 'https://...'}
          </span>
          <button
            onClick={handleCopy}
            className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 font-medium transition-all ${
              copied 
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40' 
                : 'bg-cyan-500 hover:bg-cyan-400 text-black shadow-[0_0_15px_-3px_var(--accent-glow)]'
            }`}
          >
            {copied ? (
              <>
                <Check size={14} />
                <span>Copied!</span>
              </>
            ) : (
              <>
                <Copy size={14} />
                <span>Copy</span>
              </>
            )}
          </button>
        </div>

        {typeof navigator !== 'undefined' && 'share' in navigator && (
          <button
            onClick={handleNativeShare}
            className="w-full py-2.5 px-4 rounded-xl bg-zinc-900 hover:bg-zinc-850 border border-white/10 text-xs font-medium text-zinc-200 hover:text-white flex items-center justify-center gap-2 transition-colors"
          >
            <Share2 size={15} className="text-cyan-400" />
            <span>Open System Share Menu</span>
          </button>
        )}
      </div>
    </div>
  );
};
