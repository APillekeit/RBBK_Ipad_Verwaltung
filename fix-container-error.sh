#!/bin/bash

# Docker ContainerConfig Fehler - Komplette Bereinigung und Neustart

echo "🔧 Docker ContainerConfig Fehler - Komplette Bereinigung"
echo "======================================================="

echo "⏹️  Stoppe alle Container..."
sudo docker-compose down --remove-orphans

echo "🗑️  Entferne alle Container, Images und Volumes..."
# Entferne spezifische Container
sudo docker rm -f $(sudo docker ps -aq --filter "name=ipad") 2>/dev/null || true

# Entferne Frontend-Images (oft die Ursache)
sudo docker rmi -f $(sudo docker images | grep frontend | awk '{print $3}') 2>/dev/null || true

# Entferne alle build-cache
sudo docker builder prune -a -f

echo "🧹 Bereinige Docker-System..."
sudo docker system prune -a -f

echo "📦 Entferne und erstelle Volumes neu..."
sudo docker volume rm $(sudo docker volume ls -q --filter "name=rbbk_ipad_verwaltung-main") 2>/dev/null || true

echo "🔨 Baue alles von Grund auf neu..."
sudo docker-compose build --no-cache --pull

echo "🚀 Starte System neu..."
sudo docker-compose up -d

echo ""
echo "⏳ Warte auf Services..."
sleep 15

echo "🔍 Überprüfe Container-Status..."
sudo docker-compose ps

echo ""
echo "🧪 Teste System..."
if curl -s http://localhost/health > /dev/null; then
    echo "✅ System läuft erfolgreich!"
    echo "🌐 Verfügbar unter: http://$(hostname -I | awk '{print $1}')"
else
    echo "⚠️  System startet noch oder hat Probleme"
    echo "📋 Prüfe Logs: sudo docker-compose logs"
fi