# Frontend Dockerfile für React
FROM node:20-alpine as build

# Arbeitsverzeichnis setzen
WORKDIR /app

# Package-Dateien kopieren
COPY package*.json ./

# Abhängigkeiten installieren (Yarn ist bereits installiert)
# Entferne yarn.lock falls vorhanden für sauberen Build
RUN rm -f yarn.lock
RUN yarn install

# Build-Argument für Backend-URL
ARG REACT_APP_BACKEND_URL
ENV REACT_APP_BACKEND_URL=$REACT_APP_BACKEND_URL

# Anwendung kopieren
COPY . .

# Anwendung bauen
RUN yarn build

# Build-Artefakte in Volume kopieren
FROM alpine:latest
WORKDIR /app
COPY --from=build /app/build ./build

# Dummy-Kommando (Container wird nur für Build-Artefakte verwendet)
CMD ["echo", "Frontend build completed"]