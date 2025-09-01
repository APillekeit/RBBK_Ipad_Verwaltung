#!/bin/bash

# Frontend Build mit Netzwerk-Retry-Logik

echo "🔄 Frontend Build mit Netzwerk-Retry-Mechanismus"
echo "=============================================="

# Funktion für Retry-Build
build_frontend() {
    local attempt=$1
    local max_attempts=3
    
    echo "🔨 Build-Versuch $attempt/$max_attempts..."
    
    # Container und Images bereinigen
    sudo docker-compose down
    sudo docker image rm $(sudo docker images | grep frontend | awk '{print $3}') 2>/dev/null || true
    
    # Build mit erweiterten Timeouts
    if sudo docker-compose build --no-cache frontend; then
        echo "✅ Frontend Build erfolgreich (Versuch $attempt)"
        return 0
    else
        echo "❌ Frontend Build fehlgeschlagen (Versuch $attempt)"
        return 1
    fi
}

# DNS und Netzwerk prüfen
echo "🌐 Teste Netzwerk-Verbindung..."
if ping -c 1 registry.npmjs.org > /dev/null 2>&1; then
    echo "✅ NPM Registry erreichbar"
else
    echo "⚠️  NPM Registry-Verbindung problematisch"
    echo "💡 Versuche DNS-Flush..."
    sudo systemctl flush-dns 2>/dev/null || true
fi

# Mehrere Build-Versuche
for i in {1..3}; do
    if build_frontend $i; then
        echo ""
        echo "🎉 Frontend erfolgreich gebaut!"
        echo "🚀 Starte vollstiges System..."
        sudo docker-compose up -d
        
        echo ""
        echo "✅ System gestartet!"
        echo "🌐 Verfügbar unter: http://$(hostname -I | awk '{print $1}')"
        exit 0
    fi
    
    if [ $i -lt 3 ]; then
        echo "⏳ Warte 30 Sekunden vor nächstem Versuch..."
        sleep 30
    fi
done

echo ""
echo "❌ Frontend Build nach 3 Versuchen fehlgeschlagen"
echo "💡 Mögliche Lösungen:"
echo "   1. Internetverbindung prüfen"
echo "   2. DNS-Einstellungen überprüfen"
echo "   3. Firewall-Regeln kontrollieren"
echo "   4. Später erneut versuchen"