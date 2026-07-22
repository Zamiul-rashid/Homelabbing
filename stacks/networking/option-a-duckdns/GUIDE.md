# Option A: Free Dynamic DNS with DuckDNS & Nginx Proxy Manager

> **End Result:** Your homelab accessible at `https://yourname.duckdns.org` with automated valid SSL certificates, entirely for free.

---

## 📖 How it Works
1. **DuckDNS Container (`duckdns`):** Continuously checks your home internet's public IP address and updates `yourname.duckdns.org` automatically if your residential ISP rotates your IP.
2. **Nginx Proxy Manager (`nginx-proxy-manager`):** Receives incoming web requests on ports 80 and 443, handles SSL encryption with Let's Encrypt, and forwards traffic securely to internal container doors (`8096`, `4533`, etc.).

---

## 🚀 Step-by-Step Guide

### 1. Register on DuckDNS
1. Go to [https://www.duckdns.org](https://www.duckdns.org) and sign in (via GitHub, Google, etc.).
2. In the top bar, copy your **token**.
3. In the **subdomains** box, type a unique name (e.g., `myhomelab-demo`) and click **add domain**.

### 2. Configure Environment Variables
Edit your root `stacks/.env` file (`nano /opt/homelab/stacks/.env`) and add your values:
```bash
DUCKDNS_SUBDOMAIN=myhomelab-demo
DUCKDNS_TOKEN=xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
```

### 3. Port Forwarding on Your Router
To let Let's Encrypt verify your domain and let external users reach your reverse proxy:
1. Log into your home router's admin panel (`http://192.168.1.1` or `http://192.168.0.1`).
2. Find **Port Forwarding** or **Virtual Servers**.
3. Forward **External Port 80** to **Internal Port 80** on your server's local IP (`192.168.1.100`).
4. Forward **External Port 443** to **Internal Port 443** on your server's local IP (`192.168.1.100`).

### 4. Start the Containers
From inside the `option-a-duckdns/` directory:
```bash
docker compose up -d
```

### 5. Configure Nginx Proxy Manager
1. Open your browser to `http://YOUR_SERVER_IP:81`.
2. Log in with default credentials:
   - **Email:** `admin@example.com`
   - **Password:** `changeme`
3. **Immediately change your email and password when prompted!**
4. Click **Proxy Hosts** → **Add Proxy Host**:
   - **Domain Names:** `yourname.duckdns.org`
   - **Scheme:** `http`
   - **Forward Host / IP:** Your server's local IP (`192.168.1.100`)
   - **Forward Port:** `8096` *(for Jellyfin, for example)*
   - Enable **Block Common Exploits** and **Websockets Support**.
5. Go to the **SSL** tab:
   - Select **Request a new SSL Certificate**.
   - Check **Force SSL** and **I Agree to the Let's Encrypt Terms of Service**.
   - Click **Save**.

🎉 Your service is now live and secure at `https://yourname.duckdns.org`!
