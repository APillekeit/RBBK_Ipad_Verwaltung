# Fehler: Container-Namenskonflikt

## 🔴 Fehlermeldung

```
ERROR: for ipad_frontend_build  Cannot create container for service frontend: 
Conflict. The container name "/ipad_frontend_build" is already in use by container "..."
```

## ❓ Was bedeutet dieser Fehler?

Docker versucht, einen neuen Container mit einem Namen zu erstellen, der bereits von einem existierenden (möglicherweise gestoppten) Container verwendet wird.

**Häufige Ursachen:**
- Vorherige Installation wurde nicht vollständig entfernt
- Installation wurde abgebrochen
- Container wurden manuell gestoppt, aber nicht entfernt

## ✅ Lösung 1: Schnelles Cleanup-Script (Empfohlen)

Das Projekt enthält ein schnelles Cleanup-Script:

```bash
# Script ausführbar machen (falls noch nicht geschehen)
chmod +x quick-cleanup.sh

# Cleanup ausführen
./quick-cleanup.sh
```

**Das Script fragt:**
1. Volumes löschen? (j/n) - Wählen Sie **j** für komplette Neuinstallation
2. Images löschen? (j/n) - Wählen Sie **j** um Speicher zu sparen

**Nach dem Cleanup:**
```bash
./install.sh
```

## ✅ Lösung 2: Vollständiges Cleanup über Installations-Script

```bash
./install.sh --cleanup
```

Bei den Fragen:
- Backup erstellen? → **j** (wenn Sie Daten behalten möchten)
- Alles löschen? → **ja** eingeben

Dann neu installieren:
```bash
./install.sh
```

## ✅ Lösung 3: Manuelle Behebung

### Schritt 1: Alle Container anzeigen

```bash
docker ps -a | grep ipad
```

**Beispielausgabe:**
```
8d4d4e2113d4   config_frontend    "docker-entrypoint..."   ipad_frontend_build
a1b2c3d4e5f6   config_backend     "uvicorn server:ap..."   ipad_backend
7f8e9d0c1b2a   mongo:4.4          "docker-entrypoint..."   ipad_mongodb
```

### Schritt 2: Container entfernen

**Alle auf einmal:**
```bash
docker rm -f $(docker ps -a -q --filter "name=ipad")
docker rm -f $(docker ps -a -q --filter "name=mongodb")
docker rm -f $(docker ps -a -q --filter "name=config")
```

**Oder einzeln:**
```bash
docker rm -f ipad_frontend_build
docker rm -f ipad_backend
docker rm -f ipad_mongodb
docker rm -f ipad_nginx
```

### Schritt 3: Volumes entfernen (optional, DATENVERLUST!)

```bash
docker volume ls | grep ipad

# Alle entfernen
docker volume rm $(docker volume ls -q --filter "name=ipad")
docker volume rm $(docker volume ls -q --filter "name=mongodb")
docker volume rm $(docker volume ls -q --filter "name=config")
```

### Schritt 4: Images entfernen (optional)

```bash
docker images | grep ipad

# Entfernen
docker rmi -f $(docker images -q --filter "reference=*ipad*")
docker rmi -f $(docker images -q --filter "reference=config*")
```

### Schritt 5: Neu installieren

```bash
./install.sh
```

## ✅ Lösung 4: Docker Compose Cleanup

Wenn Sie Docker Compose V1 oder V2 verwenden:

```bash
cd config

# V2 (neuere Version)
docker compose down -v
docker compose rm -f

# V1 (ältere Version)
docker-compose down -v
docker-compose rm -f

cd ..
```

Dann neu installieren:
```bash
./install.sh
```

## 🔍 Überprüfung nach Cleanup

Stellen Sie sicher, dass alles entfernt wurde:

```bash
# Sollte leer sein oder nichts mit ipad zeigen
docker ps -a | grep ipad
docker ps -a | grep mongodb

# Sollte leer sein
docker volume ls | grep ipad
docker volume ls | grep mongodb

# Sollte leer sein
docker images | grep ipad
docker images | grep config
```

**Erwartetes Ergebnis:** Alle Befehle sollten keine Ergebnisse liefern.

## 🔄 Neuinstallation mit automatischer Konfliktauflösung

Das aktualisierte `install.sh` Script erkennt und entfernt automatisch konfliktauslösende Container vor dem Build:

```bash
./install.sh
```

**Was das Script automatisch macht:**
1. ✅ Prüft auf existierende Installation
2. ✅ Bietet Backup-Option
3. ✅ Entfernt automatisch konfliktauslösende Container
4. ✅ Führt saubere Neuinstallation durch

## 💡 Prävention

**Um diesen Fehler zu vermeiden:**

1. **Immer das Installations-Script verwenden:**
   ```bash
   ./install.sh
   ```
   Nicht manuell `docker-compose up` ausführen!

2. **Bei Problemen das Cleanup-Script verwenden:**
   ```bash
   ./quick-cleanup.sh
   ```

3. **Vor Neuinstallation immer aufräumen:**
   ```bash
   ./install.sh --cleanup
   ```

4. **Container richtig stoppen:**
   ```bash
   cd config
   docker compose down -v  # oder docker-compose down -v
   ```

## ❓ Häufige Fragen

**Q: Verliere ich meine Daten beim Cleanup?**
A: Ja, wenn Sie die Volumes entfernen. Erstellen Sie vorher ein Backup:
```bash
./install.sh --cleanup  # Wählen Sie "j" für Backup
```

**Q: Kann ich nur die Container entfernen ohne Daten zu löschen?**
A: Ja, entfernen Sie nur die Container:
```bash
docker rm -f $(docker ps -a -q --filter "name=ipad")
# Volumes NICHT entfernen
```

**Q: Der Fehler tritt nach jedem Neustart auf**
A: Sie starten wahrscheinlich die Container manuell. Verwenden Sie:
```bash
cd config
docker compose up -d  # oder docker-compose up -d
```

**Q: Ich habe mehrere Versionen installiert**
A: Entfernen Sie alle:
```bash
docker ps -a  # Alle Container anzeigen
docker rm -f $(docker ps -a -q)  # ALLE Container entfernen (Vorsicht!)
```

## 📞 Weitere Hilfe

Wenn das Problem weiterhin besteht:

1. Überprüfen Sie die Logs:
   ```bash
   docker logs ipad_frontend_build 2>&1
   ```

2. Prüfen Sie den Docker-Status:
   ```bash
   docker system df
   docker system prune -a --volumes  # Vorsicht: Löscht ALLES!
   ```

3. Konsultieren Sie die Dokumentation:
   - `INSTALLATION.md` - Installationsanleitung
   - `CLEANUP.md` - Vollständige Cleanup-Dokumentation
   - `README.md` - Projekt-Übersicht

## 🎯 Zusammenfassung

**Schnellste Lösung:**
```bash
# 1. Cleanup
./quick-cleanup.sh

# 2. Neu installieren
./install.sh
```

**Oder mit Backup:**
```bash
# 1. Cleanup mit Backup
./install.sh --cleanup
# Bei Fragen: j für Backup, ja für Löschen

# 2. Neu installieren
./install.sh
```

Der Fehler sollte danach nicht mehr auftreten! 🎉
