# Full Stack — All 6 Modular Stacks on a Single Unified Network

## 🎯 What You'll Have When You're Done
When you complete this guide, you will have a complete, enterprise-grade personal cloud system running across **15 synchronized containers** on your home server. All services communicate cleanly over a single virtual network (`homelab_net`) by container name (`http://radarr:7878`, `http://immich-postgres:5432`), sharing unified `/data` storage pools with health monitoring across all ports!

---

## 💡 What Is the Full Stack and Why Would I Want It?

While our modular stacks (`media-server`, `arr-stack`, `music-server`, `photo-backup`, `book-reader`, `cloud-storage`) allow you to boot services one by one, experienced system administrators often prefer a single master compose file (`docker-compose.yml`) that boots their entire household infrastructure simultaneously.

The **Full Stack** consolidates all 6 modules into one cohesive blueprint:
- **Single Network Bridge (`homelab_net`):** Every service resides on the same virtual network, eliminating complex multi-bridge routing.
- **Unified Configuration State:** All database and application configuration folders are organized neatly inside `./config/<service_name>`, making automated evening backup routines simple and clean.
- **One Command Lifecycle:** Turn on, update, or pause all 15 services with a single `docker compose up -d` or `docker compose down`.

> [!CAUTION]
> **Recommended for Experienced Users Only!**
> If this is your very first time setting up a home server, **do not start here!** Launching 15 containers at once creates dozens of settings pages to configure. We strongly advise launching the modular stacks inside `stacks/` individually first until you are familiar with each service.

---

## 📋 Prerequisites

Before deploying the consolidated stack, make sure you have:
1. Formatted your hard disks (`/data`) and created all standard folders (`media/movies`, `media/tv`, `media/music`, `media/books`, `media/comics`, `media/photos`, `downloads/complete`, `nextcloud`) as covered in **[04. Storage, Disks & NAS Concepts](../../docs/04-storage-and-nas.md)**.
2. Copied and edited `stacks/.env` (`cp stacks/.env.example stacks/.env`) with secure database passwords (`DB_ROOT_PASSWORD`, `NEXTCLOUD_DB_PASSWORD`, `IMMICH_DB_PASSWORD`) and your exact user ID (`PUID=1000`).

---

## 🔧 Understanding the Compose File

Our `docker-compose.yml` consolidates 15 distinct container definitions into 6 logical blocks:
1. **Media Server:** `jellyfin` (`port 8096`)
2. **Automation Pipeline:** `qbittorrent` (`8080`), `prowlarr` (`9696`), `radarr` (`7878`), `sonarr` (`8989`), `jellyseerr` (`5055`)
3. **Music Server:** `navidrome` (`4533`)
4. **Book Reader:** `kavita` (`5000`)
5. **Photo Backup Suite:** `immich-server` (`2283`), `immich-machine-learning`, `immich-redis`, `immich-postgres`
6. **Cloud Storage Suite:** `nextcloud` (`4443`), `nextcloud-db`

---

## 🚀 Setting It Up Step by Step

### Step 1: Navigate to the Full Stack Folder
Open your terminal and move into the `full-stack` directory:
```bash
cd /opt/homelab/stacks/full-stack
```

### Step 2: Launch the Consolidated Ecosystem
Boot up all 15 containers in detached mode:
```bash
docker compose up -d
```

### 🔍 What Just Happened?
When you ran `docker compose up -d`:
1. Docker pulled the 15 official images from Docker Hub, LinuxServer.io, and GitHub Container Registry.
2. It created the `homelab_net` virtual bridge network.
3. It generated distinct `./config/service_name` state folders and booted all web dashboards simultaneously!

---

## ✅ Verifying It Works & Accessing Your Dashboards

Run our diagnostic health checker from the repo root to verify that all 10 service ports are up and responsive:
```bash
../../helpers/check-health.sh
```

All web dashboards are accessible right at your server's local IP (`http://YOUR_SERVER_IP:PORT`):
- `http://192.168.1.100:8096` — **Jellyfin** (Media Server)
- `http://192.168.1.100:8080` — **qBittorrent** (Download Client)
- `http://192.168.1.100:9696` — **Prowlarr** (Indexer Manager)
- `http://192.168.1.100:7878` — **Radarr** (Movie Manager)
- `http://192.168.1.100:8989` — **Sonarr** (TV Show Manager)
- `http://192.168.1.100:5055` — **Jellyseerr** (Request Portal)
- `http://192.168.1.100:4533` — **Navidrome** (Music Server)
- `http://192.168.1.100:5000` — **Kavita** (Book Reader)
- `http://192.168.1.100:2283` — **Immich** (Photo Backup)
- `https://192.168.1.100:4443` — **Nextcloud** (Cloud Storage - Self-signed SSL)

---

## 📚 Step-by-Step Onboarding Guides

For detailed onboarding and first-time configuration of each service, refer to their modular teaching guides:
- **[Jellyfin First-Time Setup](../media-server/README.md)**
- **[*Arr Stack API Wiring & Prowlarr Setup](../arr-stack/README.md)**
- **[Navidrome Admin Setup & Mobile Apps](../music-server/README.md)**
- **[Kavita Library Creation & Manga Indexing](../book-reader/README.md)**
- **[Immich Admin Onboarding & Mobile Backup](../photo-backup/README.md)**
- **[Nextcloud Database Connection & Sync Clients](../cloud-storage/README.md)**

---

## 🧩 What's Next?

With all your applications running smoothly on internal ports, let's configure edge reverse proxy routing and SSL certificates so you and your household can connect using clean, encrypted domain names (`https://movies.yourdomain.com`) across the web!

👉 **Proceed to the [`networking/`](../networking/README.md) Stack**

---

## 🔧 Troubleshooting

- **Issue: My server slows down or freezes briefly when starting `docker compose up -d`.**
  - **Solution:** Booting 15 containers simultaneously creates a momentary CPU and disk I/O spike as databases (`PostgreSQL` and `MariaDB`) format system tables and web servers initialize. Give the system 60–90 seconds to settle before accessing dashboards or running diagnostic checkers.
