#!/bin/bash

# Basis-Pfad anpassen
BASE_PATH="/RBBK_Ipad_Verwaltung-main"

echo "═══════════════════════════════════════"
echo "  Frontend Deployment"
echo "═══════════════════════════════════════"
echo ""

# Prüfen ob Pfad existiert
if [ ! -d "$BASE_PATH" ]; then
    echo "❌ Fehler: $BASE_PATH existiert nicht!"
    echo "   Bitte passen Sie BASE_PATH im Skript an."
    exit 1
fi

# Backup erstellen
echo "📦 Erstelle Backup..."
BACKUP_DIR="$BASE_PATH/frontend/src.backup.$(date +%Y%m%d_%H%M%S)"
if [ -d "$BASE_PATH/frontend/src" ]; then
    cp -r "$BASE_PATH/frontend/src" "$BACKUP_DIR"
    echo "✅ Backup erstellt: $BACKUP_DIR"
else
    echo "⚠️ Kein src-Verzeichnis gefunden, überspringe Backup"
fi
echo ""

# Wechsle ins config-Verzeichnis
cd "$BASE_PATH/config" || exit 1

# Frontend neu bauen
echo "🔨 Baue Frontend-Container neu..."
echo "   (Das kann 5-10 Minuten beim ersten Mal dauern...)"
docker-compose build --no-cache frontend

if [ $? -ne 0 ]; then
    echo "❌ Frontend-Build fehlgeschlagen!"
    exit 1
fi

echo "✅ Frontend-Build erfolgreich"
echo ""

# Frontend-Container starten um Build-Artefakte zu kopieren
echo "📦 Kopiere Build-Artefakte ins Volume..."
docker-compose up -d frontend

# Warten bis Container fertig ist (er stoppt automatisch)
sleep 5

echo "✅ Build-Artefakte kopiert"
echo ""

# Nginx neu starten um neue Dateien zu laden
echo "🔄 Starte Nginx neu..."
docker restart ipad_nginx

if [ $? -eq 0 ]; then
    echo "✅ Nginx neu gestartet"
else
    echo "❌ Nginx-Neustart fehlgeschlagen!"
    exit 1
fi

echo ""
echo "════════════════════════════════════════════════════════"
echo "✅ DEPLOYMENT ERFOLGREICH ABGESCHLOSSEN!"
echo "════════════════════════════════════════════════════════"
echo ""
echo "🌐 Bitte öffnen Sie jetzt Ihren Browser:"
echo "   1. Drücken Sie: Strg + Shift + Entf"
echo "   2. Wählen Sie: 'Gecachte Bilder und Dateien'"
echo "   3. Klicken Sie: 'Daten löschen'"
echo "   4. Laden Sie die Seite neu: Strg + F5"
echo ""
echo "🎯 Testen Sie folgende Features:"
echo "   ✓ Toast-Meldungen erscheinen unten rechts"
echo "   ✓ Passwort-Bestätigung im Edit-Dialog"
echo "   ✓ Kopierbarer Reset-Password-Dialog"
echo ""
echo "🔄 Bei Problemen Backup zurückspielen:"
echo "   cp -r $BACKUP_DIR $BASE_PATH/frontend/src"
echo "   $BASE_PATH/frontend/deploy-frontend.sh"
echo ""
echo "📋 Container-Status:"
docker ps --filter "name=ipad" --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
echo "════════════════════════════════════════════════════════"
