export interface Service {
  slug: string;
  name: string;
  tagline: string;
  replaces: string;
  port: number;
  difficulty: 1 | 2 | 3;
  folder: string;
  icon: string;
  accentColor: string;
}

export const services: Service[] = [
  {
    slug: 'jellyfin',
    name: 'Jellyfin',
    tagline: 'A powerful, open-source media system that organizes, manages, and streams your movies, shows, and music.',
    replaces: 'Netflix, Plex, Emby, Apple TV+',
    port: 8096,
    difficulty: 1,
    folder: '01-media-server',
    icon: '🎬',
    accentColor: '#8b5cf6',
  },
  {
    slug: 'arr-stack',
    name: 'The *arr Stack',
    tagline: 'Automated media downloading, search indexers, quality monitoring, and request portal.',
    replaces: 'Manual torrenting, Radarr, Sonarr, manual renaming, and folder management.',
    port: 8080,
    difficulty: 2,
    folder: '02-arr-stack',
    icon: '📥',
    accentColor: '#f59e0b',
  },
  {
    slug: 'navidrome',
    name: 'Navidrome',
    tagline: 'A modern, lightweight, fast web-based music server and Subsonic-compatible audio streaming system.',
    replaces: 'Spotify, Apple Music, YouTube Music, Tidal',
    port: 4533,
    difficulty: 1,
    folder: '03-music-server',
    icon: '🎵',
    accentColor: '#22c55e',
  },
  {
    slug: 'immich',
    name: 'Immich',
    tagline: 'High-performance self-hosted backup and organization platform for your mobile photos and videos.',
    replaces: 'Google Photos, Apple iCloud Photos, Amazon Photos',
    port: 2283,
    difficulty: 2,
    folder: '04-photo-server',
    icon: '📸',
    accentColor: '#f97316',
  },
  {
    slug: 'nextcloud',
    name: 'Nextcloud',
    tagline: 'A comprehensive, self-hosted file collaboration, synchronization, document editing, and productivity platform.',
    replaces: 'Google Drive, Dropbox, Microsoft OneDrive, Google Docs',
    port: 4443,
    difficulty: 2,
    folder: '05-cloud-storage',
    icon: '☁️',
    accentColor: '#0ea5e9',
  },
];
