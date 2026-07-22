# 🧱 Modular Homelabbing Stacks (`stacks/`)

Welcome to our modular Docker Compose ecosystem! Instead of placing every single application inside a giant, complicated 1,500-line `docker-compose.yml` file, **Homelabbing** divides your home server into clean, self-contained **stacks**.

Every single line inside every `docker-compose.yml` file in this directory is **heavily commented** to teach you what every directive (`image`, `environment`, `volumes`, `ports`, `healthcheck`) does and why it matters.

---

## 🏗️ Why Use Modular Stacks?

1. **Zero-Impact Upgrades & Maintenance:** If you need to restart or troubleshoot your photo backup server (`photo-backup`), your family members watching a 4K movie on `media-server` will never notice any interruption.
2. **Learn One Concept at a Time:** Instead of booting 20 containers at once and feeling overwhelmed, you can launch one single stack, understand its volume mounts and ports, and verify it works before adding the next piece.
3. **Customize Your Architecture:** Only want a book reader and photo server? Just run `book-reader` and `photo-backup`. You never have to spin up containers you don't actually need!

---

## 🗺️ Recommended Stack Launch Order

We recommend launching these modular stacks in the following order as you build your lab:

| # | Stack Folder | Primary Services | What It Gives You |
| :--- | :--- | :--- | :--- |
| **1** | **[`media-server/`](media-server/)** | Jellyfin | Pristine, uncompressed 4K movie and TV show streaming across your LAN. |
| **2** | **[`arr-stack/`](arr-stack/)** | Radarr, Sonarr, Prowlarr, qBittorrent, Jellyseerr | Automated media discovery, zero-copy hardlinking, and household requests. |
| **3** | **[`music-server/`](music-server/)** | Navidrome | Blazing-fast personal music streaming with Subsonic mobile app compatibility. |
| **4** | **[`photo-backup/`](photo-backup/)** | Immich | Self-hosted photo and video backup with AI facial recognition and timeline sync. |
| **5** | **[`book-reader/`](book-reader/)** | Kavita | High-performance ebook, comic book, and multi-volume manga reader. |
| **6** | **[`cloud-storage/`](cloud-storage/)** | Nextcloud, MariaDB | Complete Google Workspace and Dropbox replacement for multi-device document sync. |
| **7** | **[`home-automation/`](home-automation/)** | Home Assistant, AdGuard Home | Local-first smart home IoT brain (`8123`) and network-wide DNS ad/tracker blocking (`53`, `8083`). |
| **8** | **[`networking/`](networking/)** | Nginx Proxy Manager, DuckDNS / Cloudflare, Tailscale | Remote access, custom subdomains, reverse proxy routing, and SSL padlocks. |
| **9** | **[`full-stack/`](full-stack/)** | Combined All-in-One Compose | *For experienced users only:* A consolidated compose file combining all services into a single stack. |

---

## 🚀 How to Launch Any Stack Step-by-Step

Before launching any stack, make sure you have prepared your hardware and formatted your `/data` storage pool as explained in **[`docs/03-your-first-server.md`](../docs/03-your-first-server.md)** and **[`docs/04-storage-and-nas.md`](../docs/04-storage-and-nas.md)**.

1. **Copy the Environment Template:**
   In this directory (`stacks/`), copy the environment variables template so Docker knows your user permissions and timezone:
   ```bash
   cp .env.example .env
   nano .env
   ```
   Set your `PUID`, `PGID` (find them by running `id` in your terminal), `TZ` (`America/New_York`), and `SERVER_IP`.

2. **Navigate into the Desired Stack Folder:**
   ```bash
   cd media-server
   ```

3. **Launch the Containers in the Background (`-d`):**
   ```bash
   docker compose up -d
   ```

4. **Verify Live Logs & Health Status:**
   ```bash
   docker compose ps
   docker logs --tail 50 jellyfin
   ```
   Or run our handy diagnostic checker anytime from the repo root:
   ```bash
   ./helpers/check-health.sh
   ```

Enjoy building and learning each component!
