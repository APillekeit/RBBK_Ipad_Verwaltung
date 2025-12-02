#!/bin/bash

# SUPER SCHNELL: Nur geänderte Dateien kopieren
# Verwendung: ./quick-update.sh

echo "═══════════════════════════════════════"
echo "  Quick Update (Nur App.js)"
echo "═══════════════════════════════════════"

# Auf dem Produktions-Server:
# 1. Stoppe die Container
echo "🛑 Stoppe Container..."
cd /home/RBBK_Ipad_Verwaltung-main/config
docker-compose down

# 2. Kopiere die neue App.js (von deinem Entwicklungs-PC hierher)
echo "📋 Kopiere App.js..."
# Hier musst du die Datei vorher hochgeladen haben!

# 3. Neu bauen (nutzt existierende node_modules!)
echo "🔨 Baue Frontend neu..."
docker-compose build frontend

# 4. Starten
echo "🚀 Starte Container..."
docker-compose up -d

echo ""
echo "✅ FERTIG! Warte 10 Sekunden..."
sleep 10

echo "📋 Status:"
docker ps --filter "name=ipad"

echo ""
echo "🌐 WICHTIG: Browser-Cache leeren (Strg+Shift+Entf)"
