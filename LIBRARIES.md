# iPad-Verwaltungssystem - Bibliotheken-Übersicht

## Backend-Bibliotheken (Python)

### Core Framework
- **FastAPI 0.110.1** - Haupt-Web-Framework
- **Uvicorn 0.25.0** - ASGI-Server
- **Pydantic 2.6.4+** - Datenvalidierung

### Datenbank
- **Motor 3.3.1** - Async MongoDB-Driver
- **PyMongo 4.5.0** - MongoDB-Client

### PDF-Verarbeitung ✅
- **PyPDF2 3.0.1+** - PDF-Lesen und Formularfeld-Extraktion
  - Unterstützt: PDF-Form-Fields lesen
  - Verwendet für: Vertragsvalidierung
  - Features: AcroForm-Felder, Checkbox-Werte

### Excel-Verarbeitung ✅
- **Pandas 2.2.0+** - Excel-Lesen und Datenverarbeitung
- **OpenPyXL 3.1.2+** - Excel-Engine für .xlsx-Dateien
- **XlsxWriter 3.1.9+** - Excel-Export
- **NumPy 1.26.0+** - Numerische Berechnungen (Pandas-Abhängigkeit)

### Authentifizierung & Sicherheit
- **Passlib 1.7.4+** - Passwort-Hashing
- **PyJWT 2.10.1+** - JWT-Token-Verarbeitung
- **Python-Jose 3.3.0+** - JWT-Utilities
- **Cryptography 42.0.8+** - Kryptografische Funktionen

### Datei-Upload
- **Python-Multipart 0.0.9+** - Multipart-Form-Datenverarbeitung

### Utilities
- **Python-Dotenv 1.0.1+** - Umgebungsvariablen
- **Requests 2.31.0+** - HTTP-Client
- **TZData 2024.2+** - Zeitzone-Daten

### Development & Testing
- **Pytest 8.0.0+** - Testing-Framework
- **Black 24.1.1+** - Code-Formatierung
- **isSort 5.13.2+** - Import-Sortierung
- **Flake8 7.0.0+** - Code-Linting
- **MyPy 1.8.0+** - Type-Checking

## Frontend-Bibliotheken (Node.js/React)

### Core Framework
- **React 19.0.0** - UI-Framework
- **React-DOM 19.0.0** - DOM-Rendering
- **React-Scripts 5.0.1** - Build-Tools

### UI-Komponenten (Shadcn/ui)
- **@radix-ui/react-*** - Basis-UI-Komponenten
- **Lucide-React 0.507.0** - Icons
- **Tailwind CSS 3.4.17** - CSS-Framework
- **Class-Variance-Authority 0.7.1** - CSS-Klassen-Management

### HTTP & State Management
- **Axios 1.8.4** - HTTP-Client für API-Calls

### Routing
- **React-Router-DOM 7.5.1** - Client-seitiges Routing

### Formulare & Validierung
- **React-Hook-Form 7.56.2** - Formular-Management
- **Zod 3.24.4** - Schema-Validierung

### Notifications
- **Sonner 2.0.3** - Toast-Notifications

## System-Abhängigkeiten (Docker)

### Backend-Container
```dockerfile
# Python 3.11-slim
apt-get install:
  - curl (für Health Checks)
  - gcc (für native Extensions)
  - g++ (für C++-Kompilierung)
  - python3-dev (für Python-Header)
  - libffi-dev (für Cryptography)
  - libssl-dev (für SSL-Support)
```

### MongoDB-Container
- **MongoDB 4.4** (VM-kompatibel)
- Authentifizierung aktiviert
- Index-Optimierung

### Nginx-Container
- **Nginx Alpine** (leichtgewichtig)
- Reverse Proxy-Konfiguration
- Statische Datei-Bereitstellung

## Funktionalitätstests

### PDF-Verarbeitung testen
```bash
docker exec ipad_backend python -c "
import PyPDF2, io
pdf = b'%PDF-1.4...'  # Minimal PDF
reader = PyPDF2.PdfReader(io.BytesIO(pdf))
print(f'PDF-Test: {len(reader.pages)} Seiten')
"
```

### Excel-Verarbeitung testen
```bash
docker exec ipad_backend python -c "
import pandas as pd, io
df = pd.DataFrame({'test': [1,2,3]})
buffer = io.BytesIO()
df.to_excel(buffer, engine='openpyxl')
print('Excel-Test: OK')
"
```

### Vollständiger Bibliothekstest
```bash
docker exec ipad_backend python test-docker-libs.py
```

## Besondere Features

### PDF-Formularfeld-Extraktion
- Liest AcroForm-Felder aus PDF-Verträgen
- Extrahiert Checkbox-Werte (/Yes, /Off)
- Validiert Formular-Inhalte

### Excel-Batch-Verarbeitung
- Unterstützt große Excel-Dateien
- Automatische Datentyp-Erkennung
- Fehlerbehandlung für beschädigte Dateien

### Upload-Handling
- Streaming-Upload für große Dateien
- Mime-Type-Validierung
- Virus-Scan-bereit (erweiterbar)

## Versionskontrolle

Alle Bibliotheken sind mit Mindestversionen spezifiziert, um Kompatibilität sicherzustellen:
- **PDF:** PyPDF2 ≥3.0.1 (moderne API)
- **Excel:** Pandas ≥2.2.0, OpenPyXL ≥3.1.2
- **Security:** Aktuelle Cryptography- und JWT-Versionen

## Troubleshooting

### PDF-Probleme
```bash
# Test PDF-Bibliothek
docker exec ipad_backend python -c "import PyPDF2; print('PyPDF2 OK')"
```

### Excel-Probleme
```bash
# Test Excel-Bibliotheken
docker exec ipad_backend python -c "import pandas, openpyxl; print('Excel OK')"
```

### Performance-Monitoring
```bash
# Memory-Usage prüfen
docker stats ipad_backend
```

**Alle PDF- und Excel-Funktionen sind vollständig im Docker-Setup enthalten und getestet!** ✅