// LexGoAI — Motor de plantillas documentales
// Cada documento generado cita las normas y artículos consultados con enlace,
// fecha de la versión y estado de verificación. El aviso "asistente jurídico
// virtual, no un abogado" es parte obligatoria de todo documento.

import { assistantObservations } from "./ai.ts";
import type {
  Citation,
  GeneratedDocument,
  LegalSource,
  Service,
  ServiceRequest,
} from "./types.ts";

const esc = (v: unknown) =>
  String(v ?? "").replace(/[&<>"']/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c] ?? c);

const money = (n: unknown) => {
  const num = Number(n);
  if (Number.isNaN(num)) return esc(n);
  return `RD$ ${num.toLocaleString("es-DO")}`;
};

const fechaLarga = (iso: string) => {
  const d = new Date(`${iso}T12:00:00`);
  if (Number.isNaN(d.getTime())) return esc(iso);
  return d.toLocaleDateString("es-DO", { day: "numeric", month: "long", year: "numeric" });
};

const hoy = () =>
  new Date().toLocaleDateString("es-DO", { day: "numeric", month: "long", year: "numeric" });

interface DocCtx {
  citations: Citation[];
  delivered: boolean;
  risk: string;
}

// ── Piezas compartidas ────────────────────────────────────────────────

function citationsHtml(citations: Citation[]) {
  if (!citations.length) return "";
  const items = citations.map((c) => `
    <li>
      <strong>${esc(c.source)}</strong>
      ${c.articles.length ? ` — ${esc(c.articles.join("; "))}` : ""}
      <br><a href="${esc(c.url)}" target="_blank" rel="noopener">${esc(c.url)}</a>
      <span class="cite-meta">Versión consultada: ${esc(c.consulted)}. ${
        c.verified
          ? "Fuente verificada por el profesional responsable."
          : "Pendiente de verificación profesional."
      }</span>
    </li>`).join("");
  return `<section class="doc-cites"><h3>Fundamento jurídico consultado</h3><ul>${items}</ul></section>`;
}

function docShell(
  title: string,
  body: string,
  ctx: DocCtx,
  extraNextSteps: string[] = [],
) {
  const riskNotice = ctx.delivered
    ? "Este es un documento estándar de bajo riesgo, entregado automáticamente dentro de los límites previamente aprobados. Verifica que los datos sean correctos antes de firmar."
    : "Este documento requiere revisión y aprobación por el profesional responsable antes de entregarse al cliente.";
  const next = extraNextSteps.length
    ? `<section class="doc-next"><h3>Próximos pasos</h3><ol>${extraNextSteps.map((s) => `<li>${s}</li>`).join("")}</ol></section>`
    : "";
  return `
    <header class="doc-head">
      <div class="doc-brand">LexGoAI</div>
      <span class="doc-badge">Asistente jurídico virtual — no un abogado</span>
    </header>
    <h2 class="doc-title">${esc(title)}</h2>
    ${body}
    ${citationsHtml(ctx.citations)}
    ${next}
    <footer class="doc-notice">
      <p><strong>Aviso:</strong> documento preparado por LexGoAI, asistente jurídico virtual de la República Dominicana. ${esc(riskNotice)}</p>
      <p>Los importes mostrados en la plataforma son precios informativos de prueba; no constituyen honorarios recomendados.</p>
    </footer>
  `;
}

function signatureBlock(left: string, right: string) {
  return `
    <div class="doc-sign">
      <div><p class="sig-line"></p><p>${esc(left)}</p></div>
      <div><p class="sig-line"></p><p>${esc(right)}</p></div>
    </div>`;
}

// ── Plantillas por tipo de servicio ────────────────────────────────────

type Template = (service: Service, req: ServiceRequest, ctx: DocCtx) => Promise<{ title: string; content: string }>;

const contratoAlquiler: Template = (_s, req, ctx) => {
  const a = req.answers;
  const body = `
    <p class="doc-intro">Contrato de arrendamiento de ${esc(a.proposito)}, celebrado en la República Dominicana el ${hoy()}, entre:</p>
    <p><strong>ARRENDADOR(A):</strong> ${esc(a.nombre_arrendador)}, dominicano/a, mayor de edad, portador/a de la cédula de identidad y electoral No. ${esc(a.cedula_arrendador)}, en lo adelante "EL ARRENDADOR".</p>
    <p><strong>ARRENDATARIO(A):</strong> ${esc(a.nombre_arrendatario)}, mayor de edad, portador/a de la cédula de identidad y electoral No. ${esc(a.cedula_arrendatario)}, en lo adelante "EL ARRENDATARIO".</p>
    <h3>CLÁUSULA PRIMERA — OBJETO</h3>
    <p>EL ARRENDADOR cede en arrendamiento a EL ARRENDATARIO el inmueble ubicado en ${esc(a.direccion_inmueble)}, para uso exclusivo de ${esc(a.proposito)}.</p>
    <h3>CLÁUSULA SEGUNDA — CANON</h3>
    <p>El canon mensual de arrendamiento es de <strong>${money(a.canon_mensual)}</strong>, pagadero por adelantado dentro de los primeros ${esc(a.dia_pago)} días de cada mes, en el lugar que EL ARRENDADOR indique por escrito.</p>
    <h3>CLÁUSULA TERCERA — GARANTÍA</h3>
    <p>EL ARRENDATARIO entrega en este acto la suma de <strong>${money(a.deposito_garantia)}</strong> en concepto de depósito en garantía, que responde por daños y obligaciones distintas al pago del canon. Este depósito no cubre cánones ordinarios y será devuelto al término del contrato, previa deducción justificada de daños, si los hubiere.</p>
    <h3>CLÁUSULA CUARTA — PLAZO</h3>
    <p>El presente contrato comienza el ${fechaLarga(a.fecha_inicio)} y tendrá una duración de ${esc(a.duracion_meses)} meses, renovable por mutuo acuerdo escrito de las partes.</p>
    <h3>CLÁUSULA QUINTA — CONSERVACIÓN Y USO</h3>
    <p>EL ARRENDATARIO se obliga a usar el inmueble conforme a su destino, cuidarlo como un buen padre de familia y devolverlo en el estado en que lo recibió, salvo el deterioro natural por el uso legítimo. Toda mejora o modificación requiere consentimiento previo y por escrito de EL ARRENDADOR.</p>
    <h3>CLÁUSULA SEXTA — REPARACIONES</h3>
    <p>EL ARRENDADOR responde por las reparaciones mayores y los vicios ocultos del inmueble. EL ARRENDATARIO responde por las reparaciones menores derivadas del uso diario.</p>
    <h3>CLÁUSULA SÉPTIMA — LEY Y DOMICILIO</h3>
    <p>Este contrato se rige por el Código Civil de la República Dominicana y las leyes aplicables al arrendamiento. Para cualquier diferencia, las partes eligen como domicilio especial la ciudad donde se encuentra el inmueble, sometiéndose a los tribunales competentes de esa jurisdicción.</p>
    ${signatureBlock("EL ARRENDADOR", "EL ARRENDATARIO")}`;
  return Promise.resolve({
    title: "Contrato de Arrendamiento",
    content: docShell("Contrato de Arrendamiento", body, ctx, [
      "Verifica que cédulas, montos y direcciones sean exactos antes de firmar.",
      "Imprime dos ejemplares: uno para cada parte.",
      "Si deseas legalización o actuación notarial, solicita la coordinación notarial y el notario hará las comprobaciones que legalmente le corresponden.",
    ]),
  });
};

const acuerdoPago: Template = (_s, req, ctx) => {
  const a = req.answers;
  const body = `
    <p class="doc-intro">Acuerdo de reconocimiento de deuda y plan de pago, celebrado en la República Dominicana el ${hoy()}, entre:</p>
    <p><strong>ACREEDOR(A):</strong> ${esc(a.nombre_acreedor)}, portador/a de la cédula No. ${esc(a.cedula_acreedor)}.</p>
    <p><strong>DEUDOR(A):</strong> ${esc(a.nombre_deudor)}, portador/a de la cédula No. ${esc(a.cedula_deudor)}.</p>
    <h3>CLÁUSULA PRIMERA — RECONOCIMIENTO DE DEUDA</h3>
    <p>EL DEUDOR reconoce deber a EL ACREEDOR la suma de <strong>${money(a.monto_total)}</strong>, y declara que la reconoce de manera libre, espontánea y sin coacción de ningún tipo.</p>
    <h3>CLÁUSULA SEGUNDA — PLAN DE PAGO</h3>
    <p>La deuda será pagada en cuotas mensuales de <strong>${money(a.cuota_mensual)}</strong>, el día ${esc(a.dia_pago_cuota)} de cada mes, comenzando el ${fechaLarga(a.fecha_primer_pago)}, hasta la extinción total del saldo.</p>
    <h3>CLÁUSULA TERCERA — EXIGIBILIDAD ANTICIPADA</h3>
    <p>Si EL DEUDOR dejare de pagar dos (2) cuotas consecutivas, EL ACREEDOR podrá exigir de inmediato el pago total del saldo pendiente, sin necesidad de requerimiento previo.</p>
    <h3>CLÁUSULA CUARTA — LEY Y DOMICILIO</h3>
    <p>Este acuerdo se rige por el Código Civil de la República Dominicana. Las partes eligen como domicilio la ciudad de firma y se someten a los tribunales competentes de esa jurisdicción.</p>
    ${signatureBlock("EL ACREEDOR", "EL DEUDOR")}`;
  return Promise.resolve({
    title: "Acuerdo de Pago",
    content: docShell("Acuerdo de Pago", body, ctx, [
      "Verifica el monto y las cuotas antes de firmar.",
      "Conserve copia del acuerdo firmado junto a los recibos de cada pago.",
    ]),
  });
};

const contratoServicios: Template = (_s, req, ctx) => {
  const a = req.answers;
  const body = `
    <p class="doc-intro">Contrato de prestación de servicios, celebrado en la República Dominicana el ${hoy()}, entre:</p>
    <p><strong>PRESTADOR(A):</strong> ${esc(a.nombre_prestador)}, cédula/RNC No. ${esc(a.cedula_prestador)}, en lo adelante "EL PRESTADOR".</p>
    <p><strong>CLIENTE:</strong> ${esc(a.nombre_cliente)}, cédula/RNC No. ${esc(a.cedula_cliente)}, en lo adelante "EL CLIENTE".</p>
    <h3>CLÁUSULA PRIMERA — OBJETO</h3>
    <p>EL PRESTADOR se obliga a prestar a EL CLIENTE los siguientes servicios: ${esc(a.descripcion_servicios)}.</p>
    <h3>CLÁUSULA SEGUNDA — PRECIO Y FORMA DE PAGO</h3>
    <p>El precio de los servicios es de <strong>${money(a.monto_servicio)}</strong>, pagadero mediante ${esc(a.forma_pago).toLowerCase()}, según recibo o comprobante que acredite cada pago.</p>
    <h3>CLÁUSULA TERCERA — INICIO Y DURACIÓN</h3>
    <p>Los servicios comienzan el ${fechaLarga(a.fecha_inicio)} con una duración estimada de ${esc(a.duracion)}.</p>
    <h3>CLÁUSULA CUARTA — OBLIGACIONES DEL PRESTADOR</h3>
    <p>EL PRESTADOR ejecutará los servicios con diligencia profesional, dentro de los plazos pactados, y mantendrá informado a EL CLIENTE del avance.</p>
    <h3>CLÁUSULA QUINTA — TERMINACIÓN</h3>
    <p>Cualquiera de las partes podrá dar por terminado este contrato mediante aviso escrito con siete (7) días de anticipación. En tal caso, EL CLIENTE pagará los servicios efectivamente prestados hasta la fecha de terminación.</p>
    <h3>CLÁUSULA SEXTA — LEY Y DOMICILIO</h3>
    <p>Este contrato se rige por el Código Civil de la República Dominicana. Las partes eligen como domicilio la ciudad de firma y se someten a los tribunales competentes de esa jurisdicción.</p>
    ${signatureBlock("EL PRESTADOR", "EL CLIENTE")}`;
  return Promise.resolve({
    title: "Contrato de Prestación de Servicios",
    content: docShell("Contrato de Prestación de Servicios", body, ctx, [
      "Acompaña el contrato con alcances detallados si el servicio lo amerita.",
      "Documenta cada pago con recibo firmado.",
    ]),
  });
};

const cartaFormal: Template = (_s, req, ctx) => {
  const a = req.answers;
  const body = `
    <p class="doc-letter-head">
      ${esc(a.ciudad)}, ${fechaLarga(a.fecha_carta)}<br>
      <strong>Señor/a:</strong><br>${esc(a.nombre_destinatario)}<br>
      <strong>Asunto:</strong> ${esc(a.asunto)}
    </p>
    <p class="doc-letter-body">${esc(a.contenido).replace(/\n/g, "<br>")}</p>
    <p class="doc-letter-close">Atentamente,</p>
    <p class="doc-letter-sign"><strong>${esc(a.nombre_remitente)}</strong><br>Cédula: ${esc(a.cedula_remitente)}</p>`;
  return Promise.resolve({
    title: `${a.tipo_carta} — ${a.asunto}`,
    content: docShell(a.tipo_carta ?? "Carta formal", body, ctx, [
      "Entriega la carta por escrito y conserva constancia de entrega (sello, firma de recepción o correo certificado).",
      "Si la carta no recibe respuesta en el plazo indicado, puedes solicitar seguimiento profesional.",
    ]),
  });
};

const cartaRenuncia: Template = (_s, req, ctx) => {
  const a = req.answers;
  const motivo = a.motivo?.trim()
    ? `<p>Las razones que motivan mi decisión son las siguientes: ${esc(a.motivo)}.</p>`
    : "";
  const body = `
    <p class="doc-letter-head">
      República Dominicana<br>
      <strong>A:</strong> ${esc(a.empresa)}<br>
      <strong>Asunto:</strong> Renuncia al puesto de ${esc(a.puesto)}
    </p>
    <p class="doc-letter-body">Por medio de la presente, yo, <strong>${esc(a.nombre_trabajador)}</strong>, comunico formalmente mi decisión de renunciar de manera irrevocable al puesto de ${esc(a.puesto)} que ocupo en su representación, con efecto a partir del ${fechaLarga(a.fecha_efectiva)}.</p>
    ${motivo}
    <p class="doc-letter-body">Agradezco la oportunidad de haber formado parte de su equipo y pongo mi colaboración a disposición para la entrega ordenada de las funciones y responsabilidades a mi cargo.</p>
    <p class="doc-letter-close">Atentamente,</p>
    <p class="doc-letter-sign"><strong>${esc(a.nombre_trabajador)}</strong></p>`;
  return Promise.resolve({
    title: "Carta de Renuncia",
    content: docShell("Carta de Renuncia", body, ctx, [
      "Entrega la carta firmada y conserva una copia con constancia de recepción.",
      "La fecha efectiva deja constancia del preaviso; verifica tu contrato y el Código de Trabajo.",
    ]),
  });
};

const reclamoLaboral: Template = async (_s, req, ctx) => {
  const a = req.answers;
  const obs = await assistantObservations(
    `Caso laboral dominicano. Trabajador: ${a.nombre_trabajador}. Empresa: ${a.empresa}. Inicio: ${a.fecha_inicio}. Término: ${a.fecha_terminacion}. Último salario mensual: RD$${a.salario_mensual}. Terminación: ${a.motivo_terminacion}. Prestaciones recibidas: ${a.prestaciones_recibidas}. Redacta un resumen objetivo de los derechos posiblemente y otros derechos pendientes y señala qué datos faltan. No inventes montos.`,
    "Según los datos aportados, corresponde verificar el preaviso, el auxilio de cesantía y demás derechos del trabajador conforme al Código de Trabajo (Ley 16-92), así como el régimen de ayuda por desempleo. Es indispensable calcular los montos con el salario certificado y el tiempo de servicio acreditado, y contrastar las prestaciones efectivamente recibidas antes de presentar la reclamación.",
  );
  const body = `
    <h3>1. Resumen del caso</h3>
    <table class="doc-table">
      <tr><td>Trabajador/a</td><td>${esc(a.nombre_trabajador)}</td></tr>
      <tr><td>Empresa</td><td>${esc(a.empresa)}</td></tr>
      <tr><td>Período trabajado</td><td>Desde ${fechaLarga(a.fecha_inicio)} hasta ${fechaLarga(a.fecha_terminacion)}</td></tr>
      <tr><td>Último salario mensual</td><td>${money(a.salario_mensual)}</td></tr>
      <tr><td>Tipo de terminación</td><td>${esc(a.motivo_terminacion)}</td></tr>
      <tr><td>Prestaciones recibidas</td><td>${esc(a.prestaciones_recibidas)}</td></tr>
    </table>
    <h3>2. Observaciones del asistente</h3>
    <p>${esc(obs)}</p>
    <h3>3. Carta de reclamación</h3>
    <p class="doc-letter-head"><strong>A:</strong> ${esc(a.empresa)}<br><strong>Asunto:</strong> Reclamación de derechos laborales</p>
    <p class="doc-letter-body">Por medio de la presente, yo, <strong>${esc(a.nombre_trabajador)}</strong>, ex trabajador de su representación, comunico que mi relación laboral terminó el ${fechaLarga(a.fecha_terminacion)} y a la fecha no me han sido entregadas la totalidad de las prestaciones que me corresponden conforme al Código de Trabajo y al régimen de ayuda por desempleo.</p>
    <p class="doc-letter-body">Solicito, respetuosamente, el pago de las prestaciones pendientes (preaviso, auxilio de cesantía y demás derechos aplicables) dentro de un plazo de diez (10) días laborables a partir de la recepción de esta comunicación, junto con la documentación de descuento correspondiente.</p>
    <p class="doc-letter-body">De no recibir respuesta satisfactoria, me reservo el derecho de recurrir a los procedimientos administrativos y judiciales que establece la ley.</p>
    <p class="doc-letter-close">Atentamente,</p>
    <p class="doc-letter-sign"><strong>${esc(a.nombre_trabajador)}</strong></p>
    <h3>4. Documentos que acompañan este expediente</h3>
    <ul class="doc-list">
      <li>Carta de despido o constancia de terminación</li>
      <li>Recibos de pago del período trabajado</li>
      <li>Contrato de trabajo, si existe</li>
    </ul>`;
  return {
    title: "Reclamación de Derechos Laborales",
    content: docShell("Reclamación de Derechos Laborales", body, ctx, [
      "Este expediente pasa por revisión del abogado responsable antes de entregarse.",
      "Reúne los documentos del listado mientras el profesional revisa el caso.",
    ]),
  };
};

const informeAnalisis: Template = async (service, req, ctx) => {
  const a = req.answers;
  const rows = service.fields
    .map((f) => `<tr><td>${esc(f.question.replace(/ \(.*\)$/, ""))}</td><td>${esc(a[f.key] ?? "—")}</td></tr>`)
    .join("");
  const puntos: string[] = [];
  if (a.clausulas_preocupacion) {
    for (const line of String(a.clausulas_preocupacion).split(/\n+/).map((l) => l.trim()).filter(Boolean).slice(0, 8)) {
      puntos.push(`<li>${esc(line)}</li>`);
    }
  }
  const areaPoints: Record<string, string[]> = {
    laboral: [
      "Verificar jornada máxima legal, descanso semanal y vacaciones.",
      "Confirmar que el salario pactado no sea inferior al sectorial mínimo aplicable.",
      "Revisar cláusulas de confidencialidad o no competencia desproporcionadas.",
    ],
    inmobiliario: [
      "Verificar la existencia del deslinde y la certificación de gravámenes actualizada.",
      "Confirmar que el vendedor es el titular registral o su representante debidamente acreditado.",
      "Contrastar el plazo de escrituración y las consecuencias del incumplimiento.",
    ],
  };
  const extras = (areaPoints[service.area] ?? []).map((p) => `<li>${esc(p)}</li>`).join("");
  const obs = await assistantObservations(
    `Informe preliminar de ${service.area} en RD. Servicio: ${service.name}. Datos: ${JSON.stringify(a)}. Señala riesgos y datos faltantes. No inventes normas.`,
    "Con la información aportada se han identificado los puntos que se detallan a continuación. Algunos extremos requieren verificar datos adicionales antes de emitir conclusiones definitivas; el caso se remite a revisión profesional para valorar el alcance real de los riesgos detectados.",
  );
  const body = `
    <h3>1. Datos del caso</h3>
    <table class="doc-table">${rows}</table>
    <h3>2. Observaciones del asistente</h3>
    <p>${esc(obs)}</p>
    <h3>3. Puntos que conviene revisar</h3>
    <ul class="doc-list">${puntos.join("")}${extras}</ul>
    <h3>4. Recomendaciones</h3>
    <ol class="doc-list doc-list-num">
      <li>No firmes ni pagues montos adicionales hasta tener el resultado de esta revisión.</li>
      <li>Reúne los documentos señalados como pendientes.</li>
      <li>Si hay plazos o vencimientos cercanos, indícalo al profesional que revise tu caso.</li>
    </ol>
    <h3>5. Alcance de este informe</h3>
    <p>Este informe es preliminar e informativo. No constituye asesoría jurídica individualizada hasta tanto el profesional responsable lo revise y apruebe.</p>`;
  return {
    title: `Informe preliminar — ${service.name}`,
    content: docShell(`Informe preliminar<br><span class="doc-sub">${esc(service.name)}</span>`, body, ctx, [
      "El informe pasa por revisión profesional antes de entregarse con carácter definitivo.",
      "Ten a mano los documentos originales para la revisión.",
    ]),
  };
};

const contratoProveedores: Template = (_s, req, ctx) => {
  const a = req.answers;
  const body = `
    <p class="doc-intro">Contrato de suministro de bienes y/o servicios, celebrado en la República Dominicana el ${hoy()}, entre:</p>
    <p><strong>COMPRADORA:</strong> ${esc(a.empresa_compradora)}, RNC No. ${esc(a.rnc_compradora)}.</p>
    <p><strong>PROVEEDORA:</strong> ${esc(a.empresa_proveedor)}, RNC No. ${esc(a.rnc_proveedor)}.</p>
    <h3>CLÁUSULA PRIMERA — OBJETO</h3>
    <p>LA PROVEEDORA se obliga a suministrar a LA COMPRADORA los siguientes bienes y/o servicios: ${esc(a.descripcion_bienes)}.</p>
    <h3>CLÁUSULA SEGUNDA — PRECIO Y PAGO</h3>
    <p>Las partes pactan como condiciones de pago: ${esc(a.condiciones_pago)}. Cada entrega dará lugar al comprobante fiscal correspondiente.</p>
    <h3>CLÁUSULA TERCERA — ENTREGA</h3>
    <p>Las entregas se realizarán conforme al plazo y lugar siguiente: ${esc(a.plazo_entrega)}.</p>
    <h3>CLÁUSULA CUARTA — GARANTÍA DE CALIDAD</h3>
    <p>LA PROVEEDORA garantiza que los bienes suministrados serán aptos para su uso y conformes a las especificaciones pactadas, respondiendo por los defectos que se manifiesten dentro de los treinta (30) días siguientes a cada entrega.</p>
    <h3>CLÁUSULA QUINTA — INCUMPLIMIENTO</h3>
    <p>El incumplimiento de cualquiera de las obligaciones dará derecho a la parte cumplidora a requerir la ejecución forzosa o la resolución del contrato, con indemnización de daños y perjuicios.</p>
    <h3>CLÁUSULA SEXTA — LEY Y DOMICILIO</h3>
    <p>Este contrato se rige por las leyes de la República Dominicana. Las partes eligen como domicilio la ciudad de firma y se someten a los tribunales competentes de esa jurisdicción.</p>
    ${signatureBlock("LA COMPRADORA", "LA PROVEEDORA")}`;
  return Promise.resolve({
    title: "Contrato de Proveedores",
    content: docShell("Contrato de Proveedores", body, ctx, [
      "Este contrato pasa por revisión profesional antes de entregarse definitivamente.",
      "Adjunta anexos con especificaciones y precios unitarios si aplica.",
    ]),
  });
};

const nda: Template = (_s, req, ctx) => {
  const a = req.answers;
  const body = `
    <p class="doc-intro">Acuerdo de confidencialidad, celebrado en la República Dominicana el ${hoy()}, entre:</p>
    <p><strong>PRIMERA PARTE:</strong> ${esc(a.parte_a)}.</p>
    <p><strong>SEGUNDA PARTE:</strong> ${esc(a.parte_b)}.</p>
    <h3>CLÁUSULA PRIMERA — CONTEXTO</h3>
    <p>Las partes intercambiarán información con relación al siguiente asunto: ${esc(a.proposito)}.</p>
    <h3>CLÁUSULA SEGUNDA — INFORMACIÓN CONFIDENCIAL</h3>
    <p>Se entiende por información confidencial toda información técnica, comercial, financiera o de cualquier otra naturaleza que una parte entregue a la otra, sea cual sea su soporte, y que no sea del dominio público.</p>
    <h3>CLÁUSULA TERCERA — OBLIGACIÓN DE RESERVA</h3>
    <p>Cada parte se obliga a mantener la confidencialidad de la información recibida, a no divulgarla a terceros sin consentimiento previo y escrito, y a utilizarla exclusivamente para el fin indicado en la cláusula primera.</p>
    <h3>CLÁUSULA CUARTA — EXCEPCIONES</h3>
    <p>No será confidencial la información que (i) fuera pública al momento de divulgarse o llegare a serlo sin culpa del receptor; (ii) fuera conocida legítimamente antes de la divulgación; (iii) deba divulgarse por orden judicial o de autoridad competente.</p>
    <h3>CLÁUSULA QUINTA — DURACIÓN</h3>
    <p>Las obligaciones de confidencialidad durarán ${esc(a.duracion_anios)} años contados desde la divulgación de cada información confidencial.</p>
    <h3>CLÁUSULA SEXTA — LEY Y DOMICILIO</h3>
    <p>Este acuerdo se rige por las leyes de la República Dominicana. Las partes eligen como domicilio ${esc(a.ciudad_firma)} y se someten a los tribunales competentes de esa jurisdicción.</p>
    ${signatureBlock("PRIMERA PARTE", "SEGUNDA PARTE")}`;
  return Promise.resolve({
    title: "Acuerdo de Confidencialidad",
    content: docShell("Acuerdo de Confidencialidad (NDA)", body, ctx, [
      "Verifica los nombres exactos de las partes antes de firmar.",
      "Para mayor protección, la firma puede realizarse ante notario.",
    ]),
  });
};

const checklistCompraventa: Template = (_s, req, ctx) => {
  const a = req.answers;
  const body = `
    <h3>1. Datos de la operación</h3>
    <table class="doc-table">
      <tr><td>Comprador/a</td><td>${esc(a.nombre_comprador)}</td></tr>
      <tr><td>Vendedor/a</td><td>${esc(a.nombre_vendedor)}</td></tr>
      <tr><td>Inmueble</td><td>${esc(a.tipo_inmueble)} — ${esc(a.direccion_inmueble)}</td></tr>
      <tr><td>Precio estimado</td><td>${money(a.precio_estimado)}</td></tr>
      <tr><td>Financiamiento</td><td>${esc(a.financiamiento)}</td></tr>
    </table>
    <h3>2. Documentos que debes verificar</h3>
    <ul class="doc-list doc-checklist">
      <li>Título de propiedad a nombre del vendedor (o designación de derechos, si aplica)</li>
      <li>Deslinde aprobado (obligatorio para terrenos y generalmente exigido por bancos)</li>
      <li>Certificación de gravámenes actualizada de la oficina del Registrador de Títulos</li>
      <li>Comprobantes de pago de impuestos sobre la propiedad al día (DGII)</li>
      <li>Identidad del vendedor: cédula vigente (o poder de representación si actúa por terceros)</li>
      <li>Recibos de servicios al día y estado de expensas, si es apartamento</li>
    </ul>
    <h3>3. Lo que declaras tener ahora</h3>
    <p>${esc(a.estado_documentos).replace(/\n/g, "<br>")}</p>
    <h3>4. Ruta de la operación</h3>
    <ol class="doc-list doc-list-num">
      <li>Negociación y acuerdo de precio, forma de pago y fecha.</li>
      <li>Firma de promesa de venta (con arras, si se pactan).</li>
      <li>Verificación registral completa antes de escriturar.</li>
      <li>Escritura de venta ante notario.</li>
      <li>Pago del impuesto de transferencia y registro del título a nombre del comprador.</li>
    </ol>
    <h3>5. Advertencias</h3>
    <ul class="doc-list">
      <li>Este listado es informativo y general; cada operación tiene particularidades.</li>
      <li>Las verificaciones registrales y la escrituración requieren profesional (abogado y notario).</li>
      <li>Nunca entregues el balance del precio sin escritura firmada o garantía equivalente pactada.</li>
    </ul>`;
  return Promise.resolve({
    title: "Lista de verificación de compraventa",
    content: docShell("Lista de verificación de compraventa", body, ctx, [
      "Revisa cada documento de la lista antes de avanzar.",
      "Contrasta el título con la certificación de gravámenes más reciente.",
    ]),
  });
};

const expedienteFamilia: Template = async (_s, req, ctx) => {
  const a = req.answers;
  const docsFaltantes: Record<string, string[]> = {
    "Manutención": [
      "Acta de nacimiento del/de la menor",
      "Actas de nacimiento de los progenitores",
      "Recibos o pruebas de gastos del menor",
      "Dirección y datos del demandado, si se conocen",
    ],
    "Herencia / sucesión": [
      "Acta de defunción del causante",
      "Actas de nacimiento de los herederos",
      "Títulos de propiedad y documentos de bienes",
      "Testamento, si existe",
    ],
    "Divorcio": [
      "Acta de matrimonio",
      "Actas de nacimiento de los hijos comunes, si los hay",
      "Datos de bienes y deudas de la pareja",
    ],
  };
  const extras = (docsFaltantes[a.materia] ?? [
    "Documentos que identifiquen a las personas involucradas",
    "Toda correspondencia o constancias relacionadas",
  ]).map((d) => `<li>${esc(d)}</li>`).join("");
  const obs = await assistantObservations(
    `Asunto de familia/sucesiones en RD. Materia: ${a.materia}. Descripción: ${a.descripcion_caso}. Documentos disponibles: ${a.documentos_disponibles}. Resume el caso de forma neutral y sensible. No inventes plazos ni leyes.`,
    "Tu caso ha sido organizado con la información aportada. Por la naturaleza del asunto, es especialmente importante completar la documentación y someterlo a revisión profesional: los casos familiares y sucesorios requieren trato cuidadoso y verificación de plazos antes de actuar.",
  );
  const body = `
    <h3>1. Datos del expediente</h3>
    <table class="doc-table">
      <tr><td>Solicitante</td><td>${esc(a.nombre_solicitante)}</td></tr>
      <tr><td>Materia</td><td>${esc(a.materia)}</td></tr>
      <tr><td>Fecha de organización</td><td>${hoy()}</td></tr>
    </table>
    <h3>2. Descripción del caso</h3>
    <p>${esc(a.descripcion_caso).replace(/\n/g, "<br>")}</p>
    <h3>3. Documentos y datos disponibles</h3>
    <p>${esc(a.documentos_disponibles).replace(/\n/g, "<br>")}</p>
    <h3>4. Observaciones del asistente</h3>
    <p>${esc(obs)}</p>
    <h3>5. Documentos que conviene completar</h3>
    <ul class="doc-list">${extras}</ul>`;
  return {
    title: `Expediente preliminar — ${a.materia}`,
    content: docShell(`Expediente preliminar<br><span class="doc-sub">${esc(a.materia)}</span>`, body, ctx, [
      "Este expediente pasa por revisión del abogado responsable antes de cualquier gestión.",
      "Completa los documentos del listado mientras tanto.",
    ]),
  };
};

const TEMPLATES: Record<string, Template> = {
  contrato_alquiler: contratoAlquiler,
  acuerdo_pago: acuerdoPago,
  contrato_servicios: contratoServicios,
  carta_formal: cartaFormal,
  carta_renuncia: cartaRenuncia,
  reclamo_laboral: reclamoLaboral,
  informe_analisis: informeAnalisis,
  contrato_proveedores: contratoProveedores,
  nda: nda,
  checklist_compraventa: checklistCompraventa,
  expediente_familia: expedienteFamilia,
};

// ── Render principal ───────────────────────────────────────────────────

export async function renderDocument(
  service: Service,
  req: ServiceRequest,
  sources: LegalSource[],
  delivered: boolean,
): Promise<GeneratedDocument> {
  const consulted = new Date().toISOString().slice(0, 10);
  const areaSources = sources.filter((s) => s.area === service.area);
  const chosen = areaSources.length >= 1 ? areaSources : sources.filter((s) => s.area === "general");
  const citations: Citation[] = chosen
    .map((s) => ({
      source: s.name,
      articles: s.articles,
      url: s.url,
      consulted,
      verified: s.verified,
    }));

  const tpl = TEMPLATES[service.template] ?? informeAnalisis;
  const { title, content } = await tpl(service, req, { citations, delivered, risk: service.risk });

  return {
    id: crypto.randomUUID(),
    request_id: req.id,
    title,
    content,
    citations,
    delivered,
    created_date: new Date().toISOString(),
  };
}
