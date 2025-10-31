#!/bin/bash

###############################################################################
# Admin-Passwort auf admin123 setzen
# Kann jederzeit ausgeführt werden, keine Neuinstallation nötig
###############################################################################

echo "🔧 Setze Admin-Passwort auf 'admin123'..."
echo ""

cd "$(dirname "$0")/config"

# Prüfe Docker Compose Command
if command -v docker-compose &> /dev/null; then
    DOCKER_COMPOSE_CMD="docker-compose"
elif docker compose version &> /dev/null; then
    DOCKER_COMPOSE_CMD="docker compose"
else
    echo "❌ Docker Compose nicht gefunden!"
    exit 1
fi

# Setze Passwort im Backend-Container
$DOCKER_COMPOSE_CMD exec -T backend python << 'EOF'
import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from passlib.context import CryptContext
from datetime import datetime, timezone
import uuid

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

async def fix_password():
    # MongoDB mit Authentifizierung
    client = AsyncIOMotorClient("mongodb://admin:ipad_admin_2024@mongodb:27017/iPadDatabase?authSource=admin")
    db = client["iPadDatabase"]
    
    # Lösche alten Admin
    await db.users.delete_many({"username": "admin"})
    
    # Erstelle neu mit admin123
    admin = {
        "id": str(uuid.uuid4()),
        "username": "admin",
        "password_hash": pwd_context.hash("admin123"),
        "role": "admin",
        "is_active": True,
        "created_by": None,
        "created_at": datetime.now(timezone.utc).isoformat(),
        "updated_at": datetime.now(timezone.utc).isoformat()
    }
    await db.users.insert_one(admin)
    
    # Verifiziere
    admin = await db.users.find_one({"username": "admin"})
    if pwd_context.verify("admin123", admin['password_hash']):
        print("✅ Passwort erfolgreich gesetzt und verifiziert!")
    else:
        print("❌ Fehler bei der Verifikation")
    
    client.close()

asyncio.run(fix_password())
EOF

echo ""
echo "═══════════════════════════════════════════════════════"
echo "  ✅ Admin-Passwort zurückgesetzt!"
echo "═══════════════════════════════════════════════════════"
echo ""
echo "  Login-Daten:"
echo "    URL: http://localhost:3000"
echo "    Benutzername: admin"
echo "    Passwort: admin123"
echo ""
echo "  Nächste Schritte:"
echo "    1. Privates Browser-Fenster öffnen"
echo "       (Strg+Shift+N oder Strg+Shift+P)"
echo "    2. http://localhost:3000 öffnen"
echo "    3. Mit admin / admin123 anmelden"
echo ""
