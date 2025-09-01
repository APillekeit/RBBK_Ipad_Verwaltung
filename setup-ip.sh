#!/bin/bash

# iPad-Verwaltung - IP-Setup Script
# Konfiguriert das System für externe IP-Zugriffe

echo "🌐 iPad-Verwaltung IP-Setup"
echo "=========================="

# Aktuelle IP-Adresse ermitteln
CURRENT_IP=$(hostname -I | awk '{print $1}')
echo "🔍 Erkannte IP-Adresse: $CURRENT_IP"

# Benutzer fragen ob diese IP verwendet werden soll
read -p "Diese IP-Adresse verwenden? (Y/n): " -n 1 -r
echo
if [[ $REPLY =~ ^[Nn]$ ]]; then
    read -p "Bitte gewünschte IP-Adresse eingeben: " CUSTOM_IP
    CURRENT_IP=$CUSTOM_IP
fi

echo "📝 Konfiguriere System für IP: $CURRENT_IP"

# Backup erstellen
cp docker-compose.yml docker-compose.yml.backup
cp .env.docker .env.docker.backup

# Docker-Compose anpassen
echo "🔧 Aktualisiere Docker-Compose..."
sed -i "s|REACT_APP_BACKEND_URL=http://192.168.99.72/api|REACT_APP_BACKEND_URL=http://${CURRENT_IP}/api|g" docker-compose.yml

# .env.docker anpassen
echo "🔧 Aktualisiere Umgebung..."
sed -i "s|REACT_APP_BACKEND_URL=http://localhost/api|REACT_APP_BACKEND_URL=http://${CURRENT_IP}/api|g" .env.docker

# Frontend .env aktualisieren falls vorhanden
if [ -f "frontend/.env" ]; then
    sed -i "s|REACT_APP_BACKEND_URL=.*|REACT_APP_BACKEND_URL=http://${CURRENT_IP}/api|g" frontend/.env
fi

echo "✅ Konfiguration abgeschlossen!"
echo ""
echo "📋 Zusammenfassung:"
echo "   🌐 System-IP: $CURRENT_IP"
echo "   📱 Anwendung: http://$CURRENT_IP"
echo "   🔧 Backend-API: http://$CURRENT_IP/api"
echo "   📊 MongoDB: $CURRENT_IP:27017"
echo ""
echo "🚀 Starten Sie das System jetzt mit: ./start-docker.sh"

# Optional: Firewall-Info
echo ""
echo "🔒 Firewall-Hinweise:"
echo "   sudo ufw allow 80/tcp    # HTTP"
echo "   sudo ufw allow 443/tcp   # HTTPS"
echo "   sudo ufw allow 27017/tcp # MongoDB (optional)"