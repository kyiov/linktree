import React from 'react';
import { ProfileDetails, SocialLink } from '../types/linktree';
import { SocialBar } from './SocialBar';
import { KineticText } from './KineticText';

interface ProfileHeaderProps {
  profile: ProfileDetails;
  socials: SocialLink[];
}

export const ProfileHero: React.FC<{ profile: ProfileDetails }> = ({ profile }) => {
  const heroImg = profile.avatarUrl;

  return (
    <div 
      id="profile-picture"
      className="group/hero relative w-full h-[calc(100vw-80px)] sm:h-[440px] max-h-[480px] sm:rounded-t-2xl overflow-hidden cursor-pointer animate-hero-entrance select-none"
    >
      <div 
        className="hero-avatar-mask absolute inset-0 z-0 transition-transform duration-700 ease-out group-hover/hero:scale-[1.02]"
      >
        <img 
          src={heroImg} 
          alt={profile.name} 
          className="w-full h-full object-cover object-[center_38%] select-none"
          loading="eager"
        />
        <div className="hero-avatar-blur-mask absolute inset-0 z-10 pointer-events-none">
          <img 
            src={heroImg} 
            alt="" 
            role="presentation"
            className="w-full h-full object-cover object-[center_38%] select-none blur-[6px]"
          />
        </div>
      </div>
    </div>
  );
};

export const ProfileInfo: React.FC<{ profile: ProfileDetails; socials: SocialLink[] }> = ({ profile, socials }) => {
  return (
    <div className="relative w-full flex flex-col items-center">
      <div 
        id="profile-title" 
        className="relative z-20 mb-1.5 text-center w-full px-4 animate-fade-up"
        style={{ animationDelay: '120ms' }}
      >
        <div className="relative inline-flex flex-col items-center">
          <h1 className="font-display font-black text-[40px] sm:text-[46px] leading-tight text-white tracking-tight select-none">
            <KineticText text={profile.name} hoverColor="#fcd34d" />
          </h1>

          <svg
            className="w-[110px] sm:w-[130px] h-3 text-[#fcd34d] -mt-1 overflow-visible pointer-events-none drop-shadow-[0_2px_8px_rgba(252,211,77,0.45)]"
            viewBox="0 0 200 12"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M4 8.5C48 3.5 152 3.5 196 8.5"
              stroke="currentColor"
              strokeWidth="3.5"
              strokeLinecap="round"
            />
          </svg>
        </div>
      </div>

      <div 
        className="relative z-20 mt-1 mb-5 w-full flex justify-center animate-fade-up"
        style={{ animationDelay: '200ms' }}
      >
        <SocialBar socials={socials} />
      </div>
    </div>
  );
};

export const ProfileHeader: React.FC<ProfileHeaderProps> = ({ profile, socials }) => {
  return (
    <header className="relative w-full flex flex-col items-center">
      <ProfileHero profile={profile} />
      <ProfileInfo profile={profile} socials={socials} />
    </header>
  );
};
