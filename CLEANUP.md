# Cleanup und Deinstallation

## 🗑️ Übersicht

Diese Anleitung beschreibt, wie Sie eine vorhandene Installation des iPad-Verwaltungssystems vollständig entfernen können.

## ⚠️ Wichtige Hinweise

**DATENVERLUST:**
- Das Entfernen der Installation löscht **ALLE Daten**:
  - Alle iPads
  - Alle Schüler
  - Alle Zuordnungen
  - Alle Verträge (PDFs)
  - Alle Benutzerkonten

**BACKUP EMPFOHLEN:**
- Erstellen Sie **immer** ein Backup vor dem Löschen
- Backups enthalten:
  - Konfigurationsdateien (.env)
  - MongoDB-Datenbank
  - Alle Anwendungsdaten

## 🔄 Methode 1: Automatisches Cleanup (Empfohlen)

### Mit Backup

```bash
# Cleanup-Modus starten
./install.sh --cleanup

# Bei Aufforderung:
Möchten Sie vorher ein Backup erstellen? (j/n): j

# Explizite Bestätigung:
Sind Sie sicher, dass Sie alles löschen möchten? (ja/nein): ja
```

**Was wird gelöscht:**
- ✓ Alle Docker-Container gestoppt und entfernt
- ✓ Alle Docker-Volumes gelöscht (MongoDB-Daten!)
- ✓ Alle Docker-Images entfernt
- ✓ Backup erstellt in `./backup_YYYYMMDD_HHMMSS/`

### Ohne Backup (Nicht empfohlen)

```bash
./install.sh --cleanup

# Bei Aufforderung:
Möchten Sie vorher ein Backup erstellen? (j/n): n

# Explizite Bestätigung:
Sind Sie sicher, dass Sie alles löschen möchten? (ja/nein): ja
```

## 🐳 Methode 2: Docker Compose Cleanup

### Nur Container stoppen

```bash
cd config
docker-compose stop
```

Daten bleiben erhalten, Container können mit `docker-compose start` wieder gestartet werden.

### Container entfernen, Daten behalten

```bash
cd config
docker-compose down
```

Container werden gelöscht, aber Volumes (Daten) bleiben erhalten.

### Vollständiges Cleanup mit Datenverlust

```bash
cd config
docker-compose down -v
```

⚠️ **WARNUNG**: Container UND Volumes werden gelöscht! Alle Daten gehen verloren!

### Cleanup inklusive Images

```bash
cd config
docker-compose down -v --rmi all
```

Entfernt zusätzlich alle gebauten Images.

## 🐳 Methode 3: Manuelles Docker Cleanup

### Container einzeln stoppen und entfernen

```bash
# Container anzeigen
docker ps -a | grep "ipad\|mongodb"

# Container stoppen
docker stop config_backend_1 config_frontend_1 mongodb

# Container entfernen
docker rm config_backend_1 config_frontend_1 mongodb
```

### Volumes einzeln entfernen

```bash
# Volumes anzeigen
docker volume ls | grep "ipad\|mongodb"

# Volumes entfernen (⚠️ Datenverlust!)
docker volume rm config_mongodb_data config_mongodb_config
```

### Images einzeln entfernen

```bash
# Images anzeigen
docker images | grep ipad

# Images entfernen
docker rmi config_backend config_frontend
```

## 💾 Backup erstellen

### Automatisches Backup

Das Cleanup-Script erstellt automatisch Backups:

```bash
./install.sh --cleanup
# Wählen Sie "j" für Backup
```

### Manuelles Backup

**Konfigurationsdateien sichern:**
```bash
mkdir -p ./backup_manual
cp backend/.env ./backup_manual/backend.env.bak
cp frontend/.env ./backup_manual/frontend.env.bak
```

**MongoDB-Daten sichern:**
```bash
# Container muss laufen
docker exec mongodb mongodump --out /tmp/mongodb_backup
docker cp mongodb:/tmp/mongodb_backup ./backup_manual/
```

**Komplettes Backup-Script:**
```bash
#!/bin/bash
BACKUP_DIR="./backup_$(date +%Y%m%d_%H%M%S)"
mkdir -p "$BACKUP_DIR"

# Konfiguration
cp backend/.env "$BACKUP_DIR/backend.env.bak" 2>/dev/null
cp frontend/.env "$BACKUP_DIR/frontend.env.bak" 2>/dev/null

# MongoDB
docker exec mongodb mongodump --out /tmp/mongodb_backup 2>/dev/null
docker cp mongodb:/tmp/mongodb_backup "$BACKUP_DIR/" 2>/dev/null

echo "Backup erstellt in: $BACKUP_DIR"
```

