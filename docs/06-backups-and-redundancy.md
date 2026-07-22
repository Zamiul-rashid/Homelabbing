# 06. Backups & Data Redundancy: Protecting Your Data

A home server without an automated, tested backup pipeline is a disaster waiting to happen. Physical hard drives eventually degrade, power surges occur, and accidental terminal commands (`rm -rf`) happen to even the most experienced engineers.

In this guide, we reframe backup strategies away from dramatic "disaster recovery protocols" and focus on practical data protection. You will learn the golden rule of separating lightweight **configuration state** from heavy **media storage**, master encryption concepts, and walk step-by-step through setting up automated morning cron jobs.

---

## 🎯 What You'll Learn

- The **Separation of Concerns** principle: Why backing up 10 terabytes of movies every night is wasteful and unnecessary.
- What exactly needs to be backed up (databases, SSL certs, configurations) versus what is easily replaceable.
- How military-grade **AES-256-CBC encryption** works and why you should encrypt archives before uploading them to cloud storage.
- How to write clean shell commands to bundle, encrypt, and prune backups automatically using Linux `cron` schedules.
- How to test your backup recovery so you know your snapshots actually work when you need them.

---

## ⚖️ Data vs. Configuration Separation: What to Back Up?

When beginners set up a home server, they often try to compress their entire `/data` directory into daily cloud archives. Attempting to upload 12 terabytes of 4K Blu-ray remuxes over a standard home internet connection quickly exhausts bandwidth and costs a fortune in cloud storage fees.

To protect your server smartly, we divide your files into two distinct categories:

```
┌────────────────────────────────────────────────────────────────────────┐
│ The Separation of Concerns Principle                                   │
│                                                                        │
│  ├── Configuration State (Under ~500 MB) ──> [DAILY ENCRYPTED BACKUP]  │
│  │    ├── Nginx Proxy Manager SQLite Database & SSL Keys               │
│  │    ├── Nextcloud Config & User Database                             │
│  │    └── Immich Database & Paperless-ngx Metadata                     │
│  │                                                                     │
│  └── Bulk Media & Downloads (10+ Terabytes) ──> [NO CLOUD BACKUP]      │
│       ├── /data/media/movies (Replaceable via *arr pipeline)           │
│       └── /data/downloads (Temporary scratch files)                    │
└────────────────────────────────────────────────────────────────────────┘
```

### ✅ What Must Be Backed Up (Irreplaceable State)
These are compact, highly critical files and databases that cannot be recreated from Docker images alone:
- **Nginx Proxy Manager (`stacks/networking/data/npm/`):** Contains your routing tables, user credentials, and Let's Encrypt SSL private certificates (`/letsencrypt/`).
- **Nextcloud & Paperless Configurations (`config/`):** System configuration files, encryption keys, and SQLite/PostgreSQL database dumps.
- **Immich & Personal Photo Vaults:** Your family photos are irreplaceable data and should be synced to secondary physical hard drives or encrypted cloud storage!

### ❌ What Does NOT Need Daily Backups (Bulk Data)
- **Movies, TV Shows, and Music (`/data/media/...`):** Media files take up vast amounts of disk space but can be redownloaded or ripped again at any time.
- **Docker Compose YAML files:** Because our compose files are stored cleanly right inside your git repository, your infrastructure blueprint is already version-controlled and saved!

> [!NOTE]
> **💡 Why This Matters**
> By focusing only on irreplaceable configuration state (`~100 MB to 500 MB`), your daily backup job completes in under **30 seconds** and costs pennies per year to store safely in cloud object storage or on a USB drive.

---

## 🔐 Understanding Encryption (`AES-256-CBC` & `PBKDF2`)

If you save backup tarballs of your server configurations (`homelab-backup.tar.gz`) directly to an external cloud bucket or unencrypted NAS drive, anyone who gains access to those files can extract your Let's Encrypt private keys, database passwords, and Nginx administrative logins.

To guarantee complete privacy, you should **always encrypt archives locally in your computer's memory right before saving them to disk or sending them over the network.**

In Linux, we use `openssl` with industry-standard cryptographic algorithms:

```bash
openssl enc -aes-256-cbc -pbkdf2 -iter 600000 \
    -in homelab-backup.tar.gz \
    -out homelab-backup.tar.gz.enc \
    -pass pass:YourSecureDecryptionPassword123!
```

### What Do These Encryption Parameters Mean?
- `enc -aes-256-cbc`: **Advanced Encryption Standard (AES)** using a 256-bit key in **Cipher Block Chaining (CBC)** mode. This is the same cipher standard trusted worldwide by financial institutions and governments.
- `-pbkdf2 -iter 600000`: **Password-Based Key Derivation Function 2** set to **600,000 iterations**. This forces the computer to scramble your password six hundred thousand times to generate the cryptographic key, making brute-force dictionary attacks practically impossible even on massive GPU clusters.

---

