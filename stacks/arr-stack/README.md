# The *arr Stack — Automated Media Downloading & Organization
> What it is: A complete automated workflow consisting of qBittorrent, Prowlarr, Radarr, Sonarr, and Jellyseerr. What it replaces: Manual torrent searching, file renaming, moving folders, and manual media monitoring.

## What you'll have when done
An automated media pipeline where browsing and requesting a movie or TV show on **Jellyseerr** automatically triggers search indexers in **Prowlarr**, sends the best quality torrent to **qBittorrent**, monitors progress in **Radarr/Sonarr**, and cleanly renames and moves the finished file straight into `/srv/media` for Jellyfin to stream!

## Quick Launch
### 1. Set up storage
Ensure your host has `/srv/downloads` and `/srv/media` created and owned by your user (`id -u`):
```bash
sudo mkdir -p /srv/downloads/{incomplete,complete} /srv/media/{movies,tv}
sudo chown -R $USER:$USER /srv/downloads /srv/media
```

### 2. Configure .env
Verify your `quickstart/.env` contains your correct `PUID` and `PGID` so downloaded files are readable across containers:
```bash
PUID=1000
PGID=1000
TZ=UTC
MEDIA_DIR=/srv/media
DOWNLOADS_DIR=/srv/downloads
```

### 3. Start
From inside `02-arr-stack/`, launch the complete suite:
```bash
docker compose up -d
```

Expected terminal output:
```
[+] Running 6/6
 ✔ Network 02-arr-stack_default  Created            0.1s
 ✔ Container qbittorrent         Started            0.3s
 ✔ Container prowlarr            Started            0.4s
 ✔ Container radarr              Started            0.5s
 ✔ Container sonarr              Started            0.5s
 ✔ Container jellyseerr          Started            0.6s
```

### 4. Open browser: http://YOUR_IP:PORT
You now have 5 powerful web interfaces running simultaneously:
- **qBittorrent (Downloader):** `http://YOUR_IP:8080` (Default: `admin` / temporary password printed in logs via `docker logs qbittorrent`)
- **Prowlarr (Indexer Manager):** `http://YOUR_IP:9696`
- **Radarr (Movie Manager):** `http://YOUR_IP:7878`
- **Sonarr (TV Show Manager):** `http://YOUR_IP:8989`
- **Jellyseerr (Request Portal):** `http://YOUR_IP:5055`

## First-Time Setup
1. **Set up Prowlarr (`http://YOUR_IP:9696`):**
   - Click **Add Indexer**, search for public indexers (e.g., `1337x`, `EZTV`), and click Save.
   - Go to **Settings → Apps → + Add**:
     - Add **Radarr** (`http://radarr:7878`) and paste your Radarr API key (found under Radarr Settings → General).
     - Add **Sonarr** (`http://sonarr:8989`) and paste your Sonarr API key.
   - Click **Sync App Indexers** — your indexers are now automatically synced to Radarr and Sonarr!
2. **Connect Radarr & Sonarr to qBittorrent:**
   - In Radarr (`http://YOUR_IP:7878`) and Sonarr (`http://YOUR_IP:8989`), go to **Settings → Download Clients → + Add → qBittorrent**:
     - **Host:** `qbittorrent`
     - **Port:** `8080`
     - Click **Test** and **Save**.
3. **Connect Jellyseerr (`http://YOUR_IP:5055`):**
   - Log in using your Jellyfin account (`http://jellyfin:8096`).
   - Add your Radarr (`http://radarr:7878`) and Sonarr (`http://sonarr:8989`) endpoints using their API keys.

## Connecting to Other Services
- All finished downloads placed in `/srv/media/movies` or `/srv/media/tv` immediately trigger library scans in **[01-media-server](../01-media-server/README.md)** (Jellyfin).

## Add HTTPS (Optional)
To securely access Jellyseerr or Radarr outside your home, see our networking options:
→ **[networking/README.md](../networking/README.md)**

## What Now?
1. **Make Your First Request:** Open `http://YOUR_IP:5055` (Jellyseerr), search for a popular movie, and click **Request**. Watch as Radarr grabs it and downloads it automatically!
2. **Configure Trash Guides:** Check out [TRaSH Guides](https://trash-guides.info) to set up custom quality profiles (`1080p Web-DL`, `4K Remux`) and reject poor audio/video encodes.
3. **Set Up Notifications:** In Radarr and Sonarr settings, add Discord or Telegram webhooks to get phone notifications whenever a new download completes!
