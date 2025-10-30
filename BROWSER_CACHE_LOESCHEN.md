# Browser-Cache löschen und neu anmelden

## 🔴 Problem

Nach dem Update sehen Sie:
- ❌ Fehler beim Laden auf allen Seiten
- ❌ "Benutzer"-Tab fehlt
- ❌ Alte Login-Daten funktionieren nicht mehr

**Ursache:** Ihr Browser hat noch den alten Login-Token gespeichert, der keine Rolle enthält.

## ✅ Lösung: Browser-Cache löschen

### Methode 1: Schnell (Incognito/Privat-Fenster)

**Chrome/Edge:**
1. Drücken Sie `Strg + Shift + N` (Windows) oder `Cmd + Shift + N` (Mac)
2. Gehen Sie zu `http://localhost:3000`
3. Melden Sie sich an:
   - Benutzername: `admin`
   - Passwort: `geheim`
4. ✅ Der "Benutzer"-Tab sollte jetzt sichtbar sein!

**Firefox:**
1. Drücken Sie `Strg + Shift + P` (Windows) oder `Cmd + Shift + P` (Mac)
2. Gehen Sie zu `http://localhost:3000`
3. Melden Sie sich an:
   - Benutzername: `admin`
   - Passwort: `geheim`
4. ✅ Der "Benutzer"-Tab sollte jetzt sichtbar sein!

**Safari:**
1. Datei → Neues privates Fenster
2. Gehen Sie zu `http://localhost:3000`
3. Melden Sie sich an:
   - Benutzername: `admin`
   - Passwort: `geheim`
4. ✅ Der "Benutzer"-Tab sollte jetzt sichtbar sein!

### Methode 2: Cache löschen (Dauerhaft)

#### Chrome/Edge

1. Drücken Sie `Strg + Shift + Entf` (Windows) oder `Cmd + Shift + Delete` (Mac)
2. Wählen Sie **Zeitraum:** "Gesamte Zeit"
3. Aktivieren Sie:
   - ✅ Cookies und andere Websitedaten
   - ✅ Bilder und Dateien im Cache
4. Klicken Sie "Daten löschen"
5. Schließen Sie **ALLE** Chrome/Edge Fenster
6. Öffnen Sie Chrome/Edge neu
7. Gehen Sie zu `http://localhost:3000`
8. Melden Sie sich mit `admin` / `geheim` an

#### Firefox

1. Drücken Sie `Strg + Shift + Entf` (Windows) oder `Cmd + Shift + Delete` (Mac)
2. Wählen Sie **Zeitraum:** "Alles"
3. Aktivieren Sie:
   - ✅ Cookies
   - ✅ Cache
   - ✅ Aktive Logins
4. Klicken Sie "Jetzt löschen"
5. Schließen Sie **ALLE** Firefox Fenster
6. Öffnen Sie Firefox neu
7. Gehen Sie zu `http://localhost:3000`
8. Melden Sie sich mit `admin` / `geheim` an

#### Safari

1. Safari → Einstellungen → Datenschutz
2. Klicken Sie "Website-Daten verwalten"
3. Suchen Sie nach "localhost"
4. Klicken Sie "Entfernen" → "Fertig"
5. Schließen Sie **ALLE** Safari Fenster
6. Öffnen Sie Safari neu
7. Gehen Sie zu `http://localhost:3000`
8. Melden Sie sich mit `admin` / `geheim` an

### Methode 3: Developer Tools (Für Entwickler)

#### Chrome/Edge

1. Drücken Sie `F12` (Developer Tools öffnen)
2. Gehen Sie zum **Application** Tab
3. Im linken Menü:
   - Erweitern Sie **Local Storage**
   - Klicken Sie auf `http://localhost:3000`
   - Klicken Sie mit rechts → "Clear"
4. Erweitern Sie **Session Storage**
   - Klicken Sie auf `http://localhost:3000`
   - Klicken Sie mit rechts → "Clear"
5. Drücken Sie `Strg + Shift + R` (Hard Reload)
6. Schließen Sie Developer Tools
7. Gehen Sie zu `http://localhost:3000`
8. Melden Sie sich mit `admin` / `geheim` an

