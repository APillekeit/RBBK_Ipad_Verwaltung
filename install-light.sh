#!/bin/bash

###############################################################################
# iPad-Verwaltungssystem - Leichte Installation (für Systeme mit wenig RAM)
# Version: 2.1 Light
###############################################################################

set -e

# Farben
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$SCRIPT_DIR"

print_header() {
    echo -e "${BLUE}═══════════════════════════════════════════════════════${NC}"
    echo -e "${BLUE}    iPad-Verwaltungssystem - Leichte Installation${NC}"
    echo -e "${BLUE}    Optimiert für Systeme mit wenig RAM${NC}"
    echo -e "${BLUE}═══════════════════════════════════════════════════════${NC}"
    echo ""
}

print_step() {
    echo -e "${GREEN}➜${NC} $1"
}

print_success() {
    echo -e "${GREEN}✓${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}⚠${NC} $1"
}

print_error() {
    echo -e "${RED}✗${NC} $1"
}

print_header

print_step "System-Check..."
free -h | grep Mem
echo ""

print_warning "Diese Installation verwendet RAM-schonende Methoden:"
echo "  - Verwendet Build-Cache"
echo "  - Baut Container einzeln"
echo "  - Räumt zwischen Builds auf"
echo ""

read -p "Fortfahren? (j/n): " continue
if [ "$continue" != "j" ] && [ "$continue" != "J" ]; then
    echo "Installation abgebrochen"
    exit 0
fi

echo ""
print_step "Prüfe Docker..."
if ! command -v docker &> /dev/null; then
    print_error "Docker nicht gefunden!"
    exit 1
fi

if command -v docker-compose &> /dev/null; then
    DOCKER_COMPOSE_CMD="docker-compose"
elif docker compose version &> /dev/null; then
    DOCKER_COMPOSE_CMD="docker compose"
else
    print_error "Docker Compose nicht gefunden!"
    exit 1
fi
print_success "Docker OK"

echo ""
print_step "Räume alte Container auf..."
docker ps -a -q --filter "name=ipad" --filter "name=mongodb" --filter "name=config" 2>/dev/null | xargs -r docker rm -f
print_success "Cleanup abgeschlossen"

echo ""
print_step "Erstelle Umgebungsvariablen..."
mkdir -p ./backend ./frontend

if [ ! -f "./backend/.env" ]; then
    SECRET_KEY=$(openssl rand -hex 32)
    cat > ./backend/.env <<EOF
MONGO_URL=mongodb://localhost:27017/
IPAD_DB_NAME=iPadDatabase
SECRET_KEY=${SECRET_KEY}
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
DEBUG=False
EOF
    print_success "Backend .env erstellt"
else
    print_success "Backend .env vorhanden"
fi

if [ ! -f "./frontend/.env" ]; then
    cat > ./frontend/.env <<EOF
REACT_APP_BACKEND_URL=http://localhost:8001
EOF
    print_success "Frontend .env erstellt"
else
    print_success "Frontend .env vorhanden"
fi

echo ""
print_step "Baue Container einzeln (RAM-schonend)..."

cd config

# 1. MongoDB (klein, schnell)
print_step "1/3: MongoDB..."
$DOCKER_COMPOSE_CMD build mongodb
print_success "MongoDB gebaut"

# Räume auf
docker system prune -f >/dev/null 2>&1

# 2. Backend (mittel)
print_step "2/3: Backend..."
$DOCKER_COMPOSE_CMD build backend
print_success "Backend gebaut"

# Räume auf
docker system prune -f >/dev/null 2>&1

# 3. Frontend (groß)
print_step "3/3: Frontend..."
$DOCKER_COMPOSE_CMD build frontend
print_success "Frontend gebaut"

cd ..

echo ""
print_step "Starte Services..."
cd config
$DOCKER_COMPOSE_CMD up -d
cd ..

print_success "Services gestartet"
sleep 10

echo ""
print_step "Initialisiere Datenbank..."
sleep 5

RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:8001/api/auth/setup 2>/dev/null)
if [ "$RESPONSE" = "200" ]; then
    print_success "Admin-User erstellt"
else
    print_warning "Admin-User existiert bereits"
fi

echo ""
print_step "Konfiguriere Admin-Benutzer..."
cd config
$DOCKER_COMPOSE_CMD exec -T backend python << 'PYEOF' 2>/dev/null || echo "Admin-Setup über Container..."
import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from passlib.context import CryptContext
from datetime import datetime, timezone
import uuid

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

async def setup():
    client = AsyncIOMotorClient("mongodb://mongodb:27017/")
    db = client["iPadDatabase"]
    
    # Prüfe ob Admin existiert
    admin = await db.users.find_one({"username": "admin"})
    
    if admin:
        # Update
        await db.users.update_one(
            {"username": "admin"},
            {"$set": {
                "password_hash": pwd_context.hash("admin123"),
                "role": "admin",
                "is_active": True,
                "updated_at": datetime.now(timezone.utc).isoformat()
            }}
        )
    else:
        # Erstelle neu
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
    
    print("✓ Admin-Passwort: admin123")
    client.close()

asyncio.run(setup())
PYEOF
cd ..
print_success "Admin konfiguriert"

echo ""
print_step "Führe RBAC-Migration aus..."
if [ -f "./backend/migrate_rbac.py" ]; then
    cd config
    $DOCKER_COMPOSE_CMD exec -T backend python migrate_rbac.py 2>/dev/null || print_warning "Migration übersprungen"
    cd ..
fi

echo ""
print_step "Prüfe Services..."
BACKEND_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:8001/api/auth/setup 2>/dev/null)
FRONTEND_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000 2>/dev/null)

if [ "$BACKEND_STATUS" = "200" ]; then
    print_success "Backend läuft (Port 8001)"
else
    print_warning "Backend antwortet nicht"
fi

if [ "$FRONTEND_STATUS" = "200" ]; then
    print_success "Frontend läuft (Port 3000)"
else
    print_warning "Frontend lädt noch..."
fi

echo ""
echo -e "${GREEN}═══════════════════════════════════════════════════════${NC}"
echo -e "${GREEN}    ✓ Installation erfolgreich!${NC}"
echo -e "${GREEN}═══════════════════════════════════════════════════════${NC}"
echo ""
echo -e "${BLUE}Zugriff:${NC}"
echo -e "  Frontend: ${GREEN}http://localhost:3000${NC}"
echo -e "  Backend:  ${GREEN}http://localhost:8001${NC}"
echo ""
echo -e "${BLUE}Login:${NC}"
echo -e "  Benutzername: ${YELLOW}admin${NC}"
echo -e "  Passwort:     ${YELLOW}admin123${NC}"
echo ""
echo -e "${YELLOW}⚠️  Cache löschen nicht vergessen!${NC}"
echo -e "   Privates Fenster: Strg+Shift+N (Chrome) oder Strg+Shift+P (Firefox)"
echo ""
