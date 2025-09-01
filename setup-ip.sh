#!/bin/bash

# iPad-Verwaltung - Universelles Setup Script
# Das System funktioniert jetzt automatisch mit jeder IP-Adresse!

echo "🌐 iPad-Verwaltung - Universelles Setup"
echo "======================================"

# Aktuelle IP-Adresse ermitteln und anzeigen
CURRENT_IP=$(hostname -I | awk '{print $1}')
echo "🔍 Ihre aktuelle IP-Adresse: $CURRENT_IP"

echo ""
echo "✅ KEINE KONFIGURATION ERFORDERLICH!"
echo ""
echo "Das System ist bereits für universelle IP-Unterstützung konfiguriert:"
echo "   🌐 Funktioniert mit JEDER IP-Adresse automatisch"
echo "   📱 Zugriff über: http://[BELIEBIGE-IP]"
echo "   🔧 Backend-API: http://[BELIEBIGE-IP]/api"
echo ""
echo "📋 Beispiele:"
echo "   📍 Lokaler Zugriff: http://localhost"
echo "   📍 Netzwerk-Zugriff: http://$CURRENT_IP"  
echo "   📍 Andere Computer: http://[DEREN-IP]"
echo ""
echo "🚀 Starten Sie das System jetzt mit: ./start-docker.sh"

# Firewall-Info
echo ""
echo "🔒 Firewall-Konfiguration (falls externe Zugriffe gewünscht):"
echo "   sudo ufw allow 80/tcp    # HTTP"
echo "   sudo ufw allow 443/tcp   # HTTPS"
echo "   sudo ufw allow 27017/tcp # MongoDB (optional)"