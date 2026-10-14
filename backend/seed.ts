// LexGoAI — Datos semilla
// Catálogo de servicios por área, biblioteca jurídica inicial y profesionales.
// IMPORTANTE: las fuentes jurídicas están marcadas verified:false hasta que el
// abogado responsable valide cada norma, artículo y su vigencia.

import { db } from "./db.ts";
import type { LegalSource, Professional, Service } from "./types.ts";

export const SERVICES: Service[] = [
  // ── Civil y contratos ────────────────────────────────────────────────
  {
    id: "contrato-alquiler",
    area: "civil",
    name: "Contrato de alquiler",
    tagline: "Residencial o comercial, listo para firmar",
    description:
      "Prepara un contrato de arrendamiento con cláusulas de protección para ambas partes: canon, garantía, plazo, obligaciones y ley aplicable.",
    price_min: 1200,
    price_max: 1800,
    risk: "bajo",
    auto_deliver: true,
    icon: "home",
    template: "contrato_alquiler",
    fields: [
      { key: "nombre_arrendador", question: "Nombre completo del arrendador (dueño/a del inmueble)", type: "text", required: true },
      { key: "cedula_arrendador", question: "Cédula del arrendador", type: "text", required: true },
      { key: "nombre_arrendatario", question: "Nombre completo del arrendatario (quien va a alquilar)", type: "text", required: true },
      { key: "cedula_arrendatario", question: "Cédula del arrendatario", type: "text", required: true },
      { key: "direccion_inmueble", question: "Dirección exacta del inmueble", type: "text", required: true },
      { key: "proposito", question: "¿Cuál será el uso del inmueble?", type: "select", options: ["vivienda", "comercial"], required: true },
      { key: "canon_mensual", question: "Canon mensual (RD$)", type: "number", required: true },
      { key: "fecha_inicio", question: "Fecha de inicio del arrendamiento", type: "date", required: true },
      { key: "duracion_meses", question: "Duración del contrato (meses)", type: "number", required: true },
      { key: "deposito_garantia", question: "Depósito de garantía (RD$)", type: "number", required: true },
      { key: "dia_pago", question: "Día del mes en que se paga el canon", type: "number", required: true },
    ],
    requirements: [
      "Cédula de identidad de ambas partes",
      "Título de propiedad o constancia de dueño",
      "Inventario de muebles (si el inmueble se entrega amueblado)",
    ],
    includes: [
      "Contrato listo para firmar",
      "Cláusulas de protección para ambas partes",
      "Lista de verificación antes de firmar",
    ],
  },
  {
    id: "acuerdo-pago",
    area: "civil",
    name: "Acuerdo de pago",
    tagline: "Formaliza un plan de pago de deuda",
    description:
      "Documento en el que el deudor reconoce una deuda y se compromete a un plan de cuotas, con cláusula de exigibilidad anticipada por incumplimiento.",
    price_min: 750,
    price_max: 1200,
    risk: "bajo",
    auto_deliver: true,
    icon: "file-text",
    template: "acuerdo_pago",
    fields: [
      { key: "nombre_acreedor", question: "Nombre del acreedor (quien recibe el pago)", type: "text", required: true },
      { key: "cedula_acreedor", question: "Cédula del acreedor", type: "text", required: true },
      { key: "nombre_deudor", question: "Nombre del deudor (quien debe)", type: "text", required: true },
      { key: "cedula_deudor", question: "Cédula del deudor", type: "text", required: true },
      { key: "monto_total", question: "Monto total de la deuda (RD$)", type: "number", required: true },
      { key: "cuota_mensual", question: "Monto de cada cuota mensual (RD$)", type: "number", required: true },
      { key: "dia_pago_cuota", question: "Día del mes en que se paga cada cuota", type: "number", required: true },
      { key: "fecha_primer_pago", question: "Fecha del primer pago", type: "date", required: true },
    ],
    requirements: [
      "Cédulas de ambas partes",
      "Detalle del origen de la deuda (facturas, recibos o mensajes)",
    ],
    includes: [
      "Reconocimiento de deuda con plan de cuotas",
      "Cláusula de exigibilidad anticipada",
      "Instrucciones de firma",
    ],
  },
  {
    id: "contrato-servicios",
    area: "civil",
    name: "Contrato de prestación de servicios",
    tagline: "Freelancers, consultores y proveedores",
    description:
      "Contrato entre un prestador de servicios y su cliente: alcance, precio, forma de pago, duración, obligaciones y forma de terminación.",
    price_min: 1500,
    price_max: 2500,
    risk: "bajo",
    auto_deliver: true,
    icon: "briefcase",
    template: "contrato_servicios",
    fields: [
      { key: "nombre_prestador", question: "Nombre del prestador de servicios", type: "text", required: true },
      { key: "cedula_prestador", question: "Cédula del prestador", type: "text", required: true },
      { key: "nombre_cliente", question: "Nombre del cliente (persona o empresa)", type: "text", required: true },
      { key: "cedula_cliente", question: "Cédula o RNC del cliente", type: "text", required: true },
      { key: "descripcion_servicios", question: "Describe los servicios que se prestarán", type: "textarea", required: true },
      { key: "monto_servicio", question: "Monto del servicio (RD$)", type: "number", required: true },
      { key: "forma_pago", question: "Forma de pago", type: "select", options: ["Pago único", "Pagos semanales", "Pagos quincenales", "Pagos mensuales"], required: true },
      { key: "fecha_inicio", question: "Fecha de inicio", type: "date", required: true },
      { key: "duracion", question: "Duración estimada del servicio", type: "text", required: true, hint: "Ej: 3 meses, hasta finalizar el proyecto" },
    ],
    requirements: ["Cédulas o RNC de ambas partes"],
    includes: [
      "Contrato con alcance y precio definidos",
      "Cláusulas de terminación y pago",
      "Formato listo para firma",
    ],
  },
  {
    id: "carta-formal",
    area: "civil",
    name: "Carta formal",
    tagline: "Reclamación, notificación o constancia",
    description:
      "Redacta una carta formal lista para entregar o enviar: reclamaciones, notificaciones, constancias y comunicaciones serias con respaldo.",
    price_min: 750,
    price_max: 1000,
    risk: "bajo",
    auto_deliver: true,
    icon: "mail",
    template: "carta_formal",
    fields: [
      { key: "tipo_carta", question: "¿Qué tipo de carta necesitas?", type: "select", options: ["Carta de reclamación", "Carta de notificación", "Carta de constancia", "Otro asunto formal"], required: true },
      { key: "nombre_remitente", question: "Tu nombre completo (quien envía la carta)", type: "text", required: true },
      { key: "cedula_remitente", question: "Tu cédula", type: "text", required: true },
      { key: "nombre_destinatario", question: "Nombre del destinatario (persona o empresa)", type: "text", required: true },
      { key: "asunto", question: "Asunto de la carta", type: "text", required: true },
      { key: "contenido", question: "Explica con tus palabras lo que quieres comunicar", type: "textarea", required: true },
      { key: "ciudad", question: "Ciudad desde donde se envía", type: "text", required: true },
      { key: "fecha_carta", question: "Fecha de la carta", type: "date", required: true },
    ],
    requirements: ["Tus datos de identificación", "Datos del destinatario"],
    includes: [
      "Carta con formato y tono profesional",
      "Estructura de hechos, petición y plazo de respuesta",
      "Lista de formas de entrega válidas",
    ],
  },

  // ── Laboral ──────────────────────────────────────────────────────────
  {
    id: "analisis-contrato-laboral",
    area: "laboral",
    name: "Análisis de contrato laboral",
    tagline: "Informe preliminar de tu contrato",
    description:
      "Sube o resume las condiciones de tu contrato laboral y recibe un informe preliminar: jornada, salario, vacaciones, riesgos y cláusulas que conviene revisar.",
    price_min: 1800,
    price_max: 3000,
    risk: "medio",
    auto_deliver: false,
    icon: "search",
    template: "informe_analisis",
    fields: [
      { key: "nombre_trabajador", question: "Tu nombre completo", type: "text", required: true },
      { key: "empresa", question: "Nombre de la empresa", type: "text", required: true },
      { key: "puesto", question: "Puesto que ocupas", type: "text", required: true },
      { key: "fecha_inicio_empleo", question: "Fecha de inicio del empleo", type: "date", required: true },
      { key: "salario_mensual", question: "Salario mensual (RD$)", type: "number", required: true },
      { key: "jornada", question: "Describe tu jornada: horas por día, días por semana", type: "text", required: true },
      { key: "clausulas_preocupacion", question: "Pega o resume las cláusulas que te preocupan", type: "textarea", required: true },
    ],
    requirements: [
      "Tu contrato de trabajo (si lo tienes a mano)",
      "Recibo de pago más reciente",
    ],
    includes: [
      "Informe preliminar de condiciones",
      "Puntos de riesgo detectados",
      "Recomendaciones antes de firmar o continuar",
    ],
  },
  {
    id: "carta-renuncia",
    area: "laboral",
    name: "Carta de renuncia",
    tagline: "Formal, correcta y sin rodeos",
    description:
      "Carta de renuncia con fecha efectiva y tono profesional, para presentarla por escrito y dejar constancia ante tu empleador.",
    price_min: 750,
    price_max: 1000,
    risk: "bajo",
    auto_deliver: true,
    icon: "send",
    template: "carta_renuncia",
    fields: [
      { key: "nombre_trabajador", question: "Tu nombre completo", type: "text", required: true },
      { key: "empresa", question: "Nombre de la empresa", type: "text", required: true },
      { key: "puesto", question: "Puesto que ocupas", type: "text", required: true },
      { key: "fecha_efectiva", question: "Fecha efectiva de la renuncia", type: "date", required: true },
      { key: "motivo", question: "¿Deseas incluir el motivo de tu renuncia?", type: "textarea", required: false, hint: "Es opcional. Puedes dejarla en blanco." },
    ],
    requirements: ["Tu nombre y puesto exactos", "La fecha en que quieres dejar de trabajar"],
    includes: [
      "Carta lista para entregar",
      "Instructivo de entrega con constancia",
    ],
  },
  {
    id: "reclamo-prestaciones",
    area: "laboral",
    name: "Reclamación de derechos laborales",
    tagline: "Carta de reclamo y resumen del caso",
    description:
      "Organiza tu caso de terminación laboral y prepara una carta de reclamación de prestaciones, con resumen de hechos para el abogado que revise tu caso.",
    price_min: 2000,
    price_max: 3500,
    risk: "alto",
    auto_deliver: false,
    icon: "scale",
    template: "reclamo_laboral",
    fields: [
      { key: "nombre_trabajador", question: "Tu nombre completo", type: "text", required: true },
      { key: "empresa", question: "Nombre de la empresa", type: "text", required: true },
      { key: "fecha_inicio", question: "Fecha de inicio del empleo", type: "date", required: true },
      { key: "fecha_terminacion", question: "Fecha de terminación del empleo", type: "date", required: true },
      { key: "salario_mensual", question: "Último salario mensual (RD$)", type: "number", required: true },
      { key: "motivo_terminacion", question: "¿Cómo terminó la relación laboral?", type: "select", options: ["Despido", "Renuncia", "Mutuo acuerdo", "Vencimiento de contrato"], required: true },
      { key: "prestaciones_recibidas", question: "Indica si recibiste preaviso, auxilio de cesantía u otras prestaciones", type: "textarea", required: true },
    ],
    requirements: [
      "Carta de despido o cualquier documento de terminación",
      "Recibos de pago",
      "Contrato de trabajo si existe",
    ],
    includes: [
      "Carta de reclamación con base legal",
      "Resumen del caso para el abogado",
      "Revisión profesional antes de enviarse",
    ],
  },

  // ── Comercial y empresarial ──────────────────────────────────────────
  {
    id: "contrato-proveedores",
    area: "comercial",
    name: "Contrato de proveedores",
    tagline: "Suministro entre empresas",
    description:
      "Contrato de suministro de bienes o servicios entre dos empresas: objeto, condiciones de pago, plazo de entrega, garantías y jurisdicción.",
    price_min: 2000,
    price_max: 3000,
    risk: "medio",
    auto_deliver: false,
    icon: "building",
    template: "contrato_proveedores",
    fields: [
      { key: "empresa_compradora", question: "Nombre de la empresa compradora", type: "text", required: true },
      { key: "rnc_compradora", question: "RNC de la empresa compradora", type: "text", required: true },
      { key: "empresa_proveedor", question: "Nombre de la empresa proveedora", type: "text", required: true },
      { key: "rnc_proveedor", question: "RNC de la empresa proveedora", type: "text", required: true },
      { key: "descripcion_bienes", question: "Describe los bienes o servicios que se suministrarán", type: "textarea", required: true },
      { key: "condiciones_pago", question: "Condiciones de pago", type: "text", required: true, hint: "Ej: 50% adelantado y 50% contra entrega" },
      { key: "plazo_entrega", question: "Plazo y lugar de entrega", type: "text", required: true },
    ],
    requirements: ["RNC de ambas empresas", "Detalle de los bienes y precios"],
    includes: [
      "Contrato con condiciones comerciales claras",
      "Cláusulas de garantía y cumplimiento",
      "Revisión profesional antes de firma",
    ],
  },
  {
    id: "acuerdo-confidencialidad",
    area: "comercial",
    name: "Acuerdo de confidencialidad (NDA)",
    tagline: "Protege información de tu negocio",
    description:
      "Acuerdo de confidencialidad entre dos partes: qué se protege, por cuánto tiempo, excepciones y consecuencias del incumplimiento.",
    price_min: 1500,
    price_max: 2500,
    risk: "bajo",
    auto_deliver: true,
    icon: "shield",
    template: "nda",
    fields: [
      { key: "parte_a", question: "Nombre de la primera parte (persona o empresa)", type: "text", required: true },
      { key: "parte_b", question: "Nombre de la segunda parte", type: "text", required: true },
      { key: "proposito", question: "Describe el negocio o proyecto que motiva el intercambio de información", type: "textarea", required: true },
      { key: "duracion_anios", question: "Duración de la confidencialidad (años)", type: "number", required: true },
      { key: "ciudad_firma", question: "Ciudad donde se firmará", type: "text", required: true },
    ],
    requirements: ["Identificación de las partes", "Contexto del negocio"],
    includes: [
      "NDA con definiciones y excepciones estándar",
      "Cláusula de duración y consecuencias",
      "Formato listo para firma",
    ],
  },

  // ── Inmobiliario ─────────────────────────────────────────────────────
  {
    id: "checklist-compraventa",
    area: "inmobiliario",
    name: "Lista de verificación de compraventa",
    tagline: "Antes de comprar tu inmueble",
    description:
      "Lista de verificación documental para comprar o vender un inmueble: título, deslinde, gravámenes, impuestos y pasos de escrituración.",
    price_min: 1000,
    price_max: 1500,
    risk: "medio",
    auto_deliver: false,
    icon: "list-check",
    template: "checklist_compraventa",
    fields: [
      { key: "nombre_comprador", question: "Nombre del comprador", type: "text", required: true },
      { key: "nombre_vendedor", question: "Nombre del vendedor", type: "text", required: true },
      { key: "tipo_inmueble", question: "Tipo de inmueble", type: "select", options: ["Apartamento", "Casa", "Terreno", "Local comercial"], required: true },
      { key: "direccion_inmueble", question: "Dirección del inmueble", type: "text", required: true },
      { key: "precio_estimado", question: "Precio estimado (RD$)", type: "number", required: true },
      { key: "financiamiento", question: "¿Cómo se financiará la compra?", type: "select", options: ["Con préstamo bancario", "Al contado", "Aún no lo sé"], required: true },
      { key: "estado_documentos", question: "Indica qué documentos ya tienes", type: "textarea", required: true, hint: "Ej: título de propiedad, deslinde, certificación de gravámenes" },
    ],
    requirements: ["Datos de las partes", "Información del inmueble"],
    includes: [
      "Lista de verificación personalizada",
      "Pasos de la compraventa y escrituración",
      "Alertas de riesgos comunes",
    ],
  },
  {
    id: "analisis-promesa-venta",
    area: "inmobiliario",
    name: "Análisis de promesa de venta",
    tagline: "Revisión antes de comprometer arras",
    description:
      "Informe preliminar de tu promesa de venta: precio, arras, plazo de escrituración, cláusulas de riesgo y qué verificar antes de firmar.",
    price_min: 2500,
    price_max: 3500,
    risk: "alto",
    auto_deliver: false,
    icon: "search",
    template: "informe_analisis",
    fields: [
      { key: "nombre_comprador", question: "Nombre del promitente comprador", type: "text", required: true },
      { key: "nombre_vendedor", question: "Nombre del promitente vendedor", type: "text", required: true },
      { key: "precio_venta", question: "Precio de venta acordado (RD$)", type: "number", required: true },
      { key: "monto_arras", question: "Monto entregado como arras (RD$)", type: "number", required: true },
      { key: "plazo_escrituracion", question: "Plazo acordado para la escrituración", type: "text", required: true },
      { key: "clausulas_preocupacion", question: "Pega o resume las cláusulas que te preocupan", type: "textarea", required: true },
    ],
    requirements: ["Borrador o texto de la promesa de venta", "Datos de las partes"],
    includes: [
      "Informe preliminar de cláusulas y riesgos",
      "Puntos a negociar antes de firmar",
      "Revisión profesional obligatoria",
    ],
  },

  // ── Familia y sucesiones ─────────────────────────────────────────────
  {
    id: "orientacion-familia",
    area: "familia",
    name: "Orientación de familia y sucesiones",
    tagline: "Manutención, herencias y divorcio",
    description:
      "Organiza la información de tu asunto familiar o sucesorio y recibe un expediente preliminar con resumen del caso, listo para la evaluación de un abogado.",
    price_min: 2000,
    price_max: 3500,
    risk: "alto",
    auto_deliver: false,
    icon: "users",
    template: "expediente_familia",
    fields: [
      { key: "nombre_solicitante", question: "Tu nombre completo", type: "text", required: true },
      { key: "materia", question: "¿Cuál es tu asunto?", type: "select", options: ["Manutención", "Herencia / sucesión", "Divorcio", "Otro asunto familiar"], required: true },
      { key: "descripcion_caso", question: "Describe tu situación con tus palabras", type: "textarea", required: true },
      { key: "documentos_disponibles", question: "¿Qué documentos y datos tienes ahora mismo?", type: "textarea", required: true, hint: "Ej: actas de nacimiento, acta de defunción, recibos, título de propiedad" },
    ],
    requirements: [
      "Actas y documentos relacionados que tengas",
      "Nombres y fechas relevantes de las personas involucradas",
    ],
    includes: [
      "Expediente preliminar organizado",
      "Resumen del caso para el abogado",
      "Lista de documentos faltantes",
    ],
  },
];

