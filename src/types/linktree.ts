export interface SocialLink {
  platform: 'github' | 'twitter' | 'linkedin' | 'telegram' | 'whatsapp' | 'instagram' | 'email' | 'youtube' | 'website';
  url: string;
  label: string;
}

export interface LinkItem {
  id: string;
  title: string;
  description?: string;
  url: string;
  icon?: string;
  badge?: string;
  category?: 'featured' | 'projects' | 'socials' | 'services' | 'other';
  highlight?: boolean;
  accentColor?: string;
  glowColor?: string;
}

export interface MusicTrackConfig {
  id: string;
  title: string;
  artist: string;
  duration: number;
  audioUrl: string;
  thumbnail?: string;
}

export interface MusicConfig {
  enabled: boolean;
  defaultTrack?: MusicTrackConfig | null;
  volume: number;
  loop: boolean;
  presets?: string[];
  autoplay?: boolean;
}

export interface FeatureFlags {
  filmGrain: boolean;
  sunsetVignette: boolean;
  soundEffects: boolean;
  keyboardShortcuts: boolean;
}

export interface ProfileDetails {
  name: string;
  handle: string;
  title: string;
  bio: string;
  avatarUrl: string;
  avatarLocalFallback?: string;
}

export type ProfileConfig = ProfileDetails;

export interface AppConfig {
  profile: ProfileDetails;
  music: MusicConfig;
  features: FeatureFlags;
  socials: SocialLink[];
  links: LinkItem[];
}
