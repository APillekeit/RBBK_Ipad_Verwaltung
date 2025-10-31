#!/bin/bash

###############################################################################
# Login-Test Script
# Testet ob der Login funktioniert
###############################################################################

echo "🔐 Login-Test"
echo ""

# Prüfe ob Backend läuft
echo "1️⃣ Prüfe Backend..."
if sudo supervisorctl status backend | grep -q RUNNING; then
    echo "   ✓ Backend läuft"
else
    echo "   ✗ Backend läuft NICHT!"
    echo ""
    echo "   Backend starten:"
    echo "   sudo supervisorctl restart backend"
    exit 1
fi

echo ""
echo "2️⃣ Teste Passwörter..."
echo ""

# Teste beide Passwörter
python3 << 'EOF'
import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from passlib.context import CryptContext

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

async def test_login():
    client = AsyncIOMotorClient("mongodb://localhost:27017/")
    db = client["iPadDatabase"]
    
    # Hole Admin
    admin = await db.users.find_one({"username": "admin"})
    
    if not admin:
        print("❌ Kein Admin-User gefunden!")
        client.close()
        return
    
    password_hash = admin['password_hash']
    
    # Teste Passwörter
    passwords = ["geheim", "admin123", "admin", ""]
    
    print("Teste Passwörter:")
    for pwd in passwords:
        result = pwd_context.verify(pwd, password_hash)
        status = "✅ FUNKTIONIERT" if result else "❌ Falsch"
        if pwd == "":
            pwd = "(leer)"
        print(f"   '{pwd}': {status}")
    
    client.close()

asyncio.run(test_login())
EOF

echo ""
echo "3️⃣ Setze Passwort auf 'geheim'..."
python3 << 'EOF'
import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from passlib.context import CryptContext
from datetime import datetime, timezone

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

async def set_password():
    client = AsyncIOMotorClient("mongodb://localhost:27017/")
    db = client["iPadDatabase"]
    
    # Setze Passwort
    await db.users.update_one(
        {"username": "admin"},
        {
            "$set": {
                "password_hash": pwd_context.hash("geheim"),
                "role": "admin",
                "is_active": True,
                "updated_at": datetime.now(timezone.utc).isoformat()
            }
        }
    )
    
    print("✅ Passwort auf 'geheim' gesetzt")
    
    # Verifiziere
    admin = await db.users.find_one({"username": "admin"})
    if pwd_context.verify("geheim", admin['password_hash']):
        print("✅ Passwort verifiziert - Login sollte funktionieren!")
    else:
        print("❌ Passwort NICHT korrekt gesetzt!")
    
    client.close()

asyncio.run(set_password())
EOF

echo ""
echo "═══════════════════════════════════════════════════════"
echo "📋 Login-Daten:"
echo "═══════════════════════════════════════════════════════"
echo ""
echo "   URL:          http://localhost:3000"
echo "   Benutzername: admin"
echo "   Passwort:     geheim"
echo ""
echo "⚠️  WICHTIG:"
echo "   1. Öffnen Sie ein PRIVATES/INCOGNITO Fenster"
echo "      Chrome/Edge: Strg+Shift+N"
echo "      Firefox:     Strg+Shift+P"
echo ""
echo "   2. Gehen Sie zu: http://localhost:3000"
echo ""
echo "   3. Melden Sie sich an mit:"
echo "      Benutzername: admin"
echo "      Passwort:     geheim"
echo ""
echo "   4. Falls es IMMER NOCH nicht funktioniert:"
echo "      - Backend neu starten: sudo supervisorctl restart backend"
echo "      - Browser komplett schließen"
echo "      - Erneut versuchen"
echo ""