export const LEGAL_SOURCES: LegalSource[] = [
  {
    id: "codigo-civil",
    area: "civil",
    name: "Código Civil de la República Dominicana",
    articles: ["1101 y ss. (contratos)", "1710 y ss. (arrendamiento)", "1582 y ss. (compraventa)"],
    summary: "Regula contratos, obligaciones, arrendamientos y compraventas entre particulares.",
    url: "https://www.poderjudicial.gob.do/",
    effective_note: "Versión consolidada; verificar modificaciones vigentes antes de su uso.",
    verified: false,
  },
  {
    id: "codigo-trabajo",
    area: "laboral",
    name: "Código de Trabajo (Ley 16-92)",
    articles: ["177 (preaviso)", "219 (auxilio de cesantía)"],
    summary: "Regula contratos de trabajo, jornada, salario, terminación y prestaciones laborales.",
    url: "https://www.mitradel.gob.do/",
    effective_note: "Verificar artículos aplicables con la versión vigente y regulaciones complementarias.",
    verified: false,
  },
  {
    id: "ley-339-22",
    area: "general",
    name: "Ley 339-22 para la Modernización de los Procesos Judiciales",
    articles: ["General"],
    summary: "Moderniza los procesos judiciales y habilita los procedimientos digitales en la RD.",
    url: "https://www.poderjudicial.gob.do/",
    effective_note: "Publicada en 2022; verificar reglamento de aplicación.",
    verified: false,
  },
  {
    id: "ley-358-05",
    area: "civil",
    name: "Ley 358-05 de Protección de los Derechos del Consumidor",
    articles: ["General"],
    summary: "Protege los derechos de las personas consumidoras en sus relaciones de consumo.",
    url: "https://www.proconsumo.gob.do/",
    effective_note: "Verificar texto vigente y organismos de aplicación.",
    verified: false,
  },
  {
    id: "ley-136-03",
    area: "familia",
    name: "Ley 136-03, Código para el Sistema de Protección de los Derechos de NNA",
    articles: ["General"],
    summary: "Protege los derechos de niños, niñas y adolescentes, incluida la manutención.",
    url: "https://www.conani.gob.do/",
    effective_note: "Verificar reglamento de aplicación y procedimientos vigentes.",
    verified: false,
  },
  {
    id: "codigo-civil-sucesiones",
    area: "familia",
    name: "Código Civil — Sucesiones y herencias",
    articles: ["732 y ss. (sucesiones)"],
    summary: "Regula la transmisión hereditaria, aceptación y partición de bienes.",
    url: "https://www.poderjudicial.gob.do/",
    effective_note: "Verificar artículos aplicables con la versión vigente.",
    verified: false,
  },
  {
    id: "ley-notariado",
    area: "general",
    name: "Ley de Notariado (Ley 189 de 1940)",
    articles: ["General"],
    summary: "Regula el ejercicio notarial y la legalización de documentos en la RD.",
    url: "https://www.poderjudicial.gob.do/",
    effective_note: "Verificar texto vigente y aranceles notariales aplicables.",
    verified: false,
  },
];

