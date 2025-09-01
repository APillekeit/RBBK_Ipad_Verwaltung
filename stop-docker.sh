#!/bin/bash

# iPad-Verwaltungssystem Docker Stop Script

echo "🛑 Stoppe iPad-Verwaltungssystem..."

# Stoppe alle Container
docker-compose down

echo "✅ Alle Container gestoppt!"

# Optional: Volumes beibehalten oder entfernen
read -p "🗑️  Daten löschen? (ACHTUNG: Alle Daten gehen verloren!) (y/N): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "🗑️  Entferne Volumes und Daten..."
    docker-compose down --volumes
    echo "🗑️  Alle Daten gelöscht!"
else
    echo "💾 Daten bleiben erhalten"
fi

echo "🏁 iPad-Verwaltungssystem beendet!"