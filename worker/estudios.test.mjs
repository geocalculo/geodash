import assert from "node:assert/strict";
import test from "node:test";
import {
  manejarRutaEstudios,
  obtenerContadorEstudios,
  registrarAccesoEstudios
} from "./estudios.js";

function dbFalsa({ duplicate = null, totals = null, fail = false } = {}) {
  const calls = [];
  return {
    calls,
    prepare(sql) {
      const call = { sql, values: [] };
      calls.push(call);
      return {
        bind(...values) {
          call.values = values;
          return this;
        },
        async first() {
          if (fail) throw new Error("D1 no disponible");
          return sql.includes("SUM(") ? totals : duplicate;
        },
        async run() {
          if (fail) throw new Error("D1 no disponible");
          return { success: true };
        }
      };
    }
  };
}

const request = (body) => new Request("https://worker.test/api/estudios/visita", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(body)
});

test("registra una visita nueva sin fecha, IP ni coordenadas", async () => {
  const DB = dbFalsa();
  const response = await registrarAccesoEstudios(
    request({ evento: " visita ", recurso: null, session_id: " abc " }),
    { DB }
  );
  assert.equal(response.status, 201);
  assert.deepEqual(await response.json(), { ok: true, registrado: true });
  assert.equal(DB.calls.length, 2);
  assert.deepEqual(DB.calls[1].values, ["visita", null, "abc"]);
  assert.doesNotMatch(DB.calls[1].sql, /fecha|ip|coorden/i);
});

test("no inserta una visita duplicada", async () => {
  const DB = dbFalsa({ duplicate: { 1: 1 } });
  const response = await registrarAccesoEstudios(
    request({ evento: "visita", recurso: null, session_id: "abc" }),
    { DB }
  );
  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), { ok: true, registrado: false, duplicado: true });
  assert.equal(DB.calls.length, 1);
});

test("deduplica lámina por evento, recurso y sesión", async () => {
  const DB = dbFalsa({ duplicate: { 1: 1 } });
  await registrarAccesoEstudios(
    request({ evento: "lamina", recurso: " ficha-1 ", session_id: "abc" }),
    { DB }
  );
  assert.deepEqual(DB.calls[0].values, ["lamina", "ficha-1", "abc"]);
});

test("rechaza eventos y campos inválidos", async () => {
  for (const body of [
    { evento: "otro", recurso: null, session_id: "abc" },
    { evento: "visita", recurso: "ficha", session_id: "abc" },
    { evento: "linkedin", recurso: null, session_id: "abc" },
    { evento: "lamina", recurso: "x".repeat(201), session_id: "abc" },
    { evento: "visita", recurso: null, session_id: " ".repeat(101) }
  ]) {
    const response = await registrarAccesoEstudios(request(body), { DB: dbFalsa() });
    assert.equal(response.status, 400);
    assert.equal((await response.json()).ok, false);
  }
});

test("convierte una falla D1 en respuesta aislada", async () => {
  const response = await registrarAccesoEstudios(
    request({ evento: "visita", recurso: null, session_id: "abc" }),
    { DB: dbFalsa({ fail: true }) }
  );
  assert.equal(response.status, 500);
  assert.deepEqual(await response.json(), {
    ok: false,
    error: "No fue posible registrar el acceso"
  });
});

test("devuelve contadores históricos, incluidos ceros", async () => {
  const response = await obtenerContadorEstudios({
    DB: dbFalsa({ totals: { visitas: 100, laminas: 250, linkedin: 54 } })
  });
  const body = await response.json();
  assert.equal(response.status, 200);
  assert.deepEqual(
    { ok: body.ok, visitas: body.visitas, laminas: body.laminas, linkedin: body.linkedin },
    { ok: true, visitas: 100, laminas: 250, linkedin: 54 }
  );
  assert.match(body.updated_at, /^\d{4}-\d{2}-\d{2}T/);
});

test("solo intercepta las dos rutas nuevas", async () => {
  assert.equal(
    manejarRutaEstudios(new Request("https://worker.test/api/registro"), { DB: dbFalsa() }),
    null
  );
  const response = await manejarRutaEstudios(
    new Request("https://worker.test/api/estudios/contador"),
    { DB: dbFalsa({ totals: null }) }
  );
  assert.equal(response.status, 200);
});