export const PROFESSIONALS: Professional[] = [
  {
    id: "prof-abogado-pendiente",
    name: "Abogado/a responsable (por asignar)",
    role: "abogado",
    license: "",
    areas: ["civil", "laboral", "comercial", "inmobiliario", "familia"],
    active: false,
  },
  {
    id: "prof-notario-pendiente",
    name: "Notario/a (por asignar)",
    role: "notario",
    license: "",
    areas: ["civil", "inmobiliario"],
    active: false,
  },
];

export function seed() {
  let seeded = false;
  if (db.all("services").length === 0) {
    SERVICES.forEach((s) => db.insert("services", s));
    seeded = true;
  }
  if (db.all("legal_sources").length === 0) {
    LEGAL_SOURCES.forEach((s) => db.insert("legal_sources", s));
    seeded = true;
  }
  if (db.all("professionals").length === 0) {
    PROFESSIONALS.forEach((p) => db.insert("professionals", p));
    seeded = true;
  }
  if (seeded) console.log("[seed] Catálogo, biblioteca jurídica y profesionales inicializados.");
  return seeded;
}

if (import.meta.main) {
  seed();
  console.log(
    `Servicios: ${db.all("services").length} | Fuentes: ${db.all("legal_sources").length} | Profesionales: ${db.all("professionals").length}`,
  );
}
