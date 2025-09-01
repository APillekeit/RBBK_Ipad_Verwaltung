#!/bin/bash

# Node.js Version Fix - Neustart nach Node.js 20 Upgrade

echo "🔧 Node.js Version Fix - Frontend Build Reparatur"
echo "================================================"

echo "📋 Problem behoben: Node.js 18 → Node.js 20"
echo "   React Router DOM 7.8.2 benötigt Node.js 20+"
echo ""

# Alte Container und Images entfernen
echo "🗑️  Entferne alte Container und Frontend-Images..."
sudo docker-compose down --volumes --remove-orphans
sudo docker image rm $(sudo docker images | grep "frontend" | awk '{print $3}') 2>/dev/null || true

echo "🔨 Baue Frontend mit Node.js 20 neu..."
sudo docker-compose build --no-cache frontend

echo "🚀 Starte alle Services..."
sudo docker-compose up -d

echo ""
echo "⏳ Warte auf Services..."
sleep 15

echo "🔍 Überprüfe Container-Status..."
sudo docker-compose ps

echo ""
echo "✅ Node.js Version Fix abgeschlossen!"
echo ""
echo "🌐 System sollte jetzt verfügbar sein unter:"
echo "   📍 http://localhost"  
echo "   📍 http://$(hostname -I | awk '{print $1}')"
echo ""
echo "🧪 Test-URL: http://localhost/health"