# Fehler: Build wurde beendet ("Killed")

## 🔴 Fehlermeldung

```
Killed
The command '/bin/sh -c apt-get update && ...' returned a non-zero exit code: 137
ERROR: Service 'backend' failed to build : Build failed
```

## ❓ Was bedeutet dieser Fehler?

**Exit Code 137 = Out of Memory (OOM)**

Der Docker-Build-Prozess wurde vom System beendet, weil:
- ❌ Nicht genug RAM verfügbar war
- ❌ Der Build-Prozess zu viel Speicher gebraucht hat
- ❌ Das `--no-cache` Flag viel RAM benötigt

**Die debconf-Fehler vorher sind harmlos** (nur Warnungen).

## ✅ Lösung 1: Leichtes Installations-Script (Empfohlen)

Verwenden Sie das RAM-optimierte Script:

```bash
./install-light.sh
```

**Was es anders macht:**
- ✅ Baut Container **einzeln** (nicht alle auf einmal)
- ✅ Verwendet **Build-Cache** (spart RAM)
- ✅ Räumt zwischen Builds auf
- ✅ Optimiert für Systeme mit wenig RAM

## ✅ Lösung 2: Normales Script (jetzt RAM-freundlicher)

Das normale Script wurde aktualisiert:

```bash
./install.sh
```

**Was geändert wurde:**
- ✅ Entfernt `--no-cache` Flag (spart RAM)
- ✅ Verwendet Build-Cache

## ✅ Lösung 3: Docker-Aufräumen vor Installation

Manchmal hilft es, Docker aufzuräumen:

```bash
# 1. Cleanup
./quick-cleanup.sh

# 2. Docker-System aufräumen
docker system prune -a -f

# 3. Neu installieren
./install.sh
```

## ✅ Lösung 4: Manuell RAM freigeben

### Container stoppen

```bash
# Alle laufenden Container stoppen
docker stop $(docker ps -q)

# Container entfernen
docker rm $(docker ps -a -q)
```

### Images aufräumen

```bash
# Ungenutzte Images löschen
docker image prune -a -f

# Ungenutzte Volumes löschen
docker volume prune -f

# Build-Cache löschen
docker builder prune -a -f
```

### System-Cache löschen

```bash
# Komplettes Docker-Cleanup (⚠️ löscht ALLES)
docker system prune -a --volumes -f
```

## ✅ Lösung 5: Docker RAM-Limit erhöhen

### Docker Desktop (Windows/Mac)

1. Docker Desktop öffnen
2. Einstellungen → Resources → Advanced
3. Memory erhöhen (mindestens 4 GB, besser 6-8 GB)
4. "Apply & Restart"
5. Installation erneut versuchen

### Linux (Docker-Daemon)

```bash
# Docker-Daemon Konfiguration
sudo nano /etc/docker/daemon.json

# Hinzufügen:
{
  "default-ulimits": {
    "nofile": {
      "Name": "nofile",
      "Hard": 64000,
      "Soft": 64000
    }
  }
}

# Docker neu starten
sudo systemctl restart docker
```

## ✅ Lösung 6: Container einzeln bauen

Wenn alles andere fehlschlägt:

```bash
cd config

# 1. MongoDB
docker compose build mongodb
docker compose up -d mongodb
sleep 5

# 2. Backend  
docker compose build backend
docker compose up -d backend
sleep 10

# 3. Frontend
docker compose build frontend
docker compose up -d frontend nginx

# 4. Status prüfen
docker compose ps
```

## 🔍 System-Diagnose

### RAM prüfen

```bash
# Verfügbarer Speicher
free -h

# Erwartetes Minimum:
# - Verfügbar: mindestens 2 GB
# - Gesamt: mindestens 4 GB
```

**Beispiel-Ausgabe:**
```
              total        used        free      shared  buff/cache   available
Mem:           15Gi        7.3Gi       1.9Gi        44Mi       6.6Gi       8.3Gi
```

### Docker-Speicher prüfen

```bash
# Docker-Speichernutzung
docker system df

# Container
docker ps -a --format "{{.Names}}: {{.Size}}"

# Images
docker images --format "{{.Repository}}: {{.Size}}"
```

### Laufende Prozesse

```bash
# Prozesse die RAM verbrauchen
top -o %MEM | head -20

# Oder
ps aux --sort=-%mem | head -10
```

## 💡 Prävention

### Vor der Installation

```bash
# 1. System aufräumen
docker system prune -a --volumes -f

# 2. RAM-Status prüfen
free -h

# 3. Wenn wenig RAM (<4 GB verfügbar)
./install-light.sh  # Statt ./install.sh
```

### Während der Installation

- ⚠️ Schließen Sie andere Programme
- ⚠️ Keine Browser mit vielen Tabs offen
- ⚠️ Keine IDEs oder andere Docker-Container laufen lassen

## ❓ Häufige Fragen

**Q: Warum hat es vorher funktioniert?**
A: Möglicherweise:
- Mehr RAM war verfügbar
- Weniger andere Prozesse liefen
- Build-Cache war vorhanden

**Q: Wie viel RAM brauche ich?**
A: Empfohlen:
- **Minimum:** 4 GB Gesamt-RAM, 2 GB verfügbar
- **Empfohlen:** 8 GB Gesamt-RAM, 4 GB verfügbar
- **Optimal:** 16 GB Gesamt-RAM, 8 GB verfügbar

**Q: Kann ich während des Builds weitermachen?**
A: 
- ❌ Build läuft: Warten (kann 5-15 Minuten dauern)
- ❌ Nicht abbrechen (Strg+C) - sonst Cleanup nötig
- ✅ Terminal offen lassen

**Q: Was ist der Unterschied zwischen install.sh und install-light.sh?**

| Feature | install.sh | install-light.sh |
|---------|------------|------------------|
| Geschwindigkeit | Normal | Langsamer |
| RAM-Bedarf | Normal | Niedrig |
| Parallel-Build | Ja | Nein (einzeln) |
| Cache-Nutzung | Ja | Ja |
| Cleanup zwischen Builds | Nein | Ja |

**Q: Der Build dauert ewig, ist das normal?**
A: Ja, beim ersten Mal:
- MongoDB: ~2 Minuten
- Backend: ~5-10 Minuten
- Frontend: ~5-15 Minuten
- **Gesamt: 15-30 Minuten** beim ersten Build

**Q: Was mache ich bei "Cannot connect to Docker daemon"?**
```bash
# Docker starten
sudo systemctl start docker

# Status prüfen
sudo systemctl status docker

# Als User zur docker-Gruppe hinzufügen
sudo usermod -aG docker $USER
# Neu anmelden erforderlich!
```

## 🎯 Schnelle Lösung - Checkliste

1. [ ] System-RAM prüfen: `free -h`
2. [ ] Docker aufräumen: `docker system prune -a -f`
3. [ ] Andere Programme schließen
4. [ ] RAM-optimiertes Script verwenden: `./install-light.sh`
5. [ ] Warten (15-30 Minuten)
6. [ ] Bei Erfolg: Browser-Cache löschen
7. [ ] Mit `admin` / `geheim` anmelden

## 📚 Siehe auch

- `INSTALLATION.md` - Normale Installation
- `quick-cleanup.sh` - Aufräumen
- `FEHLER_CONTAINER_KONFLIKT.md` - Container-Fehler

**Bei wenig RAM: Immer `install-light.sh` verwenden!** 🚀
