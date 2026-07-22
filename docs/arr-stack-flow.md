# 🔄 *Arr Stack Flow & TRaSH Guides Integration

This document explains exactly how our download automation pipeline (`radarr`, `sonarr`, `prowlarr`, `qBittorrent`, `jellyseerr`, and `recyclarr`) is wired together, how API keys are exchanged securely, and how TRaSH Guides quality rules are maintained automatically.

---

## 1. Pipeline Architecture Diagram

```
[ Household Users / Mobile Devices ]
                 │
                 ▼
     ┌───────────────────────┐
     │ Jellyseerr (Port 5055) │  ← Request UI (Movies & TV Shows)
     └───────────┬───────────┘
                 │
         ┌───────┴───────┐
         ▼               ▼
┌─────────────────┐ ┌─────────────────┐
│ Radarr (7878)   │ │ Sonarr (8989)   │  ← Media Collection Managers
└────────┬────────┘ └────────┬────────┘
         ▲                   ▲
         │ Full Sync         │ Full Sync
┌────────┴───────────────────┴────────┐
│ Prowlarr (9696)                      │  ← Central Indexer Aggregator
└────────┬────────────────────────────┘
         │
         │ Send Torrent Magnet / File
         ▼
┌─────────────────────────────────────┐
│ qBittorrent (8080)                  │  ← Download Client (/data/torrents)
└────────┬────────────────────────────┘
         │
         ▼ Hardlink / Move Completed Media
┌─────────────────────────────────────┐
│ Storage Pool (/data/media/...)      │  ← Read by Jellyfin / Navidrome
└─────────────────────────────────────┘
```

---

## 2. Automated API Key Wiring (`configure-stack.sh`)

When `radarr`, `sonarr`, and `prowlarr` start for the very first time on a fresh install, they generate unique, random 32-character API keys stored inside their respective `config.xml` files. Because these keys are unknown before container initialization, our `configure-stack.sh` script automates the entire discovery and wiring procedure without manual copy-pasting.

### How `configure-stack.sh` Works:
1. **API Key Extraction:** Scans `/opt/homelab/media-stack/config/{radarr,sonarr,prowlarr}/config.xml` and extracts each `<ApiKey>` using regular expressions.
2. **Environment Update:** Writes the discovered `RADARR_API_KEY`, `SONARR_API_KEY`, and `PROWLARR_API_KEY` back into your root `.env` file so subsequent tools (`recyclarr`) can authenticate cleanly.
3. **qBittorrent Setup:** Logs into qBittorrent via its API (extracting the temporary admin password from Docker logs if required), sets the global save path to `/data/torrents`, enables temporary incomplete paths (`/data/torrents/incomplete`), and creates dedicated download categories (`radarr` and `sonarr`).
4. **Download Client Registration:** Uses Radarr (`/api/v3/downloadclient`) and Sonarr (`/api/v3/downloadclient`) REST APIs to register `qbittorrent` (port 8080) as the primary torrent download client assigned to their respective categories.
5. **Root Folder Registration:** Sets `/data/media/movies` as the default movie storage path in Radarr and `/data/media/tv` as the default series storage path in Sonarr.
6. **Prowlarr Indexer Synchronization:** Registers Radarr and Sonarr as target applications (`/api/v1/applications`) inside Prowlarr with `fullSync` enabled. When you add a torrent tracker or indexer inside Prowlarr, it instantly pushes the indexer configuration and search categories directly to Radarr and Sonarr.

---

## 3. TRaSH Guides Integration (`recyclarr`)

Out of the box, default Radarr and Sonarr quality profiles often grab low-bitrate rips, unwanted releases, or incorrect audio formats. We utilize **[Recyclarr](https://recyclarr.dev/)** paired with **[TRaSH Guides](https://trash-guides.info/)** to automatically enforce strict custom format rules and quality scores.

### What `scripts/04-recyclarr.yml` Enforces:
- **HD Balanced Profile:** Prioritizes high-quality `1080p Bluray` and `WEBDL` releases up to a target score threshold (`10000`).
- **Audio Custom Formats:** Assigns positive scores to premium surround formats (`TrueHD Atmos`, `DTS X`, `DTS-HD MA`, `FLAC`) so the system automatically upgrades standard AAC/DD audio tracks when higher-fidelity Blu-ray rips become available.
- **Video & HDR Scoring:** Properly scores `Dolby Vision (DV)`, `HDR10+`, and `HDR10` releases based on display compatibility.
- **Garbage Release Penalty (`-10000` Score):** Immediately rejects `BR-DISK` ISO rips, low-quality encodings (`LQ`), `3D` movies, unwanted extras, and bad dual-audio release groups.

### Running Recyclarr Sync
After running `configure-stack.sh` (which saves your API keys to `.env`), synchronize TRaSH Guides profiles with one command:
```bash
docker exec -it recyclarr recyclarr sync
```
Recyclarr connects directly to Radarr and Sonarr using your injected `.env` API keys, creating and updating custom formats and profiles in seconds.

---

## 4. Manual Indexer Setup (Remaining Step)

Because torrent trackers and Usenet indexers require private user account credentials, API keys, or passkeys, **this is the only step that cannot be automated safely**.

1. Open your browser to Prowlarr: `http://YOUR_SERVER_IP:9696`
2. Navigate to **Indexers** → **Add Indexer**.
3. Search for your public or private trackers and enter your account credentials.
4. Click **Test** and **Save**.
5. Prowlarr will immediately sync your new indexers to both Radarr and Sonarr automatically!
