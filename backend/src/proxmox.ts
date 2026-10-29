/** Server-only, read-only Proxmox adapter. Never disable TLS verification. */
export class ProxmoxError extends Error {
  constructor(public code: string) {
    super(code);
  }
}
export function configured() {
  return Boolean(
    process.env.PROXMOX_URL &&
    process.env.PROXMOX_TOKEN_ID &&
    process.env.PROXMOX_TOKEN_SECRET,
  );
}
async function read(path: string): Promise<unknown> {
  const base = process.env.PROXMOX_URL;
  const id = process.env.PROXMOX_TOKEN_ID;
  const secret = process.env.PROXMOX_TOKEN_SECRET;
  if (!base || !id || !secret) throw new ProxmoxError("NOT_CONFIGURED");
  let url: URL;
  try {
    url = new URL(base);
    if (
      url.protocol !== "https:" ||
      url.username ||
      url.password ||
      url.search ||
      url.hash
    )
      throw Error();
  } catch {
    throw new ProxmoxError("INVALID_CONFIGURATION");
  }
  url.pathname = "/api2/json" + path;
  let response: Response;
  try {
    response = await fetch(url, {
      headers: { Authorization: `PVEAPIToken=${id}=${secret}` },
      signal: AbortSignal.timeout(8000),
      redirect: "error",
    });
  } catch {
    throw new ProxmoxError("CONNECTION_FAILED");
  }
  if (!response.ok)
    throw new ProxmoxError(
      response.status === 401 || response.status === 403
        ? "ACCESS_DENIED"
        : "UPSTREAM_FAILED",
    );
  let body: unknown;
  try {
    body = await response.json();
  } catch {
    throw new ProxmoxError("INVALID_RESPONSE");
  }
  if (!body || typeof body !== "object" || !("data" in body))
    throw new ProxmoxError("INVALID_RESPONSE");
  return body.data;
}
function records(value: unknown): Record<string, unknown>[] {
  if (
    !Array.isArray(value) ||
    value.some((r) => !r || typeof r !== "object" || Array.isArray(r))
  )
    throw new ProxmoxError("INVALID_RESPONSE");
  return value as Record<string, unknown>[];
}
function str(v: unknown) {
  return typeof v === "string" ? v : null;
}
function num(v: unknown) {
  return typeof v === "number" && Number.isFinite(v) ? v : null;
}
export async function snapshot() {
  const [version, ns, rs, jobs, tasks] = await Promise.all([
    read("/version"),
    read("/nodes"),
    read("/cluster/resources"),
    read("/cluster/backup")
      .then(records)
      .then((data) => ({
        available: true,
        data: data.map((j) => ({
          id: str(j.id),
          schedule: str(j.schedule),
          enabled: num(j.enabled),
        })),
      }))
      .catch(() => ({ available: false, data: [] })),
    read("/cluster/tasks")
      .then(records)
      .then((data) => ({
        available: true,
        data: data.map((t) => ({
          node: str(t.node),
          type: str(t.type),
          id: str(t.id),
          status: str(t.status),
          starttime: num(t.starttime),
          endtime: num(t.endtime),
        })),
      }))
      .catch(() => ({ available: false, data: [] })),
  ]);
  if (
    !version ||
    typeof version !== "object" ||
    !("version" in version) ||
    typeof version.version !== "string"
  )
    throw new ProxmoxError("INVALID_RESPONSE");
  const resources = records(rs).map((r) => ({
    id: str(r.id),
    name: str(r.name),
    node: str(r.node),
    type: str(r.type),
    vmid: num(r.vmid),
    status: str(r.status),
    cpu: num(r.cpu),
    mem: num(r.mem),
    maxmem: num(r.maxmem),
    disk: num(r.disk),
    maxdisk: num(r.maxdisk),
    uptime: num(r.uptime),
  }));
  return {
    mode: "live",
    timestamp: new Date().toISOString(),
    version: version.version,
    nodes: records(ns).map((n) => ({
      node: str(n.node),
      status: str(n.status),
      cpu: num(n.cpu),
      mem: num(n.mem),
      maxmem: num(n.maxmem),
      uptime: num(n.uptime),
    })),
    resources,
    backupJobs: jobs,
    tasks,
  };
}
