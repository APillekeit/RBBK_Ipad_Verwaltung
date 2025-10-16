# Entwicklungs-Leitfaden

## 🛠️ Entwicklungsumgebung Setup

### 1. Lokale Entwicklung

**Backend-Entwicklung:**
```bash
cd /app/backend

# Virtuelle Umgebung erstellen
python -m venv venv
source venv/bin/activate  # Linux/Mac
# oder: venv\Scripts\activate  # Windows

# Dependencies installieren
pip install -r requirements.txt

# Server starten (Development)
uvicorn server:app --host 0.0.0.0 --port 8001 --reload
```

**Frontend-Entwicklung:**
```bash
cd /app/frontend

# Dependencies installieren
yarn install

# Development Server starten
yarn start
```

### 2. Code-Struktur

**Backend Architektur:**
```
backend/
├── server.py              # Haupt-API Server
│   ├── Models              # Pydantic Datenmodelle
│   ├── Routes              # API-Endpunkte
│   ├── Security           # Authentifizierung & Validation
│   ├── Database           # MongoDB Operationen
│   └── Utilities          # Helper-Funktionen
├── requirements.txt       # Python Dependencies
├── Dockerfile            # Container Definition
└── .env                  # Umgebungsvariablen
```

**Frontend Architektur:**
```
frontend/src/
├── App.js                # Haupt-Komponente & Routing
├── components/           # Wiederverwendbare UI-Komponenten
│   └── ui/              # Shadcn/UI Komponenten
├── hooks/               # Custom React Hooks
├── lib/                 # Utility-Funktionen
├── index.js            # Entry Point
└── *.css               # Styling
```

### 3. API-Entwicklung

**Neue Endpunkte hinzufügen:**
```python
# In server.py
@api_router.post("/neue-funktion")
@limiter.limit("10/minute")
async def neue_funktion(
    request: Request,
    data: NeuesFunktionModel,
    current_user: str = Depends(get_current_user)
):
    # 1. Input validieren
    validate_resource_access("funktion", data.id, current_user)
    
    # 2. Daten sanitizen
    data.name = sanitize_input(data.name, max_length=100)
    
    # 3. Business Logic
    result = await db.collection.insert_one(data.dict())
    
    # 4. Response
    return {"message": "Erfolgreich erstellt", "id": result.inserted_id}
```

**Datenmodelle definieren:**
```python
from pydantic import BaseModel, Field
from typing import Optional

class NeuesFunktionModel(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    beschreibung: Optional[str] = None
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())
```

### 4. Frontend-Komponenten

**Neue Komponente erstellen:**
```javascript
// components/NeueKomponente.js
import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from './ui/card';
import { Button } from './ui/button';

const NeueKomponente = ({ onAction }) => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const response = await api.get('/neue-funktion');
      setData(response.data);
    } catch (error) {
      console.error('Fehler beim Laden:', error);
      toast.error('Daten konnten nicht geladen werden');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Neue Funktion</CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div>Lädt...</div>
        ) : (
          <div>
            {/* Komponenten-Inhalt */}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default NeueKomponente;
```

### 5. Testing

**Backend-Tests:**
```python
# test_api.py
import pytest
import requests

def test_authentifizierung():
    response = requests.post("/api/auth/login", json={
        "username": "admin",
        "password": "admin123"
    })
    assert response.status_code == 200
    assert "access_token" in response.json()

def test_geschützte_route():
    # Ohne Token
    response = requests.get("/api/students")
    assert response.status_code == 403
```

**Sicherheitstests:**
```bash
# Sicherheitstests ausführen
python scripts/security_tests.py
```

### 6. Code-Qualität

**Python Code-Style:**
```bash
# Linting
flake8 backend/server.py

# Formatierung
black backend/server.py
```

**JavaScript Code-Style:**
```bash
# ESLint
cd frontend
npm run lint

# Prettier
npm run format
```

### 7. Debugging

**Backend Debugging:**
```python
# Debug-Logs hinzufügen
import logging
logging.basicConfig(level=logging.DEBUG)

# In Funktionen:
logging.debug(f"Processing data: {data}")
```

**Frontend Debugging:**
```javascript
// React Developer Tools nutzen
// Console-Logs für Debugging
console.log('Component state:', { data, loading });

// Error Boundaries für Production
```

### 8. Performance-Optimierung

**Backend Performance:**
```python
# MongoDB Queries optimieren
# Indizes nutzen
await db.students.find({"sus_kl": klasse}).hint([("sus_kl", 1)])

# Async/Await korrekt nutzen
async def bulk_operation():
    tasks = [process_item(item) for item in items]
    results = await asyncio.gather(*tasks)
    return results
```

**Frontend Performance:**
```javascript
// React.memo für teure Komponenten
const ExpensiveComponent = React.memo(({ data }) => {
  // Komponentenlogik
});

// useMemo für teure Berechnungen
const expensiveValue = useMemo(() => {
  return heavyCalculation(data);
}, [data]);
```

### 9. Git Workflow

```bash
# Feature Branch erstellen
git checkout -b feature/neue-funktion

# Änderungen committen
git add .
git commit -m "feat: neue Funktion für XYZ"

# Branch pushen
git push origin feature/neue-funktion

# Pull Request erstellen
# Code Review abwarten
# Nach Approval: Merge in main
```

### 10. Deployment-Vorbereitung

```bash
# Build testen
cd frontend && yarn build

# Docker Images erstellen
docker build -t ipad-backend ./backend
docker build -t ipad-frontend ./frontend

# Sicherheitstests ausführen
python scripts/security_tests.py
```