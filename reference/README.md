# 🏛️ Author's Personal Reference Setup (`reference/`)

> [!IMPORTANT]
> **This directory is provided for advanced reference and inspiration only.**
> You are **NOT** expected or advised to deploy these configurations directly on your first home server!

When building your first home server, we strongly recommend starting with the modular, self-contained stacks inside our [`stacks/`](../stacks/README.md) directory. Each stack there is isolated, heavily commented, and designed to teach you how the underlying services work.

---

## 🧐 What is Inside This Folder?

This directory contains the exact, unmodified Docker Compose blueprints and recovery scripts that the repository author personally uses to run their 25+ service production ecosystem at home:

- **[`media-stack/`](media-stack/README.md)** — A comprehensive, **Tri-Network (`media_net`, `download_net`, `infra_net`)** 25-container production compose stack combining `Jellyfin`, `Navidrome`, `Kavita`, `Feishin`, the complete `*arr` download automation pipeline (`Radarr`, `Sonarr`, `Prowlarr`, `qBittorrent`, `Jellyseerr`), artificial intelligence audio vector indexing (`AudioMuse AI` + `PostgreSQL pgvector`), `Paperless-ngx`, `Stirling PDF`, `Actual Budget`, `Home Assistant`, `Mosquitto MQTT`, `AdGuard Home`, `Redis`, `Portainer`, `Watchtower`, `Uptime Kuma`, `Homarr`, and `Homepage`. Features zero-trust database isolation (`internal: true`).
- **[`nextcloud-stack/`](nextcloud-stack/)** — A standalone production Nextcloud + MariaDB stack wired to dedicated cloud storage pools.
- **[`proxy-stack/`](proxy-stack/)** — The primary Nginx Proxy Manager + DuckDNS edge routing gateway.
- **[`recovery/`](recovery/)** — The author's personal bare-metal recovery scripts (`01-bootstrap.sh`, `02-restore.sh`, `03-backup.sh`, `04-recyclarr.yml`, `05-ignition.sh`) used to resurrect the entire 25+ service lab from a cold backup in under 30 minutes (`Bus Factor: 0`).

---

## 🏛️ System Architecture & Data Flow

Below is the high-level system architecture of the Homelabbing ecosystem, illustrating how traffic enters from external networks, routes through the proxy layer, hits the dual-homed application containers, and interacts with isolated databases and unified storage:

![Homelabbing Architecture Diagram](../docs/architecture.png)

---

## 🌐 The Tri-Network Architecture: Why Three Networks?

