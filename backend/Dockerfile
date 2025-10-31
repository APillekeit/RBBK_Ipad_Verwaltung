# Backend Dockerfile für FastAPI
FROM python:3.11-slim

# Arbeitsverzeichnis setzen
WORKDIR /app

# System-Abhängigkeiten installieren (für PDF/Excel-Verarbeitung)
RUN apt-get update && apt-get install -y \
    curl \
    gcc \
    g++ \
    python3-dev \
    libffi-dev \
    libssl-dev \
    libmagic1 \
    && rm -rf /var/lib/apt/lists/*

# Python-Abhängigkeiten kopieren und installieren
COPY requirements.txt .
RUN pip install --no-cache-dir --upgrade pip
RUN pip install --no-cache-dir -r requirements.txt

# Anwendung kopieren
COPY . .

# Upload-Verzeichnis erstellen
RUN mkdir -p uploads

# Port freigeben
EXPOSE 8001

# Healthcheck
HEALTHCHECK --interval=30s --timeout=30s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:8001/api/auth/setup || exit 1

# Startkommando
CMD ["uvicorn", "server:app", "--host", "0.0.0.0", "--port", "8001", "--reload"]