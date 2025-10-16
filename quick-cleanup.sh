#!/bin/bash

###############################################################################
# Schnelles Cleanup-Script für Docker Container-Konflikte
###############################################################################

echo "🧹 Schnelles Cleanup wird ausgeführt..."
echo ""

# Stoppe alle ipad-bezogenen Container
echo "➜ Stoppe Container..."
docker stop $(docker ps -a -q --filter "name=ipad" --filter "name=mongodb" --filter "name=config") 2>/dev/null || true

# Entferne alle ipad-bezogenen Container
echo "➜ Entferne Container..."
docker rm -f $(docker ps -a -q --filter "name=ipad" --filter "name=mongodb" --filter "name=config") 2>/dev/null || true

# Optional: Entferne Volumes (DATENVERLUST!)
read -p "Möchten Sie auch die Volumes (Daten) löschen? (j/n): " delete_volumes
if [ "$delete_volumes" = "j" ] || [ "$delete_volumes" = "J" ]; then
    echo "➜ Entferne Volumes..."
    docker volume rm $(docker volume ls -q --filter "name=ipad" --filter "name=mongodb" --filter "name=config") 2>/dev/null || true
fi

# Optional: Entferne Images
read -p "Möchten Sie auch die Images löschen? (j/n): " delete_images
if [ "$delete_images" = "j" ] || [ "$delete_images" = "J" ]; then
    echo "➜ Entferne Images..."
    docker rmi -f $(docker images -q --filter "reference=*ipad*" --filter "reference=config*") 2>/dev/null || true
fi

echo ""
echo "✓ Cleanup abgeschlossen!"
echo ""
echo "Sie können jetzt die Installation neu starten:"
echo "  ./install.sh"
