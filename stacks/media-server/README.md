# Jellyfin — Your Personal Netflix, Without the Subscription
> What it is: A powerful, open-source media system that organizes, manages, and streams your movies, shows, and music. What it replaces: Netflix, Plex, Emby, Apple TV+.

## What you'll have when done
A fully functional media streaming server running locally on your hardware. You will be able to open any web browser, smart TV, or mobile app on your home network and instantly stream your high-definition video files with automatic poster art, cast details, and subtitles.

## Quick Launch
### 1. Set up storage
Verify that your host machine has `/srv/media` created (our `bootstrap.sh` script does this automatically). Place at least one video file (`.mp4` or `.mkv`) inside `/srv/media/movies` to test with.

### 2. Configure .env
Ensure your `quickstart/.env` file exists and contains your user IDs (`id -u` and `id -g`):
```bash
PUID=1000
PGID=1000
TZ=UTC
MEDIA_DIR=/srv/media
```

### 3. Start
From inside the `01-media-server/` directory, start the container:
```bash
docker compose up -d
```

Expected terminal output:
```
[+] Running 2/2
 ✔ Network 01-media-server_default  Created            0.1s
 ✔ Container jellyfin               Started            0.4s
```

### 4. Open browser: http://YOUR_IP:8096
When you navigate to `http://192.0.2.1:8096` (replace with your server's local IP), you will see the **Jellyfin Welcome & Setup Wizard** asking you to choose your display language.

## First-Time Setup
1. **Language:** Select **English** (or your preferred language) and click **Next**.
2. **Admin User:** Create your primary administrator username and a strong password.
3. **Media Libraries:** Click **+ Add Media Library**:
   - **Content type:** Select `Movies`.
   - **Folders:** Click `+` and choose `/data/media/movies` (or `/data/media`).
   - Click **OK** and then **Next**.
4. **Metadata Settings:** Leave preferred language and country at defaults so Jellyfin fetches exact movie posters and ratings from TMDB.
5. **Remote Access:** Leave **Allow remote connections to this server** checked (this applies to local LAN devices too). Click **Next**, then **Finish**.
6. Sign in with your newly created admin credentials!

## Connecting to Other Services
- **Download Automation:** Connect Jellyfin with **[02-arr-stack](../02-arr-stack/README.md)** (Radarr & Sonarr) to automatically download and organize new movies right into `/srv/media` where Jellyfin watches!
- **Request Management:** Use **Jellyseerr** (included in `02-arr-stack`) so your family can search and request movies right from an elegant web dashboard.

## Add HTTPS (Optional)
To securely access Jellyfin outside your home network without VPNs, see our networking options:
→ **[networking/README.md](../networking/README.md)**

## What Now?
1. **Install Client Apps:** Download the free Jellyfin app on your Roku, Apple TV, Android TV, iOS, or Android device and connect using `http://YOUR_SERVER_IP:8096`.
2. **Enable Hardware Acceleration:** If your server has an Intel CPU with QuickSync or an NVIDIA GPU, enable hardware transcoding under **Dashboard → Playback** for silky smooth 4K streaming.
3. **Set Up Download Automation:** Move on to `02-arr-stack` so you never have to manually rename files or hunt for subtitles again!
