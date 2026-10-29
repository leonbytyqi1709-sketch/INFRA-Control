export interface Resource {
  id: number;
  name: string;
  node: string;
  status: string;
  cpu: number;
  ram: number;
  uptime: string;
  kind: "VM" | "LXC" | "Node";
}
export const nodes: Resource[] = [18, 22, 15].map((cpu, i) => ({
  id: i + 1,
  name: `pve-0${i + 1}`,
  node: `pve-0${i + 1}`,
  status: "online",
  cpu,
  ram: [43, 37, 40][i],
  uptime: "23 T 14 Std",
  kind: "Node",
}));
export const vms: Resource[] = [
  "vm-web-01",
  "vm-app-01",
  "vm-db-01",
  "vm-mail-01",
  "vm-dev-01",
  "vm-proxy-01",
  "vm-test-01",
  "vm-build-01",
].map((name, i) => ({
  id: 100 + i,
  name,
  node: `pve-0${(i % 3) + 1}`,
  status: i === 7 ? "gestoppt" : "online",
  cpu: [4, 7, 12, 3, 6, 2, 8, 0][i],
  ram: [35, 42, 60, 28, 33, 18, 41, 0][i],
  uptime: i === 7 ? "—" : "12 T 6 Std",
  kind: "VM",
}));
export const containers: Resource[] = [
  "ct-web-01",
  "ct-proxy-01",
  "ct-gitlab-01",
  "ct-monitoring-01",
  "ct-dns-01",
  "ct-vault-01",
].map((name, i) => ({
  id: 200 + i,
  name,
  node: `pve-0${(i % 3) + 1}`,
  status: "online",
  cpu: [2, 1, 3, 2, 1, 2][i],
  ram: [22, 18, 25, 20, 15, 19][i],
  uptime: "18 T 9 Std",
  kind: "LXC",
}));
export const storage = [
  { name: "tank", used: 12.4, total: 20, type: "ZFS" },
  { name: "zdata", used: 7.6, total: 16, type: "ZFS" },
  { name: "backup", used: 3.1, total: 10, type: "NFS" },
  { name: "local-lvm", used: 1.2, total: 4, type: "LVM-thin" },
  { name: "container", used: 2.8, total: 8, type: "ZFS" },
];
export const backups = [
  "vm-backup-daily",
  "ct-backup-daily",
  "db-backup",
  "files-backup",
  "config-backup",
  "weekly-archive",
].map((name, i) => ({
  name,
  resource: i % 2 ? "LXC 201" : "VM 100",
  status: i === 2 ? "Fehlgeschlagen" : "Erfolgreich",
  time: ["13 Min", "18 Min", "32 Min", "45 Min", "1 Std", "1 Tag"][i],
}));
export const events = [
  {
    severity: "Warnung",
    text: "CPU-Auslastung über 80 %",
    resource: "pve-02",
    time: "vor 5 Min",
    status: "Offen",
  },
  {
    severity: "Kritisch",
    text: "Backup-Auftrag fehlgeschlagen",
    resource: "VM 102 · db-backup",
    time: "vor 32 Min",
    status: "Offen",
  },
  {
    severity: "Info",
    text: "Cluster-Quorum bestätigt",
    resource: "cluster-infra",
    time: "vor 1 Std",
    status: "Abgeschlossen",
  },
];
export const history = Array.from({ length: 48 }, (_, i) => ({
  time: `${String(12 + Math.floor(i / 12)).padStart(2, "0")}:${String((i % 12) * 5).padStart(2, "0")}`,
  cpu: Math.round(
    21 + 8 * Math.sin(i * 1.7) + 5 * Math.cos(i * 0.6) + (i === 25 ? 32 : 0),
  ),
  ram: Math.round(40 + 3 * Math.sin(i * 0.5)),
}));
/** Health = mean of five equally weighted availability ratios: nodes, running VMs, running LXC, available storage and successful backup tasks. Demo snapshots only. */
export function healthScore() {
  const ratios = [
    nodes.filter((x) => x.status === "online").length / nodes.length,
    vms.filter((x) => x.status === "online").length / vms.length,
    containers.filter((x) => x.status === "online").length / containers.length,
    1,
    backups.filter((x) => x.status === "Erfolgreich").length / backups.length,
  ];
  return Math.round((ratios.reduce((a, b) => a + b, 0) / ratios.length) * 100);
}
export function selectResources(
  rows: Resource[],
  query: string,
  status: string,
  sort: string,
) {
  return rows
    .filter(
      (r) =>
        (r.name + " " + r.id + " " + r.node)
          .toLowerCase()
          .includes(query.toLowerCase()) &&
        (status === "alle" || r.status === status),
    )
    .sort((a, b) =>
      sort === "cpu"
        ? b.cpu - a.cpu
        : sort === "ram"
          ? b.ram - a.ram
          : a.name.localeCompare(b.name),
    );
}
