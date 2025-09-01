#!/bin/bash

# iPad-Verwaltungssystem Docker Startup Script
# Für Ubuntu 24.04.3 LTS

echo "🚀 Starte iPad-Verwaltungssystem..."

# Überprüfe ob Docker installiert ist
if ! command -v docker &> /dev/null; then
    echo "❌ Docker ist nicht installiert!"
    echo "Installiere Docker mit: sudo apt update && sudo apt install docker.io docker-compose"
    exit 1
fi

# Überprüfe ob Docker Compose installiert ist
if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose ist nicht installiert!"
    echo "Installiere Docker Compose mit: sudo apt install docker-compose"
    exit 1
fi

# Überprüfe Docker-Berechtigungen
if ! docker ps &> /dev/null; then
    echo "❌ Keine Docker-Berechtigung!"
    echo "Führe aus: sudo usermod -aG docker $USER"
    echo "Danach neu anmelden oder 'newgrp docker' ausführen"
    exit 1
fi

# Stoppe vorhandene Container
echo "🛑 Stoppe vorhandene Container..."
docker-compose down

# Entferne alte Images (optional)
read -p "🗑️  Alte Images entfernen? (y/N): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "🗑️  Entferne alte Images..."
    docker-compose down --rmi all --volumes --remove-orphans
fi

# Baue und starte Container
echo "🔨 Baue Container..."
docker-compose build

echo "🚀 Starte Container..."
docker-compose up -d

# Warte auf Services
echo "⏳ Warte auf Services..."
sleep 10

# Überprüfe Service-Status
echo "🔍 Überprüfe Service-Status..."
docker-compose ps

# Teste Backend-Verfügbarkeit
echo "🧪 Teste Backend..."
for i in {1..30}; do
    if curl -s http://localhost/api/auth/setup > /dev/null; then
        echo "✅ Backend ist bereit!"
        break
    fi
    echo "⏳ Warte auf Backend... ($i/30)"
    sleep 2
done

# Teste Backend-Bibliotheken
echo "📚 Teste Backend-Bibliotheken..."
BACKEND_CONTAINER=$(docker-compose ps -q backend)
if [ ! -z "$BACKEND_CONTAINER" ]; then
    if docker exec $BACKEND_CONTAINER python test-docker-libs.py > /dev/null 2>&1; then
        echo "✅ Alle PDF/Excel-Bibliotheken funktionieren!"
    else
        echo "⚠️  Bibliotheken-Test fehlgeschlagen - Detaillierte Logs:"
        docker exec $BACKEND_CONTAINER python test-docker-libs.py
    fi
else
    echo "⚠️  Backend-Container nicht gefunden"
fi

# Teste Frontend-Verfügbarkeit
echo "🧪 Teste Frontend..."
if curl -s http://localhost > /dev/null; then
    echo "✅ Frontend ist bereit!"
else
    echo "⚠️  Frontend möglicherweise noch nicht bereit"
fi

echo ""
echo "🎉 iPad-Verwaltungssystem gestartet!"
echo ""
echo "📱 Anwendung verfügbar unter: http://localhost"
echo "🔧 Backend-API verfügbar unter: http://localhost/api"
echo "📊 MongoDB verfügbar unter: localhost:27017"
echo ""
echo "👤 Standard-Login: admin / admin123"
echo ""
echo "📝 Nützliche Kommandos:"
echo "   docker-compose logs -f          # Logs anzeigen"
echo "   docker-compose stop             # Container stoppen"
echo "   docker-compose restart          # Container neustarten"
echo "   docker-compose down             # Container stoppen und entfernen"
echo ""

# Öffne Browser (optional)
read -p "🌐 Browser öffnen? (y/N): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    if command -v xdg-open &> /dev/null; then
        xdg-open http://localhost
    elif command -v firefox &> /dev/null; then
        firefox http://localhost &
    else
        echo "Browser konnte nicht automatisch geöffnet werden"
        echo "Öffne manuell: http://localhost"
    fi
fi