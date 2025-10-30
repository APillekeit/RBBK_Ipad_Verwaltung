# 🚀 Schnellstart-Anleitung

## Voraussetzungen

- Docker installiert
- Docker Compose installiert
- Linux, macOS oder Windows mit WSL2

## Installation in 3 Schritten

### 1. Projekt herunterladen

```bash
# ZIP herunterladen und entpacken
unzip RBBK_Ipad_Verwaltung-main.zip

# Ins Projektverzeichnis wechseln
cd RBBK_Ipad_Verwaltung-main

# ODER via Git
git clone <repository-url>
cd ipad-management
```

### 2. Installation ausführen

```bash
# Script ausführbar machen
chmod +x install.sh

# Installation starten
./install.sh
```

**Das war's!** Das Script erledigt alles automatisch.

### 3. Anwendung öffnen

Nach erfolgreicher Installation:

```
Frontend: http://localhost:3000
Backend:  http://localhost:8001
API Docs: http://localhost:8001/docs
```

**Login:**
- Benutzername: `admin`
- Passwort: `admin123`

⚠️ **Wichtig:** Ändern Sie das Passwort nach dem ersten Login!

---

## 🔴 Bei Fehlern

### Fehler: "No such file or directory"

Sie sind im falschen Verzeichnis!

```bash
# Prüfen Sie Ihr aktuelles Verzeichnis
pwd

# Es sollte so aussehen:
# /home/user/RBBK_Ipad_Verwaltung-main
# oder
# /home/user/ipad-management

# Wechseln Sie ins richtige Verzeichnis
cd /pfad/zum/RBBK_Ipad_Verwaltung-main

# Dann erneut versuchen
./install.sh
```

### Fehler: "Container name is already in use"

Vorherige Installation existiert noch.

```bash
# Quick Cleanup
chmod +x quick-cleanup.sh
./quick-cleanup.sh

# Dann neu installieren
./install.sh
```

### Fehler: "build path does not exist"

Docker Compose findet die Verzeichnisse nicht.

```bash
# Prüfen ob alle Verzeichnisse existieren
ls -la

# Sie sollten sehen:
# backend/
# frontend/
# config/
# install.sh

# Falls nicht, sind Sie im falschen Verzeichnis!
```

### Fehler: "docker: command not found"

Docker ist nicht installiert.

```bash
# Docker installieren (Ubuntu/Debian)
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Docker Compose installieren
sudo apt-get install docker-compose-plugin

# Testen
docker --version
docker compose version
```

---

## 📱 Nach der Installation

### Passwort ändern

1. Bei http://localhost:3000 anmelden
2. Auf "Einstellungen" klicken
3. "Passwort ändern" wählen
4. Neues sicheres Passwort eingeben

### Ersten Benutzer erstellen (Optional)

Als Admin:
1. Auf "Benutzer" Tab klicken
2. "Neuer Benutzer" klicken
3. Formular ausfüllen:
   - Benutzername (min. 3 Zeichen)
   - Passwort (min. 6 Zeichen)
   - Rolle: Benutzer oder Administrator
4. "Erstellen" klicken

### Daten importieren

1. **iPads importieren:**
   - Tab "iPads" öffnen
   - "Excel hochladen" klicken
   - .xlsx Datei auswählen

2. **Schüler importieren:**
   - Tab "Schüler" öffnen
   - "Excel hochladen" klicken
   - .xlsx Datei auswählen

3. **Automatische Zuordnung:**
   - Tab "Zuordnungen" öffnen
   - "Auto-Zuordnung" klicken

### Verträge hochladen

1. Tab "Verträge" öffnen
2. "PDF hochladen" klicken
3. Bis zu 50 PDFs auswählen
4. Automatische Zuordnung erfolgt

---

## 🛠️ Verwaltung

### Services Status

```bash
cd config
docker compose ps
```

### Logs anzeigen

```bash
cd config
docker compose logs -f
```

### Services neu starten

```bash
cd config
docker compose restart
```

### Services stoppen

```bash
cd config
docker compose down
```

### Services starten

```bash
cd config
docker compose up -d
```

---

## 🆘 Hilfe

**Container-Konflikt:**
```bash
./quick-cleanup.sh
./install.sh
```

**Komplettes Cleanup:**
```bash
./install.sh --cleanup
```

**Dokumentation:**
- `README.md` - Projekt-Übersicht
- `INSTALLATION.md` - Ausführliche Installation
- `FEHLER_CONTAINER_KONFLIKT.md` - Container-Fehler beheben
- `CLEANUP.md` - Deinstallation

---

## ✅ Checkliste für erfolgreiche Installation

- [ ] Docker installiert (`docker --version`)
- [ ] Docker Compose installiert (`docker compose version`)
- [ ] Im richtigen Verzeichnis (`ls -la` zeigt backend/, frontend/, config/)
- [ ] Script ausführbar (`chmod +x install.sh`)
- [ ] Keine alten Container (`docker ps -a | grep ipad` ist leer)
- [ ] Installation ausgeführt (`./install.sh`)
- [ ] Frontend erreichbar (http://localhost:3000)
- [ ] Login erfolgreich (admin / admin123)
- [ ] Passwort geändert

**Viel Erfolg!** 🎉