#### Firefox

1. Drücken Sie `F12` (Developer Tools öffnen)
2. Gehen Sie zum **Storage** Tab
3. Im linken Menü:
   - Erweitern Sie **Local Storage**
   - Rechtsklick auf `http://localhost:3000` → "Alle löschen"
   - Erweitern Sie **Session Storage**
   - Rechtsklick auf `http://localhost:3000` → "Alle löschen"
4. Drücken Sie `Strg + Shift + R` (Hard Reload)
5. Schließen Sie Developer Tools
6. Gehen Sie zu `http://localhost:3000`
7. Melden Sie sich mit `admin` / `geheim` an

## ✅ Nach dem Cache löschen

### Was Sie sehen sollten:

1. **Login-Seite** erscheint (nicht automatisch eingeloggt)
2. Nach Login mit `admin` / `geheim`:
   - ✅ Oben rechts: "admin" mit **ADMIN** Badge (orange)
   - ✅ 6 Tabs: Schüler, iPads, Zuordnungen, Verträge, Einstellungen, **Benutzer**
   - ✅ Keine Fehler beim Laden der Seiten

### Benutzer-Tab (Admin-only)

Wenn Sie als Admin angemeldet sind, sollten Sie:
1. Den **"Benutzer"** Tab sehen (mit orange Hintergrund)
2. Dort alle 5 Benutzer sehen können
3. Neue Benutzer erstellen können
4. Bestehende Benutzer bearbeiten können

## ❓ Immer noch Probleme?

### Problem: "Benutzer"-Tab fehlt immer noch

**Prüfen Sie:**
```bash
# 1. Backend läuft?
sudo supervisorctl status backend
# Sollte: RUNNING

# 2. Login gibt Rolle zurück?
curl -X POST http://localhost:8001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"geheim"}' | python3 -m json.tool
# Sollte zeigen: "role": "admin"
```

**Wenn "role": "admin" fehlt:**
```bash
# Admin-User neu konfigurieren
./update-admin.sh
```

### Problem: Fehler beim Laden von Daten

**Prüfen Sie die Browser-Konsole:**
1. Drücken Sie `F12`
2. Gehen Sie zum **Console** Tab
3. Suchen Sie nach Fehlern (rot)

**Häufige Fehler:**
- `401 Unauthorized` → Token abgelaufen, neu anmelden
- `403 Forbidden` → Keine Berechtigung, prüfen Sie die Rolle
- `Network Error` → Backend läuft nicht

**Backend neu starten:**
```bash
sudo supervisorctl restart backend
# Warten
sleep 3
# Status prüfen
sudo supervisorctl status backend
```

### Problem: Alte Login-Daten funktionieren nicht

**Neue Login-Daten:**
- ❌ Alt: `admin` / `admin123`
- ✅ Neu: `admin` / `geheim`

**Falls Sie das alte Passwort möchten:**
```bash
# Passwort auf admin123 zurücksetzen
python3 << 'EOF'
import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from passlib.context import CryptContext

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

async def reset():
    client = AsyncIOMotorClient("mongodb://localhost:27017/")
    db = client["iPadDatabase"]
    await db.users.update_one(
        {"username": "admin"},
        {"$set": {"password_hash": pwd_context.hash("admin123")}}
    )
    print("✓ Passwort auf 'admin123' zurückgesetzt")
    client.close()

asyncio.run(reset())
EOF
```

## 🎯 Checkliste

Nach erfolgreichem Cache-Löschen:

- [ ] Browser-Cache gelöscht
- [ ] Mit `admin` / `geheim` angemeldet
- [ ] "ADMIN" Badge sichtbar (orange)
- [ ] 6 Tabs sichtbar (inkl. "Benutzer")
- [ ] Keine Lade-Fehler auf den Seiten
- [ ] Schüler-Seite lädt Daten
- [ ] iPads-Seite lädt Daten
- [ ] Einstellungen-Seite lädt Daten
- [ ] Benutzer-Seite zeigt 5 Benutzer

**Wenn alle Punkte ✓ sind: Alles funktioniert!** 🎉
