# Homie Service Marketplace

This directory contains service definitions for the Homie homelab manager. Each service is defined as a JSON file that describes how to install, configure, and manage that particular service.

## Directory Structure

```
marketplace/
├── services/         # Service definition files (JSON)
│   ├── media/       # Media services (Plex, Jellyfin, etc.)
│   ├── automation/  # Automation services (Radarr, Sonarr, etc.)
│   ├── monitoring/  # Monitoring services (Grafana, Prometheus, etc.)
│   ├── networking/  # Networking services (Pi-hole, Traefik, etc.)
│   ├── storage/     # Storage services (Nextcloud, Syncthing, etc.)
│   └── ...
├── icons/           # Service icons (SVG/PNG)
├── schemas/         # JSON schemas for validation
├── categories/      # Category definitions
└── marketplace.json # Marketplace metadata

## Adding a New Service

1. Create a JSON file in the appropriate category folder under `services/`
2. Follow the schema defined in `schemas/service.schema.json`
3. Add an icon in the `icons/` folder (optional)
4. Submit a pull request

## Service Definition Format

Each service is defined as a JSON file with the following structure:

```json
{
  "id": "unique-service-id",
  "name": "Service Name",
  "version": "1.0.0",
  "author": "Author Name",
  "description": "Short description",
  "category": "media|automation|monitoring|...",
  "docker": {
    "image": "docker-image-name",
    "ports": [...],
    "volumes": [...],
    "environment": {...}
  },
  "config": {
    "fields": [...]
  },
  ...
}
```

## Marketplace Updates

The Homie application can:
- Poll this repository for updates
- Cache service definitions locally
- Check for new services periodically
- Update existing service definitions

## Contributing

To contribute a new service:
1. Fork this repository
2. Add your service definition
3. Test the service locally
4. Submit a pull request

## License

Service definitions are provided as-is for use with Homie.