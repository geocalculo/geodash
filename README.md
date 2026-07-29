# GeoDash Analytics 2.0

Dashboard web estático de inteligencia operacional para el ecosistema **GeoCálculo**. La primera fase reemplaza los indicadores de eventos por cinco lecturas: evolución, distribución por sitio, patrones horarios, journey y tendencia comparada.

## Funcionalidad

- Selector global **Hoy / Semana / Mes**, comparación equivalente y porcentaje de variación.
- Línea suavizada con promedio móvil, máximo y mínimo.
- Participación 100 % entre GeoIPT, GeoEVA, GeoNOXA y GeoNEMO.
- Heatmap horario, embudo de conversión y cuatro series con leyenda interactiva.
- Respuesta en caché durante cinco minutos y actualización automática con la misma frecuencia.
- Responsive, sin dependencias de npm ni proceso de build.

## Ejecución local

```bash
python3 -m http.server 8080
```

Abrir `http://localhost:8080`. Chart.js y la tipografía se descargan desde CDN.

## Contrato del API

La interfaz llama `GET /analytics?period=week`, donde `period` acepta `today`, `week` o `month`. El navegador nunca se conecta directamente a D1 y `js/config.js` solo contiene la URL pública del Worker.

```json
{
  "summary": { "current": 148, "previous": 125, "change": 18.4 },
  "trend": [{ "label": "Lun", "bucket": "2026-07-27", "count": 20 }],
  "siteDistribution": [{ "site": "GeoIPT", "count": 68, "percentage": 45.9, "change": 12.5 }],
  "heatmap": [{ "label": "Lun", "hours": [0, 1, 0, 2] }],
  "journey": [{ "stage": "Index", "count": 300 }, { "stage": "Consulta", "count": 148 }],
  "siteTrend": {
    "labels": ["Lun", "Mar"],
    "series": [{ "site": "GeoIPT", "values": [20, 24] }]
  }
}
```

Las consultas propuestas para el Worker están en [`docs/d1-analytics.sql`](docs/d1-analytics.sql). Usan `strftime()`, funciones de ventana y agregaciones en D1 para evitar trasladar cálculos de volumen, participación y conversión al navegador. El Worker debe completar buckets sin actividad con cero y devolver los nombres de campo del contrato anterior.

## Archivos

```text
index.html                Estructura accesible de los cinco paneles
css/geodash.css           Sistema visual y breakpoints responsive
js/config.js              URL pública del API
js/api.js                 Cliente y caché de cinco minutos
js/charts.js              Visualizaciones Chart.js
js/dashboard.js           Carga, transformación y render de paneles
docs/d1-analytics.sql     Consultas agregadas para Cloudflare D1
```
