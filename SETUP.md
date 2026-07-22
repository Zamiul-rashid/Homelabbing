# ⚡ Step-by-Step Setup & Doomsday Recovery Guide (`SETUP.md`)

Whether deploying this stack for the very first time on a brand new Ubuntu server or executing an emergency disaster recovery rebuild following a hard drive failure (**Doomsday Protocol**), this guide walks you through every exact command from bare metal to a fully functioning 25+ service ecosystem.

> **Our Goal: Bus Factor 0.** Complete this entire 10-step rebuild in under 30 minutes.

---

## 📋 Step 1 — Prerequisites & Hardware Preparation

Before entering terminal commands, verify that your environment meets the core requirements:
- A server PC running a clean, fresh installation of **Ubuntu Server 22.04 LTS or 24.04 LTS** (x86_64).
- Root or `sudo` administrative privileges (`sudo -i` or `sudo` access).
- Your **password vault** open with access to your primary email, domain tokens, and backup passwords.
- At least one data hard disk attached (`/dev/sda`, `/dev/sdb`, etc.) for media storage.

---

## 📥 Step 2 — Clone the Showcase Repository

Connect to your server via SSH and clone the repository directly into `/opt/homelab` (or your preferred working directory):

```bash
sudo mkdir -p /opt/homelab
sudo chown -R $(id -u):$(id -g) /opt/homelab
git clone https://github.com/YOUR_USERNAME/homelab.git /opt/homelab
cd /opt/homelab
```

---

## 🛠️ Step 3 — Bootstrap the Operating System (`01-bootstrap.sh`)

Our automated OS bootstrap script prepares the bare-metal Linux environment in one pass. It updates apt packages, installs **Docker Engine 24.0+** and **Docker Compose plugin**, installs **Tailscale VPN** and **mergerfs**, configures **UFW firewall rules** (allowing ports `22`, `80`, `443`, and `81`), creates the `/opt/homelab/...` directory skeleton, and adds your user to the `docker` group.

```bash
sudo chmod +x scripts/01-bootstrap.sh
sudo ./scripts/01-bootstrap.sh
```

### Expected Output Snippet:
```
[INFO]  Bootstrapping for user: ubuntu
[INFO]  Updating system packages...
[INFO]  Installing Docker Engine...
[INFO]  Added ubuntu to docker group (re-login to activate)
[INFO]  Configuring UFW firewall...
Firewall is active and enabled on system startup
[INFO]  Creating homelab directory structure...
[INFO]  Directories created
════════════════════════════════════════════════════
  ✅  Bootstrap complete!
════════════════════════════════════════════════════
```
*Note: Run `newgrp docker` or log out and log back into your SSH session to use Docker without typing `sudo` every time.*

---

## 🔐 Step 4 — Populate Infrastructure Secrets (`.env`)

Copy the public environment template and fill in your confidential passwords, domain names, and encryption keys:

```bash
cp .env.example .env
nano .env
```

### Essential Variables to Fill Right Now:
```env
PUID=1000
PGID=1000
TZ=UTC
SERVER_IP=192.168.1.100              # Your server's static LAN IP address
HOMELAB_DIR=/opt/homelab

DUCKDNS_SUBDOMAIN=your-subdomain       # Just the subdomain part
DUCKDNS_TOKEN=xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
NPM_ADMIN_EMAIL=you@example.com
NPM_ADMIN_PASSWORD=YourSecureProxyPassword123!

DB_ROOT_PASSWORD=YourMariaDBRootPass123!
DB_PASSWORD=YourNextcloudDBPass123!
PAPERLESS_ADMIN_USER=admin
PAPERLESS_ADMIN_PASSWORD=YourPaperlessAdminPass123!
PAPERLESS_SECRET_KEY=generate_with_python3_secrets_token_hex_32

BACKUP_ENCRYPTION_PASSWORD=YourAES256DecryptionKey!
BACKUP_ARCHIVE_URL=/mnt/disk1/backups/homelab
```
*Leave `RADARR_API_KEY`, `SONARR_API_KEY`, and `PROWLARR_API_KEY` blank for now—they will be populated automatically after Step 8.*

---

## 💾 Step 5 — Mount & Pool Storage Disks (`setup.bash`)

Run our intelligent storage setup script to inspect attached hard drives (`/dev/sda..sdd`), safely mount existing filesystems into `/mnt/disk1..4` without formatting, and pool them into a unified `/data` directory using `mergerfs`:

```bash
sudo chmod +x setup.bash
sudo ./setup.bash
```

### Expected Output & Prompt:
```
== Scanning disks ===============================================
  /dev/sda : /dev/sda1 already has filesystem 'ext4' -> mount only, no format
  /dev/sdb : /dev/sdb1 already has filesystem 'ext4' -> mount only, no format

This pools all disks into a single /data via mergerfs, matching
the paths your compose file already expects (/data/media, /data/torrents).
Type YES to continue: YES
  mounted /dev/sda1 -> /mnt/disk1
  mounted /dev/sdb1 -> /mnt/disk2
Verifying fstab...
fstab OK
== Done ==========================================================
Pooled at        : /data
```

---

## 📦 Step 6 — Restore Stateful Configuration (`02-restore.sh`)

