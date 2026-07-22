# Nextcloud Cloud Storage — Your Personal Google Drive Replacement

## 🎯 What You'll Have When You're Done
When you complete this guide, you will have your own private cloud storage hub accessible across Windows, macOS, Linux, iOS, and Android. You will be able to synchronize folders across multiple laptops in real-time, share password-protected download links with clients or friends, edit documents, and keep your sensitive files stored safely under your physical control on `/data/nextcloud` without monthly storage subscription fees!

---

## 💡 What Is Nextcloud and Why Would I Want It?

Public cloud providers like Google Drive, Microsoft OneDrive, and Dropbox continuously scan your documents for automated policy enforcement, charge tiered monthly fees once you exceed basic tiers, and can suspend your accounts or lock you out of your files at any time.

**[Nextcloud](https://nextcloud.com/)** is a comprehensive, self-hosted collaboration platform designed to replace those third-party services:
- **Multi-Device File Synchronization:** Official desktop and mobile sync clients run silently in the background, automatically syncing local folders across all your computers just like Dropbox.
- **Dedicated MariaDB Database:** By pairing Nextcloud with a dedicated MariaDB container instead of basic SQLite, your file indices remain blazing fast even when managing millions of documents across dozens of users.
- **Expandable App Ecosystem:** Add free collaborative office suites (`Nextcloud Office`), calendar syncing (`CalDAV`), contact management (`CardDAV`), and note-taking apps right inside your private cloud dashboard.

---

## 📋 Prerequisites

Before deploying this stack, make sure you have:
1. Completed **[02. Understanding Docker & Containers](../../docs/02-understanding-docker.md)**.
2. Created your `/data/nextcloud` storage directory (`sudo mkdir -p /data/nextcloud && sudo chown -R $USER:$USER /data/nextcloud`).
3. Copied and edited `stacks/.env` (`cp stacks/.env.example stacks/.env`), setting unique passwords for `DB_ROOT_PASSWORD` and `NEXTCLOUD_DB_PASSWORD`.

---

## 🔧 Understanding the Compose File

Let's examine how our two services (`nextcloud` and `nextcloud-db`) interact inside `docker-compose.yml`:

```yaml
services:
  nextcloud:
    image: lscr.io/linuxserver/nextcloud:latest
    volumes:
      - ./config/nextcloud:/config
      - ${DATA_ROOT:-/data}/nextcloud:/data
    ports:
      - "4443:443"
    depends_on:
      - nextcloud-db

  nextcloud-db:
    image: lscr.io/linuxserver/mariadb:latest
    environment:
      - MYSQL_DATABASE=nextcloud
      - MYSQL_USER=nextcloud
      - MYSQL_PASSWORD=${NEXTCLOUD_DB_PASSWORD}
    volumes:
      - ./config/mariadb:/config
```

- **`volumes:`** We bind `/data/nextcloud` from your physical hard drive to `/data` inside Nextcloud. This is where your actual synced files will reside! We also save both configurations locally inside `./config/nextcloud` and `./config/mariadb` so database state is always accessible.
- **`ports:`** Notice that LinuxServer's Nextcloud container listens internally on encrypted `443` using a self-signed SSL certificate. We expose it on host door `4443` (`https://YOUR_SERVER_IP:4443`).

---

## 🚀 Setting It Up Step by Step

### Step 1: Navigate to the Cloud Storage Folder
Open your terminal and move into the `cloud-storage` directory:
```bash
cd /opt/homelab/stacks/cloud-storage
```

### Step 2: Launch the Nextcloud Stack
Boot up the server and database containers:
```bash
docker compose up -d
```

### 🔍 What Just Happened?
When you ran `docker compose up -d`:
1. Docker pulled both `linuxserver/nextcloud:latest` and `linuxserver/mariadb:latest`.
2. It created `./config/nextcloud` and `./config/mariadb` right on your disk.
3. It initialized MariaDB with your secure credentials and started Nextcloud on port `4443`!

---

## ✅ Verifying It Works & Completing Setup

### Step 1: Check Container Health
Run our diagnostic checker to confirm both containers are ready:
```bash
../../helpers/check-health.sh
```
Both `nextcloud` and `nextcloud-db` should show as `healthy (running)`.

### Step 2: Open the Web Dashboard & Handle Self-Signed Certificate
Open your browser and navigate to:
```
https://192.168.1.100:4443
```
*(Replace `192.168.1.100` with your server's actual IP address. Notice `https://` at the start!)*

> [!WARNING]
> **Browser Security Warning ("Your connection is not private")**
> Because LinuxServer Nextcloud generates an automatic **self-signed SSL certificate** on initial startup before you configure custom domain names, your browser will display a security warning. This is completely normal and expected on a local LAN!
> - In Chrome/Edge: Click **Advanced → Proceed to 192.168.1.100 (unsafe)**.
> - In Firefox: Click **Advanced → Accept the Risk and Continue**.

### Step 3: Complete the Installation Wizard
1. **Create Admin Account:** Type your desired administrator username and a strong password.
2. **Configure Database:** If prompted for database connection parameters (`Storage & database` section):
   - **Database user:** `nextcloud`
   - **Database password:** Enter the exact value you set for `NEXTCLOUD_DB_PASSWORD` inside `stacks/.env`.
   - **Database name:** `nextcloud`
   - **Database host:** `nextcloud-db`
3. Click **Install** and wait (~1 minute) while Nextcloud initializes your cloud workspace!

---

## 💻 Installing Desktop and Mobile Sync Clients

Once logged into your dashboard:
1. **Desktop Client:** Download the official **Nextcloud Desktop Client** (available for Windows, macOS, and Linux) to pick any folder on your computer (`~/Nextcloud`) and keep it automatically synchronized with your server.
2. **Mobile App:** Download **Nextcloud** from your phone's App Store or Google Play Store to access documents on the road!

---

## 🧩 What's Next?

You now have a complete suite of self-hosted services (`media-server`, `arr-stack`, `music-server`, `photo-backup`, `book-reader`, `cloud-storage`) running on internal ports. But how do you access them safely from outside your house without memorizing port numbers (`4443`, `8096`, `4533`)?

Let's set up our edge reverse proxy and SSL certificate automation!

👉 **Proceed to the [`networking/`](../networking/README.md) Stack**

---

## 🔧 Troubleshooting

- **Issue: Nextcloud setup wizard says "Error while trying to create admin user: Failed to connect to database".**
  - **Solution:** MariaDB takes about 15–20 seconds on first boot to initialize its system tables before accepting connections. If you typed faster than MariaDB could boot, simply wait 30 seconds and click **Install** again. Also double-check that your `NEXTCLOUD_DB_PASSWORD` inside `stacks/.env` has no special bash-breaking characters (or quotes) that might mismatch between containers.
- **Issue: Nextcloud reports "Access through untrusted domain" when connecting via a new IP address or reverse proxy subdomain.**
  - **Solution:** Nextcloud enforces a strict whitelist of allowed domain names inside `config.php` (`./config/nextcloud/www/nextcloud/config/config.php`). Open that file in a terminal text editor (`nano ./config/nextcloud/www/nextcloud/config/config.php`), find the `'trusted_domains'` array, and add your new domain or server IP (`192.168.1.100` or `cloud.yourdomain.com`) cleanly!
