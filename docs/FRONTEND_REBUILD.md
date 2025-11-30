# Frontend Neubuild - Anleitung

## 📋 Wann ist ein kompletter Neubuild notwendig?

Ein vollständiger Neubuild des Frontends ist erforderlich bei:

- ❌ **Fehler:** `KeyError: 'ContainerConfig'` beim Deployment
- ❌ **Fehler:** Container können nicht neu erstellt werden
- ❌ Änderungen im Frontend werden nicht übernommen
- ❌ Alte Build-Artefakte verursachen Probleme
- ❌ Button oder Features sind nach Deploy nicht sichtbar

---

## 🚀 Kompletter Frontend-Neubuild

### **Voraussetzungen:**
- SSH-Zugriff auf Server
- Docker und Docker Compose installiert
- Berechtigung für `docker` Befehle

---

## 📝 Schritt-für-Schritt Anleitung

### **SCHRITT 1: Navigieren zum config-Verzeichnis**

```bash
cd /pfad/zu/RBBK_Ipad_Verwaltung-main/config
```

**Erklärung:** Hier liegt die `docker-compose.yml` mit den Service-Definitionen.

---

### **SCHRITT 2: Alle Container stoppen**

```bash
docker-compose down
```

**Was passiert:**
- ✅ Stoppt alle Container (frontend, backend, nginx, mongodb)
- ✅ Entfernt gestoppte Container
- ⚠️ Volumes bleiben erhalten (Daten sicher!)

**Erwartete Ausgabe:**
```
Stopping ipad_nginx ... done
Stopping ipad_backend ... done
Stopping ipad_mongodb ... done
Removing ipad_nginx ... done
Removing ipad_backend ... done
Removing ipad_frontend_build ... done
Removing ipad_mongodb ... done
```

---

### **SCHRITT 3: Alte Frontend-Container finden**

```bash
docker ps -a | grep ipad_frontend
```

**Was passiert:**
- ✅ Zeigt ALLE Frontend-Container (auch gestoppte)
- ℹ️ Nur zur Information / Kontrolle

**Mögliche Ausgabe:**
```
abc123... ipad_frontend_build  Exited (0) 5 hours ago
```

---

### **SCHRITT 4: Frontend-Container löschen**

```bash
docker rm -f ipad_frontend_build 2>/dev/null
```

**Was passiert:**
- ✅ Entfernt den alten Frontend-Build-Container
- ✅ `-f` = erzwingt Löschen (auch wenn noch läuft)
- ✅ `2>/dev/null` = Fehler werden unterdrückt (falls Container nicht existiert)

**Erwartete Ausgabe:**
```
ipad_frontend_build
```
(Oder keine Ausgabe, wenn Container nicht existierte)

---

### **SCHRITT 5: Frontend-Volume löschen**

```bash
docker volume rm config_frontend_build
```

**Was passiert:**
- ✅ Löscht das Volume mit den alten Build-Artefakten
- ⚠️ **WICHTIG:** Hier liegen die kompilierten React-Dateien
- ✅ Muss gelöscht werden, damit neue Dateien gebaut werden

**Erwartete Ausgabe:**
```
config_frontend_build
```

**Bei Fehler:** "volume is in use" → Container laufen noch → Zurück zu Schritt 2

---

### **SCHRITT 6: Alte Frontend-Images finden**

```bash
docker images | grep frontend
```

**Was passiert:**
- ✅ Zeigt alle Frontend-Docker-Images
- ℹ️ Nur zur Information / Kontrolle

**Mögliche Ausgabe:**
```
config_frontend  latest  abc123def456  2 hours ago  500MB
```

---

### **SCHRITT 7: Frontend-Image löschen**

```bash
docker rmi config_frontend 2>/dev/null
```

**Was passiert:**
- ✅ Löscht das alte Frontend-Docker-Image
- ✅ Erzwingt kompletten Neubuild (kein Cache)
- ✅ `2>/dev/null` = Fehler werden unterdrückt

**Erwartete Ausgabe:**
```
Untagged: config_frontend:latest
Deleted: sha256:abc123...
```

---

### **SCHRITT 8: Frontend NEU bauen**

```bash
docker-compose build --no-cache frontend
```

