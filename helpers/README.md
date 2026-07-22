# 🔧 Diagnostic & Utility Helpers (`helpers/`)

While **Homelabbing** avoids blind automation scripts that set up complex services without your understanding, diagnostic and utility scripts (`helpers/`) are enormously valuable for quickly verifying your server's health and checking container status.

---

## 🏥 `check-health.sh` — The Stack Health Checker

When running multiple Docker containers across different stacks (`media-server`, `arr-stack`, `music-server`, `photo-backup`, `cloud-storage`, `book-reader`), checking `docker ps` individually can produce cluttered output.

Our diagnostic script scans your Docker daemon and formats a clean, color-coded table showing the status and direct URL access link for all 10 core service containers.

### How to Run:
```bash
chmod +x helpers/check-health.sh
./helpers/check-health.sh
```

### Example Output:
```
==================================================================================
Container / Service      | Status               | URL
----------------------------------------------------------------------------------
jellyfin                 | healthy (running)    | http://192.168.1.100:8096
qbittorrent              | healthy (running)    | http://192.168.1.100:8080
prowlarr                 | healthy (running)    | http://192.168.1.100:9696
radarr                   | healthy (running)    | http://192.168.1.100:7878
sonarr                   | healthy (running)    | http://192.168.1.100:8989
jellyseerr               | healthy (running)    | http://192.168.1.100:5055
navidrome                | healthy (running)    | http://192.168.1.100:4533
kavita                   | healthy (running)    | http://192.168.1.100:5000
immich_server            | not running          | http://192.168.1.100:2283
nextcloud                | healthy (running)    | https://192.168.1.100:4443
==================================================================================
```

### What Status Colors Mean:
- **🟢 Green (`healthy (running)`)** — The container is booted, responsive, and ready to accept web traffic.
- **🟡 Yellow (`starting...`)** — The container is booting up or initializing internal databases. Wait 15–30 seconds and run the script again.
- **🔴 Red (`unhealthy` / `not running`)** — The container either failed its internal healthcheck or is currently stopped (`docker compose down`). Use `docker logs --tail 50 <container_name>` to inspect what happened!
