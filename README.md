# LexGoAI

Plataforma de asistencia jurídica digital para República Dominicana, asistida por
agentes de IA especializados. **Asistente jurídico virtual, no un abogado.**

## Decisiones de diseño vigentes

- **Máxima automatización con supervisión según riesgo**: los documentos estándar
  de riesgo bajo se entregan automáticamente dentro de límites aprobados; los de
  riesgo medio y alto siempre pasan por revisión profesional antes de entregarse.
- **Todas las áreas desde el inicio**: civil y contratos, laboral, comercial,
  inmobiliario y familia/sucesiones.
- **Sin Supabase**: el backend usa únicamente Deno (sin dependencias externas)
  con una capa de almacenamiento en JSON fácil de sustituir por una base de datos
  real manteniendo la misma interfaz.
- **Sin PayPal (pagos diferidos)**: los precios son informativos de prueba
  (RD$750–3,500 por servicio).
- Cada documento generado cita las **normas y artículos** consultados con enlace,
  fecha de la versión y estado de verificación.

## Estructura

```
lexgoai/
├── backend/
│   ├── server.ts      # API REST + servidor de archivos estáticos (puerto 8000)
│   ├── db.ts          # Almacenamiento JSON (data/db.json), sustituible
│   ├── seed.ts        # Catálogo de servicios, biblioteca jurídica, profesionales
│   ├── templates.ts   # Motor de plantillas con citas legales y avisos
│   ├── ai.ts          # Capa de IA opcional (con degradación segura)
│   └── types.ts       # Modelos: Service, ServiceRequest, CaseData (answers),
│                      # GeneratedDocument, LegalSource, Professional, ReviewTask
├── frontend/          # PWA instalable (vanilla JS, sin frameworks)
│   ├── index.html     # 4 pantallas: Servicios, Asistente, Mis documentos, Panel
│   ├── css/styles.css # Sistema de diseño minimalista y profesional
│   ├── js/app.js      # SPA con enrutado por hash
│   ├── manifest.webmanifest + sw.js   # Instalable y funcionable sin conexión
│   └── icons/         # Íconos de la app (192/512/apple/favicon)
└── data/db.json       # Base de datos (se crea sola al arrancar)
```

## Ejecutar localmente

Requiere [Deno 2.x](https://deno.com).

```bash
deno task dev        # http://localhost:8000
```

La primera ejecución siembra automáticamente 12 servicios en 5 áreas, la
biblioteca jurídica inicial y los profesionales pendientes de asignar.

### Variables de entorno (opcionales)

| Variable      | Por defecto   | Descripción                                        |
| ------------- | ------------- | -------------------------------------------------- |
| `PORT`        | `8000`        | Puerto del servidor                                |
| `ADMIN_PIN`   | `lexgo2026`   | PIN del panel profesional (**cámbialo en producción**) |
| `DB_PATH`     | `data/db.json`| Ruta del almacén de datos                          |
| `AI_API_KEY`  | (sin IA)      | Clave tipo OpenAI para enriquecer informes         |
| `AI_BASE_URL` | api.openai.com| Endpoint compatible con OpenAI                     |
| `AI_MODEL`    | `gpt-4o-mini` | Modelo de la capa de IA                            |

Sin `AI_API_KEY` el sistema funciona con flujos deterministas por servicio.
La capa de IA nunca bloquea la entrega: si falla, usa el texto de respaldo.

## Prueba rápida del flujo

```bash
# crear solicitud de contrato de alquiler (riesgo bajo → entrega automática)
curl -s localhost:8000/api/services | head -c 300
# panel profesional: POST /api/admin/login {"pin": "lexgo2026"}
```

## Despliegue activo

- **Interfaz (PWA):** https://mingo20.github.io/lexgoai/
- **API (función Base44):** https://superagent-573efe2c.base44.app/functions/lexgoaiApi
- **Almacenamiento:** entidad `LexRecord` del entorno nativo de Base44 (sin Supabase).
- El frontend publicado usa `LEXGO_BACKEND = "base44"`; el backend Deno de este
  repositorio (`deno task dev`) sirve la misma aplicación en modo local.

## Despliegue (alternativas)

### Backend (Deno Deploy)

1. Sube el repositorio a GitHub.
2. En [Deno Deploy](https://deno.com/deploy) crea un proyecto conectado al repo,
   punto de entrada `backend/server.ts`.
3. Define `ADMIN_PIN` en las variables de entorno del proyecto.

### Frontend

- **Opción A (recomendada para empezar)**: el propio backend sirve el frontend.
  Conecta el dominio de Deno Deploy y listo.
- **Opción B (GitHub Pages)**: publica `frontend/` y en `index.html` define
  `window.LEXGO_API_BASE = "https://TU-PROYECTO.deno.dev";`.
  La API ya envía cabeceras CORS para permitirlo.

## Limitaciones honestas y ruta de mejora

1. **Biblioteca jurídica sin verificar**: las fuentes sembradas (Código Civil,
   Ley 16-92, Ley 339-22, Ley 358-05, Ley 136-03, Ley de Notariado) están
   marcadas `verified: false`. El abogado responsable debe validar cada norma,
   artículo y su vigencia **antes de operar con clientes reales**.
2. **Almacenamiento en archivo**: `data/db.json` es ideal para desarrollo y
   piloto. En producción (o en Deno Deploy, cuyo sistema de archivos es
   efímero) sustituye la clase `Database` de `db.ts` por PostgreSQL u otra base
   de datos sin tocar el resto del código.
3. **Autenticación de clientes pendiente**: hoy cada navegador tiene un
   `client_id` anónimo. Falta registro/login y aislamiento por cuenta.
4. **Pagos diferidos por decisión del propietario** (sin PayPal por ahora).
5. La capa de IA es un punto de integración: sustitúyela por el proveedor que
   elijas (incluido un agente Base44 vía API).

## Aviso legal

LexGoAI es un asistente jurídico virtual, no un abogado. No constituye asesoría
jurídica individualizada salvo que un profesional la revise y apruebe. La
publicidad del producto debe describir con veracidad qué hace la plataforma y
qué profesional interviene en cada servicio.
