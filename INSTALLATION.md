# iPad-Verwaltungssystem - Installation für Ubuntu 24.04.3 LTS

## Komplette Installationsanleitung

### Schritt 1: System vorbereiten

```bash
# System aktualisieren
sudo apt update && sudo apt upgrade -y

# Docker installieren
sudo apt install docker.io docker-compose curl -y

# Benutzer zur Docker-Gruppe hinzufügen
sudo usermod -aG docker $USER

# WICHTIG: Neu anmelden oder Docker-Gruppe aktivieren
newgrp docker
```

### Schritt 2: System starten (Universelle IP-Unterstützung)

```bash
# System starten - funktioniert automatisch mit jeder IP!
./start-docker.sh

# Optional: Setup-Info anzeigen
./setup-ip.sh
```

**🌐 Das System funktioniert automatisch mit JEDER IP-Adresse:**
- http://localhost (lokal)
- http://192.168.99.72 (Ihre Netzwerk-IP)
- http://[BELIEBIGE-IP] (universell)

### Schritt 3: Erste Anmeldung

```bash
# Verzeichnis erstellen
mkdir ipad-verwaltung
cd ipad-verwaltung

# Alle Dateien in diesen Ordner kopieren
# (Alle erstellten Dateien vom Docker-Setup)
```

### Schritt 3: System starten

```bash
# Startup-Script ausführbar machen
chmod +x start-docker.sh
chmod +x stop-docker.sh

# System starten
./start-docker.sh
```

### Schritt 4: Ersten Login durchführen

1. Browser öffnen: http://localhost
2. Admin-Setup aufrufen oder direkt anmelden
3. **Standard-Login:** admin / admin123

### Schritt 5: System konfigurieren

1. **Passwort ändern:** Nach erstem Login
2. **Testdaten hochladen:** Excel-Dateien für iPads und Schüler
3. **Funktionen testen:** Zuordnungen, Verträge, etc.

## Verzeichnisstruktur

```
ipad-verwaltung/
├── docker-compose.yml          # Haupt-Orchestrierung
├── docker-compose.dev.yml      # Entwicklungsmodus
├── .env.docker                 # Umgebungsvariablen
├── start-docker.sh            # Start-Script
├── stop-docker.sh             # Stop-Script
├── README-Docker.md           # Ausführliche Dokumentation
├── INSTALLATION.md            # Diese Datei
├── backend/
│   ├── Dockerfile             # Backend Container
│   ├── server.py              # FastAPI Anwendung
│   ├── requirements.txt       # Python Abhängigkeiten
│   └── .env                   # Backend Umgebung
├── frontend/
│   ├── Dockerfile             # Frontend Container
│   ├── package.json           # Node.js Abhängigkeiten
│   ├── src/                   # React Quellcode
│   └── .env                   # Frontend Umgebung
├── nginx/
│   ├── nginx.conf             # Nginx Hauptkonfiguration
│   └── default.conf           # Server-Konfiguration
└── mongo-init/
    └── init.js                # MongoDB Initialisierung
```

## Wichtige URLs

- **Anwendung:** http://localhost
- **API-Dokumentation:** http://localhost/api/docs
- **Admin-Setup:** http://localhost/api/auth/setup

## Fehlerbehebung

### Docker-Berechtigung
```bash
# Wenn "Permission denied" Fehler auftreten
sudo usermod -aG docker $USER
newgrp docker
# Oder neu anmelden
```

### Port bereits belegt
```bash
# Port 80 freigeben
sudo fuser -k 80/tcp
# Oder anderen Port verwenden (docker-compose.yml ändern)
```

### MongoDB Probleme
```bash
# Container-Logs prüfen
docker-compose logs mongodb

# Neu starten
docker-compose restart mongodb
```

## Produktionsbereitschaft

Für Produktionsumgebung:

1. **Passwörter ändern** in `.env.docker`
2. **SSL-Zertifikate** einrichten
3. **Firewall** konfigurieren
4. **Backups** einrichten
5. **Monitoring** aktivieren

## System entfernen

```bash
# Komplett entfernen (ACHTUNG: Alle Daten gehen verloren!)
./stop-docker.sh
docker system prune -a --volumes
```

## Support

Bei Problemen:
1. Logs sammeln: `docker-compose logs > system-logs.txt`
2. System-Info: `docker system info > docker-info.txt`
3. Container-Status: `docker-compose ps > container-status.txt`

**Standard-Login:** admin / admin123