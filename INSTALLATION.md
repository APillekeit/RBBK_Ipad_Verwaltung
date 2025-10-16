# Installationsanleitung

## 📋 Voraussetzungen

Bevor Sie das Installations-Script ausführen, stellen Sie sicher, dass folgende Software installiert ist:

- **Docker** (Version 20.10 oder höher)
  - Installation: https://docs.docker.com/get-docker/
  
- **Docker Compose** (Version 2.0 oder höher)
  - Installation: https://docs.docker.com/compose/install/

- **Betriebssystem**: Linux, macOS oder Windows mit WSL2

- **Hardware**: 
  - Mindestens 4GB RAM
  - 2 CPU-Kerne
  - 20GB freier Speicherplatz

## 🚀 Automatische Installation

### Schritt 1: Repository klonen

```bash
git clone <repository-url>
cd ipad-management
```

### Schritt 2: Installations-Script ausführen

```bash
./install.sh
```

Das Script führt automatisch folgende Schritte aus:

1. ✅ **System-Voraussetzungen prüfen**
   - Überprüft Docker-Installation
   - Überprüft Docker Compose-Installation
   - Zeigt gefundene Versionen an

2. ✅ **Vorherige Installation prüfen**
   - Sucht nach existierenden Containern
   - Sucht nach existierenden Volumes
   - Sucht nach .env-Dateien
   - Bietet Optionen zum Löschen oder Backup

3. ✅ **Umgebungsvariablen erstellen**
   - Generiert sichere SECRET_KEY (64 Zeichen, zufällig)
   - Erstellt `backend/.env` mit MongoDB-Verbindung
   - Erstellt `frontend/.env` mit Backend-URL

4. ✅ **Docker-Container bauen**
   - Baut Backend-Container (FastAPI + Python 3.11)
   - Baut Frontend-Container (React + Node 20)
   - Baut MongoDB-Container (Version 4.4)

5. ✅ **Services starten**
   - Startet MongoDB
   - Startet Backend (Port 8001)
   - Startet Frontend (Port 3000)
   - Wartet auf Service-Initialisierung

5. ✅ **Datenbank initialisieren**
   - Erstellt Admin-Benutzer (username: admin, password: admin123)
   - Führt RBAC-Datenmigration aus
   - Erstellt Datenbank-Indizes

6. ✅ **Health-Checks durchführen**
   - Prüft Backend-Status (HTTP 200)
   - Prüft Frontend-Status (HTTP 200)
   - Prüft MongoDB-Status (Container läuft)

### Was das Script ausgibt

```
═══════════════════════════════════════════════════════
    iPad-Verwaltungssystem - Installation
    Version 2.0 mit RBAC
═══════════════════════════════════════════════════════

➜ Überprüfe System-Voraussetzungen...
✓ Docker gefunden: 24.0.7
✓ Docker Compose gefunden: 2.23.0

➜ Erstelle Umgebungsvariablen...
✓ Backend .env erstellt mit sicherem SECRET_KEY
✓ Frontend .env erstellt

➜ Baue Docker-Container...
✓ Docker-Container erfolgreich gebaut

➜ Starte Services...
✓ Services gestartet

➜ Initialisiere Datenbank und Admin-Benutzer...
✓ Admin-Benutzer erfolgreich erstellt

═══════════════════════════════════════════════════════
    Standard-Login-Daten:
    Benutzername: admin
    Passwort: admin123
    Rolle: Administrator
    
    ⚠ WICHTIG: Ändern Sie das Passwort nach dem ersten Login!
═══════════════════════════════════════════════════════

➜ Führe RBAC-Datenmigration aus...
✓ Datenmigration abgeschlossen

➜ Überprüfe Service-Status...
✓ Backend läuft auf http://localhost:8001
✓ Frontend läuft auf http://localhost:3000
✓ MongoDB-Container läuft

═══════════════════════════════════════════════════════
    ✓ Installation erfolgreich abgeschlossen!
═══════════════════════════════════════════════════════

Zugriff auf die Anwendung:
  Frontend: http://localhost:3000
  Backend:  http://localhost:8001
  API Docs: http://localhost:8001/docs
```

## 🔧 Manuelle Installation

Falls Sie die Installation manuell durchführen möchten:

### 1. Environment-Variablen erstellen

