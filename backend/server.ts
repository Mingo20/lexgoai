// LexGoAI — Servidor API (Deno, sin dependencias externas)
// Ejecutar desde la raíz del proyecto:  deno task dev  (o deno task start)
//
// Enrutado por riesgo: los servicios de riesgo BAJO con auto_entrega activada
// se entregan solos; riesgo MEDIO/ALTO genera una tarea de revisión profesional.

import { db, nowISO } from "./db.ts";
import { seed } from "./seed.ts";
import { renderDocument } from "./templates.ts";
import type { Professional, RequestStatus, ReviewTask, Service, ServiceRequest } from "./types.ts";

seed();

const PORT = Number(Deno.env.get("PORT") ?? 8000);
const FRONTEND = new URL("../frontend/", import.meta.url);
const ADMIN_PIN = Deno.env.get("ADMIN_PIN") ?? "lexgo2026";

// ── Utilidades ─────────────────────────────────────────────────────────

async function sha256(input: string): Promise<string> {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(input));
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, "0")).join("");
}
const ADMIN_TOKEN = await sha256(ADMIN_PIN);

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET,POST,PATCH,OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type,x-admin-token",
};

function json(data: unknown, status = 200, extra: Record<string, string> = {}): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json; charset=utf-8", ...CORS, ...extra },
  });
}

async function body(req: Request): Promise<Record<string, unknown>> {
  try {
    return await req.json() as Record<string, unknown>;
  } catch {
    return {};
  }
}

function requestStatus(req_awaited: ServiceRequest, service: Service): RequestStatus {
  const missing = service.fields.filter((f) => f.required && !req_awaited.answers[f.key]?.trim());
  return missing.length ? "recopilando" : "listo";
}

function withService<T extends { service_id: string }>(row: T): T & { service?: Service } {
  const service = db.get("services", row.service_id);
  return { ...row, service };
}

// ── Rutas ───────────────────────────────────────────────────────────────

type Params = Record<string, string>;
type Handler = (req: Request, params: Params, url: URL) => Promise<Response> | Response;

const routes: { method: string; re: RegExp; keys: string[]; handler: Handler }[] = [];

function route(method: string, path: string, handler: Handler) {
  const keys: string[] = [];
  const re = new RegExp(
    "^" +
      path.split("/").map((seg) =>
        seg.startsWith(":")
          ? (keys.push(seg.slice(1)), "([^/]+)")
          : seg.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
      ).join("/") +
      "$",
  );
  routes.push({ method, re, keys, handler });
}

// Público — catálogo
route("GET", "/api/services", () => {
  const services = db.all("services");
  services.sort((a, b) => a.area.localeCompare(b.area) || a.price_min - b.price_min);
  return json(services);
});

route("GET", "/api/services/:id", (_req, p) => {
  const service = db.get("services", p.id);
  return service ? json(service) : json({ error: "Servicio no encontrado" }, 404);
});

route("GET", "/api/legal-sources", () => json(db.all("legal_sources")));

route("GET", "/api/areas", () => {
  const services = db.all("services");
  const areas = [...new Set(services.map((s) => s.area))];
  return json(areas.map((a) => ({
    id: a,
    services: services.filter((s) => s.area === a).length,
  })));
});

// Público — solicitudes de cliente
route("POST", "/api/requests", async (req) => {
  const b = await body(req);
  const service = db.get("services", String(b.service_id ?? ""));
  if (!service) return json({ error: "Servicio no encontrado" }, 404);
  if (!b.client_id) return json({ error: "client_id requerido" }, 400);

  const request = db.insert("requests", {
    id: crypto.randomUUID(),
    service_id: service.id,
    client_id: String(b.client_id),
    status: "recopilando",
    risk: service.risk,
    answers: {},
    created_date: nowISO(),
    updated_date: nowISO(),
  });
  return json(withService(request), 201);
});

route("GET", "/api/requests", (_req, _p, url) => {
  const clientId = url.searchParams.get("client_id");
  if (!clientId) return json({ error: "client_id requerido" }, 400);
  const list = db.filter("requests", (r) => r.client_id === clientId)
    .map((r) => {
      const doc = db.filter("documents", (d) => d.request_id === r.id)[0];
      return { ...withService(r), document_id: doc?.id ?? null, document_title: doc?.title ?? null };
    });
  list.sort((a, b) => b.created_date.localeCompare(a.created_date));
  return json(list);
});

route("GET", "/api/requests/:id", (_req, p) => {
  const r = db.get("requests", p.id);
  if (!r) return json({ error: "Solicitud no encontrada" }, 404);
  const document = db.filter("documents", (d) => d.request_id === r.id)[0] ?? null;
  const review = db.filter("review_tasks", (t) => t.request_id === r.id)[0] ?? null;
  return json({ request: r, service: withService(r).service, document, review_task: review });
});

