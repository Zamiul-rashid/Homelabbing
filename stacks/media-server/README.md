# Jellyfin Media Server — Your Personal Netflix, Without the Subscription

## 🎯 What You'll Have When You're Done
When you complete this guide, you will have a fully functional media streaming server running locally on your hardware. You will be able to open any web browser, smart TV, Roku, Apple TV, or mobile app on your home Wi-Fi and instantly stream your uncompressed 4K movies and TV series with automatic poster art, actor bios, and synchronized subtitles.

---

## 💡 What Is Jellyfin and Why Would I Want It?

Commercial streaming services are becoming increasingly fragmented, expensive, and restrictive. Content disappears every month due to shifting licensing deals, and streaming quality is often heavily compressed.

**[Jellyfin](https://jellyfin.org/)** is a 100% free, open-source media server that puts you back in complete control:
- **Zero Fees & Zero Paywalls:** Unlike Plex or Emby, Jellyfin has no premium tiers, no subscription fees, and no remote authentication servers tracking what you watch.
- **Uncapped Hardware Transcoding:** If your server has an Intel CPU with QuickSync or an NVIDIA GPU, Jellyfin transcodes 4K video streams on the fly without locking hardware acceleration behind a paywall.
- **Complete Privacy:** Your media files and watch history stay exclusively on your home network.

---

## 📋 Prerequisites

Before setting up this stack, make sure you have:
1. Completed **[02. Understanding Docker & Containers](../../docs/02-understanding-docker.md)**.
2. Created your `/data/media/movies` and `/data/media/tv` folders as explained in **[04. Storage, Disks & NAS Concepts](../../docs/04-storage-and-nas.md)**.
3. Copied and edited your root environment variables file: `cp stacks/.env.example stacks/.env`.

---

## 🔧 Understanding the Compose File

Let's examine how our `docker-compose.yml` works under the hood:

```yaml
services:
  jellyfin:
    image: lscr.io/linuxserver/jellyfin:latest
    container_name: jellyfin
    environment:
      - PUID=${PUID:-1000}
      - PGID=${PGID:-1000}
      - TZ=${TZ:-America/New_York}
    volumes:
      - ./config:/config
      - ${DATA_ROOT:-/data}/media:/data/media
    ports:
      - "8096:8096"
    restart: unless-stopped
```

- **`volumes:`** We bind `/data/media` from your physical disk right to `/data/media` inside the container so Jellyfin can index your video files. We also bind `./config` so your library metadata and user accounts are saved locally on disk right next to your compose file.
- **`ports:`** Door `8096` is opened on your server, pointing straight to Jellyfin's internal web server.

---

## 🚀 Setting It Up Step by Step

### Step 1: Navigate to the Media Server Folder
Open your terminal and move into the `media-server` directory:
```bash
cd /opt/homelab/stacks/media-server
```

### Step 2: Launch the Jellyfin Container
Start the container in detached background mode:
```bash
docker compose up -d
```

### 🔍 What Just Happened?
When you ran `docker compose up -d`:
1. Docker downloaded the clean `linuxserver/jellyfin:latest` image.
2. It created `./config` on your disk and bound your `/data/media` folder.
3. It booted Jellyfin and assigned it to port `8096` on your local network!

---

## ✅ Verifying It Works

### Step 1: Check Container Health
Run our diagnostic checker from the repo root to verify Jellyfin is healthy:
```bash
../../helpers/check-health.sh
```

### Step 2: Complete the Welcome Wizard
Open your web browser and navigate to:
```
http://192.168.1.100:8096
```
*(Replace `192.168.1.100` with your server's actual IP address.)*

1. **Choose Language:** Select your preferred language and click **Next**.
2. **Create Admin User:** Type your desired username and a strong password.
3. **Add Media Libraries:** Click **+ Add Media Library**:
   - **Content type:** Select `Movies`.
   - **Folders:** Click `+` and pick `/data/media/movies`.
   - Click **OK**, repeat for `Shows` (`/data/media/tv`), then click **Next**.
4. **Metadata:** Leave defaults checked so Jellyfin automatically downloads official movie posters from TMDB.
5. **Finish Wizard:** Click **Finish** and log in!

---

## 🧩 What's Next?

Now that your media server is streaming smoothly, nobody wants to manually download and rename video files every time a new episode airs. Let's set up the automated ***Arr Acquisition Pipeline** to handle searching, downloading, and organizing automatically!

👉 **Proceed to the [`arr-stack/`](../arr-stack/README.md) Stack**

---

## 🔧 Troubleshooting

- **Issue: Jellyfin cannot see my movie files inside `/data/media/movies`.**
  - **Solution:** Check your Linux folder ownership! If `/data/media` is owned by root, Jellyfin running under your `PUID` (`1000`) will get permission denied errors. Run `sudo chown -R $USER:$USER /data/media` and scan your library again inside Jellyfin settings.
- **Issue: Video playback stutters when watching on my smartphone or external browser.**
  - **Solution:** High-bitrate 4K HDR files require transcoding when streamed to devices that don't natively support video codecs like H.265. If you have an Intel CPU with QuickSync, go to **Dashboard → Playback** and enable **Intel QuickSync (QSV)** hardware transcoding.
