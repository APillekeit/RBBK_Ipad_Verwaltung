# 🚀 Deployment Anleitung

## 🌟 **NEU: Smart Deployment (Empfohlen!)**

Ein einziges Script für alles - erkennt automatisch, was geändert wurde!

```bash
cd /home/RBBK_Ipad_Verwaltung-main
sudo bash deploy-smart.sh
```

Dann wählen:
- **1** = Nur Frontend (2-3 Min)
- **2** = Nur Backend (1-2 Min)
- **3** = Beides (3-4 Min)
- **4** = Full Build mit package.json/requirements.txt (5-7 Min)

👉 **[Komplette Anleitung zu Smart Deployment](docs/SMART_DEPLOYMENT.md)**

---

## ✅ **Alternative: Einzelne Scripts**

### **Methode 1: Mit Script (Empfohlen)**

### **A) Normale Änderungen (App.js, CSS, etc.) - SCHNELL ⚡**
```bash
# Auf dem Produktions-Server:
cd /home/RBBK_Ipad_Verwaltung-main/frontend
sudo bash deploy-production.sh
```
**Dauer: 2-3 Minuten** (nutzt Docker Cache)

### **B) package.json geändert - VOLLSTÄNDIG 🔄**
```bash
# Nur wenn package.json geändert wurde:
cd /home/RBBK_Ipad_Verwaltung-main/frontend
sudo bash deploy-production-full.sh
```
**Dauer: 3-5 Minuten** (ohne Cache)

---

## ✅ **Methode 2: Ein-Zeilen-Befehl**

```bash
cd /home/RBBK_Ipad_Verwaltung-main/config && \
docker-compose down && \
docker rm -f ipad_frontend_build 2>/dev/null && \
docker volume rm config_frontend_build 2>/dev/null && \
docker-compose build --no-cache frontend && \
docker-compose up -d && \
sleep 10 && \
docker ps --filter "name=ipad"
```

---

## 📋 **Warum muss das Volume gelöscht werden?**

Das Frontend wird in einem **Docker Volume** gespeichert (`config_frontend_build`). Wenn du nur neu baust, bleiben die alten Dateien im Volume. **Deshalb muss das Volume gelöscht werden!**

### Was passiert:
1. `docker-compose down` - Stoppt alle Container
2. `docker rm -f ipad_frontend_build` - Löscht den Frontend-Build-Container
3. `docker volume rm config_frontend_build` - **🔥 WICHTIG: Löscht die alten Build-Dateien**
4. `docker-compose build --no-cache frontend` - Baut neu ohne Cache
5. `docker-compose up -d` - Startet alle Container
6. `docker ps` - Zeigt den Status

---

## ⚡ **Schneller machen (OHNE npm install neu laufen zu lassen)**

Das Problem: `npm install` dauert lange (~5-10 Minuten)

**Lösung:** Deine `node_modules` sind bereits im Docker Image! Du musst sie NICHT neu installieren.

Der obige Befehl mit `--no-cache` zwingt Docker, `npm install` erneut auszuführen. Das ist **nicht nötig**, wenn sich nur `App.js` geändert hat.

### ⚡ **Optimierte Version (nur React-Build, kein npm install):**

**Schritt 1: Ändere die Frontend Dockerfile temporär**

Öffne: `/home/RBBK_Ipad_Verwaltung-main/frontend/Dockerfile`

```dockerfile
# Füge NACH "COPY package*.json ./" diese Zeile ein:
RUN npm ci --only=production --ignore-scripts
```

**Schritt 2: Dann verwende:**

```bash
cd /home/RBBK_Ipad_Verwaltung-main/config && \
docker-compose down && \
docker rm -f ipad_frontend_build && \
docker volume rm config_frontend_build && \
docker-compose build frontend && \
docker-compose up -d
```

(Ohne `--no-cache` = Docker nutzt gecachte `node_modules`)

---

## 🌐 **Nach dem Deployment:**

### **Im Browser (WICHTIG!):**
1. **Strg + Shift + Entf** drücken
2. "Cache/Zwischengespeicherte Bilder und Dateien" auswählen
3. "Daten löschen" klicken
4. **Strg + F5** drücken (Hard Reload)

### **Oder:**
- **Chrome/Edge:** Rechtsklick → "Untersuchen" → Rechtsklick auf Neuladen-Button → "Cache leeren und harte Aktualisierung"

---

## 🔍 **Bei Problemen:**

### Container-Logs prüfen:
```bash
docker logs ipad_frontend_build
docker logs ipad_nginx
docker logs ipad_backend
```

### Container-Status prüfen:
```bash
docker ps --filter "name=ipad"
```

### Volume prüfen:
```bash
docker volume ls | grep frontend
```

---

## ⏱️ **Dauer:**
- **Komplett neu (mit npm install):** ~5-8 Minuten
- **Nur Build (ohne npm install):** ~2-3 Minuten
- **Browser-Cache leeren:** 30 Sekunden

---

## 🎯 **Zusammenfassung für dich:**

Du hast völlig Recht - das Volume **muss** gelöscht werden! Dein Befehl ist korrekt.

**Verwende ab jetzt:**
```bash
cd /home/RBBK_Ipad_Verwaltung-main/frontend
sudo bash deploy-production.sh
```

Oder die Ein-Zeilen-Version (die du bereits verwendest).
