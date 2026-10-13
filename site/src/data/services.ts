export type Category = 'media' | 'files' | 'docs' | 'home' | 'access' | 'monitoring';

export interface Service {
  slug: string;
  name: string;
  tagline: string;
  replaces: string;
  difficulty: 1 | 2 | 3;
  /** Folder under stacks/ with a beginner Compose file. Omitted when the repo has no stack for it yet. */
  folder?: string;
  category: Category;
}

export const categories: { id: Category; label: string; blurb: string }[] = [
  { id: 'media', label: 'Media and books', blurb: 'Films, shows, music, books and games from your own library.' },
  { id: 'files', label: 'Photos and files', blurb: 'Phone backups, file sync and plain web access to your folders.' },
  { id: 'docs', label: 'Documents and tools', blurb: 'Paperwork, PDFs, notes, code and small everyday utilities.' },
  { id: 'home', label: 'Home and network', blurb: 'Smart home control and ad blocking for every device in the house.' },
  { id: 'access', label: 'Access and security', blurb: 'Reach your apps safely and keep your passwords on your own server.' },
  { id: 'monitoring', label: 'Monitoring and management', blurb: 'Know when something breaks, and manage containers without a terminal.' },
];

export const difficultyLabel = (d: 1 | 2 | 3 | number) =>
  d === 1 ? 'Easy' : d === 2 ? 'Medium' : 'Advanced';

export const hasStack = (s: { folder?: string }) => Boolean(s.folder);

