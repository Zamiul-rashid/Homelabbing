# How the *arr pipeline fits together

This page explains how a request turns into a file in your media library: which app does what, how the apps talk to each other with API keys, how hardlinks keep imports instant, and how TRaSH Guides quality rules pick good releases without you filtering by hand.

The paths and extra tools below are the ones the author runs (October 2026). The beginner stack in [`stacks/arr-stack/`](../stacks/arr-stack/) is simpler and uses `/data/downloads` instead of `/data/torrents`; the ideas are the same.

---

## 1. The pipeline

```
[ People in the house, on phones and TVs ]
                 |
                 v
     +-------------------------+
     | Seerr (request page)    |   "I want this film / show"
     +------------+------------+
                  |
          +-------+--------+
          v                v
 +-----------------+ +-----------------+
 | Radarr (movies) | | Sonarr (TV)     |   pick a release by quality profile
 +--------+--------+ +--------+--------+   (Recyclarr keeps profiles in sync)
          ^                   ^
          |   full sync       |
 +--------+-------------------+--------+
 | Prowlarr                            |   manages the indexers once, for both
 +--------+----------------------------+
          |  send the torrent
          v
 +-------------------------------------+
 | qBittorrent                         |   /data/torrents/incomplete
 |                                     |   -> /data/torrents/{radarr,sonarr}
 +--------+----------------------------+
          |  hardlink import (same filesystem, no extra space)
          v
 +-------------------------------------+
 | /data/media/{movies,tv}             |   read by Jellyfin
 +-------------------------------------+
```

Around it, three helpers keep things clean:

- **qbit-manage** keeps the torrents inside qBittorrent tagged and tidy. Its image is pinned, like qBittorrent's.
- **The download guard** is a small script on the host that runs every 2 minutes. If an executable file shows up in a finished download, it moves it to quarantine and blocklists that release through the Sonarr or Radarr API, so the same release is not grabbed again. A film or an episode never needs to be an `.exe`.
- **Maintainerr** cleans up the library by rules you set once, instead of you deleting old media by hand.

---

## 2. Hardlinks, and why one `/data` folder matters

When Radarr imports a finished download, it can either **copy** the file into the library or create a **hardlink**: a second name for the same data on disk. A hardlink is instant and uses no extra space, and the torrent can keep seeding from the original name.

Hardlinks only work inside one filesystem. That is why both the download folder and the library live under one parent:

```
/data
├── torrents
│   ├── incomplete        <- qBittorrent downloads here
│   ├── radarr            <- finished movie downloads
│   └── sonarr            <- finished TV downloads
└── media
    ├── movies            <- Radarr's library (hardlinks)
    └── tv                <- Sonarr's library (hardlinks)
```

Mount the whole `/data` into qBittorrent, Radarr and Sonarr as one volume. If you mount `/data/torrents` and `/data/media` as two separate volumes, Docker treats them as two mount points and hardlinks fail, even on the same disk, so every import becomes a full copy.

### Hardlinks over NFS

In the author's lab, `/data` is not a local disk. It is an NFS 4.2 share exported by a second machine (a Proxmox host) and mounted on the app server. Hardlinks still work, because the torrents and the library are still on the same filesystem on the far end.

When the media moved to that share in October 2026, 432 GB were copied with every hardlink intact (all 228 hardlinked paths were checked afterwards). Two things to get right if you do the same:

- **Guard against an empty mount point.** If the share fails to mount, `/data` is just an empty folder on the root disk, and the apps will happily fill the root disk instead. Make the mount point immutable and start the media containers only after the share is mounted.
- **Use `rsync -H`** (or another tool that preserves hardlinks) when you move a library. A plain copy turns every hardlink into a second full file.

---

## 3. Connecting the apps (API keys)

The first time Radarr, Sonarr and Prowlarr start, each one generates an **API key**: a long random string that lets one app talk to another without a username and password. You connect the pipeline by hand, once:

### Step 1: qBittorrent in Radarr and Sonarr
1. Open **Radarr** (`http://YOUR_SERVER_IP:7878`) and go to **Settings**, then **Download Clients**, then **Add**, then **qBittorrent**.
2. Enter the host (`qbittorrent`), the port (`8080`) and the category `radarr`.
3. Click **Test**, then **Save**.
4. Do the same in **Sonarr** (`http://YOUR_SERVER_IP:8989`) with the category `sonarr`.

The category is what sends finished downloads to `/data/torrents/radarr` or `/data/torrents/sonarr`.

### Step 2: Prowlarr in Radarr and Sonarr (full sync)
Instead of adding indexers to Radarr and Sonarr separately, you add them once in **Prowlarr**:
1. In **Radarr**, open **Settings**, then **General**, and copy the **API Key**.
2. Do the same in **Sonarr**.
3. In **Prowlarr** (`http://YOUR_SERVER_IP:9696`), open **Settings**, then **Apps**, then **Add**, then **Radarr**. Paste the Radarr key, set **Sync Level** to `Full Sync` and save.
4. Add **Sonarr** the same way.

From now on, every indexer you add in Prowlarr appears in Radarr and Sonarr automatically.

### Step 3: Seerr
Sign in to Seerr with your Jellyfin account, then add Radarr and Sonarr under its settings with their addresses (`http://radarr:7878`, `http://sonarr:8989`) and API keys.

---

## 4. TRaSH Guides with Recyclarr

Out of the box, Radarr and Sonarr quality profiles happily grab low-bitrate rips and releases with the wrong audio. **[Recyclarr](https://recyclarr.dev/)** applies the **[TRaSH Guides](https://trash-guides.info/)** custom formats and scores to both apps from one YAML file (see [`reference/recovery/04-recyclarr.yml`](../reference/recovery/04-recyclarr.yml)).

What it sets up:
- **A balanced HD profile** that prefers good 1080p Blu-ray and WEB-DL releases up to a target score.
- **Audio formats** scored by quality (TrueHD Atmos, DTS:X, DTS-HD MA, FLAC), so a release with better audio replaces a weaker one when it appears.
- **HDR formats** (Dolby Vision, HDR10+, HDR10) scored by what your screens can show.
- **A large negative score** for things you never want: full disc images, very low-quality encodes, 3D, and unwanted extras.

Run a sync by hand after you change the YAML:

```bash
docker exec -it recyclarr recyclarr sync
```

---

## 5. Adding indexers

Indexers are the sites that Prowlarr searches. Some are public; private ones need an account or a passkey. Either way, you add them in one place:

1. Open **Prowlarr** at `http://YOUR_SERVER_IP:9696`.
2. Go to **Indexers**, then **Add Indexer**.
3. Search for the indexer you use and enter your credentials if it needs them.
4. Click **Test**, then **Save**.

Prowlarr pushes the new indexer to Radarr and Sonarr straight away.
