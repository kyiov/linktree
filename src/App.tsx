import React, { useState, useEffect } from 'react';
import appConfig from './config/config.json';
import { AppConfig } from './types/linktree';
import { ProfileHero, ProfileInfo } from './components/ProfileHeader';
import { LinkList } from './components/LinkList';
import { FilmGrain } from './components/FilmGrain';
import { MusicPlayer } from './components/MusicPlayer';
import { ProfileFooter } from './components/ProfileFooter';
import { playTactileClick, playCopySuccess } from './utils/audio';

const App: React.FC = () => {
  const [config] = useState<AppConfig>(appConfig as unknown as AppConfig);

  useEffect(() => {
    if (!config.features?.keyboardShortcuts) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes(target?.tagName)) return;

      if (e.key >= '1' && e.key <= '9') {
        const idx = parseInt(e.key, 10) - 1;
        if (idx < config.links.length) {
          const targetLink = config.links[idx];
          if (targetLink) {
            playTactileClick();
            window.open(targetLink.url, '_blank');
          }
        }
      }

      if (e.key.toLowerCase() === 'c') {
        playCopySuccess();
        navigator.clipboard.writeText(window.location.href);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [config.links, config.features?.keyboardShortcuts]);

  return (
    <div className="relative min-h-screen w-full flex flex-col items-center justify-start overflow-x-clip bg-[#2b0e18]">
      {config.features?.filmGrain && <FilmGrain />}

      <MusicPlayer config={config.music} />

      <main className="relative w-full max-w-[580px] mx-auto flex flex-col items-center">
        <div className="sticky top-0 z-0 w-full flex justify-center overflow-hidden pointer-events-auto">
          <ProfileHero profile={config.profile} />
        </div>

        <div className="relative z-10 w-full bg-[#2b0e18] -mt-16 sm:-mt-20 pt-4 rounded-t-[32px] sm:rounded-t-[36px] shadow-[0_-24px_50px_rgba(0,0,0,0.85)] border-t border-white/10 flex flex-col items-center min-h-[calc(100vh-220px)]">
          <div className="w-9 h-1 rounded-full bg-white/20 mb-3.5 pointer-events-none" />

          <ProfileInfo profile={config.profile} socials={config.socials} />

          <div className="w-full px-3.5 sm:px-7">
            <LinkList links={config.links} />
          </div>

          <div className="w-full px-4 sm:px-7">
            <ProfileFooter handle={config.profile.handle} totalLinks={config.links.length} />
          </div>
        </div>
      </main>
    </div>
  );
};

export default App;
