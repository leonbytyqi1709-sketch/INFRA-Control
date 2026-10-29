import { useEffect, useState } from "react";
import {
  Activity,
  Bell,
  Box,
  CheckCircle2,
  ChevronRight,
  CircleHelp,
  Clock3,
  Database,
  Download,
  Grid2X2,
  HardDrive,
  Layers3,
  Menu,
  Monitor,
  RefreshCw,
  Search,
  Server,
  Settings,
  ShieldCheck,
  TriangleAlert,
  X,
} from "lucide-react";
import {
  backups,
  containers,
  events,
  healthScore,
  nodes,
  selectResources,
  storage,
  vms,
  type Resource,
} from "./data";
import {
  Bar,
  Detail,
  MonitoringChart,
  Panel,
  ResourceTable,
  Spark,
  Status,
} from "./components";
const nav = [
  { name: "Dashboard", icon: Grid2X2 },
  { name: "Proxmox Nodes", icon: Server },
  { name: "Virtuelle Maschinen", icon: Monitor },
  { name: "LXC Container", icon: Box },
  { name: "Storage", icon: Database },
  { name: "Backups", icon: ShieldCheck },
  { name: "Monitoring", icon: Activity },
  { name: "Alerts & Events", icon: Bell },
  { name: "Einstellungen", icon: Settings },
];
export default function App() {
  const [page, setPage] = useState(location.hash.slice(1) || "Dashboard");
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("alle");
  const [sort, setSort] = useState("name");
  const [range, setRange] = useState("4h");
  const [detail, setDetail] = useState<Resource | null>(null);
  const [menu, setMenu] = useState(false);
  const [updated, setUpdated] = useState(new Date());
  const [interval, setIntervalValue] = useState(
    Number(localStorage.getItem("refresh")) || 30,
  );
  const [diagnostic, setDiagnostic] = useState("Noch nicht geprüft");
  const [checking, setChecking] = useState(false);
  useEffect(() => {
    const fn = () => {
      const next = decodeURIComponent(location.hash.slice(1));
      setPage(nav.some((n) => n.name === next) ? next : "Dashboard");
      setQuery("");
      setStatus("alle");
      setMenu(false);
    };
    window.addEventListener("hashchange", fn);
    fn();
    return () => window.removeEventListener("hashchange", fn);
  }, []);
  useEffect(() => {
    const timer = window.setInterval(
      () => setUpdated(new Date()),
      interval * 1000,
    );
    return () => window.clearInterval(timer);
  }, [interval]);
  useEffect(() => {
    const fn = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setDetail(null);
        setMenu(false);
      }
    };
    window.addEventListener("keydown", fn);
    return () => window.removeEventListener("keydown", fn);
  }, []);
  function go(p: string) {
    location.hash = encodeURIComponent(p);
  }
  async function diagnose() {
    setChecking(true);
    setDiagnostic("Verbindung wird geprüft …");
    try {
      const response = await fetch("/api/health", {
        signal: AbortSignal.timeout(5000),
      });
      const data = await response.json();
      if (!response.ok || data.application !== "InfraControl") throw Error();
      setDiagnostic(
        "Backend erreichbar · InfraControl online (Proxmox separat prüfen)",
      );
    } catch {
      setDiagnostic(
        "Kein Backend an dieser Adresse erreichbar. Die Demo arbeitet unabhängig.",
      );
    } finally {
      setChecking(false);
    }
  }
  const storagePanel = (
    <div className="storage-list">
      {storage.map((s) => (
        <div className="storage-row" key={s.name}>
          <HardDrive size={15} />
          <strong>
            {s.name}
            <small>{s.type} · verfügbar</small>
          </strong>
          <div className="storage-meter">
            <span>
              {s.used.toFixed(1)} TB <em>/ {s.total} TB</em>
            </span>
            <Bar value={(s.used / s.total) * 100} />
          </div>
          <span>{Math.round((s.used / s.total) * 100)}%</span>
          <Spark seed={s.total % 8} />
          <span className="free">{(s.total - s.used).toFixed(1)} TB frei</span>
        </div>
      ))}
    </div>
  );
  const backupPanel = (
    <div className="backup-list">
      <div className="mini-head">
        <span>AUFTRAG / RESSOURCE</span>
        <span>LETZTES ERGEBNIS</span>
        <span>LETZTER LAUF</span>
      </div>
      {backups.map((b) => (
        <div className="backup-row" key={b.name}>
          <span>
            {b.name}
            <small>{b.resource}</small>
          </span>
          <Status value={b.status} />
          <span>{b.time}</span>
        </div>
      ))}
      <div className="panel-note">
        Simulierter Task-Verlauf · keine konfigurierten Live-Jobs
      </div>
    </div>
  );
  const alertsPanel = (
    <div className="alerts">
      {events
        .filter(
          (e) =>
            (e.text + " " + e.resource)
              .toLowerCase()
              .includes(query.toLowerCase()) &&
            (status === "alle" || e.severity === status),
        )
        .map((e) => (
          <article
            className={`alert ${e.severity === "Kritisch" ? "critical" : e.severity === "Warnung" ? "warning" : "info"}`}
            key={e.text}
          >
            {e.severity === "Info" ? (
              <CheckCircle2 size={17} />
            ) : (
              <TriangleAlert size={17} />
            )}
            <div>
              <strong>{e.text}</strong>
              <small>
                {e.resource} <span>· {e.status}</span>
              </small>
            </div>
            <time>{e.time}</time>
          </article>
        ))}
    </div>
  );
  const monitoring = (
    <>
      <div className="monitoring-meta">
        <div>
          <span className="legend blue" />
          CPU <strong>18,3 %</strong>
        </div>
        <div>
          <span className="legend green" />
          RAM <strong>40,0 %</strong>
        </div>
        <select
          aria-label="Zeitraum"
          value={range}
          onChange={(e) => setRange(e.target.value)}
        >
          <option value="1h">1 Stunde</option>
          <option value="4h">4 Stunden</option>
          <option value="24h">24 Stunden</option>
        </select>
      </div>
      <MonitoringChart range={range} />
      <div className="panel-note">
        <span className="status good">
          <i />
          Keine Verbindungsfehler in der Demo
        </span>
        <span>Verlauf simuliert</span>
      </div>
    </>
  );
  return (
    <div className="app-shell">
      <aside className={`sidebar ${menu ? "expanded" : ""}`}>
        <a
          href="#Dashboard"
          className="brand"
          aria-label="InfraControl Dashboard"
        >
          <Layers3 size={25} />
        </a>
        <nav>
          {nav.slice(0, 8).map((n) => (
            <button
              key={n.name}
              onClick={() => go(n.name)}
              className={page === n.name ? "active" : ""}
              title={n.name}
              aria-label={n.name}
              aria-current={page === n.name ? "page" : undefined}
            >
              <n.icon size={20} />
              <span>{n.name}</span>
            </button>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <button
            title="Einstellungen"
            aria-label="Einstellungen"
            className={page === "Einstellungen" ? "active" : ""}
            onClick={() => go("Einstellungen")}
          >
            <Settings size={21} />
            <span>Einstellungen</span>
          </button>
          <div className="avatar" title="Lokale Demo-Sitzung">
            IC
          </div>
        </div>
      </aside>
      <div className="workspace">
        <header className="topbar">
          <div className="header-brand">
            <button
              className="icon-button mobile-menu"
              aria-label="Navigation öffnen"
              onClick={() => setMenu(!menu)}
            >
              {menu ? <X /> : <Menu />}
            </button>
            <strong>
              INFRA<span>CONTROL</span>
              <sup>V1.0</sup>
            </strong>
            <div className="header-divider" />
            <span className="workspace-label">
              Infrastructure Operations Center
            </span>
          </div>
          <div className="header-actions">
            <span className="demo-badge">
              <i /> DEMO MODE
            </span>
            <button
              className="icon-button"
              aria-label="Alerts anzeigen"
              onClick={() => go("Alerts & Events")}
            >
              <Bell size={18} />
              <b className="notification-dot" />
            </button>
            <button
              className="icon-button"
              aria-label="Anwendungsinformationen"
              onClick={() => go("Einstellungen")}
            >
              <CircleHelp size={18} />
            </button>
            <div className="profile">LB</div>
          </div>
        </header>
        <main>
          <div className="page-heading">
            <div>
              <div className="breadcrumbs">
                WORKSPACE <ChevronRight size={11} /> PROXMOX VE{" "}
                <ChevronRight size={11} /> <span>ÜBERSICHT</span>
              </div>
              <h1>
                {page === "Dashboard" ? "Infrastructure Overview" : page}
                <span className="live-label">
                  <i /> DEMO
                </span>
              </h1>
              <p>Deine gesamte Infrastruktur. Ein zentraler Überblick.</p>
            </div>
            <div className="page-actions">
              <span>
                <Clock3 size={13} /> Aktualisiert{" "}
                {updated.toLocaleTimeString("de-DE", {
                  hour: "2-digit",
                  minute: "2-digit",
                  second: "2-digit",
                })}
              </span>
              <button className="button" onClick={() => setUpdated(new Date())}>
                <RefreshCw size={14} />
                Aktualisieren
              </button>
            </div>
          </div>
          <div className="demo-notice">
            <span>
              <span className="demo-pulse" />
              Demo-Umgebung <span className="notice-divider">/</span> Alle
              Infrastrukturwerte und Verläufe sind simuliert.
            </span>
            <button onClick={() => go("Einstellungen")}>
              Details <ChevronRight size={13} />
            </button>
          </div>
          {page === "Dashboard" ? (
            <>
              <div className="summary-strip">
                {[
                  {
                    label: "PROXMOX CLUSTER",
                    value: "infra-production",
                    sub: "3 Nodes · Quorum OK",
                    icon: Layers3,
                  },
                  {
                    label: "VIRTUELLE MASCHINEN",
                    value: "07",
                    sub: "/ 08 aktiv",
                    icon: Monitor,
                  },
                  {
                    label: "LXC CONTAINER",
                    value: "06",
                    sub: "/ 06 aktiv",
                    icon: Box,
                  },
                  {
                    label: "STORAGE GESAMT",
                    value: "26,1 TB",
                    sub: "/ 58 TB belegt",
                    icon: Database,
                  },
                  {
                    label: "AKTIVE MELDUNGEN",
                    value: "02",
                    sub: "1 kritisch · 1 Warnung",
                    icon: Bell,
                  },
                ].map((s, i) => (
                  <div key={s.label}>
                    <s.icon size={20} />
                    <div>
                      <small>{s.label}</small>
                      <strong>
                        {s.value} <span>{s.sub}</span>
                      </strong>
                    </div>
                    {i === 0 && <i className="online-dot" />}
                  </div>
                ))}
              </div>
              <div className="dashboard-grid">
                <Panel title="Cluster Health" className="health-panel">
                  <div className="health-content">
                    <div
                      className="gauge"
                      style={{
                        background: `conic-gradient(var(--success) ${healthScore() * 3.6}deg, #203044 0)`,
                      }}
                    >
                      <div>
                        <strong>
                          {healthScore()}
                          <span>%</span>
                        </strong>
                        <small>Verfügbar</small>
                        <span className="gauge-caption">CLUSTER HEALTH</span>
                      </div>
                    </div>
                    <div className="health-checks">
                      {[
                        ["Nodes", "3 / 3"],
                        ["Virtuelle Maschinen", "7 / 8"],
                        ["LXC Container", "6 / 6"],
                        ["Storage Pools", "5 / 5"],
                        ["Backup-Tasks", "5 / 6"],
                      ].map(([k, v], i) => (
                        <div key={k}>
                          <CheckCircle2
                            size={14}
                            className={i === 1 || i === 4 ? "warning-text" : ""}
                          />
                          <span>{k}</span>
                          <strong>{v}</strong>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="panel-note">
                    Mittelwert aus fünf Verfügbarkeitsquoten{" "}
                    <ShieldCheck size={13} />
                  </div>
                </Panel>
                <Panel
                  title="Proxmox Nodes"
                  count={3}
                  action={() => go("Proxmox Nodes")}
                >
                  <ResourceTable rows={nodes} compact onSelect={setDetail} />
                  <div className="node-bottom">
                    <span className="status good">
                      <i />
                      Alle Nodes erreichbar
                    </span>
                    <span>Proxmox VE · Demo</span>
                  </div>
                </Panel>
                <Panel
                  title="System Monitoring"
                  className="monitor-panel"
                  action={() => go("Monitoring")}
                >
                  {monitoring}
                </Panel>
                <Panel
                  title="Virtuelle Maschinen"
                  count={8}
                  action={() => go("Virtuelle Maschinen")}
                >
                  <ResourceTable
                    rows={vms.slice(0, 5)}
                    compact
                    onSelect={setDetail}
                  />
                  <button
                    className="table-footer"
                    onClick={() => go("Virtuelle Maschinen")}
                  >
                    Alle 8 Maschinen anzeigen <ChevronRight size={12} />
                  </button>
                </Panel>
                <Panel
                  title="LXC Container"
                  count={6}
                  action={() => go("LXC Container")}
                >
                  <ResourceTable
                    rows={containers.slice(0, 5)}
                    compact
                    onSelect={setDetail}
                  />
                  <button
                    className="table-footer"
                    onClick={() => go("LXC Container")}
                  >
                    Alle 6 Container anzeigen <ChevronRight size={12} />
                  </button>
                </Panel>
                <Panel
                  title="Alerts & Events"
                  count={2}
                  action={() => go("Alerts & Events")}
                >
                  {alertsPanel}
                  <div className="alert-summary">
                    <ShieldCheck size={25} />
                    <div>
                      Infrastruktur im Blick
                      <small>Schwellenwertbasierte Demo-Meldungen</small>
                    </div>
                  </div>
                </Panel>
                <Panel
                  title="Storage Pools"
                  count={5}
                  className="storage-panel"
                  action={() => go("Storage")}
                >
                  {storagePanel}
                </Panel>
                <Panel
                  title="Backup Tasks"
                  count={6}
                  action={() => go("Backups")}
                >
                  {backupPanel}
                </Panel>
                <Panel
                  title="Letzte Aktivitäten"
                  count={3}
                  action={() => go("Alerts & Events")}
                >
                  <div className="activity-list">
                    {[
                      {
                        title: "Snapshot erstellt",
                        sub: "vm-web-01 · pve-01",
                        time: "vor 13 Min",
                        icon: Download,
                      },
                      {
                        title: "Container gestartet",
                        sub: "ct-web-01 · pve-02",
                        time: "vor 18 Min",
                        icon: Box,
                      },
                      {
                        title: "Node-Synchronisierung",
                        sub: "cluster-infra · Quorum OK",
                        time: "vor 25 Min",
                        icon: RefreshCw,
                      },
                    ].map((a) => (
                      <div key={a.title}>
                        <span className="activity-icon">
                          <a.icon size={16} />
                        </span>
                        <div>
                          <strong>{a.title}</strong>
                          <small>{a.sub}</small>
                        </div>
                        <time>{a.time}</time>
                      </div>
                    ))}
                  </div>
                  <div className="panel-note">
                    Simulierte Proxmox-Ereignisse{" "}
                    <span className="status good">
                      <i />
                      Demo
                    </span>
                  </div>
                </Panel>
              </div>
            </>
          ) : (
            <div className="dedicated-page">
              {[
                "Proxmox Nodes",
                "Virtuelle Maschinen",
                "LXC Container",
              ].includes(page) ? (
                <Panel
                  title={page}
                  count={
                    (page === "Proxmox Nodes"
                      ? nodes
                      : page === "Virtuelle Maschinen"
                        ? vms
                        : containers
                    ).length
                  }
                >
                  <div className="filter-bar">
                    <label className="search">
                      <Search size={16} />
                      <input
                        aria-label="Ressourcen suchen"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder="Name, ID oder Node suchen …"
                      />
                    </label>
                    <select
                      aria-label="Status filtern"
                      value={status}
                      onChange={(e) => setStatus(e.target.value)}
                    >
                      <option value="alle">Alle Status</option>
                      <option value="online">Online</option>
                      <option value="gestoppt">Gestoppt</option>
                    </select>
                    <select
                      aria-label="Sortieren"
                      value={sort}
                      onChange={(e) => setSort(e.target.value)}
                    >
                      <option value="name">Name A–Z</option>
                      <option value="cpu">CPU absteigend</option>
                      <option value="ram">RAM absteigend</option>
                    </select>
                  </div>
                  <ResourceTable
                    rows={selectResources(
                      page === "Proxmox Nodes"
                        ? nodes
                        : page === "Virtuelle Maschinen"
                          ? vms
                          : containers,
                      query,
                      status,
                      sort,
                    )}
                    onSelect={setDetail}
                  />
                  {selectResources(
                    page === "Proxmox Nodes"
                      ? nodes
                      : page === "Virtuelle Maschinen"
                        ? vms
                        : containers,
                    query,
                    status,
                    sort,
                  ).length === 0 && (
                    <div className="empty">Keine passenden Ressourcen.</div>
                  )}
                </Panel>
              ) : page === "Storage" ? (
                <Panel title="Storage-Kapazität & Verfügbarkeit" count={5}>
                  {storagePanel}
                </Panel>
              ) : page === "Backups" ? (
                <>
                  <Panel title="Backup Task-Verlauf">{backupPanel}</Panel>
                  <Panel title="Konfigurierte Backup-Jobs">
                    <div className="empty">
                      Keine Live-Verbindung. Konfigurierte Jobs werden hier nach
                      erfolgreicher Proxmox-Anbindung angezeigt.
                      <p>Demo-Backup-Storage: backup · NFS · 6,9 TB frei</p>
                    </div>
                  </Panel>
                </>
              ) : page === "Monitoring" ? (
                <>
                  <Panel
                    title="CPU & RAM · Simulierter Ressourcenverlauf"
                    className="large-chart"
                  >
                    {monitoring}
                  </Panel>
                  <Panel title="Node-Metriken">
                    <ResourceTable rows={nodes} onSelect={setDetail} />
                  </Panel>
                  <Panel title="VM- und Container-Metriken">
                    <ResourceTable
                      rows={[...vms, ...containers]}
                      onSelect={setDetail}
                    />
                  </Panel>
                </>
              ) : page === "Alerts & Events" ? (
                <Panel title="Meldungen & Ereignisse">
                  <div className="filter-bar">
                    <label className="search">
                      <Search size={16} />
                      <input
                        aria-label="Ereignisse suchen"
                        placeholder="Ereignisse durchsuchen …"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                      />
                    </label>
                    <select
                      aria-label="Schweregrad"
                      value={status}
                      onChange={(e) => setStatus(e.target.value)}
                    >
                      <option value="alle">Alle Schweregrade</option>
                      {["Kritisch", "Warnung", "Info"].map((x) => (
                        <option key={x}>{x}</option>
                      ))}
                    </select>
                  </div>
                  {alertsPanel}
                  <p className="panel-note">
                    Demo-Schwellenwert: CPU &gt; 80 % = Warnung.
                    Fehlgeschlagener Backup-Task = kritisch. Meldungen sind
                    simuliert.
                  </p>
                </Panel>
              ) : (
                <div className="settings-grid">
                  <Panel title="Anwendung">
                    <dl>
                      <dt>Produkt</dt>
                      <dd>InfraControl V1.0</dd>
                      <dt>Modus</dt>
                      <dd>
                        <span className="demo-badge">DEMO MODE</span>
                      </dd>
                      <dt>Design</dt>
                      <dd>Dark Mode · NOC Control Center</dd>
                      <dt>Datenquelle</dt>
                      <dd>Lokaler, simulierter Datensatz</dd>
                    </dl>
                  </Panel>
                  <Panel title="Monitoring & Verbindung">
                    <label className="setting-label">
                      Anzeige-Aktualisierung
                      <select
                        value={interval}
                        onChange={(e) => {
                          const v = Number(e.target.value);
                          setIntervalValue(v);
                          localStorage.setItem("refresh", String(v));
                        }}
                      >
                        <option value={15}>15 Sekunden</option>
                        <option value={30}>30 Sekunden</option>
                        <option value={60}>60 Sekunden</option>
                      </select>
                    </label>
                    <p className="muted">
                      Die Demo aktualisiert den Anzeigezeitpunkt, nicht die
                      simulierten Messwerte. Es erfolgt kein automatischer
                      Backend-Zugriff.
                    </p>
                    <button
                      className="button"
                      disabled={checking}
                      onClick={diagnose}
                    >
                      <RefreshCw size={14} />
                      Backend prüfen
                    </button>
                    <p role="status">{diagnostic}</p>
                  </Panel>
                  <Panel title="Health-Berechnung">
                    <p className="explanation">
                      Der Cluster-Score ist der gerundete Mittelwert aus fünf
                      gleich gewichteten Quoten: erreichbare Nodes, laufende
                      VMs, laufende Container, verfügbare Storage Pools und
                      erfolgreiche Backup-Tasks. Gestoppte VMs senken diesen
                      Verfügbarkeitswert unabhängig davon, ob sie absichtlich
                      gestoppt wurden. Alle Daten sind simuliert.
                    </p>
                  </Panel>
                </div>
              )}
            </div>
          )}
          <footer>
            <span>
              <i className="online-dot" />
              InfraControl <b>v1.0</b>
              <span className="footer-divider">|</span> Proxmox Infrastructure
              Monitoring
            </span>
            <span>
              Nur lesender Zugriff <ShieldCheck size={12} />
              <span className="footer-divider">|</span>Demo-Daten · keine
              Live-Verbindung
            </span>
          </footer>
        </main>
      </div>
      {detail && <Detail resource={detail} onClose={() => setDetail(null)} />}
    </div>
  );
}