If you are performing a **fresh initial install** with zero past data, **you can skip directly to Step 7**.

If you are performing a **disaster recovery rebuild**, run our restore script right now to download and decrypt your daily `homelab-backup.tar.gz.enc` archive, restoring Nginx Proxy Manager rules, Let's Encrypt certificates, Nextcloud settings, and Home Assistant automations:

```bash
sudo chmod +x scripts/02-restore.sh
sudo ./scripts/02-restore.sh
```

---

## 🚀 Step 7 — Ignite All Stacks (`05-ignition.sh`)

Launch our automated ignition runner. It creates the shared `proxy-net` Docker network, distributes copies of `.env` into each stack directory, starts `proxy-stack` (NPM + DuckDNS) first, waits up to 90 seconds for proxy initialization, and then launches `media-stack` and `nextcloud-stack`:

```bash
bash scripts/05-ignition.sh
```

### Expected Output Snippet:
```
══ Creating shared Docker network ══
[INFO]  Created proxy-net

══ Starting proxy-stack (NPM + DuckDNS) ══
[INFO]  proxy-stack started

══ Waiting for Nginx Proxy Manager to initialize ══
[INFO]  NPM ready!

══ Starting media-stack (all media + automation services) ══
[INFO]  media-stack started

══ Starting nextcloud-stack (Nextcloud + MariaDB) ══
[INFO]  nextcloud-stack started
════════════════════════════════════════════════════
  ✅  Ignition complete!
════════════════════════════════════════════════════
```

---

## 🔗 Step 8 — Wire the *Arr Pipeline & Sync Recyclarr (`configure-stack.sh`)

Wait ~60 seconds for containers to fully boot and generate their initial configuration XML files. Then run our automated wiring script to extract newly generated API keys directly from `config.xml` files, configure qBittorrent download paths/categories, connect Prowlarr to Radarr and Sonarr, and save the keys directly into `.env`:

```bash
bash configure-stack.sh
```

Once `configure-stack.sh` finishes saving API keys to `.env`, push TRaSH Guides custom formats and quality definitions:

```bash
docker exec -it recyclarr recyclarr sync
```

---

## 🌐 Step 9 — Configure Reverse Proxy & Nextcloud SSL (`proxy-setup.sh`)

Run our proxy automation script to free port 443 from Nextcloud (shifting it to `4443:443`), request a valid 90-day Let's Encrypt SSL certificate for your DuckDNS domain (`*.your-subdomain.duckdns.org`), create an NPM proxy host, and update Nextcloud `occ` trusted domains:

```bash
bash proxy-setup.sh
```

If you are running Nextcloud with multiple household users, restore user accounts and promote admin status:

```bash
bash nextcloud-stack/restore-users.sh
```

---

## ✅ Step 10 — System Verification Checklist

Your entire homelab is now active and healthy! Run the following commands to confirm operational readiness across all tiers:

```bash
# 1. Verify that all 25+ containers are running cleanly
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"

# 2. Verify UFW firewall rules
sudo ufw status verbose

# 3. Verify Tailscale VPN connectivity
tailscale status
```

### Access Your Live Services:
Open your web browser and navigate to your newly deployed dashboards:
- 📊 **Homepage Dashboard:** `http://YOUR_SERVER_IP:3002`
- 🟢 **Uptime Kuma Status Screen:** `http://YOUR_SERVER_IP:3001`
- 🐳 **Portainer Container Manager:** `http://YOUR_SERVER_IP:9000`
- 🎬 **Jellyfin Media Server:** `http://YOUR_SERVER_IP:8096`
- 🎵 **Navidrome Music Server:** `http://YOUR_SERVER_IP:4533`
- 📚 **Kavita Book/Manga Reader:** `http://YOUR_SERVER_IP:5050`
- 📄 **Paperless-ngx Document Archiver:** `http://YOUR_SERVER_IP:8010`
- ☁️ **Nextcloud Cloud Suite (LAN):** `https://YOUR_SERVER_IP:4443`
- 🔒 **Nextcloud Cloud Suite (WAN/SSL):** `https://your-subdomain.duckdns.org`

---

## 🚨 Troubleshooting Common Setup Errors

| Symptom / Error Message | Root Cause | Solution |
|---|---|---|
| `bind: address already in use` (Port 80/443) | Another web server (e.g., Apache, host Nginx) is occupying ports 80 or 443 before `proxy-stack` boots. | Stop and disable the conflicting service: `sudo systemctl disable --now apache2 nginx` then re-run ignition. |
| `SSL cert request failed` inside `proxy-setup.sh` | Your home router has not forwarded ports 80 and 443 to `SERVER_IP`, or DNS propagation is pending. | Forward ports `80` and `443` on your router to your Ubuntu server IP. Once forwarded, run `bash proxy-stack/finish.sh`. |
| `Radarr API key not found` inside `configure-stack.sh` | Radarr or Sonarr has not finished its very first initialization boot cycle yet. | Wait 60–90 seconds for containers to finish initial startup, then re-run `bash configure-stack.sh`. |
| `occ user:add failed` inside `restore-users.sh` | Nextcloud is still initializing MariaDB tables on first boot. | Check logs via `docker logs -f nextcloud`. Once database tables are created, re-run `bash nextcloud-stack/restore-users.sh`. |
