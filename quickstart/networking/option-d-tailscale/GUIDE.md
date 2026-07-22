# Option D: Tailscale Mesh VPN (Maximum Privacy & Zero Open Ports)

> **End Result:** Your homelab accessible securely from anywhere in the world (`http://homelab:8096`) **only on devices connected to your private Tailscale account**. The public internet cannot see, ping, or access your server at all.

---

## 🔒 Why Tailscale is the Gold Standard for Privacy

Think of Tailscale as a **private, invisible Ethernet cable** connecting all your devices over the internet using military-grade WireGuard encryption. Unlike traditional port forwarding or cloud proxies:
- **Zero Open Ports:** You do not touch your home router or open ports 80/443/8096 to the outside world.
- **Zero Public Exposure:** Automated bots, hackers, and scanners scanning the web cannot even detect that your home server exists.
- **Simple Names:** Access your server simply by typing `http://homelab:PORT` on any enrolled phone, laptop, or tablet.

---

## 🚀 Step-by-Step Guide

### 1. Sign up and Install Tailscale on Your Devices
1. Go to [https://tailscale.com](https://tailscale.com) and sign up for a **Free Personal Account** (supports up to 3 users and 100 devices forever).
2. Download and install the Tailscale app on your personal laptop, phone, or desktop.
3. Log in and verify that your device appears in the [Tailscale Admin Console](https://login.tailscale.com/admin/machines).

### 2. Generate a Reusable Auth Key for Your Server
1. In the Tailscale Admin Console, go to **Settings** → **Keys** → **Generate auth key**.
2. Check the boxes for:
   - **Reusable** (so the container can restart without generating a new key).
   - **Ephemeral: NO** (so your server retains its name and IP).
3. Click **Generate key** and copy the string starting with `tskey-auth-...`.

### 3. Configure Environment Variables
Edit `quickstart/.env` and paste your key:
```bash
TAILSCALE_AUTH_KEY=tskey-auth-xxxxxxxxxxxx-xxxxxxxxxxxxxxxxxxxxxxxx
```

### 4. Start the Tailscale Sidecar Container
From inside `quickstart/networking/option-d-tailscale/`:
```bash
docker compose --env-file ../../.env up -d
```

### 5. Verify Connection
1. Open your [Tailscale Admin Console](https://login.tailscale.com/admin/machines).
2. You should now see a machine named **`homelab`** with a green connected dot and a private `100.x.y.z` IP address!
3. On your laptop or phone (with Tailscale connected), open your web browser and go to:
   ```
   http://homelab:8096
   ```
   or
   ```
   http://100.x.y.z:8096
   ```
   *(Replace `8096` with any service port like `4533` for Navidrome or `4443` for Nextcloud).*

---

## 🌟 Advanced: Tailscale Funnel (Selective Public Exposure)

What if you keep your server 100% private on Tailscale 99% of the time, but occasionally want to share a specific link (like a photo album or Nextcloud file) with a friend who doesn't use Tailscale?

You can use **Tailscale Funnel** to selectively expose a single local port to the public web with automated SSL over Tailscale's edge nodes!
1. Enable HTTPS Certificates and MagicDNS in your Tailscale DNS Settings.
2. Inside your `tailscale` container or host, run:
   ```bash
   docker exec -it tailscale tailscale funnel 8096
   ```
3. Tailscale generates an instant, public HTTPS URL (`https://homelab.your-alias.ts.net`) routing strictly to that one port!