**Was passiert:**
- ✅ Baut Frontend-Container komplett neu
- ✅ `--no-cache` = Kein Build-Cache (garantiert frischen Build)
- ⏱️ **Dauer:** 5-15 Minuten (je nach System)

**Erwartete Ausgabe:**
```
Building frontend
Step 1/10 : FROM node:20-alpine as build
Step 2/10 : WORKDIR /app
Step 3/10 : COPY package*.json ./
Step 4/10 : RUN yarn install
 ---> Running in abc123...
[viele Zeilen mit Package-Installation]
Step 8/10 : RUN yarn build
 ---> Running in def456...
Creating an optimized production build...
Compiled successfully!
...
Successfully built abc123def456
Successfully tagged config_frontend:latest
```

**Bei Fehler:**
- Prüfen Sie `package.json` auf Syntax-Fehler
- Prüfen Sie ob `node_modules` korrekt ist
- Prüfen Sie Netzwerkverbindung (für npm-Downloads)

---

### **SCHRITT 9: Alle Container starten**

```bash
docker-compose up -d
```

**Was passiert:**
- ✅ Startet alle Container im Hintergrund
- ✅ Frontend-Container kopiert Build-Artefakte ins Volume
- ✅ Nginx serviert die neuen Dateien

**Erwartete Ausgabe:**
```
Creating ipad_mongodb ... done
Creating ipad_backend ... done
Creating ipad_frontend_build ... done
Creating ipad_nginx ... done
```

---

### **SCHRITT 10: Container-Status prüfen**

```bash
docker ps | grep ipad
```

**Was passiert:**
- ✅ Zeigt alle laufenden iPad-Container

**Erwartete Ausgabe:**
```
abc123  ipad_nginx           Up 10 seconds   0.0.0.0:80->80/tcp, 443/tcp
def456  ipad_backend         Up 15 seconds   0.0.0.0:8001->8001/tcp
ghi789  ipad_mongodb         Up 20 seconds   0.0.0.0:27017->27017/tcp
```

**Hinweis:** `ipad_frontend_build` sollte **NICHT** laufen (Exited 0 ist OK).
Dieser Container läuft nur kurz zum Kopieren der Build-Artefakte.

---

## ✅ Erfolgskriterien

Nach erfolgreichem Rebuild sollten Sie sehen:

- ✅ Alle Container laufen (`docker ps`)
- ✅ Nginx ist healthy
- ✅ Backend ist erreichbar
- ✅ Frontend lädt im Browser
- ✅ **Neue Features sind sichtbar** (z.B. "Vollständig löschen"-Button)

---

## 🌐 Frontend im Browser testen

### **WICHTIG: Browser-Cache leeren!**

```
1. Drücken Sie: Strg + Shift + Entf
2. Wählen Sie: "Gesamter Zeitraum"
3. Aktivieren Sie:
   ✅ Cookies und Website-Daten
   ✅ Gecachte Bilder und Dateien
4. Klicken Sie: "Daten löschen"
5. Browser komplett schließen
6. Browser neu öffnen
7. URL aufrufen
8. Drücken Sie: Strg + F5 (Hard Reload)
```

### **Oder: Inkognito-Modus testen**

- Chrome: `Strg + Shift + N`
- Firefox: `Strg + Shift + P`

---

## 🚨 Troubleshooting

### **Problem 1: "volume is in use"**

```bash
# Lösung: Alle Container stoppen
docker-compose down
docker stop $(docker ps -a -q --filter "name=ipad")
docker volume rm config_frontend_build
```

---

### **Problem 2: Build schlägt fehl**

```bash
# Logs anschauen:
docker-compose build frontend 2>&1 | tee build.log

# Häufige Ursachen:
# - Netzwerkprobleme (npm Registry nicht erreichbar)
# - Syntax-Fehler in package.json
# - Zu wenig RAM (min. 2GB empfohlen)
```

---

### **Problem 3: Container startet nicht**

```bash
# Logs prüfen:
docker logs ipad_frontend_build
docker logs ipad_nginx

# Häufige Ursachen:
# - Build-Artefakte nicht kopiert
# - Volume-Permissions
```

---

### **Problem 4: Änderungen nicht sichtbar**

