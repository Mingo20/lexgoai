// LexGoAI — Tipos del dominio
// Plataforma de asistencia jurídica digital para República Dominicana

export type Area = "civil" | "laboral" | "comercial" | "inmobiliario" | "familia";
export type Risk = "bajo" | "medio" | "alto";

export interface FieldDef {
  key: string;
  question: string;
  type: "text" | "textarea" | "number" | "date" | "select";
  options?: string[];
  required: boolean;
  hint?: string;
}

export interface Service {
  id: string;
  area: Area;
  name: string;
  tagline: string;
  description: string;
  price_min: number;
  price_max: number;
  risk: Risk;
  auto_deliver: boolean;
  icon: string;
  template: string;
  fields: FieldDef[];
  requirements: string[];
  includes: string[];
}

export interface LegalSource {
  id: string;
  area: Area | "general";
  name: string;
  articles: string[];
  summary: string;
  url: string;
  effective_note: string;
  /** false hasta que el abogado responsable valide la fuente y su vigencia */
  verified: boolean;
}

export interface Professional {
  id: string;
  name: string;
  role: "abogado" | "notario";
  license: string;
  areas: string[];
  active: boolean;
}

export type RequestStatus =
  | "recopilando" // el asistente recopila datos
  | "listo" // datos completos, listo para generar
  | "en_revision" // documento preparado, espera al profesional
  | "entregado" // entregado al cliente
  | "rechazado"; // rechazado en revisión profesional

export interface ServiceRequest {
  id: string;
  service_id: string;
  client_id: string;
  status: RequestStatus;
  risk: Risk;
  answers: Record<string, string>;
  created_date: string;
  updated_date: string;
}

export interface Citation {
  source: string;
  articles: string[];
  url: string;
  consulted: string;
  verified: boolean;
}

export interface GeneratedDocument {
  id: string;
  request_id: string;
  title: string;
  content: string; // HTML listo para pantalla e impresión
  citations: Citation[];
  delivered: boolean;
  created_date: string;
}

export interface ReviewTask {
  id: string;
  request_id: string;
  document_id: string;
  professional_id: string | null;
  status: "pendiente" | "aprobada" | "rechazada";
  notes: string;
  created_date: string;
  resolved_date: string | null;
}

export const AREA_LABELS: Record<Area, string> = {
  civil: "Civil y contratos",
  laboral: "Laboral",
  comercial: "Comercial y empresarial",
  inmobiliario: "Inmobiliario",
  familia: "Familia y sucesiones",
};

export const AREA_ICONS: Record<Area, string> = {
  civil: "file-text",
  laboral: "briefcase",
  comercial: "building",
  inmobiliario: "home",
  familia: "users",
};
