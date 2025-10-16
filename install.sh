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
    
    # Check Docker Compose (v1 oder v2)
    if command -v docker-compose &> /dev/null; then
        DOCKER_COMPOSE_CMD="docker-compose"
        print_success "Docker Compose gefunden: $(docker-compose --version | cut -d' ' -f4)"
    elif docker compose version &> /dev/null; then
        DOCKER_COMPOSE_CMD="docker compose"
        print_success "Docker Compose gefunden: $(docker compose version --short)"
    else
        print_error "Docker Compose ist nicht installiert!"
        echo "Installation: https://docs.docker.com/compose/install/"
        exit 1
    fi
    
    # Check Python
    if ! command -v python3 &> /dev/null; then
        print_warning "Python3 nicht gefunden, wird aber für lokale Entwicklung empfohlen"
    else
        print_success "Python gefunden: $(python3 --version | cut -d' ' -f2)"
    fi
    
    echo ""
}

check_existing_installation() {
    print_step "Prüfe auf vorherige Installation..."
    
    local has_containers=false
    local has_volumes=false
    local has_env_files=false
    
    # Prüfe auf laufende/existierende Container (auch gestoppte)
    if docker ps -a 2>/dev/null | grep -q "ipad\|mongodb"; then
        has_containers=true
        print_warning "Existierende Container gefunden"
    fi
    
    # Prüfe auf Docker Volumes
    if docker volume ls | grep -q "ipad\|mongodb"; then
        has_volumes=true
        print_warning "Existierende Docker-Volumes gefunden"
    fi
    
    # Prüfe auf .env Dateien
    if [ -f "./backend/.env" ] || [ -f "./frontend/.env" ]; then
        has_env_files=true
        print_warning "Existierende .env-Dateien gefunden"
    fi
    
    # Wenn keine vorherige Installation gefunden wurde
    if [ "$has_containers" = false ] && [ "$has_volumes" = false ] && [ "$has_env_files" = false ]; then
        print_success "Keine vorherige Installation gefunden"
        echo ""
        return 0
    fi
    
    # Vorherige Installation gefunden - Benutzer fragen
    echo ""
    echo -e "${YELLOW}═══════════════════════════════════════════════════════${NC}"
    echo -e "${YELLOW}    ⚠  VORHERIGE INSTALLATION GEFUNDEN${NC}"
    echo -e "${YELLOW}═══════════════════════════════════════════════════════${NC}"
    echo ""
    
    if [ "$has_containers" = true ]; then
        echo -e "${YELLOW}Gefundene Container:${NC}"
        docker ps -a --filter "name=ipad\|mongodb\|nginx" --format "  - {{.Names}} ({{.Status}})"
        echo ""
    fi
    
    if [ "$has_volumes" = true ]; then
        echo -e "${YELLOW}Gefundene Volumes:${NC}"
        docker volume ls --filter "name=ipad\|mongodb" --format "  - {{.Name}}"
        echo ""
    fi
    
    if [ "$has_env_files" = true ]; then
        echo -e "${YELLOW}Gefundene Konfigurationsdateien:${NC}"
        [ -f "./backend/.env" ] && echo "  - backend/.env"
        [ -f "./frontend/.env" ] && echo "  - frontend/.env"
        echo ""
    fi
    
    echo -e "${RED}WARNUNG: Das Löschen entfernt alle Daten (iPads, Schüler, Zuordnungen, Verträge)!${NC}"
    echo ""
    echo "Optionen:"
    echo "  1) Alte Installation löschen und neu installieren"
    echo "  2) Backup erstellen, dann löschen und neu installieren"
    echo "  3) Installation abbrechen"
    echo ""
    read -p "Ihre Wahl (1/2/3): " choice
    
    case $choice in
        1)
            print_step "Lösche alte Installation..."
            cleanup_installation false
            print_success "Alte Installation gelöscht"
            echo ""
            ;;
        2)
            print_step "Erstelle Backup..."
            create_backup
            print_step "Lösche alte Installation..."
            cleanup_installation false
            print_success "Backup erstellt und alte Installation gelöscht"
            echo ""
            ;;
        3)
            echo ""
            print_warning "Installation abgebrochen"
            exit 0
            ;;
        *)
            print_error "Ungültige Auswahl"
            exit 1
            ;;
    esac
}

