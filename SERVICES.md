# 📦 Comprehensive Service Directory & Architecture Justification

Our homelab runs more than **25 specialized Docker containers** carefully grouped across three decoupled compose stacks (`media-stack`, `nextcloud-stack`, and `proxy-stack`). Every service was selected based on strict criteria: active open-source development, stability, low resource consumption, clean API design, and long-term maintainability.

This document provides a detailed breakdown of each service, what port it exposes, which internal Docker network it resides on, and exactly why it was chosen over alternatives.

---

## 1. Core Proxy & Edge Routing (`proxy-stack`)

The `proxy-stack` serves as the edge gateway. It connects directly to the host's primary ports (`80`, `443`, `81`) and creates the shared `proxy-net` network that allows internal applications to receive clean, SSL-terminated HTTPS subdomains.

| Service | Container Name | Port(s) | Network(s) | Role & Justification |
|---|---|---|---|---|
| **[Nginx Proxy Manager](https://nginxproxymanager.com/)** | `nginx-proxy-manager` | `80:80`<br>`443:443`<br>`81:81` | `proxy-net`<br>`host` | **Reverse Proxy & SSL Gateway:** Provides a clean, intuitive web GUI to manage reverse proxy routing (`https://app.your-subdomain.duckdns.org` → `http://container:port`). Selected over raw Nginx or Traefik for its accessible GUI, built-in Let's Encrypt automation, and effortless management of custom access lists and WebSocket upgrades. |
| **[DuckDNS](https://www.duckdns.org/)** | `duckdns` | Background | `proxy-net` | **Dynamic DNS Updater:** Lightweight utility that checks your residential public IP every 5 minutes and updates your free `.duckdns.org` domain registration. Ensures that remote connections and SSL certificates remain valid even when your ISP rotates your IP address. |

---

## 2. Media Streaming & Entertainment (`media-stack`)

The entertainment core provides uncompressed 4K video, lossless audio streaming, and high-speed ebook reading across every device in your household.

| Service | Container Name | Port(s) | Network(s) | Role & Justification |
|---|---|---|---|---|
| **[Jellyfin](https://jellyfin.org/)** | `jellyfin` | `8096:8096` | `media_net` | **Primary Video Media Server:** Stream movies, TV series, and personal video libraries. Chosen over Plex and Emby because Jellyfin is 100% free, fully open-source, requires zero remote authentication servers, and offers unrestricted hardware transcoding without paywalls. |
| **[Navidrome](https://www.navidrome.org/)** | `navidrome` | `4533:4533` | `media_net` | **Personal Music Subsonic Server:** Blazing-fast, Go-based music server that indexes huge audio libraries in seconds with tiny RAM overhead (<100 MB). Compatible with hundreds of mobile apps (Symfonium, Amperfy, Substreamer) via the standard Subsonic API. |
| **[Feishin](https://github.com/jeffvli/feishin)** | `feishin` | `9180:9180` | `media_net` | **Modern Web Music Client:** A sleek, desktop-inspired web player specifically built for Subsonic servers like Navidrome. Features instant search, synchronized lyrics display, custom playlist management, and responsive layouts. |
| **[Kavita](https://www.kavitareader.com/)** | `kavita` | `5050:5000` | `media_net` | **eBook, Comic & Manga Reader:** Highly optimized reading server supporting EPUB, PDF, CBZ, and CBR formats. Selected over Komga/Calibre-Web for its built-in web reader, OPDS support, and smooth handling of massive multi-volume manga collections. |

---

## 3. Automated *Arr Download Pipeline (`media-stack`)

The automated acquisition and curation pipeline monitors release schedules, discovers high-quality media files, downloads them cleanly via BitTorrent, and upgrades them automatically based on TRaSH Guides custom format scoring.

| Service | Container Name | Port(s) | Network(s) | Role & Justification |
|---|---|---|---|---|
| **[Radarr](https://radarr.video/)** | `radarr` | `7878:7878` | `download_net` | **Movie Automation Manager:** Monitors upcoming movie releases, searches indexers for preferred resolutions (1080p Blu-ray/WEB-DL), and instructs qBittorrent to download and organize files cleanly into `/data/media/movies`. |
| **[Sonarr](https://sonarr.tv/)** | `sonarr` | `8989:8989` | `download_net` | **TV Series Automation Manager:** Tracks episodic television seasons, automatically downloads new episodes within minutes of broadcast, renames files to standardized conventions, and upgrades lower-quality web releases when high-bitrate Blu-rays drop. |
| **[Prowlarr](https://prowlarr.com/)** | `prowlarr` | `9696:9696` | `download_net` | **Central Indexer Manager:** Acts as the single synchronization brain for all your torrent trackers and Usenet indexers. Instead of configuring indexers inside both Radarr and Sonarr, you configure them once in Prowlarr (`fullSync`), which pushes them instantly across the entire stack. |
| **[Jellyseerr](https://github.com/Fallenbagel/jellyseerr)** | `jellyseerr` | `5055:5055` | `media_net`<br>`download_net` | **Household Request Portal:** Beautiful discovery and request application that bridges normal users with your backend *arr stack. Family members browse trending movies/shows and click "Request"—Jellyseerr automatically checks availability in Jellyfin or triggers downloads via Radarr/Sonarr. |
| **[qBittorrent](https://www.qbittorrent.org/)** | `qbittorrent` | `8080:8080`<br>`6881:6881` | `download_net` | **BitTorrent Download Client:** Reliable, stable torrent downloader wired directly into `/data/torrents`. Configured with separate incomplete download directories and automatic categorization (`radarr` and `sonarr`) for zero-copy hardlinking. |

---

## 4. Artificial Intelligence & Vector Processing (`media-stack`)

We leverage modern machine learning and vector embeddings to intelligently organize and analyze personal collections locally.

| Service | Container Name | Port(s) | Network(s) | Role & Justification |
|---|---|---|---|---|
| **[AudioMuse AI](https://github.com/neptunehub/audiomuse-ai)** | `audiomuse-ai` | `5000:8000` | `media_net`<br>`infra_net` | **AI Music Recommendation Engine:** Connects to your Navidrome library and analyzes acoustic signatures, genres, and listening patterns using Gemini API or local OpenAI embeddings to generate intelligent, context-aware playlists and recommendations. |
| **AudioMuse Worker** | `audiomuse-ai-worker` | Background | `media_net`<br>`infra_net` | **Asynchronous AI Worker Task:** Dedicated background processor that handles intensive audio embedding computations and metadata indexing without blocking the primary web server or freezing UI responses. |
| **[PostgreSQL (pgvector)](https://github.com/pgvector/pgvector)** | `audiomuse-db` | Internal | `infra_net` | **Vector Database Backend:** Relational database running the `pgvector` extension. Stores high-dimensional vector embeddings generated by AudioMuse AI, allowing ultra-fast cosine similarity searches across thousands of audio tracks. |

---

## 5. Document Management, Finance & Utilities (`media-stack`)

Reclaim your physical office space and financial records with self-hosted productivity suites.

| Service | Container Name | Port(s) | Network(s) | Role & Justification |
|---|---|---|---|---|
| **[Paperless-ngx](https://docs.paperless-ngx.com/)** | `paperless-ngx` | `8010:8000` | `media_net`<br>`infra_net` | **Intelligent Document Archiver:** Drop scanned PDFs, bills, receipts, or contracts into your consume folder. Paperless-ngx automatically performs optical character recognition (OCR), extracts text, applies machine-learning tags, and indexes everything into an instant, searchable PDF archive. |
| **[Stirling PDF](https://github.com/Stirling-Tools/Stirling-PDF)** | `stirling-pdf` | `18888:8080` | `media_net` | **All-in-One PDF Tool Suite:** Powerful web utility allowing you to split, merge, compress, rotate, OCR, watermark, and convert PDF documents locally. Eliminates the need to upload confidential business or medical documents to sketchy free online conversion sites. |
| **[Actual Budget](https://actualbudget.org/)** | `actual-budget` | `5006:5006` | `media_net` | **Personal Finance Envelope Budgeting:** Fast, local-first budgeting platform inspired by YNAB. Features automatic transaction categorization, multi-device syncing, custom reporting, and end-to-end encryption. |
| **[Filebrowser](https://filebrowser.org/)** | `filebrowser` | `8083:80` | `media_net` | **Web-Based File Manager:** Lightweight file explorer providing direct web access to your underlying `/data` storage pool and backup archives. Perfect for uploading bulk media, reviewing configuration backups, or managing files from mobile devices. |

---

## 6. Smart Home Hub & IoT Infrastructure (`media-stack`)

Unify disparate smart home protocols and automation logic under one private, local-first umbrella.

| Service | Container Name | Port(s) | Network(s) | Role & Justification |
|---|---|---|---|---|
| **[Home Assistant](https://www.home-assistant.io/)** | `homeassistant` | `host` (`8123`) | `host` | **Smart Home Central Controller:** Runs in `network_mode: host` to enable local network discovery (mDNS, UPnP, HomeKit). Integrates thousands of smart devices (lights, thermostats, cameras, locks) and executes complex automations without internet dependencies. |
| **[Mosquitto](https://mosquitto.org/)** | `mosquitto` | `1883:1883`<br>`9001:9001` | `media_net` | **MQTT Message Broker:** Ultra-low-latency messaging backbone. Serves as the critical communication bridge between Home Assistant and local IoT hardware like Zigbee2MQTT dongles, Tasmota smart plugs, and custom ESPHome sensors. |

---

## 7. Cloud Storage & Synchronization (`nextcloud-stack`)

| Service | Container Name | Port(s) | Network(s) | Role & Justification |
|---|---|---|---|---|
| **[Nextcloud](https://nextcloud.com/)** | `nextcloud` | `4443:443` | `nextcloud_net` | **Self-Hosted Cloud Productivity Suite:** Full replacement for Google Workspace and iCloud. Provides multi-terabyte file syncing across desktop and mobile, calendar sharing, contact management, photo galleries, and collaborative document editing. |
| **[MariaDB](https://mariadb.org/)** | `nextcloud_db` | Internal | `nextcloud_net` | **Dedicated Nextcloud Database:** Highly optimized relational database engine handling Nextcloud's file indices, user profiles, and activity logs inside an isolated Docker network. |

---

## 8. Core Infrastructure, Caching & Monitoring (`media-stack`)

| Service | Container Name | Port(s) | Network(s) | Role & Justification |
|---|---|---|---|---|
| **[AdGuard Home](https://adguard.com/en/adguard-home/overview.html)** | `adguardhome` | `53:53/udp`<br>`3000:3000` | `media_net` | **DNS-Level Ad & Tracker Blocking:** Acts as your home's primary DNS server. Blocks telemetry, advertisements, phishing domains, and tracking scripts across every device on your Wi-Fi network before requests even hit the browser. |
| **[Redis](https://redis.io/)** | `redis` | Internal (`6379`) | `infra_net` | **In-Memory Cache & Queue:** High-speed RAM caching broker that dramatically accelerates Paperless-ngx document indexing queues and AudioMuse AI session caching. Sealed inside `infra_net` with zero external access. |
| **[Portainer](https://www.portainer.io/)** | `portainer` | `9000:9000` | `media_net` | **Docker Container Management GUI:** Visual administration dashboard to inspect live container logs, monitor CPU/memory utilization, restart services, and manage Docker networks and volumes directly from your browser. |
| **[Watchtower](https://containrrr.dev/watchtower/)** | `watchtower` | Background | `media_net` | **Automated Container Updater:** Configured in **opt-in mode** (`WATCHTOWER_LABEL_ENABLE=true`). Automatically checks Docker Hub nightly and safely patches stateless utilities (`qbittorrent`, `uptime-kuma`) while intentionally skipping stateful databases to prevent breaking migrations. |
| **[Homepage](https://gethomepage.dev/)** | `homepage` | `3002:3000` | `media_net` | **Primary YAML Dashboard:** Fast, widget-rich home screen displaying live stats, ping latencies, API indicators, and quick links to every service in your lab. |
| **[Homarr](https://homarr.dev/)** | `homarr` | `7575:7575` | `media_net` | **Interactive Drag-and-Drop Dashboard:** Alternative modern home screen with visual drag-and-drop customization, built-in ping monitors, and app integrations. |
| **[Uptime Kuma](https://uptime.kuma.pet/)** | `uptime-kuma` | `3001:3001` | `media_net` | **Real-Time Service Monitoring:** Continuously checks the HTTP status, TCP ports, and ping responses of all 25+ services every 30 seconds. Displays historical uptime charts and sends notifications if any container stops responding. |
