# iPad Management System

Ein sicheres, webbasiertes System zur Verwaltung von iPad-Zuordnungen an einer Bildungseinrichtung.

## 🚀 Features

### 🔐 RBAC (Role-Based Access Control) - NEU!
- **Multi-User-Unterstützung**: Mehrere Benutzer mit eigenen Daten
- **Rollensystem**: Administrator- und Benutzer-Rollen
- **Benutzerverwaltung**: Admins können Benutzer erstellen, bearbeiten und verwalten  
- **Datenisolation**: Benutzer sehen nur ihre eigenen Daten
- **Admin-Übersicht**: Admins haben Zugriff auf alle Systemdaten
- **IDOR-Schutz**: Vollständige Ownership-Validierung auf allen Endpunkten

### 📱 Kernfunktionen
- **iPad-Verwaltung**: Vollständige Verwaltung von iPad-Beständen mit Status-Tracking
- **Schüler-Management**: Import und Verwaltung von Schülerdaten
- **Zuordnungs-System**: Automatische und manuelle iPad-Zuordnungen an Schüler
- **Vertrags-Verwaltung**: Upload und automatische Zuordnung von Nutzungsverträgen
- **Export-Funktionen**: Flexible Export-Optionen für Bestandslisten und Zuordnungen
- **Sicherheit**: Enterprise-Grade Sicherheitsmaßnahmen implementiert

## 📋 Technische Spezifikationen

### Backend
- **Framework**: FastAPI (Python 3.11)
- **Datenbank**: MongoDB 4.4+
- **Authentifizierung**: JWT mit sicheren Secret Keys
- **Sicherheit**: Rate Limiting, Input Sanitization, CORS Protection

### Frontend
- **Framework**: React 18
- **UI-Library**: Shadcn/ui + Radix UI
- **Styling**: Tailwind CSS
- **Build-Tool**: Create React App

## 🛠️ Installation & Setup

### Voraussetzungen
- Docker & Docker Compose
- Minimum 2GB RAM
- 10GB freier Speicherplatz

### Schnellstart mit Installations-Script
```bash
# 1. Repository klonen
git clone <repository-url>
cd ipad-management

# 2. Installations-Script ausführen (empfohlen)
./install.sh
```

Das Script führt automatisch aus:
- ✓ Prüft System-Voraussetzungen
- ✓ Erstellt Umgebungsvariablen mit sicheren Keys
- ✓ Baut und startet alle Docker-Container
- ✓ Initialisiert Datenbank und Admin-Benutzer
- ✓ Führt RBAC-Datenmigration aus

**ODER** Manueller Start:
```bash
# Umgebung starten
docker-compose -f config/docker-compose.yml up -d

# Admin-Benutzer erstellen
curl -X POST http://localhost:8001/api/auth/setup
```

### Zugriff
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8001
- **API Docs**: http://localhost:8001/docs

### Standard-Anmeldedaten
```
Benutzername: admin
Passwort: admin123
Rolle: Administrator
```
⚠️ **WICHTIG**: Passwort nach dem ersten Login ändern!

## 📁 Projektstruktur

```
/app/
├── backend/                # FastAPI Backend
│   ├── server.py          # Haupt-API Server
│   ├── requirements.txt   # Python Abhängigkeiten  
│   ├── Dockerfile        # Backend Container
│   └── .env              # Backend Konfiguration
├── frontend/              # React Frontend
│   ├── src/              # Source Code
│   ├── public/           # Static Assets
│   ├── package.json      # Node Abhängigkeiten
│   ├── Dockerfile        # Frontend Container
│   └── .env              # Frontend Konfiguration
├── nginx/                # Reverse Proxy
├── mongo-init/           # MongoDB Setup
├── config/               # Docker Compose
├── scripts/              # Utility Scripts
├── docs/                 # Dokumentation
└── tests/                # Test Suite
```

## 🔒 Sicherheit

Das System implementiert umfassende Sicherheitsmaßnahmen:
- **RBAC**: Role-Based Access Control mit User/Admin-Rollen
- **IDOR-Schutz**: Ownership-Validierung auf allen Ressourcen
- **JWT-Authentifizierung**: 512-Bit Secret Keys mit User-ID im Token
- **Rate Limiting**: 5 Login-Versuche/Minute
- **Input Sanitization**: XSS-Schutz mit Bleach
- **File Upload Validation**: MIME-Type Checking und Größenlimits
- **HTTP Security Headers**: CSP, HSTS, X-Frame-Options
- **CORS-Konfiguration**: Strikte Origin-Policies
- **Datenisolation**: Vollständige Trennung zwischen Benutzern

## 📊 API Dokumentierung

Die vollständige API-Dokumentation ist verfügbar unter:
`http://localhost:8001/docs` (Swagger UI)

## 🔧 Entwicklung

### Backend-Tests ausführen
```bash
python scripts/security_tests.py
```

### Frontend-Entwicklung
```bash
cd frontend
yarn install
yarn start
```

## 📈 Monitoring & Logs

### Service-Status prüfen
```bash
sudo supervisorctl status
```

### Logs einsehen
```bash
# Backend Logs
tail -f /var/log/supervisor/backend.*.log

# Frontend Logs  
tail -f /var/log/supervisor/frontend.*.log
```

## 🔧 Nützliche Befehle

```bash
# Services-Status anzeigen
docker-compose ps

# Logs anzeigen
docker-compose logs -f

# Services neu starten
docker-compose restart

# Services stoppen
docker-compose down

# Alte Installation entfernen (mit Backup-Option)
./install.sh --cleanup

# RBAC-Migration ausführen
docker-compose exec backend python migrate_rbac.py

# Sicherheitstests ausführen
python scripts/security_tests.py
```

## 🤝 Support

Bei Problemen oder Fragen:
1. Prüfen Sie die Logs: `docker-compose logs -f`
2. Überprüfen Sie die Service-Status: `docker-compose ps`
3. Starten Sie die Services neu: `docker-compose restart`
4. Konsultieren Sie die Dokumentation: `docs/DEPLOYMENT.md` oder `docs/DEVELOPMENT.md`

## 📜 Lizenz

Dieses Projekt ist für interne Nutzung der Bildungseinrichtung bestimmt.