route("POST", "/api/requests/:id/answers", async (req, p) => {
  const r = db.get("requests", p.id);
  if (!r) return json({ error: "Solicitud no encontrada" }, 404);
  if (r.status !== "recopilando" && r.status !== "listo") {
    return json({ error: "La solicitud ya no admite cambios de datos" }, 409);
  }
  const b = await body(req);
  const service = db.get("services", r.service_id);
  if (!service) return json({ error: "Servicio no encontrado" }, 404);

  const incoming = (b.answers ?? {}) as Record<string, string>;
  const valid = service.fields.some((f) => f.key in incoming);
  if (!valid) return json({ error: "Campo no válido" }, 400);

  for (const [k, v] of Object.entries(incoming)) {
    if (service.fields.some((f) => f.key === k)) r.answers[k] = String(v).trim();
  }
  r.status = requestStatus(r, service);
  r.updated_date = nowISO();
  db.save();

  const missing = service.fields.filter((f) => f.required && !r.answers[f.key]?.trim()).length;
  return json({ request: r, missing });
});

route("POST", "/api/requests/:id/generate", async (_req, p) => {
  const r = db.get("requests", p.id);
  if (!r) return json({ error: "Solicitud no encontrada" }, 404);
  if (r.status !== "listo") return json({ error: "Faltan datos por completar" }, 409);

  const service = db.get("services", r.service_id);
  if (!service) return json({ error: "Servicio no encontrado" }, 404);

  const delivered = service.auto_deliver && service.risk === "bajo";
  const doc = await renderDocument(service, r, db.all("legal_sources"), delivered);
  db.insert("documents", doc);

  let review_task = null;
  if (!delivered) {
    review_task = db.insert("review_tasks", {
      id: crypto.randomUUID(),
      request_id: r.id,
      document_id: doc.id,
      professional_id: null,
      status: "pendiente",
      notes: "",
      created_date: nowISO(),
      resolved_date: null,
    });
    r.status = "en_revision";
  } else {
    r.status = "entregado";
  }
  r.updated_date = nowISO();
  db.save();

  return json({ request: r, document: doc, review_task }, 201);
});

route("GET", "/api/documents/:id", (_req, p) => {
  const doc = db.get("documents", p.id);
  if (!doc) return json({ error: "Documento no encontrado" }, 404);
  const r = db.get("requests", doc.request_id);
  return json({ document: doc, request_status: r?.status ?? null, request_id: doc.request_id });
});

// ── Administración ──────────────────────────────────────────────────────

function isAdmin(req: Request): boolean {
  return req.headers.get("x-admin-token") === ADMIN_TOKEN;
}

route("POST", "/api/admin/login", async (req) => {
  const b = await body(req);
  const token = await sha256(String(b.pin ?? ""));
  if (token !== ADMIN_TOKEN) return json({ error: "PIN incorrecto" }, 401);
  return json({ token: ADMIN_TOKEN });
});

route("GET", "/api/admin/requests", (req) => {
  if (!isAdmin(req)) return json({ error: "No autorizado" }, 401);
  const list = db.all("requests").map((r) => {
    const doc = db.filter("documents", (d) => d.request_id === r.id)[0];
    return { ...withService(r), document_id: doc?.id ?? null };
  });
  list.sort((a, b) => b.created_date.localeCompare(a.created_date));
  return json(list);
});

route("GET", "/api/admin/review-tasks", (req) => {
  if (!isAdmin(req)) return json({ error: "No autorizado" }, 401);
  const list = db.all("review_tasks").map((t) => {
    const r = db.get("requests", t.request_id);
    const doc = db.get("documents", t.document_id);
    return {
      ...t,
      request: r,
      service: r ? db.get("services", r.service_id) : undefined,
      document_title: doc?.title ?? null,
    };
  });
  list.sort((a, b) => {
    const pend = (x: typeof a) => (x.status === "pendiente" ? 0 : 1);
    return pend(a) - pend(b) || b.created_date.localeCompare(a.created_date);
  });
  return json(list);
});

route("POST", "/api/admin/review-tasks/:id/decision", async (req, p) => {
  if (!isAdmin(req)) return json({ error: "No autorizado" }, 401);
  const task = db.get("review_tasks", p.id);
  if (!task) return json({ error: "Tarea no encontrada" }, 404);
  if (task.status !== "pendiente") return json({ error: "La tarea ya fue resuelta" }, 409);

  const b = await body(req);
  const decision = String(b.decision ?? "");
  if (decision !== "aprobada" && decision !== "rechazada") {
    return json({ error: "Decisión no válida" }, 400);
  }

  db.update("review_tasks", task.id, {
    status: decision,
    notes: String(b.notes ?? task.notes ?? ""),
    professional_id: b.professional_id ? String(b.professional_id) : null,
    resolved_date: nowISO(),
  });
  db.update("requests", task.request_id, {
    status: decision === "aprobada" ? "entregado" : "rechazado",
    updated_date: nowISO(),
  });
  if (decision === "aprobada") {
    const doc = db.get("documents", task.document_id);
    if (doc) db.update("documents", doc.id, { delivered: true });
  }
  return json({ ok: true, decision });
});

