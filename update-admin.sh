#!/bin/bash

###############################################################################
# Admin-Benutzer aktualisieren
# Setzt Passwort auf "geheim" und stellt sicher, dass die Rolle gesetzt ist
###############################################################################

echo "🔧 Aktualisiere Admin-Benutzer..."
echo ""

python3 << 'EOF'
import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from passlib.context import CryptContext
import uuid
from datetime import datetime, timezone

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

async def update_admin():
    # Verbinde zur Datenbank
    mongo_url = "mongodb://localhost:27017/"
    client = AsyncIOMotorClient(mongo_url)
    db = client["iPadDatabase"]
    
    # Prüfe ob Admin existiert
    admin_user = await db.users.find_one({"username": "admin"})
    
    if admin_user:
        print(f"✓ Admin-User gefunden")
        print(f"  ID: {admin_user.get('id')}")
        print(f"  Aktuelle Rolle: {admin_user.get('role', 'KEINE')}")
        
        # Aktualisiere Passwort und Rolle
        new_password_hash = pwd_context.hash("geheim")
        await db.users.update_one(
            {"username": "admin"},
            {"$set": {
                "password_hash": new_password_hash,
                "role": "admin",
                "is_active": True,
                "updated_at": datetime.now(timezone.utc).isoformat()
            }}
        )
        print("\n✓ Admin-User aktualisiert:")
        print("  Passwort: geheim")
        print("  Rolle: admin")
        print("  Status: aktiv")
    else:
        # Erstelle neuen Admin
        print("⚠️  Kein Admin-User gefunden, erstelle neuen...")
        new_admin = {
            "id": str(uuid.uuid4()),
            "username": "admin",
            "password_hash": pwd_context.hash("geheim"),
            "role": "admin",
            "is_active": True,
            "created_by": None,
            "created_at": datetime.now(timezone.utc).isoformat(),
            "updated_at": datetime.now(timezone.utc).isoformat()
        }
        await db.users.insert_one(new_admin)
        print(f"✓ Neuer Admin-User erstellt")
        print(f"  ID: {new_admin['id']}")
        print("  Passwort: geheim")
        print("  Rolle: admin")
    
    # Zeige Statistiken
    print("\n📊 Datenbank-Statistiken:")
    users = await db.users.count_documents({})
    ipads = await db.ipads.count_documents({})
    students = await db.students.count_documents({})
    assignments = await db.assignments.count_documents({})
    
    print(f"  Benutzer: {users}")
    print(f"  iPads: {ipads}")
    print(f"  Schüler: {students}")
    print(f"  Zuordnungen: {assignments}")
    
    client.close()

asyncio.run(update_admin())
EOF

echo ""
echo "═══════════════════════════════════════════════════════"
echo "✓ Admin-Benutzer erfolgreich aktualisiert!"
echo "═══════════════════════════════════════════════════════"
echo ""
echo "Login-Daten:"
echo "  Benutzername: admin"
echo "  Passwort: geheim"
echo "  Rolle: Administrator"
echo ""
echo "⚠️  WICHTIG: Löschen Sie den Browser-Cache oder melden Sie sich"
echo "   neu an, damit die neue Rolle geladen wird!"
echo ""
echo "Schritte:"
echo "  1. Im Browser: Strg+Shift+Entf (Cache löschen)"
echo "  2. Oder: Private/Incognito Fenster öffnen"
echo "  3. Zu http://localhost:3000 gehen"
echo "  4. Mit admin / geheim anmelden"
echo "  5. Der 'Benutzer' Tab sollte jetzt sichtbar sein"
echo ""
