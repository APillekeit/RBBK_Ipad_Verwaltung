#!/bin/bash

echo "🔧 Setze Admin-Passwort..."
echo ""
echo "Welches Passwort möchten Sie?"
echo "  1) geheim"
echo "  2) admin123"
echo ""
read -p "Ihre Wahl (1 oder 2): " choice

if [ "$choice" = "1" ]; then
    PASSWORD="geheim"
elif [ "$choice" = "2" ]; then
    PASSWORD="admin123"
else
    echo "Ungültige Wahl"
    exit 1
fi

echo ""
echo "Setze Passwort auf '$PASSWORD'..."
echo ""

python3 << EOF
import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from passlib.context import CryptContext
from datetime import datetime, timezone
import uuid

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
PASSWORD = "$PASSWORD"

async def set_password():
    client = AsyncIOMotorClient("mongodb://localhost:27017/")
    db = client["iPadDatabase"]
    
    # Prüfe ob Admin existiert
    admin = await db.users.find_one({"username": "admin"})
    
    if not admin:
        # Erstelle Admin neu
        admin = {
            "id": str(uuid.uuid4()),
            "username": "admin",
            "password_hash": pwd_context.hash(PASSWORD),
            "role": "admin",
            "is_active": True,
            "created_by": None,
            "created_at": datetime.now(timezone.utc).isoformat(),
            "updated_at": datetime.now(timezone.utc).isoformat()
        }
        await db.users.insert_one(admin)
        print("✅ Admin-User erstellt")
    else:
        # Update Passwort
        await db.users.update_one(
            {"username": "admin"},
            {
                "\$set": {
                    "password_hash": pwd_context.hash(PASSWORD),
                    "role": "admin",
                    "is_active": True,
                    "updated_at": datetime.now(timezone.utc).isoformat()
                }
            }
        )
        print("✅ Passwort aktualisiert")
    
    # Verifiziere
    admin = await db.users.find_one({"username": "admin"})
    if pwd_context.verify(PASSWORD, admin['password_hash']):
        print("✅ Passwort-Verifikation erfolgreich!")
        print("")
        print("═══════════════════════════════════════")
        print("  Login-Daten:")
        print("═══════════════════════════════════════")
        print(f"  Benutzername: admin")
        print(f"  Passwort: {PASSWORD}")
        print("═══════════════════════════════════════")
    else:
        print("❌ FEHLER: Passwort konnte nicht gesetzt werden!")
    
    client.close()

asyncio.run(set_password())
EOF

echo ""
echo "Fertig!"
echo ""
echo "Jetzt einloggen:"
echo "  1. Browser öffnen (am besten privates Fenster)"
echo "  2. http://localhost:3000"
echo "  3. Benutzername: admin"
echo "  4. Passwort: $PASSWORD"
echo ""
