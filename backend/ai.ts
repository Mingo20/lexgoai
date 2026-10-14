// LexGoAI — Capa de IA opcional
// Si defines AI_API_KEY (con AI_BASE_URL y AI_MODEL opcionales), el asistente
// enriquece los informes con observaciones. Sin clave, el sistema funciona
// con el flujo determinista: mejor predecible que improvisado.

const SYSTEM_PROMPT = `Eres un asistente jurídico virtual dominicano que trabaja dentro de LexGoAI.
REGLAS ESTRICTAS:
1. No inventes leyes, artículos ni jurisprudencia. Si no tienes respaldo suficiente, dilo.
2. Escribe en español dominicano profesional, claro y sobrio.
3. Nunca prometas resultados judiciales.
4. Termina siempre señalando que el caso requiere revisión profesional cuando corresponda.
5. Máximo 250 palabras.`;

export async function assistantObservations(
  context: string,
  fallback: string,
): Promise<string> {
  const key = Deno.env.get("AI_API_KEY");
  if (!key) return fallback;

  const base = Deno.env.get("AI_BASE_URL") ?? "https://api.openai.com/v1";
  const model = Deno.env.get("AI_MODEL") ?? "gpt-4o-mini";

  try {
    const res = await fetch(`${base}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${key}`,
      },
      body: JSON.stringify({
        model,
        temperature: 0.3,
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: context },
        ],
      }),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    const text: string | undefined = data?.choices?.[0]?.message?.content?.trim();
    return text || fallback;
  } catch {
    // Nunca bloquear la entrega por una falla de la capa de IA
    return fallback;
  }
}