## 🔄 Backup wiederherstellen

### Nach Neuinstallation

**Konfiguration wiederherstellen:**
```bash
# Backup-Verzeichnis angeben
BACKUP_DIR="./backup_20241016_153042"

# .env-Dateien zurückkopieren
cp "$BACKUP_DIR/backend.env.bak" backend/.env
cp "$BACKUP_DIR/frontend.env.bak" frontend/.env

# Services neu starten
cd config
docker-compose restart
```

**MongoDB-Daten wiederherstellen:**
```bash
# Backup-Verzeichnis angeben
BACKUP_DIR="./backup_20241016_153042"

# Daten in Container kopieren
docker cp "$BACKUP_DIR/mongodb_backup" mongodb:/tmp/

# In MongoDB wiederherstellen
docker exec mongodb mongorestore /tmp/mongodb_backup

# Überprüfen
docker exec mongodb mongo iPadDatabase --eval "db.students.count()"
```

## 🗂️ Backup-Struktur

Ein automatisch erstelltes Backup enthält:

```
backup_20241016_153042/
├── backend.env.bak          # Backend-Konfiguration
├── frontend.env.bak         # Frontend-Konfiguration
└── mongodb_backup/          # Datenbank-Dump
    ├── admin/
    ├── config/
    └── iPadDatabase/        # Haupt-Datenbank
        ├── assignments.bson
        ├── contracts.bson
        ├── ipads.bson
        ├── students.bson
        ├── users.bson
        └── *.metadata.json
```

## 🔍 Cleanup verifizieren

Nach dem Cleanup können Sie überprüfen, ob alles entfernt wurde:

```bash
# Container prüfen (sollte leer sein)
docker ps -a | grep "ipad\|mongodb"

# Volumes prüfen (sollte leer sein)
docker volume ls | grep "ipad\|mongodb"

# Images prüfen (sollte leer sein)
docker images | grep ipad

# Konfigurationsdateien prüfen
ls -la backend/.env frontend/.env
```

**Erwartetes Ergebnis:** Alle Befehle sollten keine Ergebnisse liefern.

## 🔄 Neuinstallation nach Cleanup

Nach erfolgreichem Cleanup können Sie neu installieren:

```bash
# Normale Neuinstallation
./install.sh

# Das Script erkennt, dass keine vorherige Installation existiert
# und führt eine saubere Neuinstallation durch
```

## ❓ Häufige Fragen

**Q: Werden Backups automatisch gelöscht?**
A: Nein, Backups bleiben in `./backup_*` Verzeichnissen erhalten und müssen manuell gelöscht werden.

**Q: Kann ich nur die Datenbank löschen, aber Container behalten?**
A: Ja, mit `docker volume rm config_mongodb_data` (⚠️ Datenverlust!)

**Q: Wie viel Speicherplatz nimmt ein Backup ein?**
A: Abhängig von Datenmenge, typischerweise 10-100 MB für kleine bis mittlere Installationen.

**Q: Kann ich Backups auf einen anderen Server übertragen?**
A: Ja, kopieren Sie das gesamte `backup_*` Verzeichnis und führen Sie die Wiederherstellung auf dem Zielserver aus.

**Q: Was passiert, wenn ich beim Cleanup "nein" sage?**
A: Das Script bricht ab, nichts wird gelöscht oder geändert.

## 🆘 Problembehandlung

**Problem: Cleanup-Script findet keine Container**
```bash
# Manuell nach Containern suchen
docker ps -a

# Eventuell andere Namen
docker ps -a | grep mongo
```

**Problem: Volumes können nicht gelöscht werden**
```bash
# Container müssen zuerst gestoppt sein
docker stop $(docker ps -aq)

# Dann Volumes löschen
docker volume rm <volume-name>
```

**Problem: "Permission denied" beim Backup**
```bash
# Script mit sudo ausführen
sudo ./install.sh --cleanup

# Oder Berechtigungen anpassen
sudo chown -R $USER:$USER ./backup_*
```

**Problem: MongoDB-Backup schlägt fehl**
```bash
# Prüfen ob Container läuft
docker ps | grep mongodb

# Falls nicht, starten
docker start mongodb

# Warten und erneut versuchen
sleep 5
docker exec mongodb mongodump --out /tmp/mongodb_backup
```

## 📚 Weitere Informationen

- **Installation**: `INSTALLATION.md`
- **Deployment**: `docs/DEPLOYMENT.md`
- **Entwicklung**: `docs/DEVELOPMENT.md`
- **README**: `README.md`
