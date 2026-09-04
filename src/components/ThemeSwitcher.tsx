import React, { useEffect, useState } from 'react';
import { Palette, Check } from 'lucide-react';

export type ThemePreset = 'signature' | 'cyber' | 'emerald' | 'noir';

interface ThemeOption {
  id: ThemePreset;
  name: string;
  primary: string;
  bg: string;
}

export const THEME_OPTIONS: ThemeOption[] = [
  {
    id: 'signature',
    name: 'Muhar Burgundy',
    primary: '#6f4c56',
    bg: '#2b0e18',
  },
  {
    id: 'cyber',
    name: 'Cyber Cyan',
    primary: '#00f2fe',
    bg: '#050505',
  },
  {
    id: 'emerald',
    name: 'Matrix Emerald',
    primary: '#10b981',
    bg: '#03140e',
  },
  {
    id: 'noir',
    name: 'Monochrome Noir',
    primary: '#ffffff',
    bg: '#09090b',
  },
];

export const ThemeSwitcher: React.FC = () => {
  const [currentTheme, setCurrentTheme] = useState<ThemePreset>('signature');
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const savedTheme = localStorage.getItem('linktree_theme') as ThemePreset;
    if (savedTheme && THEME_OPTIONS.some(t => t.id === savedTheme)) {
      applyTheme(savedTheme);
    } else {
      applyTheme('signature');
    }
  }, []);

  const applyTheme = (themeId: ThemePreset) => {
    setCurrentTheme(themeId);
    localStorage.setItem('linktree_theme', themeId);
    
    if (themeId === 'signature') {
      document.documentElement.removeAttribute('data-theme');
    } else {
      document.documentElement.setAttribute('data-theme', themeId);
    }
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-2.5 rounded-full bg-white/10 hover:bg-white/20 text-white/90 hover:text-white backdrop-blur-md transition-all duration-300 hover:scale-105 shadow-md flex items-center justify-center"
        title="Theme Palette"
        aria-label="Switch Theme"
      >
        <Palette size={16} />
      </button>

      {isOpen && (
        <>
          <div 
            className="fixed inset-0 z-40" 
            onClick={() => setIsOpen(false)} 
          />

          <div className="absolute right-0 mt-2 w-48 rounded-2xl bg-zinc-950/95 border border-white/15 p-2 shadow-2xl backdrop-blur-2xl z-50 animate-scale-up flex flex-col gap-1">
            <div className="px-2.5 py-1 text-[10px] font-mono uppercase tracking-wider text-white/60 font-semibold border-b border-white/10 mb-1">
              Color Themes
            </div>

            {THEME_OPTIONS.map((theme) => {
              const isActive = currentTheme === theme.id;
              return (
                <button
                  key={theme.id}
                  onClick={() => {
                    applyTheme(theme.id);
                    setIsOpen(false);
                  }}
                  className={`w-full p-2 rounded-xl flex items-center justify-between text-left text-xs font-dmsans transition-all ${
                    isActive 
                      ? 'bg-white/15 text-white font-medium' 
                      : 'hover:bg-white/10 text-white/70 hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <span 
                      className="w-3.5 h-3.5 rounded-full border border-white/20 shrink-0 shadow-xs" 
                      style={{ backgroundColor: theme.primary }} 
                    />
                    <span>{theme.name}</span>
                  </div>

                  {isActive && <Check size={14} className="text-white" />}
                </button>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
};
