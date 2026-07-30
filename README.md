# GeoDash Analytics 2.0

Dashboard web estático de inteligencia operacional para el ecosistema **GeoCálculo**. Esta versión presenta la actividad del ecosistema a partir de todos los eventos registrados, sin confundir eventos, consultas y sesiones.

## Funcionalidad

- Selector global **Hoy / Semana / Mes** en UTC, con comparación contra el período equivalente anterior.
- Tres KPI: eventos del período, variación y sesiones activas.
- Evolución de eventos y promedio móvil; distribución comparada por sitio.
- Composición temporal e interactiva de acceso, exploración, consulta, ecosistema, conversión y otros.
- Journey Index → Consulta → GeoQuery → PDF → KML y tendencia de actividad por sitio.
- Caché y actualización automática cada cinco minutos; diseño responsive sin proceso de build.

## Ejecución local

```bash
python3 -m http.server 8080
```

Abrir `http://localhost:8080`. Chart.js y la tipografía se descargan desde CDN.

## Contrato del API

La interfaz realiza una única llamada a `GET /analytics?period=week`; `period` acepta `day`, `week` o `month`. El navegador nunca se conecta directamente a D1.

```json
{
  "ok": true,
  "period": "week",
  "generated_at": "2026-07-30T12:00:00.000Z",
  "timezone": "UTC",
  "summary": { "current": 184, "previous": 151, "variation": 21.9, "consultations": 32, "sessions": 18, "final_conversion": 6.4 },
  "trend": [{ "label": "29 jul", "timestamp": "2026-07-29T00:00:00.000Z", "events": 28, "moving_average": 21.4 }],
  "site_distribution": [{ "site": "geoeva", "current": 65, "previous": 58, "variation": 12.1, "share": 35.3, "previous_share": 38.4 }],
  "event_composition": [{ "label": "29 jul", "timestamp": "2026-07-29T00:00:00.000Z", "access": 21, "exploration": 35, "query": 18, "ecosystem": 4, "conversion": 3, "other": 0 }],
  "heatmap": [],
  "journey": [{ "stage": "Index", "count": 20, "events": 25 }],
  "site_trend": [{ "label": "29 jul", "timestamp": "2026-07-29T00:00:00.000Z", "geoipt": 12, "geoeva": 25, "geonemo": 8, "geonoxa": 6 }]
}
```

El frontend ignora `heatmap`, conservado solamente para compatibilidad. El Worker debe completar buckets sin actividad con ceros y nunca responder valores no finitos. Las consultas D1 parametrizadas de referencia están en [`docs/d1-analytics.sql`](docs/d1-analytics.sql).

## Archivos

```text
index.html                Estructura accesible de los cinco paneles
css/geodash.css           Sistema visual y breakpoints responsive
js/config.js              URL pública del API
js/api.js                 Cliente único y caché de cinco minutos
js/charts.js              Visualizaciones Chart.js
js/dashboard.js           Normalización y render de paneles
docs/d1-analytics.sql     Consultas agregadas para Cloudflare D1
```
