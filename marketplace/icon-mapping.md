# Service Icon Mapping

This document defines the emoji icons used for different service categories and specific services in the Homie marketplace.

## Category Icons

- **Media & Entertainment**: 🎬
- **Automation**: 🤖
- **Monitoring & Analytics**: 📊
- **Networking**: 🌐
- **Storage & Backup**: 💾
- **Security**: 🔒
- **Development**: 👨‍💻
- **Productivity**: 📝
- **Communication**: 💬
- **Gaming**: 🎮
- **Home Automation**: 🏠
- **Data & Databases**: 🗄️
- **Infrastructure**: 🏗️
- **Other**: 📦

## Service-Specific Icons

### Media Services
- Plex: 🎬 (Movie/Cinema)
- Jellyfin: 🎥 (Video Camera)
- Emby: 📽️ (Film Projector)
- Kodi: 📺 (Television)
- Tautulli: 📈 (Chart - for Plex stats)
- Overseerr: 🎞️ (Film frames)

### Automation Services
- Radarr: 🎬 (Movies)
- Sonarr: 📺 (TV Shows)
- Lidarr: 🎵 (Music)
- Readarr: 📚 (Books)
- Bazarr: 💬 (Subtitles)
- Prowlarr: 🔍 (Indexer)
- SABnzbd: 📥 (Download)
- NZBGet: ⬇️ (Download)
- Transmission: 🌊 (Torrent)
- qBittorrent: 🌀 (Torrent)

### Monitoring Services
- Grafana: 📊 (Chart)
- Prometheus: 🔥 (Fire - Prometheus reference)
- InfluxDB: 📈 (Trending up)
- Telegraf: 📡 (Satellite antenna)
- Uptime Kuma: ✅ (Check mark)
- Netdata: 📉 (Chart)
- Glances: 👁️ (Eye)

### Networking Services
- Pi-hole: 🛡️ (Shield)
- Nginx Proxy Manager: 🔀 (Shuffle/Route)
- Traefik: 🚦 (Traffic light)
- WireGuard: 🔐 (Lock)
- OpenVPN: 🔑 (Key)
- AdGuard Home: 🛡️ (Shield)
- pfSense: 🔥 (Firewall)

### Storage Services
- Nextcloud: ☁️ (Cloud)
- Syncthing: 🔄 (Sync)
- FileBrowser: 📁 (Folder)
- MinIO: 🗃️ (File cabinet)
- Seafile: 🌊 (Wave - Sea reference)
- Resilio Sync: 🔁 (Repeat)
- Duplicati: 💾 (Floppy disk - Backup)

### Home Automation
- Home Assistant: 🏠 (House)
- Node-RED: 🔴 (Red circle)
- Mosquitto: 🦟 (Mosquito)
- Zigbee2MQTT: 📡 (Antenna)
- Domoticz: 🏡 (House with garden)
- OpenHAB: 🏘️ (Houses)

### Development Services
- Gitea: 🐙 (Octopus - Git)
- GitLab: 🦊 (Fox - GitLab logo)
- Jenkins: 🎩 (Top hat - Jenkins butler)
- Drone: 🚁 (Helicopter)
- Code-Server: 💻 (Laptop)
- Portainer: 🐳 (Whale - Docker)

### Security Services
- Vaultwarden: 🔐 (Lock)
- Authelia: 🔑 (Key)
- Keycloak: 🗝️ (Old key)
- Bitwarden: 🔒 (Lock)

### Communication Services
- Matrix/Synapse: 💬 (Speech bubble)
- Rocket.Chat: 🚀 (Rocket)
- Mattermost: 💭 (Thought bubble)
- Jitsi Meet: 📹 (Video camera)

### Database Services
- PostgreSQL: 🐘 (Elephant)
- MySQL/MariaDB: 🐬 (Dolphin)
- MongoDB: 🍃 (Leaf)
- Redis: ⚡ (Lightning)
- InfluxDB: 📈 (Chart)

## Usage Notes

1. These emojis are used in the `icon` field of service definitions
2. They provide immediate visual recognition in the marketplace UI
3. They work across all platforms without requiring external assets
4. They can be overridden by custom icons if needed

## Adding New Services

When adding a new service:
1. Check if there's a category-appropriate emoji
2. If the service has a well-known association (e.g., Docker = 🐳), use that
3. Otherwise, use the category default icon
4. Document any new icon choices here