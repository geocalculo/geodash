const EVENTOS_ESTUDIOS_VALIDOS = new Set(["visita", "lamina", "linkedin"]);

function respuestaJson(payload, status, corsHeaders = {}) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { "Content-Type": "application/json; charset=UTF-8", ...corsHeaders }
  });
}

function validarAccesoEstudios(datos) {
  if (!datos || typeof datos !== "object" || Array.isArray(datos)) {
    return { error: "El cuerpo debe ser un objeto JSON" };
  }

  if (typeof datos.evento !== "string") {
    return { error: "evento es obligatorio" };
  }
  const evento = datos.evento.trim();
  if (!EVENTOS_ESTUDIOS_VALIDOS.has(evento)) {
    return { error: "evento debe ser visita, lamina o linkedin" };
  }

  if (typeof datos.session_id !== "string") {
    return { error: "session_id es obligatorio" };
  }
  const sessionId = datos.session_id.trim();
  if (!sessionId || sessionId.length > 100) {
    return { error: "session_id debe contener entre 1 y 100 caracteres" };
  }

  if (evento === "visita") {
    if (datos.recurso !== null) {
      return { error: "recurso debe ser null para visita" };
    }
    return { evento, recurso: null, sessionId };
  }

  if (typeof datos.recurso !== "string") {
    return { error: "recurso es obligatorio para lamina y linkedin" };
  }
  const recurso = datos.recurso.trim();
  if (!recurso || recurso.length > 200) {
    return { error: "recurso debe contener entre 1 y 200 caracteres" };
  }

  return { evento, recurso, sessionId };
}

export async function registrarAccesoEstudios(request, env, corsHeaders = {}) {
  let datos;
  try {
    datos = await request.json();
  } catch {
    return respuestaJson({ ok: false, error: "JSON inválido" }, 400, corsHeaders);
  }

  const acceso = validarAccesoEstudios(datos);
  if (acceso.error) {
    return respuestaJson({ ok: false, error: acceso.error }, 400, corsHeaders);
  }

  try {
    const duplicado = acceso.evento === "visita"
      ? await env.DB.prepare(
          "SELECT 1 FROM accesos_estudios WHERE evento = 'visita' AND session_id = ? LIMIT 1"
        ).bind(acceso.sessionId).first()
      : await env.DB.prepare(
          "SELECT 1 FROM accesos_estudios WHERE evento = ? AND recurso = ? AND session_id = ? LIMIT 1"
        ).bind(acceso.evento, acceso.recurso, acceso.sessionId).first();

    if (duplicado) {
      return respuestaJson(
        { ok: true, registrado: false, duplicado: true },
        200,
        corsHeaders
      );
    }

    await env.DB.prepare(
      "INSERT INTO accesos_estudios (evento, recurso, session_id) VALUES (?, ?, ?)"
    ).bind(acceso.evento, acceso.recurso, acceso.sessionId).run();

    return respuestaJson({ ok: true, registrado: true }, 201, corsHeaders);
  } catch (error) {
    console.error("Error al registrar acceso de Estudios", error);
    return respuestaJson(
      { ok: false, error: "No fue posible registrar el acceso" },
      500,
      corsHeaders
    );
  }
}

export async function obtenerContadorEstudios(env, corsHeaders = {}) {
  try {
    const totales = await env.DB.prepare(`
      SELECT
        SUM(CASE WHEN evento = 'visita' THEN 1 ELSE 0 END) AS visitas,
        SUM(CASE WHEN evento = 'lamina' THEN 1 ELSE 0 END) AS laminas,
        SUM(CASE WHEN evento = 'linkedin' THEN 1 ELSE 0 END) AS linkedin
      FROM accesos_estudios
    `).first();

    return respuestaJson({
      ok: true,
      visitas: Number(totales?.visitas ?? 0),
      laminas: Number(totales?.laminas ?? 0),
      linkedin: Number(totales?.linkedin ?? 0),
      updated_at: new Date().toISOString()
    }, 200, corsHeaders);
  } catch (error) {
    console.error("Error al obtener contador de Estudios", error);
    return respuestaJson(
      { ok: false, error: "No fue posible obtener el contador" },
      500,
      corsHeaders
    );
  }
}

// Invocar antes de la respuesta "RUTA NO ENCONTRADA" del fetch actual.
// Devuelve null para que todas las rutas preexistentes conserven su flujo intacto.
export function manejarRutaEstudios(request, env, corsHeaders = {}) {
  const { pathname } = new URL(request.url);
  if (request.method === "POST" && pathname === "/api/estudios/visita") {
    return registrarAccesoEstudios(request, env, corsHeaders);
  }
  if (request.method === "GET" && pathname === "/api/estudios/contador") {
    return obtenerContadorEstudios(env, corsHeaders);
  }
  return null;
}
