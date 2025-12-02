#!/bin/bash

# PRODUKTIONS-DEPLOYMENT für Frontend
# Vollständiges Deployment mit Volume-Cleanup
# Verwendung: sudo bash deploy-production.sh

echo "════════════════════════════════════════════════════════"
echo "  🚀 Frontend Produktions-Deployment"
echo "════════════════════════════════════════════════════════"
echo ""

# Finde das richtige Verzeichnis
if [ -d "/home/RBBK_Ipad_Verwaltung-main/config" ]; then
    CONFIG_DIR="/home/RBBK_Ipad_Verwaltung-main/config"
elif [ -d "./config" ]; then
    CONFIG_DIR="./config"
else
    echo "❌ Fehler: config Verzeichnis nicht gefunden!"
    exit 1
fi

cd "$CONFIG_DIR" || exit 1
echo "📍 Arbeitsverzeichnis: $CONFIG_DIR"
echo ""

# Schritt 1: Container stoppen
echo "🛑 [1/6] Stoppe alle Container..."
docker-compose down
echo "✅ Container gestoppt"
echo ""

# Schritt 2: Alten Frontend-Container löschen
echo "🗑️  [2/6] Lösche alten Frontend-Build-Container..."
docker rm -f ipad_frontend_build 2>/dev/null && echo "✅ Container gelöscht" || echo "⚠️  Container existierte nicht"
echo ""

# Schritt 3: Volume löschen (WICHTIG für neue Änderungen!)
echo "🗑️  [3/6] Lösche Frontend-Build-Volume..."
docker volume rm config_frontend_build 2>/dev/null && echo "✅ Volume gelöscht" || echo "⚠️  Volume existierte nicht"
echo ""

# Schritt 4: Frontend neu bauen
echo "🔨 [4/6] Baue Frontend neu (ohne Cache)..."
echo "⏳ Dies dauert 2-4 Minuten..."
docker-compose build --no-cache frontend

if [ $? -ne 0 ]; then
    echo "❌ Frontend-Build fehlgeschlagen!"
    exit 1
fi
echo "✅ Frontend erfolgreich gebaut"
echo ""

# Schritt 5: Alle Container starten
echo "🚀 [5/6] Starte alle Container..."
docker-compose up -d
echo "✅ Container gestartet"
echo ""

# Schritt 6: Status prüfen
echo "⏳ [6/6] Warte 10 Sekunden auf Container-Start..."
sleep 10
echo ""

echo "📋 Container-Status:"
docker ps --filter "name=ipad" --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
echo ""

# Prüfe ob alle Container laufen
RUNNING=$(docker ps --filter "name=ipad" --filter "status=running" | wc -l)
if [ "$RUNNING" -lt 3 ]; then
    echo "⚠️  Warnung: Nicht alle Container laufen!"
    echo "   Prüfe die Logs mit:"
    echo "   docker logs ipad_frontend_build"
    echo "   docker logs ipad_backend"
    echo "   docker logs ipad_nginx"
else
    echo "✅ Alle Container laufen!"
fi

echo ""
echo "════════════════════════════════════════════════════════"
echo "✅ DEPLOYMENT ABGESCHLOSSEN!"
echo "════════════════════════════════════════════════════════"
echo ""
echo "🌐 WICHTIG - Jetzt im Browser:"
echo "   1. Drücke: Strg + Shift + Entf"
echo "   2. Wähle: Cache/Zwischengespeicherte Dateien"
echo "   3. Klicke: Daten löschen"
echo "   4. Drücke: Strg + F5 (Hard Reload)"
echo ""
echo "🔍 Bei Problemen Logs prüfen:"
echo "   docker logs ipad_nginx"
echo "   docker logs ipad_frontend_build"
echo ""
echo "⏱️  Gesamtdauer: ~3-5 Minuten"
echo "════════════════════════════════════════════════════════"
