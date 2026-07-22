#!/usr/bin/env python3
"""
fetch-covers.py — Apple Music Central Cover Fetcher & Navidrome Symlinker

Downloads album artwork from the Apple Music / iTunes search API directly to a
centralized cover directory on the host, and creates Docker-compatible relative or
absolute symlinks (`/data/covers/...`) inside each artist/album directory so
Navidrome and other music servers can instantly read high-resolution artwork without
duplicating image files across storage.

Usage:
    python3 fetch-covers.py

Environment Variables:
    MUSIC_DIR             Path to the music library on the host (default: /mnt/disk1/media/music)
    NAVIDROME_COVERS_DIR  Path to the central covers folder on the host
                          (default: /opt/homelab/media-stack/config/navidrome/covers)
    DOCKER_COVERS_DIR     Path as seen inside the Navidrome container (default: /data/covers)
"""

import os
import urllib.parse
import urllib.request
import json
from pathlib import Path

# Adjust to your navidrome config path via environment variables or use safe defaults
MUSIC_DIR = Path(os.environ.get("MUSIC_DIR", "/mnt/disk1/media/music"))
# Adjust to your navidrome config path
HOST_COVERS_DIR = Path(os.environ.get("NAVIDROME_COVERS_DIR", Path.home() / "homelab/media-stack/config/navidrome/covers"))
DOCKER_COVERS_DIR = Path(os.environ.get("DOCKER_COVERS_DIR", "/data/covers"))  # The path inside the Navidrome Docker container
TARGET_RES = "1400x1400bb.jpg"

def fetch_applemusic_artwork(artist, album):
    query = f"{artist} {album}"
    encoded_query = urllib.parse.quote_plus(query)
    url = f"https://itunes.apple.com/search?term={encoded_query}&entity=album&limit=1"

    try:
        req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
        with urllib.request.urlopen(req, timeout=10) as response:
            data = json.loads(response.read().decode())
            results = data.get("results", [])
            if results:
                art_100 = results[0].get("artworkUrl100", "")
                if art_100:
                    return art_100.replace("100x100bb.jpg", TARGET_RES)
    except Exception:
        pass
    return None

def download_image(url, dest_path):
    try:
        req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
        with urllib.request.urlopen(req, timeout=15) as response:
            dest_path.write_bytes(response.read())
            return True
    except Exception:
        return False

def main():
    HOST_COVERS_DIR.mkdir(parents=True, exist_ok=True)
    print(f"[+] Host central covers directory: {HOST_COVERS_DIR}")
    print(f"[+] Docker container target path: {DOCKER_COVERS_DIR}")
    print(f"[+] Scanning library: {MUSIC_DIR}")

    if not MUSIC_DIR.exists():
        print(f"[!] Music directory not found: {MUSIC_DIR}")
        return

    for artist_dir in sorted(MUSIC_DIR.iterdir()):
        if not artist_dir.is_dir():
            continue
        artist_name = artist_dir.name

        for album_dir in sorted(artist_dir.iterdir()):
            if not album_dir.is_dir():
                continue
            album_name = album_dir.name
            
            safe_filename = f"{artist_name} - {album_name}.jpg".replace("/", "_")
            host_cover_path = HOST_COVERS_DIR / safe_filename
            docker_target_path = DOCKER_COVERS_DIR / safe_filename
            album_cover_symlink = album_dir / "cover.jpg"

            # Step 1: Download central cover
            if not host_cover_path.exists():
                print(f"[*] Fetching Apple Music cover: '{artist_name} - {album_name}'...")
                art_url = fetch_applemusic_artwork(artist_name, album_name)
                if art_url and download_image(art_url, host_cover_path):
                    print(f"    [✔] Saved central cover -> {safe_filename}")
                else:
                    print("    [-] Not found on Apple Music.")
                    continue

            # Step 2: Create Docker-compatible symlink (/data/covers/...)
            try:
                if album_cover_symlink.exists() or album_cover_symlink.is_symlink():
                    album_cover_symlink.unlink()
                album_cover_symlink.symlink_to(docker_target_path)
                print(f"    -> Linked cover.jpg -> {docker_target_path}")
            except PermissionError:
                print("    [!] Permission denied (run script with sudo).")

if __name__ == "__main__":
    main()
