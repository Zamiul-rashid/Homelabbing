# 💾 Backup Strategy & Disaster Recovery Guide

A homelab without an automated, tested backup pipeline is a ticking time bomb. Hardware boot drives degrade, SSD controllers fail without warning, and accidental `rm -rf` commands happen even to seasoned system administrators.

Our backup design follows a strict **Separation of Concerns** principle between **Stateful Configuration Data** and **Bulk Media Storage**. This document details exactly what is backed up, how encryption works, how to configure automated daily cron schedules, and how to verify recovery procedures.

---

## 1. What Is Backed Up vs. What Is NOT Backed Up

Attempting to pack multi-terabyte 4K movie libraries into daily cloud tar archives is neither practical nor financially viable. We separate lightweight, irreplaceable configuration state from heavy, replaceable physical data:

### ✅ What Is Backed Up (Irreplaceable System State)
When `scripts/03-backup.sh` executes, it creates a clean, consistent snapshot of the exact databases and configuration files that cannot be recreated from Docker images alone:
- `/opt/homelab/proxy-stack/data/npm/` — Nginx Proxy Manager SQLite database, proxy host routing tables, user logins, and access control lists.
- `/opt/homelab/proxy-stack/letsencrypt/` — Let's Encrypt SSL certificates, renewal accounts, and private account keys.
- `/opt/homelab/nextcloud-stack/config/` — Nextcloud system configuration (`config.php`), trusted domain definitions, and app settings.
- `/opt/homelab/media-stack/config/homeassistant/` — Home Assistant smart home automations, dashboard YAML layouts, device integrations, and Zigbee/Z-Wave pairings.

### ❌ What Is NOT Backed Up (Bulk Data & Reproducible State)
- **`/data/media/...` (Movies, TV Shows, Music Books):** Stored directly on your pooled `mergerfs` physical hard drives (`/mnt/disk1..4`). If a drive fails, media items can be redownloaded automatically via Radarr/Sonarr.
- **`/mnt/disk2/nextcloud_data/` (User Cloud Files):** Personal Nextcloud file storage should be backed up using external desktop sync clients, secondary local hard drive rsync cron jobs, or dedicated cloud object backups.
- **`media-stack/config/radarr/` & `sonarr/`:** Because Radarr, Sonarr, and Prowlarr configurations are fully codified via TRaSH Guides (`04-recyclarr.yml`) and `configure-stack.sh`, restoring them simply requires running our automated ignition and wiring scripts on fresh containers!

---

## 2. Automated Daily Backup Script (`03-backup.sh`)

Our automated runner (`scripts/03-backup.sh`) executes a clean, multi-stage backup workflow every single run:

1. **Service Pause:** Briefly pauses the `nginx-proxy-manager` container (`docker pause nginx-proxy-manager`) for 2 seconds to ensure its underlying SQLite database is not written to mid-copy, guaranteeing a corruption-free snapshot before unpausing immediately (`docker unpause`).
2. **Staging & Compression:** Copies all targeted state directories into `/tmp/homelab-staging-TIMESTAMP/` and bundles them into a compact gzip tarball (`homelab-backup-YYYYMMDD-HHMMSS.tar.gz`).
3. **AES-256-CBC Encryption:** Encrypts the tarball in memory using OpenSSL with PBKDF2 (600,000 iterations) keyed directly from `BACKUP_ENCRYPTION_PASSWORD` in `.env`, generating a secure `.tar.gz.enc` file.
4. **Destination Upload & Pruning:** Pushes the encrypted archive to your configured destination (`BACKUP_ARCHIVE_URL`) and automatically prunes local archives older than 7 days to prevent disk exhaustion.

---

## 3. Configuring Destinations (`BACKUP_ARCHIVE_URL`)

Inside your root `.env` file, set `BACKUP_ARCHIVE_URL` to match your desired storage target. The script automatically detects the protocol prefix (`local path`, `s3://`, or `https://` WebDAV):

### Option A: Local Hard Drive or NAS NFS Mount
```env
BACKUP_ARCHIVE_URL=/mnt/disk1/backups/homelab
```
*Stores archives locally on disk 1. Old backups older than 7 days are pruned automatically.*

### Option B: Amazon S3 / Cloudflare R2 / MinIO Bucket
```env
BACKUP_ARCHIVE_URL=s3://my-homelab-secure-backups-bucket/daily
```
*Requires the AWS CLI (`aws`) to be installed and configured (`aws configure`) on the host system.*

### Option C: Remote Nextcloud or WebDAV Server
```env
BACKUP_ARCHIVE_URL=nextcloud://remote-server.com/remote.php/dav/files/myuser/Backups
NC_BACKUP_USER=myuser
NC_BACKUP_PASSWORD=my-secure-webdav-password
```
*Uploads encrypted archives over secure HTTPS WebDAV directly to a remote cloud storage account.*

---

## 4. Setting Up Automated Cron Schedules

To ensure your backups run reliably every morning without human intervention, register the script with system cron:

```bash
# 1. Open the root crontab editor
sudo crontab -e

# 2. Append the following line to run every morning exactly at 3:00 AM:
0 3 * * * /opt/homelab/scripts/03-backup.sh >> /var/log/homelab-backup.log 2>&1
```

### Verifying Cron Execution
Check the live output log anytime to confirm recent backup successes and file sizes:
```bash
tail -n 30 /var/log/homelab-backup.log
```

---

## 5. Testing Disaster Recovery (`02-restore.sh`)

A backup that has never been tested is not a backup—it is a wish. We strongly recommend performing a dry-run restoration test on a virtual machine or spare hard drive to verify your decryption credentials.

### How `scripts/02-restore.sh` Works:
1. Prompts for your decryption passphrase (`BACKUP_ENCRYPTION_PASSWORD`) or reads it directly from `.env`.
2. Downloads or locates the specified encrypted archive (`homelab-backup-YYYYMMDD.tar.gz.enc`).
3. Decrypts the archive using `openssl enc -d -aes-256-cbc -pbkdf2 -iter 600000`.
4. Extracts NPM SQLite data, Let's Encrypt certificates, Nextcloud config, and Home Assistant config directly into their respective `/opt/homelab/...` configuration folders.
5. Fixes file ownership to match `PUID:PGID` (`1000:1000`).

### Running a Manual Restore:
```bash
sudo chmod +x scripts/02-restore.sh
sudo ./scripts/02-restore.sh
```
Once the restore completes, running `bash scripts/05-ignition.sh` will bring up your entire proxy, cloud, and smart home infrastructure exactly where you left off!
