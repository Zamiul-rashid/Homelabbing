# 🚀 Quickstart: Build Your Personal Home Server

> **No experience needed.** If you can open a terminal, you can build a self-hosted cloud that replaces your monthly subscriptions.

Welcome to the beginner-friendly quickstart layer of **Homelabbing**! Whether you have an old $50 desktop PC collecting dust, a Raspberry Pi 4/5, or a dedicated home server, these modular stacks let you take control of your digital life—one service at a time.

---

## 📊 At a Glance: What You Can Build

| Stack / Service | Replaces | Port | Difficulty | Folder |
| :--- | :--- | :---: | :---: | :--- |
| **🎬 Jellyfin** | Netflix, Plex, Emby | `8096` | 🟢 Easy | `01-media-server` |
| **⚡ *arr Stack** | Manual torrenting, Radarr, Sonarr | `8080`–`9696` | 🟡 Medium | `02-arr-stack` |
| **🎵 Navidrome** | Spotify, Apple Music | `4533` | 🟢 Easy | `03-music-server` |
| **🖼️ Immich** | Google Photos, iCloud Photos | `2283` | 🟡 Medium | `04-photo-server` |
| **☁️ Nextcloud** | Google Drive, Dropbox, OneDrive | `4443` | 🟡 Medium | `05-cloud-storage` |
| **🏰 Full Stack** | All of the above (Single network) | *All* | 🔴 Advanced | `06-full-stack` |

---

## ✅ Prerequisites Checklist

Before running any container, make sure your host machine meets these requirements:
- [ ] Running a Linux distribution (Ubuntu 22.04/24.04 or Debian 12 recommended).
- [ ] At least 4 GB of RAM (8 GB+ recommended if running Immich + Nextcloud).
- [ ] Internet access for pulling Docker container images.

---

## ⚡ Step 0: One-Line Docker Setup

If you don't have Docker installed yet, run our automated bootstrap script on your Ubuntu or Debian system. It installs the official Docker Engine, Compose V2 plugin, adds your user to the `docker` group, and prepares host storage folders (`/srv/media`, `/srv/downloads`, etc.):

```bash
sudo bash scripts/bootstrap.sh
```

*(Once finished, log out and log back into your terminal so your new group permissions take effect).*

---

## 🎯 Step 1: Choose Your Fast Path

We strongly recommend starting with **Jellyfin (`01-media-server`)** to get familiar with Docker. Once you see your movies streaming in your browser, add the download automation stack (`02-arr-stack`) or branch out into music (`03-music-server`) and photos (`04-photo-server`).

### The Interactive Launcher (Easiest)
You don't even need to remember folder paths or compose commands! Just run:

```bash
bash scripts/launch.sh
```

Our interactive menu will check your `.env` file, let you pick the stack you want to start, launch containers in the background, and perform an automated health check with direct clickable URLs!

---

## 🩺 Checking Service Health

At any time, you can verify container status across all 9 homelab ports by running:

```bash
bash scripts/check-health.sh
```

You'll get a clean, color-coded table showing whether each container is `healthy`, `starting...`, or `not running`.

---

## 🌐 Remote Access & Networking

Want to access your Jellyfin server from a hotel room or share Nextcloud with your family across town? Check out our comprehensive guides:

👉 **[Remote Access & Networking Guide (`networking/README.md`)](./networking/README.md)**
Choose between **DuckDNS (Free)**, **Cloudflare DNS Challenge (Free)**, **Custom Bought Domains**, and **Tailscale VPN Mesh (Most Secure)**.

---

## 🔬 Ready to Go Deeper?

This `quickstart/` directory is designed specifically for first-timers. Once you master these modular stacks and want high-availability reverse proxying, monitoring (Grafana/Prometheus), automated backups, and 25+ advanced containers, explore the parent repository's full **[Doomsday Protocol Architecture](../README.md)**!
