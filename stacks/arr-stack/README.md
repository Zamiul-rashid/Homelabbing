# *Arr Stack — Automated Media Downloading & Organization

## 🎯 What You'll Have When You're Done
When you complete this guide, you will have a complete, automated media acquisition pipeline. When your family browses trending movies or TV shows on the **Jellyseerr** web dashboard and clicks "Request", your server will automatically search indexers in **Prowlarr**, instruct **qBittorrent** to download the best quality release, monitor progress inside **Radarr** and **Sonarr**, and cleanly hardlink the finished video files right into `/data/media` where Jellyfin streams them instantly!

---

## 💡 What Is the *Arr Stack and Why Would I Want It?

Without automation, self-hosting media is tedious: you have to manually search indexers across the web, copy magnet links into torrent clients, wait for downloads, unzip files, manually rename them from messy release titles (`Movie.Title.2023.1080p.WEB-DL.x264.mkv` → `Movie Title (2023).mkv`), and move them into correct folders.

The **`*Arr` Stack** (`Radarr`, `Sonarr`, `Prowlarr`) acts as your 24/7 digital librarian:
- **Zero Manual Renaming:** Automatically formats filenames cleanly based on standardized conventions.
- **Zero-Copy Hardlinking:** Because both your `/downloads` and `/media` folders reside on the exact same underlying `/data` storage pool, when Radarr organizes a finished movie, it creates a **hardlink** in under 1 millisecond. The file appears in both your torrent folder (so you can continue seeding) and your movie folder without duplicating physical hard disk space!
- **Automatic Quality Upgrades:** Grab a standard 1080p release today, and when a higher-bitrate 4K Blu-ray remux drops months later, the system automatically downloads the upgrade and replaces the old file while you sleep.

---

## 📋 Prerequisites

Before deploying this stack, make sure you have:
1. Completed **[02. Understanding Docker & Containers](../../docs/02-understanding-docker.md)** and our **[arr-stack-flow.md conceptual guide](../../docs/arr-stack-flow.md)**.
2. Formatted your `/data/downloads` (`complete` & `incomplete`) and `/data/media` (`movies` & `tv`) directories as explained in **[04. Storage, Disks & NAS Concepts](../../docs/04-storage-and-nas.md)**.
3. Copied and edited `stacks/.env` so `PUID` (`1000`) and `PGID` (`1000`) match your user ID.

---

## 🔧 Understanding the Compose File

Let's examine how the 5 services (`qbittorrent`, `prowlarr`, `radarr`, `sonarr`, `jellyseerr`) work together inside `docker-compose.yml`:

```yaml
  radarr:
    image: lscr.io/linuxserver/radarr:latest
    container_name: radarr
    volumes:
      - ./config/radarr:/config
      - ${DATA_ROOT:-/data}/media:/media
      - ${DATA_ROOT:-/data}/downloads:/downloads
    ports:
      - "7878:7878"
```

- **`volumes:`** Notice how `radarr`, `sonarr`, and `qbittorrent` all mount `${DATA_ROOT:-/data}/downloads:/downloads`. This shared volume path is mandatory: when qBittorrent reports to Radarr that a movie is saved at `/downloads/complete/radarr/Movie.mkv`, Radarr must be able to follow that exact same folder path inside its own virtual filesystem to perform the zero-copy hardlink!
- **`ports:`** Each tool opens its own dedicated web door: `qbittorrent` (`8080`), `prowlarr` (`9696`), `radarr` (`7878`), `sonarr` (`8989`), and `jellyseerr` (`5055`).

---

## 🚀 Setting It Up Step by Step

### Step 1: Navigate to the *Arr Stack Folder
Open your terminal and move into the `arr-stack` directory:
```bash
cd /opt/homelab/stacks/arr-stack
```

### Step 2: Launch the 5 Automation Containers
Boot up the complete pipeline in detached mode:
```bash
docker compose up -d
```

### 🔍 What Just Happened?
When you ran `docker compose up -d`:
1. Docker pulled all 5 official container images from LinuxServer.io and Fallenbagel.
2. It created distinct `./config` subfolders right in your stack directory for each service (`qbittorrent`, `prowlarr`, `radarr`, `sonarr`, `jellyseerr`).
3. It bound your pooled `/data/downloads` and `/data/media` directories across the containers and opened all 5 web dashboards!

---

## ✅ Verifying It Works & Wiring Your Pipeline

Let's verify your services are running and connect them using API keys as detailed in **[arr-stack-flow.md](../../docs/arr-stack-flow.md)**:

### Step 1: Check Container Health
```bash
../../helpers/check-health.sh
```
All 5 containers (`qbittorrent`, `prowlarr`, `radarr`, `sonarr`, `jellyseerr`) should show as `healthy (running)`.

### Step 2: Connect qBittorrent inside Radarr & Sonarr
1. Open **qBittorrent** (`http://YOUR_SERVER_IP:8080`). To find your initial temporary password, run `docker logs qbittorrent | grep -i password`. Once logged in, go to Options and set your preferred admin password.
2. Open **Radarr** (`http://YOUR_SERVER_IP:7878`), go to **Settings** → **Download Clients** → **+ Add** → **qBittorrent**, set host to `qbittorrent` and port to `8080`, then click **Save**.
3. Repeat inside **Sonarr** (`http://YOUR_SERVER_IP:8989`).

### Step 3: Connect Prowlarr (`fullSync`)
1. Open **Radarr** → **Settings** → **General** and copy its **API Key**.
2. Open **Sonarr** → **Settings** → **General** and copy its **API Key**.
3. Open **Prowlarr** (`http://YOUR_SERVER_IP:9696`) → **Settings** → **Apps** → **+ Add** → **Radarr**. Paste your Radarr API key, set Sync Level to `Full Sync`, and click **Save**. Repeat for **Sonarr**!

### Step 4: Connect Jellyseerr
Open **Jellyseerr** (`http://YOUR_SERVER_IP:5055`), log in using your **Jellyfin** account, and add Radarr (`http://radarr:7878`) and Sonarr (`http://sonarr:8989`) using their API keys!

---

## 🧩 What's Next?

With your automated video acquisition and streaming pipeline completely functional, let's explore high-speed personal music streaming so you can replace Spotify or Apple Music on your smartphone!

👉 **Proceed to the [`music-server/`](../music-server/README.md) Stack**

---

## 🔧 Troubleshooting

- **Issue: Radarr/Sonarr shows a yellow warning saying "Unable to create hardlink across mounts".**
  - **Solution:** This happens when download paths (`/downloads`) and destination paths (`/media`) are mounted as completely separate physical disk partitions instead of sharing a parent path (`/data`). Make sure you configured `mergerfs` as covered in `04-storage-and-nas.md` and both services mount `${DATA_ROOT:-/data}/media` and `${DATA_ROOT:-/data}/downloads`.
- **Issue: Prowlarr says "Unable to connect to Radarr/Sonarr".**
  - **Solution:** When configuring apps inside Prowlarr while both containers run on the same Docker host, use the internal container hostname (`http://radarr:7878` and `http://sonarr:8989`) instead of your external server LAN IP address!
