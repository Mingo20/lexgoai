// LexGoAI — Almacenamiento en archivo JSON
// Almacén simple y portable (sin Supabase, decisión del propietario).
// Para producción se puede sustituir esta capa por una base de datos real
// manteniendo la misma interfaz: all / filter / get / insert / update.

import type {
  GeneratedDocument,
  LegalSource,
  Professional,
  ReviewTask,
  Service,
  ServiceRequest,
} from "./types.ts";

interface CollMap {
  services: Service;
  legal_sources: LegalSource;
  professionals: Professional;
  requests: ServiceRequest;
  documents: GeneratedDocument;
  review_tasks: ReviewTask;
}
type Coll = keyof CollMap;

interface DBData {
  services: Service[];
  legal_sources: LegalSource[];
  professionals: Professional[];
  requests: ServiceRequest[];
  documents: GeneratedDocument[];
  review_tasks: ReviewTask[];
}

const DB_PATH = Deno.env.get("DB_PATH") ?? "data/db.json";

const empty = (): DBData => ({
  services: [],
  legal_sources: [],
  professionals: [],
  requests: [],
  documents: [],
  review_tasks: [],
});

export class Database {
  private data: DBData = empty();
  private path: string;

  constructor(path: string = DB_PATH) {
    this.path = path;
    this.load();
  }

  load() {
    try {
      const raw = Deno.readTextFileSync(this.path);
      const parsed = JSON.parse(raw) as Partial<DBData>;
      this.data = { ...empty(), ...parsed };
    } catch {
      // primera ejecución: base vacía
    }
  }

  save() {
    try {
      const dir = this.path.includes("/")
        ? this.path.split("/").slice(0, -1).join("/")
        : ".";
      Deno.mkdirSync(dir, { recursive: true });
      Deno.writeTextFileSync(this.path, JSON.stringify(this.data, null, 2));
    } catch (err) {
      console.warn("[db] No se pudo persistir:", err instanceof Error ? err.message : err);
    }
  }

  all<K extends Coll>(coll: K): CollMap[K][] {
    return this.data[coll] as CollMap[K][];
  }

  filter<K extends Coll>(coll: K, pred: (doc: CollMap[K]) => boolean): CollMap[K][] {
    return this.all(coll).filter(pred);
  }

  get<K extends Coll>(coll: K, id: string): CollMap[K] | undefined {
    return this.all(coll).find((d) => (d as { id: string }).id === id);
  }

  insert<K extends Coll>(coll: K, doc: CollMap[K]): CollMap[K] {
    (this.data[coll] as CollMap[K][]).push(doc);
    this.save();
    return doc;
  }

  update<K extends Coll>(coll: K, id: string, patch: Partial<CollMap[K]>): CollMap[K] | undefined {
    const doc = this.get(coll, id);
    if (!doc) return undefined;
    Object.assign(doc, patch);
    this.save();
    return doc;
  }
}

export const db = new Database();

export const nowISO = () => new Date().toISOString();
