# Deployment-Leitfaden

## 🚀 Produktions-Deployment

### 1. Systemvoraussetzungen

**Hardware-Anforderungen:**
- CPU: 2+ Kerne
- RAM: 4GB minimum, 8GB empfohlen
- Speicher: 20GB+ freier Speicherplatz
- Netzwerk: Stabile Internetverbindung

**Software-Anforderungen:**
- Ubuntu 20.04+ oder Debian 11+
- Docker 20.10+
- Docker Compose 2.0+

### 2. Sicherheits-Setup

**Environment Variables erstellen:**
```bash
# Backend .env
SECRET_KEY="[64-Zeichen-sicherer-Schlüssel]"
MONGO_URL="mongodb://localhost:27017/iPadDatabase"

# Frontend .env  
REACT_APP_BACKEND_URL="/api"
```

**Firewall konfigurieren:**
```bash
# Nur notwendige Ports öffnen
ufw allow 22/tcp      # SSH
ufw allow 80/tcp      # HTTP
ufw allow 443/tcp     # HTTPS
ufw enable
```

### 3. SSL/TLS Setup

**Let's Encrypt Zertifikat:**
```bash
# Certbot installieren
apt install certbot python3-certbot-nginx

# Zertifikat erstellen
certbot --nginx -d ihre-domain.com

# Auto-Renewal aktivieren
echo "0 2 * * 0 /usr/bin/certbot renew --quiet" | crontab -
```

### 4. Backup-Strategie

**MongoDB Backup:**
```bash
# Tägliches Backup-Script
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
mongodump --out /backup/mongodb_$DATE
tar -czf /backup/mongodb_$DATE.tar.gz /backup/mongodb_$DATE
rm -rf /backup/mongodb_$DATE

# In Crontab: 0 2 * * * /opt/scripts/backup_mongodb.sh
```

**File Backup:**
```bash
# Backup wichtiger Dateien
tar -czf /backup/app_files_$(date +%Y%m%d).tar.gz \
  /app/backend/.env \
  /app/frontend/.env \
  /app/config/docker-compose.yml
```

### 5. Monitoring Setup

**Log-Überwachung:**
```bash
# Logrotate konfigurieren
# /etc/logrotate.d/ipad-management
/var/log/supervisor/*.log {
    daily
    missingok
    rotate 30
    compress
    notifempty
    copytruncate
}
```

**Health Checks:**
```bash
# Health Check Script
#!/bin/bash
# /opt/scripts/health_check.sh
curl -f http://localhost:8001/health || {
    echo "Backend down, restarting..."
    supervisorctl restart backend
}
```

### 6. Performance-Optimierung

**Nginx Tuning:**
```nginx
# In nginx.conf
worker_processes auto;
worker_connections 1024;

gzip on;
gzip_vary on;
gzip_min_length 1024;
gzip_types text/plain text/css application/json application/javascript;

client_max_body_size 50M;
```

**MongoDB Indizes:**
```javascript
// Wichtige Indizes erstellen
db.students.createIndex({ "sus_vorn": 1, "sus_nachn": 1 })
db.assignments.createIndex({ "itnr": 1 })
db.contracts.createIndex({ "assignment_id": 1 })
```

### 7. Troubleshooting

**Häufige Probleme:**

1. **Backend startet nicht:**
   ```bash
   # Logs prüfen
   tail -f /var/log/supervisor/backend.err.log
   
   # Dependencies prüfen
   cd /app/backend && pip install -r requirements.txt
   ```

2. **Frontend Build-Fehler:**
   ```bash
   # Node-Module neu installieren
   cd /app/frontend && rm -rf node_modules && yarn install
   ```

3. **MongoDB Verbindungsfehler:**
   ```bash
   # MongoDB Status prüfen
   systemctl status mongod
   
   # Logs prüfen
   tail -f /var/log/mongodb/mongod.log
   ```

### 8. Update-Prozedur

```bash
# 1. Backup erstellen
./backup_all.sh

# 2. Services stoppen
supervisorctl stop all

# 3. Code aktualisieren
git pull origin main

# 4. Dependencies aktualisieren
cd backend && pip install -r requirements.txt
cd ../frontend && yarn install

# 5. Services starten
supervisorctl start all

# 6. Health Check
./health_check.sh
```