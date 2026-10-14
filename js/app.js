/* LexGoAI — SPA (vanilla JS, sin dependencias) */
(() => {
  "use strict";

  const API = window.LEXGO_API_BASE ?? "";
  const B44 = window.LEXGO_BACKEND === "base44";
  const app = document.getElementById("app");

  // ── Identidad anónima del cliente ─────────────────────────────
  const clientId = (() => {
    let id = localStorage.getItem("lexgo_client");
    if (!id) {
      id = crypto.randomUUID();
      localStorage.setItem("lexgo_client", id);
    }
    return id;
  })();

  async function api(path, opts = {}) {
    if (B44) return apiB44(path, opts);
    const headers = { ...(opts.headers || {}) };
    if (opts.body) headers["Content-Type"] = "application/json";
    const token = sessionStorage.getItem("lexgo_admin");
    if (token) headers["x-admin-token"] = token;
    const res = await fetch(API + path, {
      method: opts.method || "GET",
      headers,
      body: opts.body ? JSON.stringify(opts.body) : undefined,
    });
    if (!res.ok) {
      let msg = "";
      try { msg = (await res.json()).error || ""; } catch { /* sin cuerpo */ }
      throw new Error(msg || `Error ${res.status}`);
    }
    return res.json();
  }

  // Adaptador Base44: traduce las rutas REST a acciones de la función
  async function apiB44(path, opts = {}) {
    const method = opts.method || "GET";
    const payload = { ...(opts.body || {}) };
    const token = sessionStorage.getItem("lexgo_admin");
    if (token) payload.token = token;
    const [pathname, search] = path.split("?");
    for (const [k, v] of new URLSearchParams(search || "")) payload[k] = v;
    let m;
    let action = null;
    if (method === "GET" && pathname === "/api/services") action = "services";
    else if (method === "GET" && (m = pathname.match(/^\/api\/services\/([\w-]+)$/))) { action = "service"; payload.id = m[1]; }
    else if (method === "POST" && pathname === "/api/requests") action = "createRequest";
    else if (method === "GET" && pathname === "/api/requests") action = "listRequests";
    else if (method === "GET" && (m = pathname.match(/^\/api\/requests\/([\w-]+)$/))) { action = "getRequest"; payload.id = m[1]; }
    else if (method === "POST" && (m = pathname.match(/^\/api\/requests\/([\w-]+)\/answers$/))) { action = "postAnswers"; payload.id = m[1]; }
    else if (method === "POST" && (m = pathname.match(/^\/api\/requests\/([\w-]+)\/generate$/))) { action = "generate"; payload.id = m[1]; }
    else if (method === "GET" && (m = pathname.match(/^\/api\/documents\/([\w-]+)$/))) { action = "getDocument"; payload.id = m[1]; }
    else if (method === "POST" && pathname === "/api/admin/login") action = "adminLogin";
    else if (method === "GET" && pathname === "/api/admin/requests") action = "adminRequests";
    else if (method === "GET" && pathname === "/api/admin/review-tasks") action = "adminReviewTasks";
    else if (method === "POST" && (m = pathname.match(/^\/api\/admin\/review-tasks\/([\w-]+)\/decision$/))) { action = "adminDecision"; payload.id = m[1]; }
    else if (method === "GET" && pathname === "/api/admin/professionals") action = "adminProfessionals";
    else if (method === "POST" && pathname === "/api/admin/professionals") action = "adminAddProfessional";
    else if (method === "PATCH" && (m = pathname.match(/^\/api\/admin\/professionals\/([\w-]+)$/))) { action = "adminToggleProfessional"; payload.id = m[1]; }
    else if (method === "GET" && pathname === "/api/admin/services") action = "adminServices";
    else if (method === "PATCH" && (m = pathname.match(/^\/api\/admin\/services\/([\w-]+)$/))) { action = "adminSetServiceAuto"; payload.id = m[1]; }
    else throw new Error("Ruta no soportada: " + path);

    const res = await fetch(API + "/functions/lexgoaiApi", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, ...payload }),
    });
    if (!res.ok) {
      let msg = "";
      try { msg = (await res.json()).error || ""; } catch { /* sin cuerpo */ }
      throw new Error(msg || `Error ${res.status}`);
    }
    return res.json();
  }

  // ── Utilidades ────────────────────────────────────────────────
  const esc = (v) => String(v ?? "").replace(/[&<>"']/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);

  const fmtMoney = (n) => `RD$ ${Number(n || 0).toLocaleString("es-DO")}`;
  const priceRange = (s) => `${fmtMoney(s.price_min)} – ${fmtMoney(s.price_max)}`;
  const fmtDate = (iso) =>
    new Date(iso).toLocaleDateString("es-DO", { day: "numeric", month: "short", year: "numeric" });

  const AREA_LABELS = {
    civil: "Civil y contratos", laboral: "Laboral", comercial: "Comercial y empresarial",
    inmobiliario: "Inmobiliario", familia: "Familia y sucesiones",
  };

  const RISK = {
    bajo: { label: "Riesgo bajo", cls: "chip-green" },
    medio: { label: "Riesgo medio", cls: "chip-amber" },
    alto: { label: "Riesgo alto", cls: "chip-red" },
  };
  const STATUS = {
    recopilando: { label: "Recopilando datos", cls: "chip-blue" },
    listo: { label: "Listo para generar", cls: "chip-blue" },
    en_revision: { label: "En revisión profesional", cls: "chip-amber" },
    entregado: { label: "Entregado", cls: "chip-green" },
    rechazado: { label: "Rechazado", cls: "chip-red" },
  };
  const chip = (label, cls) => `<span class="chip ${cls}">${esc(label)}</span>`;

  const scaleIcon = `<path d="M4 6h16"/><path d="M8 6l-3.5 7a4 4 0 0 0 7 0L8 6Z"/><path d="M16 6l-3.5 7a4 4 0 0 0 7 0L16 6Z"/><path d="M12 3v18M8 21h8"/>`;

  const ICONS = {
    "file-text": `<path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/><path d="M14 2v4a2 2 0 0 0 2 2h4"/><path d="M16 13H8"/><path d="M16 17H8"/>`,
    "briefcase": `<rect width="20" height="14" x="2" y="7" rx="2"/><path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2"/>`,
    "building": `<rect width="16" height="18" x="4" y="3" rx="1"/><path d="M9 21v-3h6v3"/><path d="M8 7h2"/><path d="M8 11h2"/><path d="M8 15h2"/><path d="M14 7h2"/><path d="M14 11h2"/><path d="M14 15h2"/>`,
    "home": `<path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><path d="M9 22V12h6v10"/>`,
    "users": `<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>`,
    "shield": `<path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"/>`,
    "search": `<circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>`,
    "send": `<path d="m22 2-7 20-4-9-9-4Z"/><path d="M22 2 11 13"/>`,
    "mail": `<rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-10 6L2 7"/>`,
    "scale": scaleIcon,
    "list-check": `<path d="m3 6 2 2 3-3"/><path d="m3 13 2 2 3-3"/><path d="M13 6h8"/><path d="M13 13h8"/><path d="M8 20h13"/>`,
    "check": `<path d="M20 6 9 17l-5-5"/>`,
    "check-circle": `<circle cx="12" cy="12" r="10"/><path d="m9 12 2 2 4-4"/>`,
    "alert": `<path d="m21.73 18-8-14a2 2 0 0 0-3.46 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><path d="M12 9v4"/><path d="M12 17h.01"/>`,
    "clock": `<circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/>`,
    "arrow-left": `<path d="m12 19-7-7 7-7"/><path d="M19 12H5"/>`,
    "chevron-right": `<path d="m9 18 6-6-6-6"/>`,
    "download": `<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><path d="m7 10 5 5 5-5"/><path d="M12 15V3"/>`,
    "printer": `<path d="M6 9V3h12v6"/><rect x="3" y="9" width="18" height="8" rx="1"/><path d="M6 14h12v7H6z"/>`,
    "lock": `<rect x="4" y="11" width="16" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/>`,
    "plus": `<path d="M12 5v14"/><path d="M5 12h14"/>`,
    "x": `<path d="M18 6 6 18"/><path d="m6 6 12 12"/>`,
    "sparkle": `<path d="M12 2l2.4 7.6L22 12l-7.6 2.4L12 22l-2.4-7.6L2 12l7.6-2.4Z"/>`,
    "eye": `<path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/>`,
  };
  const icon = (name, cls = "") =>
    `<svg class="ic ${cls}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICONS[name] || scaleIcon}</svg>`;

  const iconTile = (name) => `<div class="icon-tile">${icon(name)}</div>`;

  // ── Ruteo ─────────────────────────────────────────────────────
  const ROUTES = [
    { re: /^#\/servicios?$/, view: () => viewServices() },
    { re: /^#\/servicio\/([\w-]+)$/, view: (m) => viewServiceDetail(m[1]) },
    { re: /^#\/asistente\/([\w-]+)$/, view: (m) => viewAssistant(m[1]) },
    { re: /^#\/documento\/([\w-]+)$/, view: (m) => viewDocument(m[1]) },
    { re: /^#\/mis-documentos$/, view: () => viewMyDocs() },
    { re: /^#\/admin$/, view: () => viewAdmin() },
  ];

  let adminTab = "expedientes";

  async function render() {
    const hash = location.hash || "#/servicios";
    document.querySelectorAll("[data-nav]").forEach((a) => a.classList.remove("active"));
    const route = ROUTES.find((r) => r.re.test(hash));
    const navKey = hash.startsWith("#/servicio") ? "servicios"
      : hash.startsWith("#/asistente") ? "servicios"
      : hash.startsWith("#/documento") ? "mis-documentos"
      : hash.replace("#/", "").split("/")[0];
    const navLink = document.querySelector(`[data-nav="${navKey}"]`);
    if (navLink) navLink.classList.add("active");
    try {
      if (route) {
        await route.view(route.re.exec(hash));
      } else {
        await viewServices();
      }
    } catch (err) {
      console.error(err);
      app.innerHTML = `
        <div class="card empty-state">
          ${iconTile("alert")}
          <h2>No se pudo cargar</h2>
          <p>${esc(err.message || "Verifica tu conexión e inténtalo de nuevo.")}</p>
          <button class="btn btn-primary" onclick="location.reload()">Reintentar</button>
        </div>`;
    }
    window.scrollTo(0, 0);
  }

  window.addEventListener("hashchange", render);

  // ── Vista: catálogo de servicios ──────────────────────────────
  async function viewServices() {
    const services = await api("/api/services");
    const areas = [...new Set(services.map((s) => s.area))];
    let filter = "todas";

    function draw() {
      const chips = ["todas", ...areas].map((a) =>
        `<button class="filter-btn ${filter === a ? "active" : ""}" data-area="${a}">${
          a === "todas" ? icon("sparkle") + " Todos los servicios" : icon(areaIcon(a)) + " " + AREA_LABELS[a]
        }</button>`).join("");

      const cards = services
        .filter((s) => filter === "todas" || s.area === filter)
        .map((s) => `
        <a class="card service-card" href="#/servicio/${s.id}">
          ${iconTile(s.icon)}
          <h3>${esc(s.name)}</h3>
          <p class="tagline">${esc(s.tagline)}</p>
          <div class="chips-row">
            ${chip(AREA_LABELS[s.area], "chip-plain")}
            ${chip(RISK[s.risk].label, RISK[s.risk].cls)}
            ${s.auto_deliver && s.risk === "bajo" ? chip("Entrega automática", "chip-blue") : chip("Con revisión profesional", "chip-amber")}
          </div>
          <p class="price">${priceRange(s)} <small>por servicio</small></p>
        </a>`).join("");

      app.innerHTML = `
        <section class="hero">
          <h1>¿En qué podemos ayudarte hoy?</h1>
          <p>Explica tu situación en tus palabras, elige el área y un asistente jurídico virtual te guiará paso a paso.</p>
        </section>
        <div class="filter-row">${chips}</div>
        <div class="services-grid">${cards}</div>`;

      app.querySelectorAll(".filter-btn").forEach((btn) =>
        btn.addEventListener("click", () => {
          filter = btn.dataset.area;
          draw();
        }));
    }
    draw();
  }

  function areaIcon(area) {
    return { civil: "file-text", laboral: "briefcase", comercial: "building", inmobiliario: "home", familia: "users" }[area] || "scale";
  }

  // ── Vista: detalle de servicio ────────────────────────────────
  async function viewServiceDetail(id) {
    const s = await api(`/api/services/${id}`);
    app.innerHTML = `
      <div class="service-detail">
        <div class="info">
          <a class="back-link" href="#/servicios">${icon("arrow-left")} Servicios</a>
          <h1>${esc(s.name)}</h1>
          <p class="desc">${esc(s.description)}</p>
          <div class="detail-block">
            <h2>Qué incluye</h2>
            <ul>${s.includes.map((i) => `<li>${icon("check")} ${esc(i)}</li>`).join("")}</ul>
          </div>
          <div class="detail-block">
            <h2>Qué necesitas a mano</h2>
            <ul>${s.requirements.map((i) => `<li>${icon("clock")} ${esc(i)}</li>`).join("")}</ul>
          </div>
          <div class="detail-block">
            <h2>Cómo funciona</h2>
            <ul>
              <li>${icon("check")} Un asistente virtual te hace las preguntas necesarias</li>
              <li>${icon("check")} El documento se prepara con fundamento jurídico citado</li>
              <li>${icon("check")} ${s.risk === "bajo" && s.auto_deliver ? "Si es de bajo riesgo, se entrega automáticamente" : "Un profesional revisa tu caso antes de entregarlo"}</li>
            </ul>
          </div>
        </div>
        <aside class="card price-card">
          ${iconTile(s.icon)}
          <p class="price-big">${priceRange(s)}</p>
          <p class="price-note">Precio informativo de prueba. Pagos aún no habilitados.</p>
          <div class="chips-row">
            ${chip(AREA_LABELS[s.area], "chip-plain")}
            ${chip(RISK[s.risk].label, RISK[s.risk].cls)}
          </div>
          <button class="btn btn-primary" id="start-btn">${icon("send")} Iniciar solicitud</button>
        </aside>
      </div>`;
    document.getElementById("start-btn").addEventListener("click", async (e) => {
      e.currentTarget.disabled = true;
      try {
        const r = await api("/api/requests", { method: "POST", body: { service_id: s.id, client_id: clientId } });
        location.hash = `#/asistente/${r.id}`;
      } catch (err) {
        app.insertAdjacentHTML("afterbegin", `<div class="err-box">${esc(err.message)}</div>`);
        e.currentTarget.disabled = false;
      }
    });
  }

  // ── Vista: asistente jurídico ─────────────────────────────────
  async function viewAssistant(requestId) {
    const { request, service, document, review_task } = await api(`/api/requests/${requestId}`);
    const answers = request.answers;
    const fields = service.fields;
    const answeredCount = fields.filter((f) => f.key in answers).length;
    const open = request.status === "recopilando" || request.status === "listo";

    const msgs = [];
    msgs.push(aiMsg(
      `Hola, soy tu <strong>asistente jurídico virtual</strong> (no un abogado). Te ayudaré a preparar tu <strong>${esc(service.name)}</strong>. Respondo las preguntas paso a paso; si algo no lo sabes, escribe "no sé" y lo anotamos.`,
    ));
    for (const f of fields) {
      if (answers[f.key]?.trim()) {
        msgs.push(aiMsg(esc(f.question)));
        msgs.push(userMsg(esc(answers[f.key])));
      }
    }

    let inputBox = "";
    let pending = null;
    if (open && !document) {
      pending = fields.find((f) => !(f.key in answers));
      if (pending) {
        inputBox = `
        <div class="chat-input">
          <label for="fld">${esc(pending.question)}</label>
          ${inputFor(pending)}
          ${pending.hint ? `<p class="hint">${esc(pending.hint)}</p>` : ""}
          <div class="row">
            <button class="btn btn-primary" id="send-btn">${icon("send")} Enviar</button>
            ${pending && !pending.required ? `<button class="btn btn-ghost" id="skip-btn">Omitir</button>` : ""}
            <span class="hint" style="margin:0">${answeredCount}/${fields.length} datos</span>
          </div>
        </div>`;
      }
    }

    const finished = !pending;
    if (finished && !document && open) {
      msgs.push(aiMsg(
        `¡Listo! Ya tengo todo lo necesario para preparar tu documento.<br><br>${
          service.risk === "bajo" && service.auto_deliver
            ? "Como es un documento estándar de bajo riesgo, se entregará automáticamente con su fundamento jurídico."
            : "Por el nivel de riesgo de este servicio, tu documento pasará por <strong>revisión profesional</strong> antes de entregarse."
        }`,
        `<button class="btn btn-primary" id="gen-btn">${icon("sparkle")} Generar documento</button>`,
      ));
    }
    if (document) {
      if (request.status === "entregado") {
        msgs.push(aiMsg("Tu documento está listo y verificado. Puedes verlo y descargarlo cuando quieras.",
          `<a class="btn btn-primary" href="#/documento/${document.id}">${icon("eye")} Ver documento</a>`));
      } else if (request.status === "en_revision") {
        msgs.push(aiMsg("Tu documento fue preparado y está en <strong>revisión profesional</strong>. Te avisamos aquí apenas el profesional lo apruebe.",
          `<a class="btn btn-ghost" href="#/mis-documentos">${icon("arrow-left")} Mis documentos</a>`));
      } else if (request.status === "rechazado") {
        msgs.push(aiMsg(`El profesional revisó tu documento y requiere ajustes. ${esc(review_task?.notes || "Contáctanos para continuar con tu caso.")}`));
      }
    }

    app.innerHTML = `
      <div class="assistant-head">
        <a class="back-link" href="#/servicios">${icon("arrow-left")}</a>
        <div class="assistant-title">
          <h1>${esc(service.name)}</h1>
          <p>${chip(STATUS[request.status].label, STATUS[request.status].cls)} &nbsp; ${priceRange(service)}</p>
        </div>
      </div>
      <div class="assistant-layout">
        <div class="card chat-card">
          <div class="chat-scroll" id="chat-scroll">${msgs.join("")}</div>
          ${inputBox}
        </div>
        <aside class="side-panel">
          <div class="card side-card">
            <h3>Progreso</h3>
            <div class="progress-label"><span>Datos completos</span><span>${answeredCount}/${fields.length}</span></div>
            <div class="progress-track"><div class="progress-fill" style="width:${Math.round((answeredCount / fields.length) * 100)}%"></div></div>
          </div>
          <div class="card side-card">
            <h3>Necesitarás</h3>
            <ul class="req-list">
              ${service.requirements.map((r) => `<li>${icon("check-circle")} ${esc(r)}</li>`).join("")}
            </ul>
          </div>
          <div class="card side-card">
            <h3>Riesgo del servicio</h3>
            <p class="side-note">${chip(RISK[service.risk].label, RISK[service.risk].cls)}</p>
            <p class="side-note">${
              service.risk === "bajo"
                ? "Documento estándar: se entrega automáticamente dentro de límites aprobados."
                : "Este documento se entrega solo tras revisión del profesional responsable."
            }</p>
          </div>
        </aside>
      </div>`;

    const scroll = document.getElementById("chat-scroll");
    scroll.scrollTop = scroll.scrollHeight;

    const sendBtn = document.getElementById("send-btn");
    if (sendBtn && pending) {
      const submit = async () => {
        const el = document.getElementById("fld");
        const value = el.value.trim();
        if (!value) { el.focus(); return; }
        sendBtn.disabled = true;
        try {
          await api(`/api/requests/${requestId}/answers`, {
            method: "POST",
            body: { answers: { [pending.key]: value } },
          });
          viewAssistant(requestId);
        } catch (err) {
          app.insertAdjacentHTML("afterbegin", `<div class="err-box">${esc(err.message)}</div>`);
          sendBtn.disabled = false;
        }
      };
      sendBtn.addEventListener("click", submit);
      const skipBtn = document.getElementById("skip-btn");
      if (skipBtn) skipBtn.addEventListener("click", async () => {
        skipBtn.disabled = true;
        try {
          await api(`/api/requests/${requestId}/answers`, {
            method: "POST",
            body: { answers: { [pending.key]: "" } },
          });
          viewAssistant(requestId);
        } catch (err) {
          app.insertAdjacentHTML("afterbegin", `<div class="err-box">${esc(err.message)}</div>`);
          skipBtn.disabled = false;
        }
      });
      const el = document.getElementById("fld");
      if (el) {
        el.addEventListener("keydown", (e) => {
          if (e.key === "Enter" && el.tagName !== "TEXTAREA") { e.preventDefault(); submit(); }
        });
      }
    }

    const genBtn = document.getElementById("gen-btn");
    if (genBtn) {
      genBtn.addEventListener("click", async () => {
        genBtn.disabled = true;
        genBtn.textContent = "Preparando documento…";
        try {
          const r = await api(`/api/requests/${requestId}/generate`, { method: "POST" });
          location.hash = `#/documento/${r.document.id}`;
        } catch (err) {
          app.insertAdjacentHTML("afterbegin", `<div class="err-box">${esc(err.message)}</div>`);
          genBtn.disabled = false;
        }
      });
    }
  }

  function inputFor(field) {
    const id = "fld";
    if (field.type === "textarea") return `<textarea class="field-input" id="${id}" rows="4"></textarea>`;
    if (field.type === "select") {
      return `<select class="field-input" id="${id}">${
        field.options.map((o) => `<option value="${esc(o)}">${esc(o)}</option>`).join("")
      }</select>`;
    }
    if (field.type === "date") return `<input class="field-input" id="${id}" type="date" />`;
    if (field.type === "number") return `<input class="field-input" id="${id}" type="number" inputmode="numeric" min="0" />`;
    return `<input class="field-input" id="${id}" type="text" />`;
  }

  function aiMsg(html, actions = "") {
    return `<div class="msg ai"><div class="msg-avatar">${icon("scale")}</div><div class="msg-bubble">${html}${
      actions ? `<div class="msg-actions">${actions}</div>` : ""
    }</div></div>`;
  }
  function userMsg(text) {
    return `<div class="msg user"><div class="msg-avatar">${icon("users")}</div><div class="msg-bubble">${text}</div></div>`;
  }

  // ── Vista: mis documentos ──────────────────────────────────────
  async function viewMyDocs() {
    const list = await api(`/api/requests?client_id=${encodeURIComponent(clientId)}`);
    if (!list.length) {
      app.innerHTML = `
        <div class="card empty-state">
          ${iconTile("file-text")}
          <h2>Aún no tienes solicitudes</h2>
          <p>Cuando inicies un servicio, lo verás aquí con su estado y tus documentos.</p>
          <a class="btn btn-primary" href="#/servicios">Explorar servicios</a>
        </div>`;
      return;
    }
    const rows = list.map((r) => {
      const st = STATUS[r.status];
      const action = r.document_id
        ? (r.status === "entregado"
          ? `<a class="btn btn-ghost" href="#/documento/${r.document_id}">${icon("eye")} Ver</a>`
          : (r.status === "en_revision" ? `<a class="btn btn-ghost" href="#/documento/${r.document_id}">${icon("eye")} Ver borrador</a>` : ""))
        : (r.status === "recopilando" || r.status === "listo"
          ? `<a class="btn btn-primary" href="#/asistente/${r.id}">Continuar</a>`
          : "");
      return `
        <div class="card doc-row">
          ${iconTile(r.service?.icon || "file-text")}
          <div class="info">
            <h3>${esc(r.service?.name ?? r.service_id)}</h3>
            <p>Solicitado el ${fmtDate(r.created_date)}</p>
            ${r.status === "rechazado" && r.review_notes ? `<p style="color:var(--red);font-size:13px;margin-top:4px">${icon("alert")} ${esc(r.review_notes)}</p>` : ""}
          </div>
          <div class="meta">${chip(st.label, st.cls)} ${chip(RISK[r.risk].label, RISK[r.risk].cls)}</div>
          ${action}
        </div>`;
    }).join("");
    app.innerHTML = `
      <h1 class="section-title">Mis documentos</h1>
      <p class="section-sub">Estado de tus solicitudes y descargas disponibles.</p>
      <div class="doc-list" style="margin-bottom:20px">${rows}</div>`;
  }

  // ── Vista: documento ──────────────────────────────────────────
  async function viewDocument(docId) {
    const { document, request_status, request_id } = await api(`/api/documents/${docId}`);
    let banner = "";
    if (request_status === "entregado") {
      banner = `<div class="doc-banner ok">${icon("check-circle")} Documento entregado. Revísalo antes de firmarlo o presentarlo.</div>`;
    } else if (request_status === "rechazado") {
      banner = `<div class="doc-banner bad">${icon("alert")} El documento fue revisado y requiere ajustes. Revisa las notas del profesional en tu solicitud.</div>`;
    } else {
      banner = `<div class="doc-banner wait">${icon("clock")} En revisión profesional. Este es el borrador preparado por el asistente; aún no está aprobado para uso.</div>`;
    }
    app.innerHTML = `
      <div class="doc-actions">
        <a class="back-link" href="#/mis-documentos">${icon("arrow-left")} Mis documentos</a>
        <span class="spacer"></span>
        <button class="btn btn-primary" id="print-btn">${icon("printer")} Imprimir / Guardar PDF</button>
      </div>
      ${banner}
      <div class="doc-paper" id="doc-paper">${document.content}</div>`;
    document.getElementById("print-btn").addEventListener("click", () => window.print());
  }

  // ── Vista: panel administrativo ────────────────────────────────
  async function viewAdmin() {
    if (!sessionStorage.getItem("lexgo_admin")) {
      app.innerHTML = `
        <div class="card admin-login">
          <div class="icon-tile">${icon("lock")}</div>
          <h1>Panel profesional</h1>
          <p>Acceso para el equipo responsable de revisar expedientes.</p>
          <input class="field-input" type="password" id="pin" placeholder="PIN de acceso" />
          <button class="btn btn-primary" id="login-btn" style="width:100%">Entrar</button>
          <div id="login-err"></div>
        </div>`;
      const doLogin = async () => {
        const pin = document.getElementById("pin").value;
        try {
          const r = await api("/api/admin/login", { method: "POST", body: { pin } });
          sessionStorage.setItem("lexgo_admin", r.token);
          viewAdmin();
        } catch (err) {
          document.getElementById("login-err").innerHTML = `<div class="err-box">${esc(err.message)}</div>`;
        }
      };
      document.getElementById("login-btn").addEventListener("click", doLogin);
      document.getElementById("pin").addEventListener("keydown", (e) => {
        if (e.key === "Enter") doLogin();
      });
      return;
    }

    const tabs = [
      ["expedientes", "Expedientes"], ["revisiones", "Revisiones"],
      ["servicios", "Servicios"], ["profesionales", "Profesionales"],
    ];
    app.innerHTML = `
      <div class="admin-head">
        <h1 class="section-title" style="margin:0">Panel profesional</h1>
        <button class="btn btn-ghost" id="logout-btn">Salir</button>
      </div>
      <div class="admin-tabs">
        ${tabs.map(([k, l]) => `<button class="tab-btn ${adminTab === k ? "active" : ""}" data-tab="${k}">${l}</button>`).join("")}
      </div>
      <div id="admin-body" style="margin-top:16px"></div>`;
    document.getElementById("logout-btn").addEventListener("click", () => {
      sessionStorage.removeItem("lexgo_admin");
      viewAdmin();
    });
    app.querySelectorAll(".tab-btn").forEach((b) =>
      b.addEventListener("click", () => { adminTab = b.dataset.tab; viewAdmin(); }));

    const body = document.getElementById("admin-body");
    if (adminTab === "expedientes") await adminExpedientes(body);
    else if (adminTab === "revisiones") await adminRevisiones(body);
    else if (adminTab === "servicios") await adminServicios(body);
    else await adminProfesionales(body);
  }

  async function adminExpedientes(body) {
    const list = await api("/api/admin/requests");
    if (!list.length) {
      body.innerHTML = `<div class="card empty-state" style="padding:36px"><h2>Sin expedientes aún</h2><p>Cuando los clientes inicien solicitudes aparecerán aquí.</p></div>`;
      return;
    }
    const rows = list.map((r) => `
      <tr>
        <td>${fmtDate(r.created_date)}</td>
        <td><strong>${esc(r.service?.name ?? r.service_id)}</strong><br><small style="color:var(--muted)">${esc(AREA_LABELS[r.service?.area] ?? "")}</small></td>
        <td style="font-family:monospace;font-size:12px">${esc(r.client_id.slice(0, 8))}…</td>
        <td>${chip(RISK[r.risk].label, RISK[r.risk].cls)}</td>
        <td>${chip(STATUS[r.status].label, STATUS[r.status].cls)}</td>
        <td>${r.document_id ? `<a class="btn btn-ghost" style="padding:7px 12px" href="#/documento/${r.document_id}">${icon("eye")}</a>` : "—"}</td>
      </tr>`).join("");
    body.innerHTML = `
      <div class="card table-wrap">
        <table class="data">
          <thead><tr><th>Fecha</th><th>Servicio</th><th>Cliente</th><th>Riesgo</th><th>Estado</th><th></th></tr></thead>
          <tbody>${rows}</tbody>
        </table>
      </div>`;
  }

  async function adminRevisiones(body) {
    const tasks = await api("/api/admin/review-tasks");
    const professionals = (await api("/api/admin/professionals")).filter((p) => p.active);
    const pending = tasks.filter((t) => t.status === "pendiente");
    const resolved = tasks.filter((t) => t.status !== "pendiente");

    body.innerHTML = `
      ${pending.length ? "" : `<div class="card empty-state" style="padding:32px"><h2>Sin revisiones pendientes</h2><p>Buen trabajo, todo al día.</p></div>`}
      ${pending.map((t) => `
        <div class="card review-card" data-task="${t.id}">
          <div class="head">
            <h3>${esc(t.service?.name ?? "Servicio")}</h3>
            ${chip(RISK[t.request?.risk ?? "medio"].label, RISK[t.request?.risk ?? "medio"].cls)}
            ${chip("Cliente " + esc((t.request?.client_id ?? "").slice(0, 6) + "…"), "chip-plain")}
          </div>
          <p class="hint-text">Solicitado el ${fmtDate(t.created_date)}. Revisa el borrador antes de decidir.</p>
          <a class="btn btn-ghost" style="margin-bottom:12px" href="#/documento/${t.document_id}">${icon("eye")} Ver borrador</a>
          <textarea class="field-input" id="notes-${t.id}" placeholder="Notas de revisión (visible para el cliente si se rechaza)"></textarea>
          <select class="field-input prof-select" id="prof-${t.id}">
            <option value="">Asignar profesional…</option>
            ${professionals.map((p) => `<option value="${p.id}">${esc(p.name)} (${p.role})</option>`).join("")}
          </select>
          <div class="review-actions">
            <button class="btn btn-success" data-decision="aprobada" data-task="${t.id}">${icon("check")} Aprobar y entregar</button>
            <button class="btn btn-danger" data-decision="rechazada" data-task="${t.id}">${icon("x")} Rechazar</button>
          </div>
        </div>`).join("")}
      ${resolved.length ? `
        <div class="card table-wrap">
          <table class="data">
            <thead><tr><th>Resuelto</th><th>Servicio</th><th>Decisión</th><th>Notas</th></tr></thead>
            <tbody>${resolved.map((t) => `
              <tr>
                <td>${t.resolved_date ? fmtDate(t.resolved_date) : "—"}</td>
                <td>${esc(t.service?.name ?? "")}</td>
                <td>${chip(t.status === "aprobada" ? "Aprobada" : "Rechazada", t.status === "aprobada" ? "chip-green" : "chip-red")}</td>
                <td style="max-width:340px">${esc(t.notes || "—")}</td>
              </tr>`).join("")}</tbody>
          </table>
        </div>` : ""}`;

    body.querySelectorAll("[data-decision]").forEach((btn) =>
      btn.addEventListener("click", async () => {
        const id = btn.dataset.task;
        btn.disabled = true;
        try {
          await api(`/api/admin/review-tasks/${id}/decision`, {
            method: "POST",
            body: {
              decision: btn.dataset.decision,
              notes: document.getElementById(`notes-${id}`).value,
              professional_id: document.getElementById(`prof-${id}`).value || null,
            },
          });
          viewAdmin();
        } catch (err) {
          btn.disabled = false;
          body.insertAdjacentHTML("afterbegin", `<div class="err-box">${esc(err.message)}</div>`);
        }
      }));
  }

  async function adminServicios(body) {
    const services = await api("/api/admin/services");
    body.innerHTML = `
      <div class="card" style="padding:10px 20px">
        ${services.map((s) => `
          <div class="switch-row">
            <div class="info">
              <strong>${esc(s.name)}</strong>
              <small>${esc(AREA_LABELS[s.area])} · ${priceRange(s)} · ${RISK[s.risk].label}</small>
            </div>
            ${s.risk === "bajo"
              ? `<label class="switch"><input type="checkbox" data-svc="${s.id}" ${s.auto_deliver ? "checked" : ""}/><span class="track"></span></label>`
              : `<span class="chip chip-amber">Solo riesgo bajo puede automatizarse</span>`}
          </div>`).join("")}
      </div>
      <p class="side-note" style="margin-top:12px">Los servicios de riesgo medio y alto siempre pasan por revisión profesional, decisión de diseño de la plataforma.</p>`;
    body.querySelectorAll("[data-svc]").forEach((input) =>
      input.addEventListener("change", async () => {
        try {
          await api(`/api/admin/services/${input.dataset.svc}`, {
            method: "PATCH",
            body: { auto_deliver: input.checked },
          });
        } catch (err) {
          input.checked = !input.checked;
          body.insertAdjacentHTML("afterbegin", `<div class="err-box">${esc(err.message)}</div>`);
        }
      }));
  }

  async function adminProfesionales(body) {
    const professionals = await api("/api/admin/professionals");
    body.innerHTML = `
      <div class="card" style="padding:24px;margin-bottom:16px">
        <h3 style="margin:0 0 14px;font-size:15px;color:var(--navy)">Registrar profesional</h3>
        <div class="form-grid">
          <div class="two">
            <input class="field-input" id="p-name" placeholder="Nombre completo" />
            <select class="field-input" id="p-role"><option value="abogado">Abogado/a</option><option value="notario">Notario/a</option></select>
          </div>
          <input class="field-input" id="p-license" placeholder="Título o registro (opcional)" />
          <button class="btn btn-primary" id="p-add" style="justify-self:start">${icon("plus")} Agregar</button>
        </div>
        <div id="p-msg"></div>
      </div>
      <div class="card table-wrap">
        <table class="data">
          <thead><tr><th>Profesional</th><th>Rol</th><th>Áreas</th><th>Activo</th></tr></thead>
          <tbody>
            ${professionals.map((p) => `
              <tr>
                <td><strong>${esc(p.name)}</strong>${p.license ? `<br><small style="color:var(--muted)">${esc(p.license)}</small>` : ""}</td>
                <td>${esc(p.role)}</td>
                <td style="font-size:12.5px">${esc(p.areas.map((a) => AREA_LABELS[a] ?? a).join(", "))}</td>
                <td>
                  <label class="switch"><input type="checkbox" data-prof="${p.id}" ${p.active ? "checked" : ""}/><span class="track"></span></label>
                </td>
              </tr>`).join("")}
          </tbody>
        </table>
      </div>`;
    document.getElementById("p-add").addEventListener("click", async () => {
      const name = document.getElementById("p-name").value.trim();
      const role = document.getElementById("p-role").value;
      const license = document.getElementById("p-license").value.trim();
      if (!name) return;
      try {
        await api("/api/admin/professionals", {
          method: "POST",
          body: { name, role, license, areas: ["civil", "laboral", "comercial", "inmobiliario", "familia"] },
        });
        viewAdmin();
      } catch (err) {
        document.getElementById("p-msg").innerHTML = `<div class="err-box">${esc(err.message)}</div>`;
      }
    });
    body.querySelectorAll("[data-prof]").forEach((input) =>
      input.addEventListener("change", async () => {
        try {
          await api(`/api/admin/professionals/${input.dataset.prof}`, {
            method: "PATCH",
            body: { active: input.checked },
          });
        } catch (err) {
          input.checked = !input.checked;
        }
      }));
  }

  // ── Arranque ──────────────────────────────────────────────────
  render();
})();
