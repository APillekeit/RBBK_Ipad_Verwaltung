#!/bin/bash

# Automatische Pfad-Erkennung
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BASE_PATH="$(dirname "$SCRIPT_DIR")"

echo "═══════════════════════════════════════"
echo "  Frontend Deployment (Robuste Version)"
echo "═══════════════════════════════════════"
echo ""
echo "📍 Erkannter Basis-Pfad: $BASE_PATH"
echo ""

# Prüfen ob wichtige Verzeichnisse existieren
if [ ! -d "$BASE_PATH/config" ]; then
    echo "❌ Fehler: $BASE_PATH/config existiert nicht!"
    exit 1
fi

# Backup erstellen
echo "📦 Erstelle Backup..."
BACKUP_DIR="$BASE_PATH/frontend/src.backup.$(date +%Y%m%d_%H%M%S)"
if [ -d "$BASE_PATH/frontend/src" ]; then
    cp -r "$BASE_PATH/frontend/src" "$BACKUP_DIR"
    echo "✅ Backup erstellt: $BACKUP_DIR"
fi
echo ""

# Prüfen ob App.js die neuen Änderungen hat
echo "🔍 Prüfe ob App.js aktualisiert wurde..."
if grep -q "bottom-right" "$BASE_PATH/frontend/src/App.js"; then
    echo "✅ App.js enthält neue Änderungen (bottom-right gefunden)"
else
    echo "⚠️  WARNUNG: 'bottom-right' nicht in App.js gefunden!"
    echo "   Bitte prüfen Sie ob App.js richtig kopiert wurde."
    read -p "Trotzdem fortfahren? (j/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Jj]$ ]]; then
        exit 1
    fi
fi
echo ""

cd "$BASE_PATH/config" || exit 1

# Alte Container stoppen und löschen
echo "🛑 Stoppe Container..."
docker-compose down
echo ""

# Frontend-Build-Volume löschen (enthält alte Build-Dateien!)
echo "🗑️  Lösche altes Frontend-Volume..."
VOLUME_NAME="config_frontend_build"
if docker volume ls | grep -q "$VOLUME_NAME"; then
    docker volume rm "$VOLUME_NAME" 2>/dev/null || {
        echo "⚠️  Volume wird noch verwendet, erzwinge Löschung..."
        docker-compose down -v
        docker volume rm "$VOLUME_NAME"
    }
    echo "✅ Volume gelöscht"
else
    echo "ℹ️  Volume existiert nicht (normal beim ersten Build)"
fi
echo ""

# Frontend komplett neu bauen
echo "🔨 Baue Frontend-Container NEU..."
echo "   (Das kann 5-10 Minuten dauern...)"
docker-compose build --no-cache frontend

if [ $? -ne 0 ]; then
    echo "❌ Frontend-Build fehlgeschlagen!"
    exit 1
fi
echo "✅ Frontend-Build erfolgreich"
echo ""

# Alle Container starten
echo "🚀 Starte alle Container..."
docker-compose up -d

if [ $? -ne 0 ]; then
    echo "❌ Container-Start fehlgeschlagen!"
    exit 1
fi
echo ""

# Warte bis Container laufen
echo "⏳ Warte 10 Sekunden bis Container hochgefahren sind..."
sleep 10

# Prüfe Container-Status
echo "📋 Container-Status:"
docker ps --filter "name=ipad" --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
echo ""

# Prüfe ob Nginx läuft
if docker ps | grep -q "ipad_nginx"; then
    echo "✅ Nginx läuft"
else
    echo "❌ Nginx läuft NICHT! Starte manuell..."
    docker start ipad_nginx
fi
echo ""

echo "════════════════════════════════════════════════════════"
echo "✅ DEPLOYMENT ABGESCHLOSSEN!"
echo "════════════════════════════════════════════════════════"
echo ""
echo "🔍 WICHTIGE PRÜFSCHRITTE:"
echo ""
echo "1️⃣  Container-Status prüfen:"
echo "   docker ps | grep ipad"
echo "   → Alle 3 Container sollten 'Up' sein"
echo ""
echo "2️⃣  Nginx-Logs prüfen:"
echo "   docker logs ipad_nginx --tail 20"
echo ""
echo "3️⃣  Browser-Cache KOMPLETT leeren:"
echo "   • Strg + Shift + Entf"
echo "   • 'Gesamter Zeitraum' auswählen"
echo "   • 'Cookies' UND 'Cache' aktivieren"
echo "   • Daten löschen"
echo ""
echo "4️⃣  Seite mit Strg + F5 neu laden"
echo ""
echo "5️⃣  Developer Console öffnen (F12):"
echo "   • Schauen Sie nach Fehlern (rot)"
echo "   • Tab 'Network' → Prüfen Sie ob neue Dateien geladen werden"
echo ""
echo "🎯 Zu testende Features:"
echo "   ✓ Toast-Meldungen unten rechts"
echo "   ✓ Passwort-Bestätigung im Edit-Dialog"
echo "   ✓ Kopierbarer Reset-Password-Dialog"
echo ""
echo "🔄 Bei Problemen:"
echo "   docker logs ipad_frontend_build"
echo "   docker logs ipad_nginx"
echo "════════════════════════════════════════════════════════"
