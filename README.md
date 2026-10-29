# InfraControl V1

Dunkles Proxmox Operations Center, visuell an der NOC-Referenz orientiert. Die eigenständige Demo enthält Cluster Health, Nodes, VMs, LXC, Storage, Backup-Task-Verlauf, Monitoring und Ereignisse. Deutsche Oberfläche, responsive Icon-Navigation, Ressourcendetails, Suche, Statusfilter, Sortierung und konfigurierbarer Anzeige-Timer.

## Entwicklung

Voraussetzung: Node.js 22.12+ (getestet: 24), npm.

```sh
cd frontend
npm ci
npm run dev
```

Frontend: lokaler Vite-Server. Hash-Navigation funktioniert auch nach Reload. Die Demo verwendet ausschließlich lokale, deterministische Beispieldaten und kontaktiert keinen Proxmox-Server. Nur die explizite Diagnose in den Einstellungen ruft `/api/health` am selben Origin auf. Aktualisieren und Timer ändern den Anzeigezeitpunkt; sie erzeugen keine neuen Messwerte.

```sh
cd frontend
npm run build
npm test
cd ../backend
npm ci
npm test
npm run dev
```

## Architektur

- `frontend/src/App.tsx`: Dashboard, Navigation und Unterseiten
- `frontend/src/components.tsx`: Panels, Tabellen, Status, Charts, Detaildialog
- `frontend/src/data.ts`: typisierte, simulierte Daten und Health-Berechnung
- `frontend/src/style.css`: Dark-NOC-Design, responsive Raster
- `backend/src/server.ts`: loopback HTTP API, CORS und Sicherheitsheader
- `backend/src/proxmox.ts`: serverseitiger Read-only-Proxmox-Adapter

React, TypeScript, Vite, Tailwind CSS, Lucide und Recharts im Frontend; Node.js/TypeScript im Backend. Keine Docker-, Slack- oder anderen Infrastruktur-Integrationen.

## Vercel-Demo

Repository importieren und **Root Directory auf dem Repository-Hauptverzeichnis belassen** (leer bzw. `.`). Die `vercel.json` im Hauptverzeichnis legt Installation, Build und Ausgabe `frontend/dist` fest. Alternativ funktioniert weiterhin Root Directory `frontend` mit Framework Vite, Install `npm ci`, Build `npm run build`, Output `dist`. Vorhandene manuelle Build-/Output-Overrides in Vercel müssen zum gewählten Root Directory passen. Nach Änderungen ein neues Deployment auslösen. Keine Umgebungsvariablen und keine internen Zugangsdaten anlegen. `frontend/vercel.json` enthält den SPA-Fallback. Deployment selbst wurde nicht veröffentlicht.

## Interner Ubuntu-Betrieb

Backend bauen: `cd backend && npm ci && npm run build`. Mit einem internen Prozessmanager als eigener, unprivilegierter Benutzer starten: `node --env-file=.env dist/server.js`. Lokale `.env` anhand `.env.example` erstellen und Dateirechte einschränken. Niemals committen. Frontend-Build separat intern ausliefern. Die API bindet absichtlich nur an `127.0.0.1`; ein interner authentifizierter Zugang muss durch den Betreiber eingerichtet werden. Keine öffentliche Freigabe oder Tunnel automatisch einrichten. Laufende Prozesse werden nicht durch einen Cloud-Snapshot erhalten.

### Backend-Variablen

| Variable | Zweck |
| --- | --- |
| `PORT` | lokaler API-Port, Standard 3000 |
| `FRONTEND_ORIGIN` | exakt erlaubter Browser-Origin, keine Wildcard |
| `PROXMOX_URL` | HTTPS-Origin des internen Proxmox-Servers |
| `PROXMOX_TOKEN_ID` | serverseitiger Read-only-API-Token-Identifier |
| `PROXMOX_TOKEN_SECRET` | ausschließlich serverseitiges Secret |
| `NODE_EXTRA_CA_CERTS` | optionaler Pfad zur vertrauenswürdigen privaten CA |

Für den Token minimal erforderliche Leserechte verwenden, beispielsweise eine auf die benötigten Ressourcen begrenzte Audit-Rolle. TLS-Prüfung bleibt aktiv. Für lokale Tokens ist eine sichere serverseitige Secret-Injektion erforderlich; keine Browser- oder Vercel-Variablen verwenden.

### API und Live-Grenzen

- `GET /api/health`: unverändert Anwendung/Status/Zeitstempel
- `GET /api/status`: Konfiguration vorhanden, keine Behauptung über Live-Verifizierung
- `GET /api/proxmox/snapshot`: liest `/version`, `/nodes`, `/cluster/resources`, optional `/cluster/backup` und `/cluster/tasks`; gibt nur ausgewählte normalisierte Felder zurück

Timeouts, Authentifizierungs-/TLS-/Verbindungsfehler und ungültige Antworten werden ohne geheime Details gemeldet. Optional unzugängliche Jobs/Tasks sind ausdrücklich `available: false`. Mutierende Methoden sind gesperrt. Die interne API hat noch keine eigene Benutzeranmeldung und darf nicht öffentlich exponiert werden.

**Live ist noch nicht abgenommen:** Es fehlen autorisierte Proxmox-Zugangsdaten, Netzwerkzugang und Integrationstests gegen die konkrete Proxmox-Version. Das Frontend bleibt bewusst Demo; ein Live-Datenprovider und Umschalter sind noch nicht angeschlossen. RRD-Historien, vollständige versionsspezifische Schema-Validierung und Live-Backup-Jobdetails sind Folgearbeiten. Der Adapter ist die Grundlage, keine verifizierte Produktionsintegration.

## Daten und Berechnungen

Health = gerundeter Mittelwert aus fünf gleich gewichteten Verfügbarkeitsquoten: erreichbare Nodes, laufende VMs, laufende LXC, verfügbare Storage Pools, erfolgreiche Backup-Tasks. Demo: 94 %. Absichtlich gestoppte VMs reduzieren den Wert ebenfalls; dieser Score ist eine Verfügbarkeitsübersicht, keine Diagnose. CPU > 80 % demonstriert eine Warnung; ein fehlgeschlagener Backup-Task eine kritische Meldung. Ereignisse und Zeitreihen sind simuliert. Zeitraumauswahl zeigt unterschiedlich lange Ausschnitte/Abtastungen desselben Demo-Datensatzes, keine realen 24h-Messungen. Keine KI-Erkennung oder Wachstumsprognosen.

## Qualitätssicherung

Frontend: Typecheck/Produktionsbuild und Vitest-Tests für Health, Navigation, Details, Demo ohne Backend, Suche/Status/Sortierung und Diagnosefehler. Backend: Build und Node-Tests für Health, Fehlerbehandlung, Origins, Read-only-Methoden und Upstream-Validierung. Chromium-Prüfung auf Desktop und Mobile; keine Seitenfehler oder horizontales Seitenoverflow. Eine Live-Abnahme und neue Cloud-Snapshot-Wiederherstellung wurden nicht durchgeführt.
