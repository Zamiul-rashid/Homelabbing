# Kavita Book Reader — Self-Hosted eBook, Manga & Comic Server

## 🎯 What You'll Have When You're Done
When you complete this guide, you will have a blazing-fast, digital library running on your home server accessible from any web browser or reading tablet. You will be able to organize thousands of EPUB novels, PDF documents, and multi-volume manga series (CBZ/CBR) with instant page loading, automatic progress tracking, and OPDS support for mobile eReaders like Tachiyomi, Cómics, and Moon+ Reader.

---

## 💡 What Is Kavita and Why Would I Want It?

If you have ever purchased digital eBooks or comic books across different platforms (like Amazon Kindle, Comixology, or Google Play Books), you know how frustrating locked ecosystems can be. Your books are trapped inside proprietary apps, and if a platform loses licensing rights, books can vanish from your digital shelf without warning.

**[Kavita](https://www.kavitareader.com/)** is a modern, self-hosted reading platform designed to replace those commercial subscription services:
- **Universal Format Support:** Reads EPUBs, PDFs, comic archives (`.cbz`, `.cbr`), and raw image folders seamlessly.
- **Lightning-Fast Web Reader:** Features a beautiful, responsive web interface tailored for both desktop monitors and touch-screen tablets with dark themes, custom fonts, and page layout toggles.
- **Multi-User Household Support:** Create distinct accounts for every family member with independent reading progress tracking and age-rating restrictions.
- **OPDS Catalog Support:** Connect mobile eReader apps directly to your server so you can browse, download, and read offline while traveling.

---

## 📋 Prerequisites

Before setting up this stack, make sure you have:
1. Completed **[02. Understanding Docker & Containers](../../docs/02-understanding-docker.md)** and understand how `docker compose` works.
2. Formatted and created your `/data/media/books` and `/data/media/comics` folders as covered in **[04. Storage, Disks & NAS Concepts](../../docs/04-storage-and-nas.md)**.
3. Copied the root environment template (`cp stacks/.env.example stacks/.env`) and configured your timezone (`TZ`).

---

## 🔧 Understanding the Compose File

Let's examine how our `docker-compose.yml` blueprint works under the hood:

```yaml
services:
  kavita:
    image: jvmilazz0/kavita:latest
    container_name: kavita
    environment:
      - TZ=${TZ:-America/New_York}
    volumes:
      - ./config:/kavita/config
      - ${DATA_ROOT:-/data}/media/books:/books
      - ${DATA_ROOT:-/data}/media/comics:/comics
    ports:
      - "5000:5000"
    restart: unless-stopped
```

- **`volumes:`** Notice we map two distinct storage folders (`/books` and `/comics`) directly into the container. This allows you to keep text novels and illustrated comic books neatly separated on your hard drive while Kavita indexes them into unified libraries. Notice that `./config` saves the internal SQLite database locally in your stack folder so your reading history is always protected.
- **`ports:`** By exposing `"5000:5000"`, Kavita makes its web reader dashboard available on door `5000` of your home server.

---

## 🚀 Setting It Up Step by Step

### Step 1: Navigate to the Book Reader Folder
Open your SSH terminal and move into the `book-reader` stack directory:
```bash
cd /opt/homelab/stacks/book-reader
```

### Step 2: Launch the Kavita Container
Start the reading server in detached mode so it runs quietly in the background:
```bash
docker compose up -d
```

### 🔍 What Just Happened?
When you ran `docker compose up -d`:
1. Docker pulled the official `jvmilazz0/kavita:latest` container blueprint from Docker Hub.
2. It created the `./config` folder right on your disk to store your reading database.
3. It bound your physical hard disk folders (`/data/media/books` and `/data/media/comics`) directly into the container.
4. It booted the server process and bound web door `5000` on your network adapter!

---

## ✅ Verifying It Works

Let's make sure your reading server booted up cleanly and is ready to accept users:

1. **Check Container Status:**
   Run `docker ps` or execute our diagnostic helper:
   ```bash
   ../../helpers/check-health.sh
   ```
   You should see `kavita` listed as `healthy (running)` on `http://YOUR_SERVER_IP:5000`.

2. **Open the Web Reader:**
   Open a web browser on your computer or tablet and navigate to:
   ```
   http://192.168.1.100:5000
   ```
   *(Replace `192.168.1.100` with your server's actual IP address.)*

3. **Create Your Admin Account:**
   On first launch, Kavita will prompt you to create your primary administrator username and password. Once logged in, click **Settings** → **Libraries** → **Add Library** and select your `/books` or `/comics` folder to start indexing!

---

## 🧩 What's Next?

Now that your reading library is online, you can expand your homelab by adding our high-performance personal music streaming server so you can listen to your favorite albums anywhere!

👉 **Proceed to the [`music-server/`](../music-server/README.md) Stack**

---

## 🔧 Troubleshooting

- **Issue: My books or manga don't show up after clicking Scan inside Kavita.**
  - **Solution:** Verify file permissions on your host system! Make sure your `/data/media/books` folder is readable by your Docker user ID. Run `sudo chown -R $USER:$USER /data/media/books` in your terminal, then trigger another scan inside Kavita settings.
- **Issue: Comic covers load slowly or appear broken.**
  - **Solution:** Ensure your `.cbz` or `.cbr` archives aren't corrupted by testing them on a local desktop comic reader first. Kavita works best when comic archives contain standard `.jpg`, `.png`, or `.webp` image pages.
- **Issue: Cannot connect to `http://YOUR_SERVER_IP:5000`.**
  - **Solution:** Check your server's UFW firewall (`sudo ufw status`). If testing across your local LAN before reverse proxy setup, remember UFW blocks port `5000` by default! Either test locally from the server terminal using `curl -I http://localhost:5000` or set up **Nginx Proxy Manager** (`stacks/networking/`) to route traffic cleanly via port `443`.
