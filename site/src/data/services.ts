export interface Service {
  slug: string;
  name: string;
  tagline: string;
  replaces: string;
  port: number;
  icon: string;
  accentColor: string;
  difficulty: 1 | 2 | 3;
  folder: string;
  githubPath: string;
  mockupType: string;
}

export const services: Service[] = [
  {
    slug: 'jellyfin',
    name: 'Jellyfin',
    tagline: 'Your personal Netflix',
    replaces: 'Netflix, Plex, Emby',
    port: 8096,
    icon: '🎬',
    accentColor: '#00a4dc',
    difficulty: 1,
    folder: 'media-server',
    githubPath: 'stacks/media-server',
    mockupType: 'wizard',
  },
  {
    slug: 'arr-stack',
    name: '*arr Stack & Jellyseerr',
    tagline: 'Automated downloading & organization',
    replaces: 'Manual torrenting, Radarr, Sonarr',
    port: 8080,
    icon: '⚡',
    accentColor: '#10b981',
    difficulty: 2,
    folder: 'arr-stack',
    githubPath: 'stacks/arr-stack',
    mockupType: 'library',
  },
  {
    slug: 'navidrome',
    name: 'Navidrome',
    tagline: 'Your personal music cloud',
    replaces: 'Spotify, Apple Music',
    port: 4533,
    icon: '🎵',
    accentColor: '#f59e0b',
    difficulty: 1,
    folder: 'music-server',
    githubPath: 'stacks/music-server',
    mockupType: 'login',
  },
  {
    slug: 'kavita',
    name: 'Kavita',
    tagline: 'Your personal book, comic & manga reader',
    replaces: 'Kindle Cloud Reader, ComiXology',
    port: 5000,
    icon: '📚',
    accentColor: '#ec4899',
    difficulty: 1,
    folder: 'book-reader',
    githubPath: 'stacks/book-reader',
    mockupType: 'library',
  },
  {
    slug: 'immich',
    name: 'Immich',
    tagline: 'Self-hosted AI photo & video backup',
    replaces: 'Google Photos, iCloud Photos',
    port: 2283,
    icon: '🖼️',
    accentColor: '#6366f1',
    difficulty: 2,
    folder: 'photo-backup',
    githubPath: 'stacks/photo-backup',
    mockupType: 'onboarding',
  },
  {
    slug: 'nextcloud',
    name: 'Nextcloud',
    tagline: 'Collaborative cloud storage & suite',
    replaces: 'Google Drive, Dropbox, OneDrive',
    port: 4443,
    icon: '☁️',
    accentColor: '#0082c9',
    difficulty: 2,
    folder: 'cloud-storage',
    githubPath: 'stacks/cloud-storage',
    mockupType: 'wizard',
  },
];