route("GET", "/api/admin/professionals", (req) => {
  if (!isAdmin(req)) return json({ error: "No autorizado" }, 401);
  return json(db.all("professionals"));
});

route("POST", "/api/admin/professionals", async (req) => {
  if (!isAdmin(req)) return json({ error: "No autorizado" }, 401);
  const b = await body(req);
  if (!b.name || !b.role) return json({ error: "Nombre y rol requeridos" }, 400);
  const prof = db.insert("professionals", {
    id: crypto.randomUUID(),
    name: String(b.name),
    role: b.role === "notario" ? "notario" : "abogado",
    license: String(b.license ?? ""),
    areas: Array.isArray(b.areas) ? (b.areas as string[]) : ["civil"],
    active: true,
  });
  return json(prof, 201);
});

route("PATCH", "/api/admin/professionals/:id", async (req, p) => {
  if (!isAdmin(req)) return json({ error: "No autorizado" }, 401);
  const prof = db.get("professionals", p.id);
  if (!prof) return json({ error: "Profesional no encontrado" }, 404);
  const b = await body(req);
  const updated = db.update("professionals", p.id, {
    active: typeof b.active === "boolean" ? b.active : prof.active,
    name: b.name ? String(b.name) : prof.name,
  });
  return json(updated);
});

route("GET", "/api/admin/services", (req) => {
  if (!isAdmin(req)) return json({ error: "No autorizado" }, 401);
  return json(db.all("services"));
});

route("PATCH", "/api/admin/services/:id", async (req, p) => {
  if (!isAdmin(req)) return json({ error: "No autorizado" }, 401);
  const service = db.get("services", p.id);
  if (!service) return json({ error: "Servicio no encontrado" }, 404);
  const b = await body(req);
  const auto = Boolean(b.auto_deliver);
  if (auto && service.risk !== "bajo") {
    return json({ error: "Solo los servicios de riesgo bajo pueden entregarse automáticamente" }, 409);
  }
  const updated = db.update("services", p.id, { auto_deliver: auto });
  return json(updated);
});

// ── Despachador ─────────────────────────────────────────────────────────

const TYPES: Record<string, string> = {
  "html": "text/html; charset=utf-8",
  "css": "text/css; charset=utf-8",
  "js": "application/javascript; charset=utf-8",
  "json": "application/json",
  "webmanifest": "application/manifest+json",
  "png": "image/png",
  "svg": "image/svg+xml",
  "ico": "image/x-icon",
};

async function serveStatic(pathname: string): Promise<Response> {
  const rel = pathname === "/" || pathname === ""
    ? "index.html"
    : pathname.replace(/^\/+/, "");
  const target = new URL(rel, FRONTEND);
  const base = new URL(FRONTEND);
  if (!target.pathname.startsWith(base.pathname)) {
    return new Response("No encontrado", { status: 404 });
  }
  try {
    const file = await Deno.readFile(target);
    const ext = target.pathname.split(".").pop() ?? "html";
    const noCache = rel === "index.html" || rel === "sw.js";
    return new Response(file, {
      headers: {
        "Content-Type": TYPES[ext] ?? "application/octet-stream",
        ...(noCache ? { "Cache-Control": "no-store" } : {}),
      },
    });
  } catch {
    // SPA: cualquier ruta desconocida muestra la aplicación
    try {
      const index = await Deno.readFile(new URL("index.html", FRONTEND));
      return new Response(index, {
        headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store" },
      });
    } catch {
      return new Response("No encontrado", { status: 404 });
    }
  }
}

async function handle(req: Request): Promise<Response> {
  const url = new URL(req.url);
  const method = req.method.toUpperCase();

  if (method === "OPTIONS" && url.pathname.startsWith("/api/")) {
    return new Response(null, { status: 204, headers: CORS });
  }

  if (url.pathname.startsWith("/api/")) {
    let path = url.pathname;
    if (path.length > 1 && path.endsWith("/")) path = path.slice(0, -1);
    for (const r of routes) {
      if (r.method !== method) continue;
      const m = r.re.exec(path);
      if (!m) continue;
      const params: Params = {};
      r.keys.forEach((k, i) => params[k] = decodeURIComponent(m[i + 1]));
      try {
        return await r.handler(req, params, url);
      } catch (err) {
        console.error(`[api] ${method} ${path}:`, err);
        return json({ error: "Error interno del servidor" }, 500);
      }
    }
    return json({ error: "Ruta no encontrada" }, 404);
  }

  if (method === "GET") return await serveStatic(url.pathname);
  return json({ error: "Método no permitido" }, 405);
}

Deno.serve({ port: PORT }, handle);
console.log(`LexGoAI escuchando en http://localhost:${PORT}`);
