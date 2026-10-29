import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Check, ChevronRight, Monitor, Box, Server, X } from "lucide-react";
import type { ReactNode } from "react";
import { history, type Resource } from "./data";
export function Panel({
  title,
  count,
  action,
  children,
  className = "",
}: {
  title: string;
  count?: number;
  action?: () => void;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={`panel ${className}`}>
      <div className="panel-heading">
        <h2>
          {title}{" "}
          {count !== undefined && <span className="count">{count}</span>}
        </h2>
        {action && (
          <button
            className="icon-button"
            title={`Alle ${title} anzeigen`}
            onClick={action}
          >
            <ChevronRight size={15} />
          </button>
        )}
      </div>
      {children}
    </section>
  );
}
export function Status({ value = "online" }: { value?: string }) {
  const good = ["online", "Erfolgreich", "Abgeschlossen"].includes(value);
  return (
    <span
      className={`status ${good ? "good" : value === "gestoppt" ? "muted" : "bad"}`}
    >
      <i />
      {value}
    </span>
  );
}
export function Bar({ value }: { value: number }) {
  return (
    <div className="bar">
      <i
        style={{
          width: `${value}%`,
          background: value > 80 ? "var(--warning)" : undefined,
        }}
      />
    </div>
  );
}
export function Spark({
  seed = 0,
  green = false,
}: {
  seed?: number;
  green?: boolean;
}) {
  const points = history
    .slice(seed, seed + 20)
    .map((p, i) => `${i * 4},${30 - p.cpu * 0.5}`)
    .join(" ");
  return (
    <svg
      className={`spark ${green ? "green" : ""}`}
      viewBox="0 0 76 30"
      aria-label="Simulierter Verlauf"
    >
      <path d="M0 27H76" stroke="currentColor" opacity=".15" />
      <polyline
        points={points}
        fill="none"
        stroke="currentColor"
        strokeWidth="1.2"
      />
    </svg>
  );
}
export function ResourceTable({
  rows,
  onSelect,
  compact = false,
}: {
  rows: Resource[];
  onSelect: (r: Resource) => void;
  compact?: boolean;
}) {
  return (
    <div className="table-scroll">
      <table>
        <thead>
          <tr>
            <th>{rows[0]?.kind === "Node" ? "NODE" : "NAME / ID"}</th>
            {!compact && <th>NODE</th>}
            <th>STATUS</th>
            <th>CPU</th>
            <th>RAM</th>
            {!compact && <th>UPTIME</th>}
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.id}>
              <td>
                <button className="resource-name" onClick={() => onSelect(r)}>
                  {r.kind === "Node" ? (
                    <Server size={15} />
                  ) : r.kind === "VM" ? (
                    <Monitor size={15} />
                  ) : (
                    <Box size={15} />
                  )}
                  <span>
                    {r.name}
                    <small>{r.kind !== "Node" && r.id}</small>
                  </span>
                  {compact && r.kind !== "Node" && (
                    <Spark seed={r.id % 10} green={r.kind === "LXC"} />
                  )}
                </button>
              </td>
              {!compact && <td>{r.node}</td>}
              <td>
                <Status value={r.status} />
              </td>
              <td>{r.cpu}%</td>
              <td>{r.ram}%</td>
              {!compact && <td>{r.uptime}</td>}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
export function MonitoringChart({ range = "4h" }: { range?: string }) {
  return (
    <div className="chart">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart
          data={
            range === "1h"
              ? history.slice(-12)
              : range === "24h"
                ? history.filter((_, i) => i % 2 === 0)
                : history
          }
        >
          <defs>
            <linearGradient id="cpuFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#25bfff" stopOpacity={0.23} />
              <stop offset="100%" stopColor="#25bfff" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid
            vertical={false}
            stroke="#203044"
            strokeDasharray="3 5"
          />
          <XAxis
            dataKey="time"
            tick={{ fill: "#6f859f", fontSize: 10 }}
            axisLine={false}
            tickLine={false}
            minTickGap={35}
          />
          <YAxis domain={[0, 100]} hide />
          <Tooltip
            contentStyle={{
              background: "#101c2c",
              border: "1px solid #24364c",
              borderRadius: 6,
              fontSize: 12,
            }}
            formatter={(v) => `${v}%`}
          />
          <Area
            type="monotone"
            dataKey="ram"
            name="RAM"
            stroke="#23d980"
            fill="transparent"
            strokeWidth={1.4}
          />
          <Area
            type="monotone"
            dataKey="cpu"
            name="CPU"
            stroke="#25bfff"
            fill="url(#cpuFill)"
            strokeWidth={1.8}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
export function Detail({
  resource,
  onClose,
}: {
  resource: Resource;
  onClose: () => void;
}) {
  return (
    <div className="modal-backdrop" onClick={onClose}>
      <section
        className="modal"
        role="dialog"
        aria-modal="true"
        aria-label="Ressourcendetails"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          className="icon-button close"
          onClick={onClose}
          aria-label="Details schließen"
          autoFocus
        >
          <X />
        </button>
        <span className="eyebrow">{resource.kind} · DEMODATEN</span>
        <h2>{resource.name}</h2>
        <Status value={resource.status} />
        <div className="detail-grid">
          {[
            ["ID", resource.id],
            ["Node", resource.node],
            ["CPU", `${resource.cpu}%`],
            ["RAM", `${resource.ram}%`],
            ["Uptime", resource.uptime],
          ].map(([k, v]) => (
            <div key={k}>
              <small>{k}</small>
              <strong>{v}</strong>
            </div>
          ))}
        </div>
        <MonitoringChart />
        <p className="muted">
          <Check size={13} /> Nur lesender Zugriff · Verlauf simuliert
        </p>
      </section>
    </div>
  );
}
