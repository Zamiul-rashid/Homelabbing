# Immich — High-Performance Self-Hosted Photo & Video Backup
> What it is: A cutting-edge, self-hosted backup and organization platform for your mobile photos and videos powered by local machine learning. What it replaces: Google Photos, Apple iCloud Photos, Amazon Photos.

## What you'll have when done
A blazing-fast photo backup server running locally on your hardware with native iOS and Android backup apps. Your entire lifetime photo library will automatically back up in full original quality right from your phone over Wi-Fi, featuring local AI facial recognition, object detection search (e.g., search "dog on beach"), interactive map albums, and zero cloud storage fees.

## Quick Launch
### 1. Set up storage
Verify that your host machine has `/srv/photos` created:
```bash
sudo mkdir -p /srv/photos
sudo chown -R $USER:$USER /srv/photos
```

### 2. Configure .env
Ensure your `quickstart/.env` contains your Immich database secrets (`IMMICH_DB_PASSWORD`) and paths:
```bash
PUID=1000
PGID=1000
TZ=UTC
PHOTOS_DIR=/srv/photos
IMMICH_DB_PASSWORD=SecureSecretPassword123!
```

### 3. Start
From inside `04-photo-server/`, launch the multi-container stack (`server`, `machine-learning`, `redis`, and `pgvecto-rs postgres`):
```bash
docker compose up -d
```

Expected terminal output:
```
[+] Running 5/5
 ✔ Network 04-photo-server_default      Created            0.1s
 ✔ Container immich_redis               Started            0.3s
 ✔ Container immich_postgres            Started            0.4s
 ✔ Container immich_machine_learning    Started            0.5s
 ✔ Container immich_server              Started            0.8s
```

### 4. Open browser: http://YOUR_IP:2283
When you navigate to `http://192.0.2.1:2283`, you will see the **Welcome to Immich Admin Onboarding** screen.

## First-Time Setup
1. **Create Admin Account:** Click **Get Started**, enter your Email address, Password, and Name, then click **Sign Up**.
2. **Login:** Log in with your new admin credentials.
3. **Storage Template:** Under **Administration → Settings → Storage Template**, you can customize how Immich organizes uploaded files on disk (`Year/Month-Day/Filename.ext`).
4. **Machine Learning Jobs:** Go to **Administration → Jobs** and check that facial recognition and smart search models are active and downloading smoothly.

## Connecting to Other Services
- **External Libraries:** You can point Immich to read-only folders inside `/srv/nextcloud` or existing photo archives without duplicating files using Immich's **External Libraries** feature!

## Add HTTPS (Optional)
Because mobile photo backups occur continuously from cellular networks and out of the home, secure HTTPS remote access is strongly recommended:
→ **[networking/README.md](../networking/README.md)**

## What Now?
1. **Install Mobile App:** Download **Immich** on your iOS (App Store) or Android (Google Play) phone.
2. **Connect & Backup:** Open the app, enter your server URL (`http://YOUR_SERVER_IP:2283` or your HTTPS domain), sign in, and enable **Foreground & Background Backup**!
3. **Test AI Search:** Once your initial backup completes, try typing `sunset`, `birthday cake`, or clicking on a person's face to watch local machine learning find relevant pictures instantly.
