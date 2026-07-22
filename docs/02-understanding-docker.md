# 02. Understanding Docker & Containers

When beginners first start self-hosting, one of the first things they hear is: *"Just run it in Docker!"* But what exactly does that mean, and why is Docker considered the holy grail of modern home server management?

In this guide, we will break down containerization using simple analogies, explain how Docker Compose makes running complex software effortless, and explore the core concepts that power every service in our **Homelabbing** architecture.

---

## 🎯 What You'll Learn

- Why installing software directly onto your operating system can lead to messy dependency conflicts.
- The **shipping container analogy**: How Docker isolates software cleanly.
- What a `docker-compose.yml` file is and why we use declarative configuration.
- The four pillars of Docker: **Images**, **Containers**, **Volumes**, and **Networks**.
- Essential manual commands every server owner should know (`up -d`, `down`, `logs`, `exec`).
- What environment variables and container healthchecks actually do.

---

## 💡 Why Not Just Install Software Directly?

Imagine you want to install three self-hosted services on a standard computer:
1. **Nextcloud** (requires PHP version 8.1 and a PostgreSQL database).
2. **Legacy Web App** (requires an older PHP version 7.4 and a MySQL database).
3. **Paperless-ngx** (requires Python 3.11, Redis cache, and specific system font libraries).

If you install all of these directly onto your bare Ubuntu operating system, you quickly run into what engineers call **"dependency hell."** PHP 8.1 overrides PHP 7.4, breaking your legacy app. System libraries clash, database configurations conflict, and if you ever want to uninstall a tool, it leaves behind dozens of leftover files and broken dependencies.

```
┌────────────────────────────────────────────────────────────────────────┐
│ Traditional Direct Installation (Messy & Conflicting)                  │
│  [Ubuntu OS] ──> PHP 8.1 + PHP 7.4 + Python + Redis (Shared & Clashing)│
└────────────────────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────────────────┐
│ Docker Containerized Installation (Clean & Isolated)                   │
│  [Ubuntu OS] ──> [Container: Nextcloud (PHP 8.1)]                      │
│              ──> [Container: Legacy App (PHP 7.4)]                     │
│              ──> [Container: Paperless (Python 3.11 + Redis)]          │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 🚢 The Shipping Container Analogy

To solve this exact problem, the software industry adopted **containers**.

Think about global cargo shipping before standardized shipping containers existed. Loading a ship required manually packing loose crates, barrels, bags, and fragile boxes into a cargo hold. It was slow, prone to breakage, and required different handling for every item.

When the standardized **intermodal shipping container** was invented, everything changed. Whether you are shipping electronics, coffee beans, or clothing, you put them inside a sealed steel box of exact dimensions. Cranes, trucks, and cargo ships don't care *what* is inside the box—they only need to know how to move the standardized container.

In software, **Docker** does the exact same thing:
- A **Docker Image** is the standardized recipe or blueprint for a container. It packages the application code along with *all* of its exact required dependencies, software libraries, and configuration templates inside a neat, self-contained unit.
- A **Docker Container** is a running instance of that image. It executes cleanly in its own isolated bubble without touching or modifying your underlying host operating system.

> [!NOTE]
> **💡 Why This Matters**
> Because Docker containers include everything the application needs to run, a service will behave **exactly the same way** on your home PC, a laptop, or an enterprise server. You never have to worry about missing dependencies, and if you delete a container, it vanishes cleanly without leaving a single trace behind on your system.

---

## 🧱 The Four Pillars of Docker

To confidently manage your homelab, you need to understand how containers interact with your computer's storage and network. Let's explore the four core concepts:

### 1. Images & Containers
An **image** is the dormant blueprint read-only package (like a game CD or installer file). A **container** is the active running process spawned from that image (like the game currently running on your screen). You can run multiple containers from the very same image.

### 2. Volumes (Persistent Storage)
By design, containers are **ephemeral** (temporary). If a container is stopped or restarted, any data saved inside its internal virtual filesystem is wiped clean.

To make your data permanent, we use **Volumes**. A volume (or **bind mount**) maps a physical folder on your actual hard drive directly into the container's virtual folder.

```yaml
volumes:
  # [Host Hard Drive Path] : [Internal Container Path]
  - /opt/homelab/media-server/config:/config
  - /data/media/movies:/movies
