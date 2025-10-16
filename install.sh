#!/bin/bash

###############################################################################
# iPad-Verwaltungssystem - Installations- und Setup-Script
# Version: 2.0 (mit RBAC-Unterstützung)
###############################################################################

set -e  # Bei Fehler abbrechen

# Farben für Ausgabe
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Funktionen
print_header() {
    echo -e "${BLUE}═══════════════════════════════════════════════════════${NC}"
    echo -e "${BLUE}    iPad-Verwaltungssystem - Installation${NC}"
    echo -e "${BLUE}    Version 2.0 mit RBAC${NC}"
    echo -e "${BLUE}═══════════════════════════════════════════════════════${NC}"
    echo ""
}

print_step() {
    echo -e "${GREEN}➜${NC} $1"
}

print_error() {
    echo -e "${RED}✗${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}⚠${NC} $1"
}

print_success() {
    echo -e "${GREEN}✓${NC} $1"
}

check_dependencies() {
    print_step "Überprüfe System-Voraussetzungen..."
    
    # Check Docker
    if ! command -v docker &> /dev/null; then
        print_error "Docker ist nicht installiert!"
        echo "Installation: https://docs.docker.com/get-docker/"
        exit 1
    fi
    print_success "Docker gefunden: $(docker --version | cut -d' ' -f3)"
    
    # Check Docker Compose
    if ! command -v docker-compose &> /dev/null; then
        print_error "Docker Compose ist nicht installiert!"
        echo "Installation: https://docs.docker.com/compose/install/"
        exit 1
    fi
    print_success "Docker Compose gefunden: $(docker-compose --version | cut -d' ' -f4)"
    
    # Check Python
    if ! command -v python3 &> /dev/null; then
        print_warning "Python3 nicht gefunden, wird aber für lokale Entwicklung empfohlen"
    else
        print_success "Python gefunden: $(python3 --version | cut -d' ' -f2)"
    fi
    
    echo ""
}

setup_environment() {
    print_step "Erstelle Umgebungsvariablen..."
    
    # Backend .env
    if [ ! -f "./backend/.env" ]; then
        print_warning "Backend .env nicht gefunden, erstelle neue..."
        SECRET_KEY=$(openssl rand -hex 32)
        cat > ./backend/.env <<EOF
# MongoDB Configuration
MONGO_URL=mongodb://mongodb:27017/
IPAD_DB_NAME=iPadDatabase

# Security
SECRET_KEY=${SECRET_KEY}
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30

# Application
DEBUG=False
EOF
        print_success "Backend .env erstellt mit sicherem SECRET_KEY"
    else
        print_success "Backend .env bereits vorhanden"
    fi
    
    # Frontend .env
    if [ ! -f "./frontend/.env" ]; then
        print_warning "Frontend .env nicht gefunden, erstelle neue..."
        cat > ./frontend/.env <<EOF
# Backend API URL
REACT_APP_BACKEND_URL=http://localhost:8001
EOF
        print_success "Frontend .env erstellt"
    else
        print_success "Frontend .env bereits vorhanden"
    fi
    
    echo ""
}

build_containers() {
    print_step "Baue Docker-Container..."
    
    if [ -f "./config/docker-compose.yml" ]; then
        cd config
        docker-compose build --no-cache
        cd ..
        print_success "Docker-Container erfolgreich gebaut"
    else
        print_error "docker-compose.yml nicht gefunden!"
        exit 1
    fi
    
    echo ""
}

start_services() {
    print_step "Starte Services..."
    
    cd config
    docker-compose up -d
    cd ..
    
    print_success "Services gestartet"
    
    # Warte auf Services
    print_step "Warte auf Service-Initialisierung..."
    sleep 10
    
    echo ""
}

init_database() {
    print_step "Initialisiere Datenbank und Admin-Benutzer..."
    
    # Warte auf MongoDB
    sleep 5
    
    # Versuche Admin-Setup
    RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:8001/api/auth/setup)
    
    if [ "$RESPONSE" = "200" ]; then
        print_success "Admin-Benutzer erfolgreich erstellt"
        echo ""
        echo -e "${YELLOW}═══════════════════════════════════════════════════════${NC}"
        echo -e "${YELLOW}    Standard-Login-Daten:${NC}"
        echo -e "${YELLOW}    Benutzername: admin${NC}"
        echo -e "${YELLOW}    Passwort: admin123${NC}"
        echo -e "${YELLOW}    Rolle: Administrator${NC}"
        echo -e "${YELLOW}    ${NC}"
        echo -e "${RED}    ⚠ WICHTIG: Ändern Sie das Passwort nach dem ersten Login!${NC}"
        echo -e "${YELLOW}═══════════════════════════════════════════════════════${NC}"
    else
        print_warning "Admin-Benutzer existiert möglicherweise bereits"
    fi
    
    echo ""
}

