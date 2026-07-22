# Immich Photo & Video Backup — High-Performance Self-Hosted Cloud Gallery

## 🎯 What You'll Have When You're Done
When you complete this guide, you will have a cutting-edge, self-hosted photo and video backup server running locally on your hardware with native mobile apps for iOS and Android. Your entire lifetime photo library will automatically back up in full original quality directly from your smartphone over Wi-Fi, featuring local AI facial recognition, natural language object search (e.g., search "dog on beach"), interactive map albums, and zero cloud storage fees!

---

## 💡 What Is Immich and Why Would I Want It?

Storing thousands of photos and 4K videos on mobile devices quickly fills up local storage, and cloud backup providers like Google Photos, iCloud, and Amazon Photos charge ongoing monthly subscriptions for extra storage while sometimes compressing your memories.

**[Immich](https://immich.app/)** is a modern self-hosted alternative that provides the exact same user experience as Google Photos:
- **Automatic Mobile Background Backup:** Native iOS and Android apps automatically upload new pictures and videos in full, uncompressed original quality whenever your phone connects to Wi-Fi.
- **Local Machine Learning (AI):** Runs neural networks locally on your server (`immich-machine-learning`) to detect faces, group people, and generate semantic embeddings. You can search for "birthday cake" or "camping in the woods" and find matching photos instantly without sending data to Google or OpenAI!
- **Multi-User Household Support:** Create separate, private vaults for every family member on a single server with shared family albums and granular permission controls.

---

## 📋 Prerequisites

Before deploying this stack, make sure you have:
1. Completed **[02. Understanding Docker & Containers](../../docs/02-understanding-docker.md)**.
2. Created your `/data/media/photos` directory as covered in **[04. Storage, Disks & NAS Concepts](../../docs/04-storage-and-nas.md)**.
3. Copied and edited `stacks/.env` (`cp stacks/.env.example stacks/.env`), ensuring you chose a secure database password for `IMMICH_DB_PASSWORD`.

---

## 🔧 Understanding the Compose File

Our `docker-compose.yml` deploys a synchronized 4-container application suite:

```yaml
services:
  immich-server:
    image: ghcr.io/immich-app/immich-server:release
    volumes:
      - ${DATA_ROOT:-/data}/media/photos:/usr/src/app/upload
    ports:
      - "2283:2283"
    depends_on:
      - immich-redis
      - immich-db

  immich-machine-learning:
    image: ghcr.io/immich-app/immich-machine-learning:release
    volumes:
      - ./config/model-cache:/cache

  immich-redis:
    image: registry.hub.docker.com/library/redis:6.2-alpine

  immich-db:
    image: registry.hub.docker.com/tensorchord/pgvecto-rs:pg14-v0.2.0
    volumes:
      - ./config/postgres:/var/lib/postgresql/data
```

- **`immich-server`:** The primary web and API server where mobile apps connect on door `2283`. It saves all uploaded photos directly into your physical `/data/media/photos` folder.
- **`immich-machine-learning`:** A dedicated AI processor. It stores downloaded AI models locally inside `./config/model-cache`.
- **`immich-redis` & `immich-db`:** High-speed Redis caching and a specialized PostgreSQL database loaded with the `pgvecto-rs` vector extension to store high-dimensional image search embeddings right inside `./config/postgres`.

---

## 🚀 Setting It Up Step by Step

### Step 1: Navigate to the Photo Backup Folder
Open your terminal and move into the `photo-backup` stack directory:
```bash
cd /opt/homelab/stacks/photo-backup
```

### Step 2: Launch the Immich Stack
Start all 4 containers in detached background mode:
```bash
docker compose up -d
```

### 🔍 What Just Happened?
When you ran `docker compose up -d`:
1. Docker pulled the 4 specialized containers (`server`, `machine-learning`, `redis`, `pgvecto-rs`).
2. It created `./config/postgres` and `./config/model-cache` on your local drive to store your database and AI weights.
3. It initialized PostgreSQL and bound door `2283` for web and mobile access!

---

## ✅ Verifying It Works

### Step 1: Check Container Health
Run our diagnostic checker to ensure all components booted:
```bash
../../helpers/check-health.sh
```
`immich_server` should show as `healthy (running)` on `http://YOUR_SERVER_IP:2283`.

### Step 2: Complete Admin Onboarding
Open your web browser and navigate to:
```
http://192.168.1.100:2283
```
*(Replace `192.168.1.100` with your server's actual IP address.)*

1. **Get Started:** Click **Getting Started**, type your Email, Password, and Name, then click **Sign Up**.
2. **Login & Configure Storage:** Once logged in, go to **Administration → Settings → Storage Template** to customize how Immich formats folder structures (`Year/Month-Day/Filename.ext`).
3. **Verify AI Jobs:** Check **Administration → Jobs** to confirm that facial detection and semantic search models are active and running.

---

## 📱 Connecting Your Mobile Phone

1. **Download the Mobile App:** Search for **Immich** on the Apple App Store (iOS) or Google Play Store (Android).
2. **Connect to Your Server:** Open the app and type your server URL (`http://YOUR_SERVER_IP:2283` or your HTTPS domain once set up via `networking/`).
3. **Enable Background Backup:** Sign in, tap the cloud icon in the top right, and turn on **Foreground & Background Backup** to start syncing your phone's photo gallery!

---

## 🧩 What's Next?

Now that your media, music, and personal photos are securely hosted and backed up, let's deploy our self-hosted cloud office and synchronization suite (`Nextcloud`) so you can replace Google Workspace across all your laptops and desktop computers!

👉 **Proceed to the [`cloud-storage/`](../cloud-storage/README.md) Stack**

---

## 🔧 Troubleshooting

- **Issue: Mobile uploads hang or fail for large 4K video clips.**
  - **Solution:** If you are accessing Immich through a reverse proxy (`Nginx Proxy Manager` or Cloudflare) instead of directly via LAN, reverse proxies often enforce strict upload size limits (`client_max_body_size`). Ensure your Nginx Proxy Manager configuration for Immich explicitly enables `client_max_body_size 0;` or `50000M;` under Advanced Configuration!
- **Issue: Machine learning search returns no results when I type words like 'dog' or 'mountain'.**
  - **Solution:** Semantic search (`CLIP` embeddings) runs asynchronously after photos are uploaded. If you just uploaded 5,000 photos, the CPU may still be generating embeddings. Check progress under **Administration → Jobs → Smart Search**. Once complete, your natural language queries will work instantly!