```

When Jellyfin saves your user settings inside `/config`, those files are actually written directly to your real hard drive at `/opt/homelab/media-server/config`. Even if you delete and rebuild the Jellyfin container, your configuration remains perfectly safe on your disk!

### 3. Networks (Container Communication)
Docker allows you to create virtual private bridges. Containers placed on the same virtual network can talk to each other securely using their friendly container names as domain addresses, while keeping out unauthorized traffic.

For example, your `nextcloud` web container can reach its database container simply by connecting to `db:5432` on an internal Docker bridge (`infra_net`).

### 4. Environment Variables (`environment`)
Environment variables (`ENV`) are configuration switches you pass into a container when it boots up. Instead of modifying code, you pass simple `KEY=VALUE` pairs:

```yaml
environment:
  - PUID=1000                  # Run process as your regular Linux user ID
  - PGID=1000                  # Run process as your regular Linux group ID
  - TZ=America/New_York        # Set the correct local timezone for logs and schedules
```

---

## 📑 What is Docker Compose?

While you *can* launch containers by typing massive one-line terminal commands (`docker run -d --name jellyfin -p 8096:8096 -v ...`), doing so for 10 or 20 interlinked services quickly becomes unmanageable and easy to forget.

**Docker Compose** is a tool that lets you define your entire application stack using a clean, readable YAML configuration file named `docker-compose.yml`.

Instead of typing long commands from memory, you write down exactly what services, volumes, ports, and environment variables your stack needs inside `docker-compose.yml`. This makes your entire server configuration **declarative**, **version-controlled**, and **reproducible**.

---

## ⌨️ Essential Docker Commands You Must Know

We believe in our core philosophy: **Understand the Architecture First, Then Implement.** Knowing how to run and inspect container commands yourself—rather than relying on blind automated scripts—gives you complete control and confidence. Here are the core commands you will use to run and manage every stack in **Homelabbing**:

### 1. Launch a Stack (`docker compose up -d`)
Navigate to any folder containing a `docker-compose.yml` file and run:
```bash
docker compose up -d
```
- `up` tells Docker to pull required images from the internet and create the containers.
- `-d` stands for **detached mode**. It runs the containers quietly in the background so you get your terminal prompt right back.

### 2. Stop and Remove a Stack (`docker compose down`)
To safely stop and clean up running containers:
```bash
docker compose down
```
This stops the containers and removes their virtual network adapters, but **leaves your persistent mounted storage volumes safely on disk.**

### 3. Check Live Container Logs (`docker logs`)
If a service isn't loading or you want to see what a container is doing behind the scenes:
```bash
# View the last 50 lines of logs for the jellyfin container
docker logs --tail 50 jellyfin

# Follow (stream) live logs in real-time (press Ctrl+C to exit)
docker logs -f jellyfin
```

### 4. Run Commands Inside a Container (`docker exec`)
Sometimes you need to step inside a running container to check files or run a database tool:
```bash
# Open an interactive Bash shell directly inside the container
docker exec -it jellyfin /bin/bash
```

---

## 🏥 Understanding Healthchecks

In many of our compose files, you will notice a section called `healthcheck`. A **healthcheck** is a routine automated test that Docker runs periodically inside the container to verify whether the application is truly responsive—not just whether the container process is turned on.

```yaml
healthcheck:
  test: ["CMD", "curl", "-f", "http://localhost:8096/health"]
  interval: 30s
  timeout: 10s
  retries: 3
```

If the web server stops responding for any reason, Docker marks the container status as `unhealthy`, which alerts you or allows automated recovery tools to restart the frozen service safely.

---

## 🔍 What Just Happened?

When you run `docker compose up -d` in a stack directory:
1. Docker reads your `docker-compose.yml` recipe.
2. It checks if you already have the required container blueprints (images) stored locally. If not, it securely downloads (`pulls`) them from official repositories like Docker Hub or GitHub Container Registry.
3. It creates virtual network bridges so the containers can communicate cleanly.
4. It mounts your host folders into the containers (`volumes`) so data persists on your disk.
5. It starts the background processes as your designated user (`PUID:PGID`), making the service accessible on your network ports!

---

## 🧩 What's Next?

Now that you understand containerization, images, volumes, and how Docker Compose orchestrates applications cleanly, you are ready to prepare physical hardware and install your foundational operating system!

👉 **Proceed to [03. Your First Home Server](03-your-first-server.md)**
