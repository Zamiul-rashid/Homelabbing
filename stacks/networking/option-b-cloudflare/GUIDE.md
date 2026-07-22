# Option B: Cloudflare DNS Challenge & CDN Protection

> **End Result:** Your server reachable at custom subdomains like `https://jellyfin.yourdomain.com` with wildcard Let's Encrypt certificates generated via DNS challenge (no open port 80 required for SSL issuance) and DDoS protection via Cloudflare's proxy network.

> [!IMPORTANT]
> **Prerequisite Caveat:** This option requires that you own a custom domain name (~$10/year). If you don't own one yet, check out **[Option C: Custom Domain Buying Guide](../option-c-custom-domain/GUIDE.md)** first!

---

## 📖 Why Cloudflare DNS Challenge?
Normally, Let's Encrypt requires port 80 open on your router to verify you own your domain (`HTTP-01` challenge). By connecting Nginx Proxy Manager to Cloudflare via an API token (`DNS-01` challenge), Let's Encrypt verifies domain ownership by adding a temporary DNS TXT record automatically. This allows you to generate valid wildcard certificates (`*.yourdomain.com`) without exposing port 80 just for cert verification!

---

## 🚀 Step-by-Step Guide

### 1. Add Your Domain to Cloudflare
1. Sign up for a free account at [https://dash.cloudflare.com](https://dash.cloudflare.com).
2. Click **Add a Site**, enter your custom domain (e.g., `yourdomain.com`), and select the **Free Plan**.
3. Follow the instructions to change your domain registrar's nameservers to Cloudflare's nameservers.
4. Once verified, create an `A` record in Cloudflare pointing `*` (wildcard) to your home public IP address, with the orange cloud (**Proxied**) enabled.

### 2. Generate a Cloudflare API Token
1. In Cloudflare, go to **My Profile** (top right) → **API Tokens**.
2. Click **Create Token**.
3. Next to **Edit zone DNS**, click **Use template**.
4. Under **Zone Resources**, select `Include` -> `Specific zone` -> `yourdomain.com`.
5. Click **Continue to summary** → **Create Token**, and copy the generated token immediately.

### 3. Configure Environment Variables
Edit your root `stacks/.env` file (`nano /opt/homelab/stacks/.env`) and add your token:
```bash
CF_API_TOKEN=your_cloudflare_dns_edit_token_here
```

### 4. Start Nginx Proxy Manager
From inside `option-b-cloudflare/`:
```bash
docker compose up -d
```

### 5. Generate Wildcard Certificate in NPM
1. Open `http://YOUR_SERVER_IP:81` and log in (`admin@example.com` / `changeme`, then change credentials).
2. Go to **SSL Certificates** → **Add SSL Certificate** → **Let's Encrypt**:
   - **Domain Names:** `*.yourdomain.com, yourdomain.com`
   - Check **Use a DNS Challenge**.
   - **DNS Provider:** `Cloudflare`
   - In the credentials box, replace the API token placeholder with your `CF_API_TOKEN` value:
     ```ini
     dns_cloudflare_api_token = your_cloudflare_dns_edit_token_here
     ```
   - Check **I Agree to the Let's Encrypt Terms of Service** and save.
3. Once generated, go to **Proxy Hosts** → **Add Proxy Host**:
   - **Domain:** `jellyfin.yourdomain.com`
   - **Forward Host / IP:** `192.168.1.100` *(your server local IP)*
   - **Forward Port:** `8096`
   - Under **SSL**, select your wildcard certificate (`*.yourdomain.com`).
   - Enable **Force SSL** and **Websockets Support**.

🎉 Your service is now live behind Cloudflare's global CDN and DDoS protection!