If you look at the bottom of [`media-stack/docker-compose.yml`](media-stack/docker-compose.yml#L617-L625), you will notice that this production stack does **not** put all containers on a single flat network. Instead, it deploys a **Tri-Network Architecture**:

```yaml
networks:
  media_net:
    driver: bridge
  download_net:
    driver: bridge
  infra_net:
    driver: bridge
    internal: true  # Zero internet access & zero external port access
```

### 1. `media_net` (Frontend & Core Application Tier)
- **Role:** The primary application bridge where user-facing web dashboards and streaming services reside (`jellyfin`, `navidrome`, `kavita`, `jellyseerr`, `homepage`, `paperless-ngx`, `stirling-pdf`, `actual-budget`, `filebrowser`, `audiomuse-ai`).
- **Why?** These containers bind ports to the host machine (`SERVER_IP:PORT`) so your web browsers, TVs, mobile apps, and Nginx reverse proxy can reach them. They also communicate directly with one another over DNS (e.g., `http://jellyfin:8096`).

### 2. `download_net` (Automation & P2P Isolation Tier)
- **Role:** Dedicated bridge for download clients and index scrapers (`qbittorrent`, `prowlarr`, `radarr`, `sonarr`).
- **Why separate from `media_net`?** BitTorrent clients open hundreds of simultaneous peer-to-peer (P2P) connections, and indexers frequently fire burst HTTP requests to external trackers. Isolating this traffic onto `download_net` prevents broadcast chatter, TCP socket exhaustion, and rate-limit noise from degrading real-time 4K video streaming (`jellyfin`) or database queries. Furthermore, when routing downloaders through a VPN (`gluetun`), `download_net` ensures tight containment against accidental IP leaks.

### 3. `infra_net` (Zero-Trust Backend Database & Cache Tier)
- **Role:** The sealed backend data vault hosting databases and memory caches (`redis`, `audiomuse-db`).
- **Why `internal: true`?** In Docker Compose, the `internal: true` flag creates a **completely air-gapped virtual bridge**. Containers on `infra_net` have **no default outbound internet gateway** and **no external host ports**. Even if an attacker breached a download client or discovered your server's IP, they physically cannot send packets to `redis` or `audiomuse-db` because external routing rules do not exist. Only dual-homed application containers (such as `paperless-ngx` or `audiomuse-ai`) that sit simultaneously on `media_net` and `infra_net` can reach the backend database.

---

## 📦 What Every Container in the Media Stack Does

To help you understand the purpose of all 25 containers defined inside [`media-stack/docker-compose.yml`](media-stack/docker-compose.yml), here is a complete breakdown organized by functional tier:

### 🎬 Media Streaming & Library Management (`media_net`)
- **`jellyfin`:** The open-source media server. Indexes your `/data/media/movies` and `/data/media/tv` folders, scrapes metadata/posters, and transcodes video on-the-fly to stream to TVs, phones, and web browsers.
- **`navidrome`:** A lightweight, high-performance web-based music server and Subsonic API endpoint. Indexes `/data/media/music` (`Artist/Album/Track.flac`) for instant streaming to mobile apps like Symfonium, Amperfy, and Feishin.
- **`kavita`:** A lightning-fast digital library server for eBooks (EPUB/PDF), manga, and comic books (`.cbz`/`.cbr`). Features a distraction-free web reader and syncs progress across devices.
- **`feishin`:** A modern desktop and web UI built specifically as a sleek client front-end for Navidrome and Jellyfin music libraries.

### 🤖 Automated Download & Indexing Pipeline (`download_net` & `media_net`)
- **`jellyseerr`:** The self-service discovery and request dashboard. Family and friends log in here to browse movies/shows and click **"Request"**, which automatically sends tasks to Radarr and Sonarr.
- **`radarr`:** Automated movie collection manager. Monitors RSS feeds from Prowlarr, finds releases matching your exact quality rules (e.g., `1080p Web-DL`), instructs qBittorrent to download them, and renames/moves completed files into `/data/media/movies`.
- **`sonarr`:** Automated TV series manager. Tracks episodes, seasons, and airing schedules, coordinating downloads and organizing files into `/data/media/tv`.
- **`prowlarr`:** The central indexer and tracker manager. Synchronizes torrent trackers and API keys across Radarr and Sonarr from a single interface.
- **`qbittorrent`:** The rock-solid, high-performance BitTorrent download client that performs the heavy lifting inside `/data/downloads`.

### 🧠 Artificial Intelligence & Audio Vector Indexing (`media_net` + `infra_net`)
- **`audiomuse-ai`:** Custom AI audio intelligence API server. Processes your music collection to generate acoustic embeddings, mood classifications, and semantic similarity search vectors.
- **`audiomuse-ai-worker`:** Background processing queue worker that handles heavy acoustic feature extraction and vector embeddings without slowing down the web UI.
- **`audiomuse-db`:** PostgreSQL database loaded with the `pgvector` extension (`infra_net`). Safely stores high-dimensional vector embeddings and song metadata with zero external exposure.

### 📄 Productivity, Documents & Finance (`media_net` + `infra_net`)
- **`paperless-ngx`:** An intelligent document management system. Scans PDF/image invoices and letters, performs automated OCR (Optical Character Recognition), extracts text, and organizes documents with machine learning tags.
- **`redis`:** High-speed in-memory data store (`infra_net`). Powers the task queues and caching engines for both `paperless-ngx` and `watchtower`.
- **`stirling-pdf`:** A robust locally-hosted PDF manipulation suite. Split, merge, compress, OCR, convert, and redact sensitive PDF files entirely on your own hardware without uploading data to third-party cloud tools.
- **`actual-budget`:** A local-first, privacy-focused personal finance and budgeting system based on the envelope budgeting method.

### 🏠 Smart Home Automation & Network Core (`media_net`)
- **`homeassistant`:** The ultimate open-source smart home automation hub. Connects lights, sensors, thermostats, and cameras across different brands into unified dashboards and local automations.
- **`mosquitto`:** Eclipse Mosquitto MQTT message broker. Acts as the lightweight real-time communication spine for IoT devices and Zigbee/Z-Wave sensors talking to Home Assistant.
- **`adguardhome`:** Network-wide DNS server and ad/tracker blocker. Acts as your home's primary DNS resolver to strip ads and malware domains from every phone, PC, and smart TV on your Wi-Fi without installing client software.

### 🛠️ Lab Observability & Management (`media_net`)
- **`homepage`:** Highly customizable, icon-rich dashboard that aggregates live stats (CPU, RAM, active streams, download speeds) and quick-launch links for all your services.
- **`homarr`:** An alternative sleek, widget-driven home server dashboard with native integration widgets for `*Arr` services, qBittorrent, and system monitoring.
- **`uptime-kuma`:** Self-hosted monitoring tool that pings your internal ports and external websites every 60 seconds, displaying uptime percentages and sending instant alerts via Telegram/Discord if a container crashes.
- **`portainer`:** Visual web interface for managing Docker containers, volumes, networks, and logs without touching the command line.
- **`filebrowser`:** A web-based file manager providing a clean browser interface to upload, download, move, and edit files directly across `/data`.
- **`watchtower`:** Automated container updater. Checks Docker Hub nightly for security updates and automatically recreates containers when new stable images are released (`redis`-backed).

---

## 🛠️ Why Keep This Here?

While our beginner-friendly `stacks/` teach you how to build service by service, reading real-world production configurations provides immense learning value:
1. **Seeing the Big Picture:** You can inspect [`media-stack/docker-compose.yml`](media-stack/docker-compose.yml) to see how 25 containers share network definitions (`media_net`, `download_net`, `infra_net`) and zero-copy hardlink volumes (`/data/torrents` ↔ `/data/media`).
2. **Studying Advanced Security:** Notice how the `infra_net` bridge uses `internal: true` to completely seal off Redis and PostgreSQL from the public internet.
3. **Automated Recovery Inspiration:** Reviewing [`recovery/03-backup.sh`](recovery/03-backup.sh) shows how to pause live SQLite databases before archiving and encrypt tarballs in memory using `AES-256-CBC` and `PBKDF2`.

Feel free to explore, learn from the patterns, and adopt what fits your own personal homelab architecture!
