# Full Stack — All 5 Modular Stacks on a Single Unified Network
> What it is: A unified, single-file Docker Compose deployment containing all 5 beginner quickstart suites (Jellyfin, *arr stack, Navidrome, Immich, and Nextcloud) interconnected over a dedicated bridge network (`homelab_net`).

## What you'll have when done
A complete, enterprise-grade personal cloud system running across 14 synchronized containers on your host machine. All services communicate cleanly over `homelab_net` by container name (`http://radarr:7878`, `http://immich-db:5432`), sharing unified `/srv/...` storage locations with health monitoring across all ports.

## Quick Launch
### 1. Set up storage
Ensure all host storage folders (`/srv/media`, `/srv/downloads`, `/srv/music`, `/srv/photos`, `/srv/nextcloud`) exist:
```bash
sudo bash ../scripts/bootstrap.sh
```

### 2. Configure .env
Verify that your `quickstart/.env` contains all required variables (`PUID`, `PGID`, `TZ`, `MEDIA_DIR`, `DOWNLOADS_DIR`, `MUSIC_DIR`, `PHOTOS_DIR`, `CLOUD_DIR`, `DB_ROOT_PASSWORD`, `DB_PASSWORD`, `IMMICH_DB_PASSWORD`):
```bash
cat ../.env
```

### 3. Start
From inside `06-full-stack/`, launch all 14 containers:
```bash
docker compose up -d
```

Expected terminal output:
```
[+] Running 15/15
 ✔ Network 06-full-stack_homelab_net  Created           0.1s
 ✔ Container immich_redis             Started           0.3s
 ✔ Container qbittorrent              Started           0.3s
 ✔ Container immich_postgres          Started           0.4s
 ✔ Container nextcloud-db             Started           0.4s
 ✔ Container prowlarr                 Started           0.5s
 ✔ Container radarr                   Started           0.5s
 ✔ Container sonarr                   Started           0.6s
 ✔ Container jellyfin                 Started           0.6s
 ✔ Container navidrome                Started           0.7s
 ✔ Container immich_machine_learning  Started           0.8s
 ✔ Container jellyseerr               Started           0.8s
 ✔ Container nextcloud                Started           0.9s
 ✔ Container immich_server            Started           1.1s
```

### 4. Check Health & Access Ports
Verify container health across all 9 endpoints using our automated checker:
```bash
bash ../scripts/check-health.sh
```

All ports live at your host IP (`http://YOUR_SERVER_IP:PORT`):
- `8096` — Jellyfin
- `8080` — qBittorrent
- `9696` — Prowlarr
- `7878` — Radarr
- `8989` — Sonarr
- `5055` — Jellyseerr
- `4533` — Navidrome
- `2283` — Immich
- `4443` — Nextcloud (`https://`)

## First-Time Setup & Next Steps
Follow the individual setup guides inside each modular folder for step-by-step onboarding:
- [Jellyfin Setup](../01-media-server/README.md)
- [*arr Stack & Jellyseerr Setup](../02-arr-stack/README.md)
- [Navidrome Setup](../03-music-server/README.md)
- [Immich Setup](../04-photo-server/README.md)
- [Nextcloud Setup](../05-cloud-storage/README.md)
- [Remote Access & HTTPS Options](../networking/README.md)
