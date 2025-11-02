#!/bin/bash

echo "═══════════════════════════════════════"
echo "  Frontend Deployment"
echo "═══════════════════════════════════════"
echo ""

# Backup erstellen
echo "📦 Erstelle Backup..."
BACKUP_DIR="/app/frontend/src.backup.$(date +%Y%m%d_%H%M%S)"
cp -r /app/frontend/src "$BACKUP_DIR"
echo "✅ Backup erstellt: $BACKUP_DIR"
echo ""

# Build erstellen
echo "🔨 Erstelle Production Build..."
echo "   (Das kann 5-10 Minuten beim ersten Mal dauern...)"
docker run --rm -v /app/frontend:/app -w /app node:16 sh -c "npm install && npm run build"

if [ $? -eq 0 ]; then
    echo "✅ Build erfolgreich erstellt"
else
    echo "❌ Build fehlgeschlagen!"
    exit 1
fi

echo ""

# Nginx neu starten
echo "🔄 Starte Nginx neu..."
docker restart ipad_nginx

if [ $? -eq 0 ]; then
    echo "✅ Nginx neu gestartet"
else
    echo "❌ Nginx-Neustart fehlgeschlagen!"
    exit 1
fi

echo ""
echo "════════════════════════════════════════════════════════"
echo "✅ DEPLOYMENT ERFOLGREICH ABGESCHLOSSEN!"
echo "════════════════════════════════════════════════════════"
echo ""
echo "🌐 Bitte öffnen Sie jetzt Ihren Browser:"
echo "   1. Drücken Sie: Strg + Shift + Entf"
echo "   2. Wählen Sie: 'Gecachte Bilder und Dateien'"
echo "   3. Klicken Sie: 'Daten löschen'"
echo "   4. Laden Sie die Seite neu: Strg + F5"
echo ""
echo "🎯 Testen Sie folgende Features:"
echo "   ✓ Toast-Meldungen erscheinen unten rechts"
echo "   ✓ Passwort-Bestätigung im Edit-Dialog"
echo "   ✓ Kopierbarer Reset-Password-Dialog"
echo ""
echo "🔄 Bei Problemen Backup zurückspielen:"
echo "   cp -r $BACKUP_DIR /app/frontend/src"
echo "   ./deploy-frontend.sh"
echo "════════════════════════════════════════════════════════"