## ⏰ Step-by-Step: Setting Up Your Automated Daily Cron Job

Let's build a clean, manual backup routine using Linux's built-in task scheduler: **cron**.

### 1. Create a Staging Folder for Backups
Let's create an empty directory on your disk where daily encrypted archives will be saved:

```bash
sudo mkdir -p /data/backups/homelab
sudo chown -R $USER:$USER /data/backups/homelab
```

### 2. Write a Simple Backup Script
Create a script file named `daily-backup.sh` inside your home directory:

```bash
nano ~/daily-backup.sh
```

Paste the following heavily commented backup routine:

```bash
#!/usr/bin/env bash
set -e

# 1. Define timestamp and paths
TIMESTAMP=$(date +"%Y%m%d-%H%M%S")
STAGING_DIR="/tmp/backup-${TIMESTAMP}"
DEST_DIR="/data/backups/homelab"
PASSWORD="YourAES256DecryptionPasswordHere!" # Replace or load from .env

mkdir -p "$STAGING_DIR"
mkdir -p "$DEST_DIR"

echo "[INFO] Starting configuration backup: $TIMESTAMP"

# 2. Briefly pause Nginx Proxy Manager to ensure database consistency
# Pausing prevents mid-write SQLite database corruption while archiving
if docker ps --format '{{.Names}}' | grep -q "^nginx-proxy-manager$"; then
    echo "[INFO] Pausing nginx-proxy-manager for snapshot..."
    docker pause nginx-proxy-manager
fi

# 3. Bundle critical configuration state into a compressed tarball
tar -czf "$STAGING_DIR/homelab-state.tar.gz" \
    --ignore-failed-read \
    /opt/homelab/stacks/*/data \
    /opt/homelab/stacks/*/config \
    /opt/homelab/stacks/*/letsencrypt 2>/dev/null || true

# 4. Unpause Nginx Proxy Manager immediately
if docker ps --format '{{.Names}}' | grep -q "^nginx-proxy-manager$"; then
    docker unpause nginx-proxy-manager
    echo "[INFO] Resumed nginx-proxy-manager."
fi

# 5. Encrypt the tarball in memory before writing final output
echo "[INFO] Encrypting archive with AES-256-CBC..."
openssl enc -aes-256-cbc -pbkdf2 -iter 600000 \
    -in "$STAGING_DIR/homelab-state.tar.gz" \
    -out "$DEST_DIR/homelab-backup-${TIMESTAMP}.tar.gz.enc" \
    -pass "pass:$PASSWORD"

# 6. Prune old backups older than 7 days to conserve disk space
find "$DEST_DIR" -name "homelab-backup-*.tar.gz.enc" -type f -mtime +7 -delete

# 7. Clean up temporary staging folder
rm -rf "$STAGING_DIR"

echo "[INFO] ✅ Backup complete! Saved to $DEST_DIR/homelab-backup-${TIMESTAMP}.tar.gz.enc"
```

Save and exit, then make the script executable:

```bash
chmod +x ~/daily-backup.sh
```

### 3. Schedule the Script inside Crontab
To run your script automatically every morning exactly at 3:00 AM while you sleep:

```bash
crontab -e
```

Append this exact schedule at the bottom:

```cron
# Run daily configuration backup at 3:00 AM every single morning
0 3 * * * /home/ubuntu/daily-backup.sh >> /var/log/homelab-backup.log 2>&1
```

Save and exit. Your server will now quietly generate encrypted snapshots every morning!

---

## 📚 Reference: How the Author Personally Backs Up Their Lab

In the **`reference/recovery/`** directory of this repository, you will find the author's personal recovery scripts (`01-bootstrap.sh`, `02-restore.sh`, `03-backup.sh`). 

Those scripts demonstrate advanced workflows:
- S3 / Cloudflare R2 object bucket uploads using the `aws` CLI.
- Remote Nextcloud WebDAV transmission (`nextcloud://`).
- Automated multi-stack ignition triggers.

We provide those reference scripts as **inspiration and learning examples only**. We strongly encourage you to understand the manual steps above so you can adapt and build a backup strategy that fits your exact hardware and household needs!

---

## 🔍 What Just Happened?

By implementing this data protection strategy:
1. You separated massive, replaceable media data (`/data/media`) from irreplaceable configuration files (`/config` and `/letsencrypt`).
2. You mastered how `openssl` uses `AES-256-CBC` and `PBKDF2` to encrypt archives against dictionary attacks before saving them to disk.
3. You scheduled a clean, automated `cron` job that pauses SQLite databases during snapshots, encrypts archives, and prunes old snapshots after 7 days!

---

## 🧩 What's Next?

Now that your data is cleanly separated, backed up, and protected against hardware failures, let's explore our final concept guide: hardening your server's security against external threats, firewalls, and common misconfigurations!

👉 **Proceed to [07. Security & Hardening Basics](07-security-basics.md)**
