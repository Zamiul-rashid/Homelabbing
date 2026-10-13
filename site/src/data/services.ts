export type Category = 'media' | 'files' | 'home';

export interface Service {
  slug: string;
  name: string;
  tagline: string;
  replaces: string;
  port: number;
  difficulty: 1 | 2 | 3;
  folder: string;
  category: Category;
}

export const categories: { id: Category; label: string }[] = [
  { id: 'media', label: 'Media and books' },
  { id: 'files', label: 'Photos and files' },
  { id: 'home', label: 'Home and network' },
];

export const difficultyLabel = (d: 1 | 2 | 3 | number) =>
  d === 1 ? 'Easy' : d === 2 ? 'Medium' : 'Advanced';

export const services: Service[] = [
  {
    slug: 'jellyfin',
    name: 'Jellyfin',
    tagline: 'Stream your own movies and shows to any screen in the house.',
    replaces: 'Netflix, Plex, Emby',
    port: 8096,
    difficulty: 1,
    folder: 'media-server',
    category: 'media',
  },
  {
    slug: 'arr-stack',
    name: '*arr stack and Jellyseerr',
    tagline: 'Request a film or show once; it downloads, gets renamed and lands in Jellyfin.',
    replaces: 'Manual downloading and renaming',
    port: 8080,
    difficulty: 2,
    folder: 'arr-stack',
    category: 'media',
  },
  {
    slug: 'navidrome',
    name: 'Navidrome',
    tagline: 'Your own music streaming server, with mobile apps that speak Subsonic.',
    replaces: 'Spotify, Apple Music',
    port: 4533,
    difficulty: 1,
    folder: 'music-server',
    category: 'media',
  },
  {
    slug: 'kavita',
    name: 'Kavita',
    tagline: 'A reader for ebooks, comics and manga that remembers where you stopped.',
    replaces: 'Kindle Cloud Reader, ComiXology',
    port: 5000,
    difficulty: 1,
    folder: 'book-reader',
    category: 'media',
  },
  {
    slug: 'immich',
    name: 'Immich',
    tagline: 'Phone photo and video backup with face search, all on your own disks.',
    replaces: 'Google Photos, iCloud Photos',
    port: 2283,
    difficulty: 2,
    folder: 'photo-backup',
    category: 'files',
  },
  {
    slug: 'nextcloud',
    name: 'Nextcloud',
    tagline: 'File sync and sharing across your devices, plus calendars and contacts.',
    replaces: 'Google Drive, Dropbox, OneDrive',
    port: 4443,
    difficulty: 2,
    folder: 'cloud-storage',
    category: 'files',
  },
  {
    slug: 'home-assistant',
    name: 'Home Assistant',
    tagline: 'Run smart home automations locally, across brands, without a vendor cloud.',
    replaces: 'SmartThings, Apple Home, Google Nest',
    port: 8123,
    difficulty: 2,
    folder: 'home-automation',
    category: 'home',
  },
  {
    slug: 'adguard-home',
    name: 'AdGuard Home',
    tagline: 'Block ads and trackers for every device on your network at the DNS level.',
    replaces: 'Pi-hole, NextDNS, per-device blockers',
    port: 8083,
    difficulty: 1,
    folder: 'home-automation',
    category: 'home',
  },
];
