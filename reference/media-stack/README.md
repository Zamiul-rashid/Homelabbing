# The July 2026 media stack (`reference/media-stack/`)

> [!IMPORTANT]
> **[`docker-compose.yml`](docker-compose.yml) is a July 2026 snapshot.** In July, 25 containers lived in this one file. The lab has since split them into smaller stacks grouped by job. Read the file to learn from it; do not deploy it as your first server. Start with [`../../stacks/`](../../stacks/README.md).

---

## What the snapshot file contains

All 25 services in one Compose file, on three networks: one for the apps people use, one for the download side, and an internal one for databases. Here is what each service does.

### Media

| Service | What it does |
| :--- | :--- |
| `jellyfin` | Media server: indexes movies and TV, fetches artwork and streams to TVs, phones and browsers. |
| `navidrome` | Music server with the Subsonic API, so any Subsonic app can stream from it. |
| `kavita` | Reader for ebooks, comics and manga, with progress sync. |
| `feishin` | A desktop and web player for Navidrome and Jellyfin music. |

### Requests and downloads

| Service | What it does |
| :--- | :--- |
| `jellyseerr` | The request page: people pick a film or show and press Request. Its successor is called Seerr. |
| `radarr` | Watches for movies, picks releases by quality profile, imports and renames them. |
| `sonarr` | The same for TV series, episode by episode. |
| `prowlarr` | Manages indexers in one place and syncs them to Radarr and Sonarr. |
| `qbittorrent` | The download client. |

### Documents, tools and AI

| Service | What it does |
| :--- | :--- |
| `paperless-ngx` | Document archive: OCR, full-text search and automatic tags for scanned letters and invoices. |
| `redis` | Task queue for Paperless-ngx. |
| `stirling-pdf` | Merge, split, compress, OCR and redact PDFs locally. |
| `filebrowser` | A web file manager for the data disks. |
| `audiomuse-ai` | Analyses the music library to build mood tags and "sounds like" playlists. |
| `audiomuse-ai-worker` | Does the heavy audio analysis in the background. |
| `audiomuse-db` | Postgres with the `pgvector` extension for AudioMuse. |
| `actual-budget` | Personal budgeting app. |

### Smart home and DNS

| Service | What it does |
| :--- | :--- |
| `homeassistant` | Smart home hub and automations. |
| `mosquitto` | MQTT broker for sensors and devices talking to Home Assistant. |
| `adguardhome` | DNS resolver for the LAN that blocks ads and trackers. |

### Dashboards and management

| Service | What it does |
| :--- | :--- |
| `homepage` | Dashboard with links and live stats. |
| `homarr` | Another dashboard. |
| `uptime-kuma` | Checks that services answer and shows uptime history. |
| `portainer` | Web UI for containers, volumes and logs. |
| `watchtower` | Updates containers when new images appear. Safer when it only touches containers that opt in with a label. |

The file does **not** contain a VPN container. Earlier versions of this README talked about routing downloads through `gluetun`; that was never deployed.

---

## The networks

The bottom of the file defines three networks:

- **An app network** for what people open in a browser or a TV app.
- **A download network** for the download client and the *arr apps, kept apart from the apps people use.
- **An internal network** (`internal: true`) for Redis and the AudioMuse database. It has no route to the internet and no published ports. Only the apps attached to it as well as to the app network can reach the databases.

[`../README.md`](../README.md#patterns-worth-taking-from-it) explains why the networks are split this way.

---

## Storage paths

qBittorrent writes to `/data/torrents`, and Radarr and Sonarr import into `/data/media/movies` and `/data/media/tv`. As long as torrents and media sit on the same filesystem, mounted into each container as one `/data` volume, imports are hardlinks: instant, and no extra space used.