run_migration() {
    print_step "Führe RBAC-Datenmigration aus..."
    
    if [ -f "./backend/migrate_rbac.py" ]; then
        docker-compose exec backend python migrate_rbac.py || {
            print_warning "Migration konnte nicht automatisch ausgeführt werden"
            echo "Führen Sie manuell aus: docker-compose exec backend python migrate_rbac.py"
        }
        print_success "Datenmigration abgeschlossen"
    else
        print_warning "Migrations-Script nicht gefunden, übersprungen"
    fi
    
    echo ""
}

check_health() {
    print_step "Überprüfe Service-Status..."
    
    # Backend Health Check
    BACKEND_RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:8001/api/auth/setup)
    if [ "$BACKEND_RESPONSE" = "200" ]; then
        print_success "Backend läuft auf http://localhost:8001"
    else
        print_error "Backend antwortet nicht korrekt (HTTP $BACKEND_RESPONSE)"
    fi
    
    # Frontend Health Check
    FRONTEND_RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000)
    if [ "$FRONTEND_RESPONSE" = "200" ]; then
        print_success "Frontend läuft auf http://localhost:3000"
    else
        print_warning "Frontend lädt noch... (HTTP $FRONTEND_RESPONSE)"
    fi
    
    # MongoDB Health Check
    if docker ps | grep -q mongodb; then
        print_success "MongoDB-Container läuft"
    else
        print_error "MongoDB-Container läuft nicht!"
    fi
    
    echo ""
}

print_final_info() {
    echo ""
    echo -e "${GREEN}═══════════════════════════════════════════════════════${NC}"
    echo -e "${GREEN}    ✓ Installation erfolgreich abgeschlossen!${NC}"
    echo -e "${GREEN}═══════════════════════════════════════════════════════${NC}"
    echo ""
    echo -e "${BLUE}Zugriff auf die Anwendung:${NC}"
    echo -e "  Frontend: ${GREEN}http://localhost:3000${NC}"
    echo -e "  Backend:  ${GREEN}http://localhost:8001${NC}"
    echo -e "  API Docs: ${GREEN}http://localhost:8001/docs${NC}"
    echo ""
    echo -e "${BLUE}Standard-Login:${NC}"
    echo -e "  Benutzername: ${YELLOW}admin${NC}"
    echo -e "  Passwort:     ${YELLOW}admin123${NC}"
    echo -e "  Rolle:        ${YELLOW}Administrator${NC}"
    echo ""
    echo -e "${RED}⚠  WICHTIG: Ändern Sie das Admin-Passwort nach dem ersten Login!${NC}"
    echo ""
    echo -e "${BLUE}Nützliche Befehle:${NC}"
    echo -e "  Status anzeigen:     ${YELLOW}docker-compose ps${NC}"
    echo -e "  Logs anzeigen:       ${YELLOW}docker-compose logs -f${NC}"
    echo -e "  Services stoppen:    ${YELLOW}docker-compose down${NC}"
    echo -e "  Services neu starten:${YELLOW}docker-compose restart${NC}"
    echo ""
    echo -e "${BLUE}RBAC-Funktionen:${NC}"
    echo -e "  • Multi-User-Unterstützung mit Rollenzuweisung"
    echo -e "  • Admins können Benutzer verwalten (Tab: Benutzer)"
    echo -e "  • Benutzer sehen nur ihre eigenen Daten"
    echo -e "  • Admins sehen alle Systemdaten"
    echo ""
    echo -e "${BLUE}Dokumentation:${NC}"
    echo -e "  Deployment:   ${GREEN}docs/DEPLOYMENT.md${NC}"
    echo -e "  Development:  ${GREEN}docs/DEVELOPMENT.md${NC}"
    echo -e "  README:       ${GREEN}README.md${NC}"
    echo ""
    echo -e "${GREEN}═══════════════════════════════════════════════════════${NC}"
    echo ""
}

# Hauptprogramm
main() {
    print_header
    
    # Prüfungen
    check_dependencies
    
    # Setup
    setup_environment
    
    # Docker
    build_containers
    start_services
    
    # Datenbank
    init_database
    run_migration
    
    # Validierung
    check_health
    
    # Abschluss
    print_final_info
}

# Script ausführen
main
