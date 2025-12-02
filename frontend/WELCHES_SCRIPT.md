# 🚀 Welches Deployment-Script soll ich verwenden?

## 📋 Übersicht

Es gibt **2 Deployment-Scripts** mit unterschiedlichen Verwendungszwecken:

---

## ⚡ **deploy-production.sh** (SCHNELL - Empfohlen für normale Änderungen)

### **Wann verwenden?**
- ✅ Nur `App.js` oder andere `.js/.jsx` Dateien geändert
- ✅ Nur `.css` Dateien geändert
- ✅ Nur HTML-Inhalte geändert
- ✅ **KEINE** `package.json` Änderungen

### **Vorteile:**
- ⚡ **Schnell:** 2-3 Minuten
- 💾 Nutzt Docker Layer Cache
- 💾 `yarn install` wird NICHT neu ausgeführt (gecached!)

### **Verwendung:**
```bash
cd /home/RBBK_Ipad_Verwaltung-main/frontend
sudo bash deploy-production.sh
```

### **Was passiert:**
```
1. Container stoppen
2. Alten Container löschen
3. Volume löschen
4. Frontend bauen (MIT Docker Cache) ← SCHNELL!
5. Container starten
6. Status prüfen
```

**Dauer: ~2-3 Minuten** ⚡

---

## 🔄 **deploy-production-full.sh** (VOLLSTÄNDIG - Für package.json Änderungen)

### **Wann verwenden?**
- ✅ `package.json` wurde geändert (neue Packages)
- ✅ `yarn.lock` wurde geändert
- ✅ Erste Deployment nach Projekt-Setup
- ✅ Nach langer Zeit (Cache auffrischen)

### **Vorteile:**
- 🔒 Garantiert sauberer Build
- 📦 Installiert alle Packages neu
- ✅ Behebt Cache-Probleme

### **Verwendung:**
```bash
cd /home/RBBK_Ipad_Verwaltung-main/frontend
sudo bash deploy-production-full.sh
```

### **Was passiert:**
```
1. Container stoppen
2. Alten Container löschen
3. Volume löschen
4. Frontend bauen (OHNE Cache) ← Dauert länger!
   → yarn install läuft komplett neu
5. Container starten
6. Status prüfen
```

**Dauer: ~3-5 Minuten** 🐢

---

## 🎯 Entscheidungshilfe

### **Hast du nur Code geändert?**
```bash
# Beispiel: App.js, Dashboard.js, styles.css
→ Verwende: deploy-production.sh (SCHNELL)
```

### **Hast du package.json geändert?**
```bash
# Beispiel: npm install react-router-dom
# package.json wurde aktualisiert
→ Verwende: deploy-production-full.sh (VOLLSTÄNDIG)
```

### **Unsicher?**
```bash
# Im Zweifel: Verwende das schnelle Script
→ deploy-production.sh
# Bei Problemen: Verwende das vollständige Script
→ deploy-production-full.sh
```

---

## 📊 Geschwindigkeits-Vergleich

| Script | Dauer | Cache | Wann? |
|--------|-------|-------|-------|
| **deploy-production.sh** | 2-3 Min ⚡ | JA ✅ | Normale Änderungen |
| **deploy-production-full.sh** | 3-5 Min 🐢 | NEIN ❌ | package.json Änderungen |

---

## 🔧 Manuelle Ein-Zeilen-Befehle

### **Schnell (MIT Cache):**
```bash
cd /home/RBBK_Ipad_Verwaltung-main/config && \
docker-compose down && \
docker rm -f ipad_frontend_build && \
docker volume rm config_frontend_build && \
docker-compose build frontend && \
docker-compose up -d
```

### **Vollständig (OHNE Cache):**
```bash
cd /home/RBBK_Ipad_Verwaltung-main/config && \
docker-compose down && \
docker rm -f ipad_frontend_build && \
docker volume rm config_frontend_build && \
docker-compose build --no-cache frontend && \
docker-compose up -d
```

---

## 💡 Pro-Tipps

### **1. Noch schneller: Nur Nginx neustarten**
Wenn du dir **100% sicher** bist, dass nur eine kleine Änderung gemacht wurde:

```bash
cd /home/RBBK_Ipad_Verwaltung-main/config
docker-compose build frontend
docker-compose restart nginx
```

**Dauer: ~30 Sekunden!** ⚡⚡⚡

**Achtung:** Volume wird NICHT gelöscht - Änderungen könnten nicht übernommen werden!

---

### **2. Docker BuildKit für Parallel-Builds**
Noch schneller mit BuildKit:

```bash
export DOCKER_BUILDKIT=1
docker-compose build frontend
```

---

### **3. Cache komplett löschen** (bei Problemen)
Wenn nichts mehr funktioniert:

```bash
docker builder prune -a -f
# Dann: deploy-production-full.sh verwenden
```

---

## ❓ Häufige Fragen

**Q: Warum dauert es beim ersten Mal länger?**  
A: Docker muss die `node_modules` erstmalig herunterladen. Danach wird gecached.

**Q: Warum sehe ich meine Änderungen nicht?**  
A: 
1. Browser-Cache leeren (Strg + Shift + Entf)
2. Hard Reload (Strg + F5)
3. Volume wurde nicht gelöscht → Script erneut ausführen

**Q: Welches Script ist standard?**  
A: **deploy-production.sh** (das schnelle Script)

**Q: Muss ich immer --no-cache verwenden?**  
A: **NEIN!** Nur bei package.json Änderungen (deploy-production-full.sh).

---

## ✅ Zusammenfassung

**90% der Fälle:**
```bash
sudo bash deploy-production.sh  # 2-3 Minuten ⚡
```

**Nur bei package.json Änderungen:**
```bash
sudo bash deploy-production-full.sh  # 3-5 Minuten
```

**Nach dem Deployment:**
1. Browser-Cache leeren (Strg + Shift + Entf)
2. Hard Reload (Strg + F5)
3. Fertig! 🎉
