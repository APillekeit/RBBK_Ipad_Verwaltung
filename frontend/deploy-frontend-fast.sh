#!/bin/bash

# SCHNELLES Frontend-Deployment (ohne npm install)
# Voraussetzung: node_modules bereits vorhanden

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BASE_PATH="$(dirname "$SCRIPT_DIR")"

echo "═══════════════════════════════════════"
echo "  Frontend Deployment (SCHNELL)"
echo "═══════════════════════════════════════"
echo ""
echo "📍 Erkannter Basis-Pfad: $BASE_PATH"
echo ""

# Prüfen ob node_modules existiert
if [ ! -d "$BASE_PATH/frontend/node_modules" ]; then
    echo "❌ Fehler: node_modules existiert nicht!"
    echo "   Führen Sie zuerst aus:"
    echo "   1. npm install ODER"
    echo "   2. Kopieren Sie node_modules von Entwicklungs-System"
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
echo "🔍 Prüfe Änderungen..."
if grep -q "bottom-right" "$BASE_PATH/frontend/src/App.js"; then
    echo "✅ Neueste Änderungen vorhanden"
else
    echo "⚠️  Bitte App.js aktualisieren!"
fi
echo ""

cd "$BASE_PATH/config" || exit 1

# Alte Container stoppen
echo "🛑 Stoppe Container..."
docker-compose down
echo ""

# Frontend NEU bauen (OHNE npm install - nutzt vorhandene node_modules!)
echo "🔨 Baue Frontend-Container..."
echo "   (Sollte ~1-2 Minuten dauern...)"
docker-compose build --no-cache frontend

if [ $? -ne 0 ]; then
    echo "❌ Frontend-Build fehlgeschlagen!"
    exit 1
fi
echo "✅ Frontend-Build erfolgreich"
echo ""

# Container starten
echo "🚀 Starte alle Container..."
docker-compose up -d

echo ""
echo "⏳ Warte 10 Sekunden..."
sleep 10

# Container Status
echo "📋 Container-Status:"
docker ps --filter "name=ipad" --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
echo ""

echo "════════════════════════════════════════════════════════"
echo "✅ DEPLOYMENT ABGESCHLOSSEN!"
echo "════════════════════════════════════════════════════════"
echo ""
echo "⚡ SCHNELLES DEPLOYMENT (ohne npm install)"
echo "   Dauer: ~2-3 Minuten"
echo ""
echo "🌐 Browser-Cache leeren:"
echo "   1. Strg + Shift + Entf"
echo "   2. Cache löschen"
echo "   3. Strg + F5"
echo ""
echo "🔍 Bei Problemen:"
echo "   docker logs ipad_frontend_build"
echo "   docker logs ipad_nginx"
echo "════════════════════════════════════════════════════════"