create_backup() {
    local backup_dir="./backup_$(date +%Y%m%d_%H%M%S)"
    mkdir -p "$backup_dir"
    
    # Backup .env Dateien
    if [ -f "./backend/.env" ]; then
        cp ./backend/.env "$backup_dir/backend.env.bak"
        print_success "Backend .env gesichert"
    fi
    
    if [ -f "./frontend/.env" ]; then
        cp ./frontend/.env "$backup_dir/frontend.env.bak"
        print_success "Frontend .env gesichert"
    fi
    
    # MongoDB Backup wenn Container läuft
    if docker ps | grep -q mongodb; then
        print_step "Sichere MongoDB-Daten..."
        docker exec mongodb mongodump --out /tmp/mongodb_backup 2>/dev/null || true
        docker cp mongodb:/tmp/mongodb_backup "$backup_dir/mongodb_backup" 2>/dev/null || true
        print_success "MongoDB-Daten gesichert"
    fi
    
    echo ""
    echo -e "${GREEN}Backup erstellt in: ${backup_dir}${NC}"
    echo ""
}

cleanup_installation() {
    local silent=$1
    
    # Stoppe und entferne Container in einem Schritt
    [ "$silent" = false ] && print_step "Stoppe und entferne existierende Container..."
    
    # Versuche docker-compose down
    if [ -d "config" ]; then
        cd config 2>/dev/null && $DOCKER_COMPOSE_CMD down -v 2>/dev/null || true
        cd .. 2>/dev/null || true
    fi
    
    # Entferne Container direkt (auch wenn gestoppt)
    # Suche nach allen Containern mit ipad, mongodb oder config im Namen
    local containers=$(docker ps -a -q --filter "name=ipad" --filter "name=mongodb" --filter "name=config" 2>/dev/null)
    if [ ! -z "$containers" ]; then
        docker rm -f $containers 2>/dev/null || true
    fi
    
    [ "$silent" = false ] && print_success "Container entfernt"
    
    # Entferne Volumes (Datenverlust!)
    if docker volume ls | grep -q "ipad\|mongodb"; then
        [ "$silent" = false ] && print_step "Entferne Volumes..."
        docker volume rm $(docker volume ls -q --filter "name=ipad\|mongodb") 2>/dev/null || true
        [ "$silent" = false ] && print_success "Volumes entfernt"
    fi
    
    # Entferne Images (optional)
    if docker images | grep -q "ipad"; then
        [ "$silent" = false ] && print_step "Entferne alte Images..."
        docker rmi $(docker images -q --filter "reference=ipad*") 2>/dev/null || true
        [ "$silent" = false ] && print_success "Images entfernt"
    fi
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
        $DOCKER_COMPOSE_CMD build --no-cache
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
    $DOCKER_COMPOSE_CMD up -d
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
        cd config
        $DOCKER_COMPOSE_CMD exec -T backend python migrate_rbac.py || {
            print_warning "Migration konnte nicht automatisch ausgeführt werden"
            echo "Führen Sie manuell aus: cd config && $DOCKER_COMPOSE_CMD exec backend python migrate_rbac.py"
        }
        cd ..
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
    echo -e "  In config-Verzeichnis wechseln: ${YELLOW}cd config${NC}"
    echo -e "  Status anzeigen:     ${YELLOW}$DOCKER_COMPOSE_CMD ps${NC}"
    echo -e "  Logs anzeigen:       ${YELLOW}$DOCKER_COMPOSE_CMD logs -f${NC}"
    echo -e "  Services stoppen:    ${YELLOW}$DOCKER_COMPOSE_CMD down${NC}"
    echo -e "  Services neu starten:${YELLOW}$DOCKER_COMPOSE_CMD restart${NC}"
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
    check_existing_installation
    
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

# Cleanup-Modus (für manuelle Nutzung)
if [ "$1" = "cleanup" ] || [ "$1" = "--cleanup" ]; then
    print_header
    echo -e "${RED}═══════════════════════════════════════════════════════${NC}"
    echo -e "${RED}    CLEANUP-MODUS${NC}"
    echo -e "${RED}    Alle Container, Volumes und Daten werden gelöscht!${NC}"
    echo -e "${RED}═══════════════════════════════════════════════════════${NC}"
    echo ""
    read -p "Möchten Sie vorher ein Backup erstellen? (j/n): " backup_choice
    
    if [ "$backup_choice" = "j" ] || [ "$backup_choice" = "J" ]; then
        create_backup
    fi
    
    echo ""
    read -p "Sind Sie sicher, dass Sie alles löschen möchten? (ja/nein): " confirm
    
    if [ "$confirm" = "ja" ]; then
        cleanup_installation false
        print_success "Cleanup abgeschlossen"
    else
        print_warning "Cleanup abgebrochen"
    fi
    exit 0
fi

# Script ausführen
main