export const services: Service[] = [
  // Media and books
  {
    slug: 'jellyfin',
    name: 'Jellyfin',
    tagline: 'Stream your own movies and shows to any screen in the house.',
    replaces: 'Netflix, Plex, Emby',
    difficulty: 1,
    folder: 'media-server',
    category: 'media',
  },
  {
    slug: 'arr-stack',
    name: '*arr stack and Seerr',
    tagline: 'Request a film or show once; it downloads, gets renamed and lands in Jellyfin.',
    replaces: 'Manual downloading and renaming',
    difficulty: 2,
    folder: 'arr-stack',
    category: 'media',
  },
  {
    slug: 'navidrome',
    name: 'Navidrome',
    tagline: 'Your own music streaming server, with mobile apps that speak Subsonic.',
    replaces: 'Spotify, Apple Music',
    difficulty: 1,
    folder: 'music-server',
    category: 'media',
  },
  {
    slug: 'feishin',
    name: 'Feishin',
    tagline: 'A desktop and web music player for Navidrome and Jellyfin libraries.',
    replaces: 'The Spotify desktop app',
    difficulty: 1,
    category: 'media',
  },
  {
    slug: 'audiomuse-ai',
    name: 'AudioMuse AI',
    tagline: 'Analyses the sound of your music library and builds playlists from it.',
    replaces: 'Spotify radio and generated mixes',
    difficulty: 3,
    category: 'media',
  },
  {
    slug: 'kavita',
    name: 'Kavita',
    tagline: 'A reader for ebooks, comics and manga that remembers where you stopped.',
    replaces: 'Kindle Cloud Reader, ComiXology',
    difficulty: 1,
    folder: 'book-reader',
    category: 'media',
  },
  {
    slug: 'romm',
    name: 'RomM',
    tagline: 'Organise your game ROMs with cover art, and play many of them in the browser.',
    replaces: 'Loose ROM folders, LaunchBox',
    difficulty: 2,
    category: 'media',
  },

  // Photos and files
  {
    slug: 'immich',
    name: 'Immich',
    tagline: 'Phone photo and video backup with face search, all on your own disks.',
    replaces: 'Google Photos, iCloud Photos',
    difficulty: 2,
    folder: 'photo-backup',
    category: 'files',
  },
  {
    slug: 'nextcloud',
    name: 'Nextcloud',
    tagline: 'File sync and sharing across your devices, plus calendars and contacts.',
    replaces: 'Google Drive, Dropbox, OneDrive',
    difficulty: 2,
    folder: 'cloud-storage',
    category: 'files',
  },
  {
    slug: 'file-browser',
    name: 'File Browser',
    tagline: 'Browse, upload and share files from a server folder in a web page.',
    replaces: 'SFTP clients, Dropbox web',
    difficulty: 1,
    category: 'files',
  },

  // Documents and tools
  {
    slug: 'paperless-ngx',
    name: 'Paperless-ngx',
    tagline: 'Scan paper documents, make them searchable with OCR, and file them by tag.',
    replaces: 'Filing cabinets, Evernote scans',
    difficulty: 2,
    category: 'docs',
  },
  {
    slug: 'stirling-pdf',
    name: 'Stirling PDF',
    tagline: 'Merge, split, compress, convert and sign PDFs without uploading them anywhere.',
    replaces: 'iLovePDF, Smallpdf, Adobe Acrobat online',
    difficulty: 1,
    category: 'docs',
  },
  {
    slug: 'memos',
    name: 'Memos',
    tagline: 'A timeline of quick Markdown notes, like a private microblog.',
    replaces: 'Google Keep, Apple Notes',
    difficulty: 1,
    category: 'docs',
  },
  {
    slug: 'gitea',
    name: 'Gitea',
    tagline: 'A light Git server with repositories, issues, pull requests and CI.',
    replaces: 'GitHub, GitLab',
    difficulty: 2,
    category: 'docs',
  },
  {
    slug: 'mini-qr',
    name: 'Mini QR',
    tagline: 'Make and scan styled QR codes, with no ads or tracking.',
    replaces: 'Ad-filled online QR generators',
    difficulty: 1,
    category: 'docs',
  },

  // Home and network
  {
    slug: 'home-assistant',
    name: 'Home Assistant',
    tagline: 'Run smart home automations locally, across brands, without a vendor cloud.',
    replaces: 'SmartThings, Apple Home, Google Nest',
    difficulty: 2,
    folder: 'home-automation',
    category: 'home',
  },
  {
    slug: 'adguard-home',
    name: 'AdGuard Home',
    tagline: 'Block ads and trackers for every device on your network at the DNS level.',
    replaces: 'Pi-hole, NextDNS, per-device blockers',
    difficulty: 1,
    folder: 'home-automation',
    category: 'home',
  },

  // Access and security
  {
    slug: 'nginx-proxy-manager',
    name: 'Nginx Proxy Manager',
    tagline: 'Give each app a proper name and HTTPS certificate from a web dashboard.',
    replaces: 'Hand-written Nginx config files',
    difficulty: 2,
    folder: 'networking/option-b-cloudflare',
    category: 'access',
  },
  {
    slug: 'tailscale',
    name: 'Tailscale',
    tagline: 'A private WireGuard network between your devices, so apps stay off the open internet.',
    replaces: 'OpenVPN servers, exposing apps publicly',
    difficulty: 1,
    folder: 'networking/option-d-tailscale',
    category: 'access',
  },
  {
    slug: 'vaultwarden',
    name: 'Vaultwarden',
    tagline: 'A light Bitwarden-compatible password server that works with the official apps.',
    replaces: 'Bitwarden cloud, 1Password, LastPass',
    difficulty: 2,
    category: 'access',
  },

  // Monitoring and management
  {
    slug: 'uptime-kuma',
    name: 'Uptime Kuma',
    tagline: 'Checks that your apps respond and alerts you when one goes down.',
    replaces: 'UptimeRobot, Pingdom',
    difficulty: 1,
    category: 'monitoring',
  },
  {
    slug: 'grafana-prometheus',
    name: 'Grafana and Prometheus',
    tagline: 'Collect metrics from your servers and apps, then graph and alert on them.',
    replaces: 'Datadog, New Relic',
    difficulty: 3,
    category: 'monitoring',
  },
  {
    slug: 'scrutiny',
    name: 'Scrutiny',
    tagline: 'Watches the S.M.A.R.T. health of your hard drives and warns before they fail.',
    replaces: 'Manual smartctl checks, CrystalDiskInfo',
    difficulty: 2,
    category: 'monitoring',
  },
  {
    slug: 'portainer',
    name: 'Portainer',
    tagline: 'Start, stop, inspect and update Docker containers from a web interface.',
    replaces: 'Docker Desktop, the Docker CLI for daily tasks',
    difficulty: 1,
    category: 'monitoring',
  },
  {
    slug: 'dozzle',
    name: 'Dozzle',
    tagline: 'Live logs from every container in one browser tab.',
    replaces: 'Running docker logs in a terminal',
    difficulty: 1,
    category: 'monitoring',
  },
  {
    slug: 'watchtower',
    name: 'Watchtower',
    tagline: 'Pulls new images for running containers and restarts them with the same settings.',
    replaces: 'Pulling and recreating containers by hand',
    difficulty: 1,
    category: 'monitoring',
  },
];