**Backend (.env):**
```bash
# Sicheren SECRET_KEY generieren
openssl rand -hex 32

# backend/.env erstellen:
SECRET_KEY=<generierter-key>
MONGO_URL=mongodb://mongodb:27017/
IPAD_DB_NAME=iPadDatabase
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
DEBUG=False
```

**Frontend (.env):**
```bash
# frontend/.env erstellen:
REACT_APP_BACKEND_URL=http://localhost:8001
```

### 2. Docker-Container starten

```bash
cd config
docker-compose build
docker-compose up -d
```

### 3. Admin-Benutzer erstellen

```bash
# Warte bis Services bereit sind (ca. 30 Sekunden)
sleep 30

# Admin-Setup ausführen
curl -X POST http://localhost:8001/api/auth/setup
```

### 4. RBAC-Migration ausführen

```bash
docker-compose exec backend python migrate_rbac.py
```

## 🌐 Zugriff auf die Anwendung

Nach erfolgreicher Installation:

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8001
- **API Dokumentation**: http://localhost:8001/docs

**Standard-Login:**
- Benutzername: `admin`
- Passwort: `admin123`
- Rolle: Administrator

## 🔐 Erste Schritte nach der Installation

### 1. Admin-Passwort ändern

⚠️ **WICHTIG**: Ändern Sie das Standard-Passwort sofort!

1. Melden Sie sich als Admin an
2. Gehen Sie zu **Einstellungen**
3. Klicken Sie auf **Passwort ändern**
4. Geben Sie ein sicheres Passwort ein (min. 6 Zeichen)

### 2. Neuen Benutzer erstellen (Optional)

1. Gehen Sie zum Tab **Benutzer** (nur für Admins sichtbar)
2. Klicken Sie auf **Neuer Benutzer**
3. Füllen Sie das Formular aus:
   - Benutzername (min. 3 Zeichen)
   - Passwort (min. 6 Zeichen)
   - Rolle: **Benutzer** oder **Administrator**
4. Klicken Sie auf **Erstellen**

### 3. Daten importieren

1. Gehen Sie zum Tab **iPads** oder **Schüler**
2. Klicken Sie auf **Excel hochladen**
3. Wählen Sie Ihre Excel-Datei (.xlsx)
4. Der Import erfolgt automatisch

## 🛠️ Nützliche Befehle

```bash
# Services-Status anzeigen
docker-compose ps

# Alle Logs anzeigen
docker-compose logs -f

# Nur Backend-Logs
docker-compose logs -f backend

# Nur Frontend-Logs
docker-compose logs -f frontend

# Services neu starten
docker-compose restart

# Einzelnen Service neu starten
docker-compose restart backend

# Services stoppen
docker-compose down

# Services stoppen und Volumes löschen (ACHTUNG: Datenverlust!)
docker-compose down -v
```

## ❓ Troubleshooting

### Problem: Backend startet nicht

```bash
# Logs prüfen
docker-compose logs backend

# Container neu starten
docker-compose restart backend
```

### Problem: Frontend zeigt "Cannot connect to backend"

```bash
# Backend-Status prüfen
curl http://localhost:8001/api/auth/setup

# Falls Backend nicht antwortet, neu starten
docker-compose restart backend
```

### Problem: MongoDB-Verbindungsfehler

```bash
# MongoDB-Status prüfen
docker-compose ps mongodb

# MongoDB-Logs prüfen
docker-compose logs mongodb

# Alle Services neu starten
docker-compose restart
```

### Problem: Port bereits belegt

```bash
# Prüfen, welcher Prozess den Port nutzt
sudo lsof -i :3000  # Frontend
sudo lsof -i :8001  # Backend

# Prozess beenden oder Port in docker-compose.yml ändern
```

## 📚 Weitere Dokumentation

- **Deployment**: `docs/DEPLOYMENT.md` - Produktions-Deployment
- **Development**: `docs/DEVELOPMENT.md` - Entwicklung und Testing
- **README**: `README.md` - Projekt-Übersicht

## 🆘 Support

Bei weiteren Fragen oder Problemen:

1. Überprüfen Sie die Logs: `docker-compose logs -f`
2. Prüfen Sie die Service-Stati: `docker-compose ps`
3. Starten Sie alle Services neu: `docker-compose restart`
4. Konsultieren Sie die Dokumentation in `docs/`