```bash
# 1. Prüfen ob App.js aktuell ist:
docker exec ipad_nginx ls -lh /usr/share/nginx/html

# 2. Nginx neu starten:
docker restart ipad_nginx

# 3. Browser-Cache KOMPLETT leeren (siehe oben)
```

---

## 📦 Schnell-Befehl (alles auf einmal)

Für erfahrene Benutzer - alle Schritte in einem:

```bash
cd /pfad/zu/RBBK_Ipad_Verwaltung-main/config && \
docker-compose down && \
docker rm -f ipad_frontend_build 2>/dev/null && \
docker volume rm config_frontend_build 2>/dev/null && \
docker rmi config_frontend 2>/dev/null && \
docker-compose build --no-cache frontend && \
docker-compose up -d && \
echo "✅ Rebuild abgeschlossen!" && \
docker ps | grep ipad
```

**Dauer:** ~5-15 Minuten

---

## 📊 Vergleich: Deploy vs. Rebuild

| Aktion | deploy-frontend.sh | Kompletter Rebuild |
|--------|--------------------|--------------------|
| Dauer | 2-3 Min | 5-15 Min |
| Wann nutzen? | Kleine Änderungen | Fehler, große Änderungen |
| Löscht Container? | Nein | Ja |
| Löscht Volume? | Nein | Ja |
| Löscht Image? | Nein | Ja |
| Build-Cache? | Ja | Nein (--no-cache) |

**Empfehlung:**
- **Normalfall:** Nutzen Sie `deploy-frontend.sh`
- **Probleme:** Nutzen Sie **Kompletten Rebuild** (diese Anleitung)

---

## 🔄 Nach dem Rebuild

### **Was Sie testen sollten:**

1. ✅ Login funktioniert
2. ✅ Alle Tabs laden (Schüler, iPads, Zuordnungen)
3. ✅ **Neue Features sind sichtbar:**
   - Toast-Meldungen unten rechts
   - Passwort-Bestätigung im Edit-Dialog
   - "Vollständig löschen"-Button (4. Button in Benutzer-Tab)
   - Kopierbarer Reset-Dialog
4. ✅ Exports funktionieren (Zuordnungen, Bestandsliste)

---

## 📝 Logs zur Fehleranalyse

Falls etwas nicht funktioniert, sammeln Sie diese Logs:

```bash
# Container-Status
docker ps -a | grep ipad > status.txt

# Build-Logs
docker logs ipad_frontend_build > frontend_build.log 2>&1

# Nginx-Logs
docker logs ipad_nginx > nginx.log 2>&1

# Backend-Logs
docker logs ipad_backend > backend.log 2>&1

# Volume-Inhalt prüfen
docker run --rm -v config_frontend_build:/data alpine ls -lh /data/build
```

---

## 💡 Tipps & Best Practices

### **1. Vor dem Rebuild:**
- ✅ Backup der aktuellen Container-Konfiguration
- ✅ Notieren Sie die aktuellen Container-IDs
- ✅ Prüfen Sie freien Speicherplatz: `df -h`

### **2. Während des Rebuilds:**
- ⏰ Planen Sie 15-20 Minuten ein
- 📊 Überwachen Sie die Build-Logs
- 🔍 Achten Sie auf Fehler (rot markiert)

### **3. Nach dem Rebuild:**
- ✅ Testen Sie alle Hauptfunktionen
- ✅ Browser-Cache vollständig leeren
- ✅ Inkognito-Modus zum Testen nutzen

---

## 📞 Weitere Hilfe

Falls Probleme auftreten:

1. Prüfen Sie diese README nochmals
2. Sammeln Sie alle Logs (siehe oben)
3. Prüfen Sie Docker-Version: `docker --version`
4. Prüfen Sie Docker Compose Version: `docker-compose --version`
5. Prüfen Sie freien RAM: `free -h`

---

## 📚 Verwandte Dokumentationen

- `/docs/DEPLOYMENT.md` - Allgemeine Deployment-Info
- `/docs/INSTALLATION.md` - Erstinstallation
- `/frontend/deploy-frontend.sh` - Normales Deployment-Skript
- `/frontend/deploy-frontend-fast.sh` - Schnelles Deployment

---

**Letzte Aktualisierung:** 2024-11-02  
**Getestet mit:** Docker 24.x, Docker Compose 1.29.2  
**Plattform:** Ubuntu 24.04 LTS
