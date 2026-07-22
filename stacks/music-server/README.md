# Navidrome Music Server — Your Personal Cloud Music Streamer

## 🎯 What You'll Have When You're Done
When you complete this guide, you will have a blazing-fast, private cloud music server running right from your home server. You will be able to index thousands of FLAC, MP3, and ALAC albums in seconds, stream bit-perfect lossless audio from any browser, and connect dozens of Subsonic-compatible mobile apps (`Symfonium`, `Substreamer`, `Amperfy`) for offline downloads and smart playlists on the go!

---

## 💡 What Is Navidrome and Why Would I Want It?

Commercial music streaming services like Spotify and Apple Music suffer from missing album versions, compressed audio bitrates, and sudden price increases. If you own a collection of CD rips or digital audio purchases, putting them on your phone usually means wrestling with cumbersome USB cables or running out of local mobile storage space.

**[Navidrome](https://www.navidrome.org/)** is a modern, lightweight, open-source music server written in Go:
- **Ultra-Low Resource Usage:** Runs comfortably on tiny home servers or Raspberry Pis, consuming less than `100 MB` of memory while indexing 50,000+ tracks.
- **Subsonic API Compatibility:** Speaks the industry-standard **Subsonic** protocol. This means you aren't forced to use a clunky web interface on your phone—you can use dozens of top-tier, native third-party mobile apps!
- **Read-Only Safety:** By mounting your music folder in read-only mode (`:ro`), you guarantee that no server bug or accidental web click can ever overwrite or delete your master audio files.

---

## 📋 Prerequisites

Before setting up this stack, make sure you have:
1. Completed **[02. Understanding Docker & Containers](../../docs/02-understanding-docker.md)**.
2. Formatted and created your `/data/media/music` folder (`Artist / Album / Track.flac`) as covered in **[04. Storage, Disks & NAS Concepts](../../docs/04-storage-and-nas.md)**.
3. Copied and edited `stacks/.env` (`cp stacks/.env.example stacks/.env`).

---

## 🔧 Understanding the Compose File

Let's examine how our `docker-compose.yml` blueprint works under the hood:

```yaml
services:
  navidrome:
    image: deluan/navidrome:latest
    container_name: navidrome
    environment:
      - ND_PUID=${PUID:-1000}
      - ND_PGID=${PGID:-1000}
      - ND_PORT=4533
      - ND_MUSICFOLDER=/music
      - ND_DATAFOLDER=/data
    volumes:
      - ./config:/data
      - ${DATA_ROOT:-/data}/media/music:/music:ro
    ports:
      - "4533:4533"
    restart: unless-stopped
```

- **`volumes:`** We bind `./config` right to `/data` so Navidrome's SQLite database (`navidrome.db`) and album art cache live locally in your stack folder. We also mount `/data/media/music` to `/music:ro`. The `:ro` flag stands for **Read-Only**—Navidrome can scan and read audio tracks, but physical file deletions are strictly blocked at the kernel level!
- **`ports:`** Door `4533` is exposed on your server so you can reach the web dashboard across your Wi-Fi network.

---

## 🚀 Setting It Up Step by Step

### Step 1: Navigate to the Music Server Folder
Open your terminal and move into the `music-server` directory:
```bash
cd /opt/homelab/stacks/music-server
```

### Step 2: Launch the Navidrome Container
Start the server in detached mode:
```bash
docker compose up -d
```

### 🔍 What Just Happened?
When you ran `docker compose up -d`:
1. Docker pulled the lightweight `deluan/navidrome:latest` image.
2. It created `./config` on your disk to store your music database.
3. It bound `/data/media/music` in secure read-only mode (`:ro`).
4. It booted the server process and opened port `4533` on your network!

---

## ✅ Verifying It Works

### Step 1: Check Container Health
Run our diagnostic checker to verify Navidrome is healthy:
```bash
../../helpers/check-health.sh
```

### Step 2: Create Your Admin Account
Open your web browser and navigate to:
```
http://192.168.1.100:4533
```
*(Replace `192.168.1.100` with your server's actual IP address.)*

1. **Create Username & Password:** Type your desired administrator username and password, then click **Create Admin Profile**.
2. **Automatic Background Scan:** Navidrome will instantly begin scanning `/music`. Within seconds, your albums, artists, and album art will populate on the home dashboard!

---

## 📱 Connecting Your Mobile Apps

To enjoy your music on the go, download a Subsonic-compatible mobile app on your phone:
- **Android:** `Symfonium` (Best overall, incredible EQ and offline caching) or `Substreamer` (Free).
- **iOS:** `Amperfy` (Free, clean Apple Music feel) or `Substreamer`.

When prompted for server details in your mobile app:
- **Server URL:** `http://YOUR_SERVER_IP:4533` *(Or your HTTPS domain once set up via `networking/`)*
- **Username:** Your Navidrome username
- **Password:** Your Navidrome password

---

## 🧩 What's Next?

With your movies and music sorted and streaming cleanly across your home, let's tackle one of the most critical personal data tasks: backing up and organizing your irreplaceable smartphone photos and videos away from Google Photos or iCloud!

👉 **Proceed to the [`photo-backup/`](../photo-backup/README.md) Stack**

---

## 🔧 Troubleshooting

- **Issue: My albums don't appear in Navidrome after starting.**
  - **Solution:** Verify that your audio files are stored inside `/data/media/music` and check file permissions on the host system (`sudo chown -R $USER:$USER /data/media/music`). Then inside the Navidrome web UI, click the **Quick Scan** button in the top right to trigger a manual library index!
- **Issue: Album covers appear blank or generic.**
  - **Solution:** Navidrome checks for embedded ID3/FLAC metadata tags first, then looks for `cover.jpg` or `folder.jpg` inside the album folder. Use a desktop tagging tool like MusicBrainz Picard on your computer to ensure your audio files have clean embedded artwork before copying them to `/data/media/music`.
