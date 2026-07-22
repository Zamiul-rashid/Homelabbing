# Navidrome — Your Personal Cloud Music Streamer
> What it is: A modern, lightweight, fast web-based music server and Subsonic-compatible audio streaming system. What it replaces: Spotify, Apple Music, YouTube Music, Tidal.

## What you'll have when done
A blazing-fast, private music server that indexes your entire FLAC, MP3, and ALAC collection. You can stream lossless audio directly from any web browser or connect dozens of sleek third-party mobile apps (`Symfonium`, `Substreamer`, `Amperfy`) for offline downloading, smart playlists, and scrobbling without monthly subscription fees.

## Quick Launch
### 1. Set up storage
Verify that your host machine has `/srv/music` created and put your albums inside (organize folders by `Artist / Album / Track.flac`):
```bash
sudo mkdir -p /srv/music
sudo chown -R $USER:$USER /srv/music
```

### 2. Configure .env
Ensure your `quickstart/.env` contains correct permissions and path assignments:
```bash
PUID=1000
PGID=1000
TZ=UTC
MUSIC_DIR=/srv/music
```

### 3. Start
From inside `03-music-server/`, launch the server:
```bash
docker compose up -d
```

Expected terminal output:
```
[+] Running 2/2
 ✔ Network 03-music-server_default  Created            0.1s
 ✔ Container navidrome              Started            0.3s
```

### 4. Open browser: http://YOUR_IP:4533
When you navigate to `http://192.0.2.1:4533`, you will see the **Navidrome Account Creation** screen asking you to set up the admin profile.

## First-Time Setup
1. **Create Admin Profile:** Enter your desired username and password and click **Create Admin Profile**.
2. **Automatic Scan:** Navidrome will instantly begin scanning `/srv/music` in the background. Within seconds, your albums, artists, and album art will populate on the home dashboard.
3. **Scrobbling (Optional):** Click the profile icon in the top right → **Personal Settings** to connect your Last.fm or ListenBrainz account for automated scrobbling.

## Connecting to Other Services
- **Lidarr Integration:** If you want automated music downloading similar to Radarr/Sonarr, you can add `linuxserver/lidarr` and configure it to download albums directly into `/srv/music`.

## Add HTTPS (Optional)
To stream your music on your smartphone while driving or commuting, configure secure remote access:
→ **[networking/README.md](../networking/README.md)**

## What Now?
1. **Connect Mobile Apps:** Download a Subsonic-compatible app:
   - **Android:** `Symfonium` (Best overall, incredible EQ/offline features) or `Substreamer` (Free).
   - **iOS:** `Amperfy` (Free, Apple Music feel) or `Substreamer`.
   In the app, connect using `http://YOUR_SERVER_IP:4533` (or your domain URL) and your Navidrome username/password!
2. **Upload High-Res Albums:** Add lossless 24-bit/96kHz FLAC files to `/srv/music` and experience bit-perfect streaming right from your own server.
3. **Explore Photo Backups:** Ready to ditch Google Photos? Move on to **[04-photo-server](../04-photo-server/README.md)** (Immich)!
