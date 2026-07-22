# Nextcloud — Your Personal Cloud Storage & Productivity Suite
> What it is: A comprehensive, self-hosted file collaboration, synchronization, document editing, and productivity platform. What it replaces: Google Drive, Dropbox, Microsoft OneDrive, Google Docs.

## What you'll have when done
Your own private cloud storage hub accessible across Windows, Mac, Linux, iOS, and Android. You can sync documents across computers in real-time, share password-protected download links with clients or friends, edit office files, manage calendars, and keep your sensitive files stored safely on `/srv/nextcloud` under your physical control.

## Quick Launch
### 1. Set up storage
Verify that your host machine has `/srv/nextcloud` created and owned by your user (`id -u`):
```bash
sudo mkdir -p /srv/nextcloud
sudo chown -R $USER:$USER /srv/nextcloud
```

### 2. Configure .env
Ensure your `quickstart/.env` contains your MariaDB database credentials and path assignment:
```bash
PUID=1000
PGID=1000
TZ=UTC
CLOUD_DIR=/srv/nextcloud
DB_ROOT_PASSWORD=SecretRootPass456!
DB_PASSWORD=SecretNextcloudUserPass789!
```

### 3. Start
From inside `05-cloud-storage/`, launch the Nextcloud and MariaDB containers:
```bash
docker compose up -d
```

Expected terminal output:
```
[+] Running 3/3
 ✔ Network 05-cloud-storage_default  Created            0.1s
 ✔ Container nextcloud-db            Started            0.3s
 ✔ Container nextcloud               Started            0.6s
```

### 4. Open browser: https://YOUR_IP:4443
Navigate to `https://192.0.2.1:4443`. Note: Because LinuxServer Nextcloud generates an automatic self-signed SSL certificate on first startup, your browser will display a security warning ("Your connection is not private"). Click **Advanced → Proceed to 192.0.2.1 (unsafe)** to open the Nextcloud installation wizard.

## First-Time Setup
1. **Create Admin Account:** Enter your desired username and strong password.
2. **Database Configuration:** Our compose stack connects and configures MariaDB automatically! If prompted for database settings:
   - **Database user:** `nextcloud`
   - **Database password:** Enter your `${DB_PASSWORD}` value.
   - **Database name:** `nextcloud`
   - **Database host:** `nextcloud-db`
3. Click **Install / Finish Setup** and wait (~1 minute) while Nextcloud initializes your cloud workspace!

## Connecting to Other Services
- **External Storage:** You can mount `/srv/media` or `/srv/photos` inside Nextcloud using the **External storage support** app in Nextcloud settings so you can manage all server files directly from Nextcloud!

## Add HTTPS (Optional)
To replace the self-signed SSL certificate warning with a valid, trusted Let's Encrypt certificate and clean URL (`https://cloud.yourdomain.com`), see our networking guides:
→ **[networking/README.md](../networking/README.md)**

## What Now?
1. **Install Desktop Sync Client:** Download the official Nextcloud desktop client for Windows, macOS, or Linux to automatically sync a local folder (just like Dropbox or OneDrive).
2. **Install Mobile App:** Download Nextcloud on your iOS or Android device to access files on the go.
3. **Explore App Store:** In Nextcloud (`Apps` menu), install **Nextcloud Office** or **Notes** to turn your server into a full-fledged collaborative workspace!
