# iPad-Verwaltungssystem - Docker Setup

## Übersicht
Vollständiges Docker-Setup für das iPad-Verwaltungssystem, optimiert für Ubuntu 24.04.3 LTS mit MongoDB 4.4.

## Systemanforderungen

### Ubuntu 24.04.3 LTS
- Docker 20.10+ 
- Docker Compose 1.29+
- Mindestens 2GB RAM
- 5GB freier Festplattenspeicher

## Quick Start

### 1. Docker installieren (falls nicht vorhanden)
```bash
sudo apt update
sudo apt install docker.io docker-compose
sudo usermod -aG docker $USER
```
**Wichtig:** Nach der Installation neu anmelden oder `newgrp docker` ausführen!

### 2. System starten
```bash
# Ausführbar machen
chmod +x start-docker.sh

# System starten
./start-docker.sh
```

### 3. System nutzen (Universeller Zugriff)
- **Anwendung:** http://localhost ODER http://[BELIEBIGE-IP]
- **Standard-Login:** admin / admin123
- **🌐 Funktioniert automatisch mit jeder IP-Adresse!**

## Architektur

### Services
- **MongoDB 4.4:** Datenbank (Port 27017)
- **FastAPI Backend:** Python API-Server (intern Port 8001)
- **React Frontend:** Weboberfläche (gebaut und über Nginx serviert)
- **Nginx:** Reverse Proxy und Webserver (Port 80)

### Volumes
- `mongodb_data`: MongoDB-Daten (persistent)
- `backend_uploads`: Hochgeladene Dateien (persistent)
- `frontend_build`: React Build-Artefakte

## Konfiguration

### Umgebungsvariablen (.env.docker)
```bash
# MongoDB
MONGO_URL=mongodb://admin:ipad_admin_2024@mongodb:27017/iPadDatabase?authSource=admin
MONGODB_ROOT_USERNAME=admin
MONGODB_ROOT_PASSWORD=ipad_admin_2024

# Backend
SECRET_KEY=your-super-secret-key-change-this-in-production-2024

# Frontend
REACT_APP_BACKEND_URL=http://localhost/api
```

### Sicherheit
⚠️ **Produktionsumgebung:** Ändern Sie unbedingt die Standard-Passwörter!

## Verwaltung

### Container-Status prüfen
```bash
docker-compose ps
```

### Logs anzeigen
```bash
# Alle Services
docker-compose logs -f

# Spezifischer Service
docker-compose logs -f backend
docker-compose logs -f mongodb
docker-compose logs -f nginx
```

### Services neu starten
```bash
# Alle Services
docker-compose restart

# Spezifischer Service
docker-compose restart backend
```

### System stoppen
```bash
docker-compose stop
```

### System vollständig entfernen
```bash
docker-compose down --volumes --rmi all
```

## Backup & Wiederherstellung

### MongoDB Backup
```bash
# Backup erstellen
docker exec ipad_mongodb mongodump --uri="mongodb://admin:ipad_admin_2024@localhost:27017/iPadDatabase?authSource=admin" --out=/tmp/backup

# Backup herunterladen
docker cp ipad_mongodb:/tmp/backup ./mongodb-backup-$(date +%Y%m%d)
```

### MongoDB Wiederherstellen  
```bash
# Backup hochladen
docker cp ./mongodb-backup ipad_mongodb:/tmp/restore

# Wiederherstellen
docker exec ipad_mongodb mongorestore --uri="mongodb://admin:ipad_admin_2024@localhost:27017/iPadDatabase?authSource=admin" /tmp/restore/iPadDatabase
```

## Entwicklung

### Live-Entwicklung aktivieren
```bash
# Backend mit Live-Reload
docker-compose -f docker-compose.yml -f docker-compose.dev.yml up
```

### Datenbankzugriff
```bash
# MongoDB Shell
docker exec -it ipad_mongodb mongo -u admin -p ipad_admin_2024 --authenticationDatabase admin iPadDatabase
```

## Troubleshooting

### Häufige Probleme

#### Port bereits belegt
```bash
# Überprüfe welcher Prozess Port 80 verwendet
sudo netstat -tulpn | grep :80
sudo fuser -k 80/tcp  # Prozess beenden
```

#### MongoDB startet nicht
```bash
# Logs überprüfen
docker-compose logs mongodb

# Container neu starten
docker-compose restart mongodb
```

#### Frontend nicht erreichbar
```bash
# Nginx-Logs überprüfen
docker-compose logs nginx

# Frontend neu bauen
docker-compose build frontend
docker-compose up -d
```

#### Backend-API Fehler
```bash
# Backend-Logs überprüfen
docker-compose logs backend

# Environment-Variablen überprüfen
docker exec ipad_backend env | grep MONGO
```

### Systemressourcen überprüfen
```bash
# Docker-System-Info
docker system df
docker system prune  # Unused resources cleanup

# Container-Ressourcen
docker stats
```

## Produktionsbereitschaft

### Sicherheits-Checkliste
- [ ] Standard-Passwörter geändert
- [ ] SECRET_KEY geändert
- [ ] Firewall konfiguriert
- [ ] SSL/HTTPS aktiviert
- [ ] Backup-Strategie implementiert
- [ ] Monitoring eingerichtet

### SSL/HTTPS Setup
Für Produktionsumgebung SSL-Zertifikate in `./nginx/ssl/` ablegen und Nginx-Konfiguration anpassen.

## Support

### Logs sammeln
```bash
# Alle Logs sammeln für Support
mkdir -p support-logs
docker-compose logs > support-logs/all-services.log
docker system info > support-logs/docker-info.log
docker-compose ps > support-logs/container-status.log
```

### System-Informationen
- **Version:** 1.0
- **MongoDB:** 4.4 (VM-kompatibel)
- **Python:** 3.11
- **Node.js:** 18
- **Nginx:** Alpine

Für weitere Unterstützung, siehe Anwendungsdokumentation oder kontaktieren Sie den Support.