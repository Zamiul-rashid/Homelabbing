# 🔄 *Arr Stack Flow & TRaSH Guides Integration

This document explains exactly how our media acquisition pipeline (`radarr`, `sonarr`, `prowlarr`, `qBittorrent`, `jellyseerr`, and `recyclarr`) works conceptually, how services communicate using API keys, and how TRaSH Guides quality rules ensure high-definition releases without requiring manual filtering.

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

## 2. Connecting Your Services Manually (API Key Exchanging)

When `radarr`, `sonarr`, and `prowlarr` start for the very first time, each service generates a unique 32-character **API Key** (Application Programming Interface Key). This key acts as a digital passport, allowing one application to securely talk to another without typing usernames and passwords.

Instead of running opaque scripts that hide how services link together, here is how you connect the pipeline manually:

### Step 1: Connect qBittorrent to Radarr and Sonarr
1. Open **Radarr** (`http://YOUR_SERVER_IP:7878`) and go to **Settings** → **Download Clients** → **Add** → **qBittorrent**.
2. Enter your qBittorrent host (`qbittorrent`), port (`8080`), and category (`radarr`).
3. Click **Test** and **Save**.
4. Repeat this exact step inside **Sonarr** (`http://YOUR_SERVER_IP:8989`), using the category `sonarr`.

### Step 2: Connect Prowlarr to Radarr and Sonarr (`fullSync`)
Instead of adding indexers separately into both Radarr and Sonarr, you connect them once inside **Prowlarr**:
1. Open **Radarr** → **Settings** → **General** and copy the **API Key**.
2. Open **Sonarr** → **Settings** → **General** and copy the **API Key**.
3. Open **Prowlarr** (`http://YOUR_SERVER_IP:9696`) → **Settings** → **Apps** → **Add** → **Radarr**. Paste your Radarr API key, set Sync Level to `Full Sync`, and click **Save**.
4. Click **Add** → **Sonarr**, paste your Sonarr API key, set Sync Level to `Full Sync`, and click **Save**.

Now, whenever you add a torrent tracker inside Prowlarr, it automatically pushes the configuration and search categories across your entire stack!

---

## 3. TRaSH Guides Integration (`recyclarr`)

Out of the box, default Radarr and Sonarr quality profiles often grab low-bitrate rips, unwanted releases, or incorrect audio formats. We utilize **[Recyclarr](https://recyclarr.dev/)** paired with **[TRaSH Guides](https://trash-guides.info/)** to automatically enforce strict custom format rules and quality scores.

### What Recyclarr Enforces:
- **HD Balanced Profile:** Prioritizes high-quality `1080p Bluray` and `WEBDL` releases up to a target score threshold.
- **Audio Custom Formats:** Assigns positive scores to premium surround formats (`TrueHD Atmos`, `DTS X`, `DTS-HD MA`, `FLAC`) so the system automatically upgrades standard audio when higher-fidelity Blu-ray rips become available.
- **Video & HDR Scoring:** Properly scores `Dolby Vision (DV)`, `HDR10+`, and `HDR10` releases based on display compatibility.
- **Garbage Release Penalty (`-10000` Score):** Immediately rejects `BR-DISK` ISO rips, low-quality encodings (`LQ`), `3D` movies, unwanted extras, and bad dual-audio groups.

### Running Recyclarr Sync
Once your API keys are added to your stack environment (`.env`), synchronize your TRaSH Guides profiles with one manual Docker command:
```bash
docker exec -it recyclarr recyclarr sync
```
Recyclarr connects directly to Radarr and Sonarr using your API keys, creating and updating custom formats and profiles in seconds.

---

## 4. Adding Your Indexers

Because torrent trackers and Usenet indexers require private user account credentials or passkeys, you configure them cleanly inside Prowlarr:
1. Open **Prowlarr**: `http://YOUR_SERVER_IP:9696`
2. Navigate to **Indexers** → **Add Indexer**.
3. Search for your public or private trackers and enter your credentials.
4. Click **Test** and **Save**.
5. Prowlarr will immediately sync your new indexers to both Radarr and Sonarr automatically!
