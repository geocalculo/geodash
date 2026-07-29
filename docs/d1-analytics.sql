-- Consultas de referencia para GET /analytics?period=today|week|month.
-- El Worker debe enlazar :current_start, :current_end, :previous_start y :bucket_format.
-- Los límites se calculan una sola vez en UTC y usan intervalos [inicio, fin).

-- 1. Evolución, resumen, máximo y mínimo. :bucket_format = '%Y-%m-%d %H:00'
-- para Hoy y '%Y-%m-%d' para Semana/Mes.
WITH current_events AS (
  SELECT strftime(:bucket_format, fecha_hora) AS bucket, COUNT(*) AS count
  FROM events
  WHERE fecha_hora >= :current_start AND fecha_hora < :current_end
    AND tipo_evento = 'consulta'
  GROUP BY bucket
), previous_total AS (
  SELECT COUNT(*) AS count FROM events
  WHERE fecha_hora >= :previous_start AND fecha_hora < :current_start
    AND tipo_evento = 'consulta'
)
SELECT bucket, count,
       SUM(count) OVER () AS current_total,
       (SELECT count FROM previous_total) AS previous_total,
       AVG(count) OVER (ORDER BY bucket ROWS BETWEEN 2 PRECEDING AND CURRENT ROW) AS moving_average,
       MAX(count) OVER () AS maximum,
       MIN(count) OVER () AS minimum
FROM current_events ORDER BY bucket;

-- 2. Participación por sitio y variación frente al período anterior.
WITH totals AS (
  SELECT sitio,
    SUM(CASE WHEN fecha_hora >= :current_start AND fecha_hora < :current_end THEN 1 ELSE 0 END) AS current_count,
    SUM(CASE WHEN fecha_hora >= :previous_start AND fecha_hora < :current_start THEN 1 ELSE 0 END) AS previous_count
  FROM events
  WHERE fecha_hora >= :previous_start AND fecha_hora < :current_end
    AND tipo_evento = 'consulta' AND sitio IN ('GeoIPT','GeoEVA','GeoNOXA','GeoNEMO')
  GROUP BY sitio
)
SELECT sitio, current_count,
  ROUND(100.0 * current_count / NULLIF(SUM(current_count) OVER (), 0), 1) AS percentage,
  ROUND(100.0 * (current_count - previous_count) / NULLIF(previous_count, 0), 1) AS change
FROM totals ORDER BY current_count DESC;

-- 3. Heatmap. El cliente completa con cero las combinaciones sin eventos.
SELECT strftime('%w', fecha_hora) AS weekday,
       CAST(strftime('%H', fecha_hora) AS INTEGER) AS hour,
       COUNT(*) AS count
FROM events
WHERE fecha_hora >= :current_start AND fecha_hora < :current_end
  AND tipo_evento = 'consulta'
GROUP BY weekday, hour ORDER BY weekday, hour;

-- 4. Journey. session_id evita contar varias veces una etapa en una sesión.
WITH stages(stage, position, event_name) AS (
  VALUES ('Index',1,'index'),('Consulta',2,'consulta'),('GeoQuery',3,'geoquery'),('PDF',4,'pdf'),('KML',5,'kml')
)
SELECT stages.stage, stages.position, COUNT(DISTINCT events.session_id) AS count
FROM stages LEFT JOIN events
  ON lower(events.tipo_evento) = stages.event_name
  AND events.fecha_hora >= :current_start AND events.fecha_hora < :current_end
GROUP BY stages.stage, stages.position ORDER BY stages.position;

-- 5. Serie por sitio; el Worker pivota estas filas a labels/series en la respuesta.
SELECT strftime(:bucket_format, fecha_hora) AS bucket, sitio, COUNT(*) AS count,
       AVG(COUNT(*)) OVER (
         PARTITION BY sitio ORDER BY strftime(:bucket_format, fecha_hora)
         ROWS BETWEEN 2 PRECEDING AND CURRENT ROW
       ) AS moving_average
FROM events
WHERE fecha_hora >= :current_start AND fecha_hora < :current_end
  AND tipo_evento = 'consulta' AND sitio IN ('GeoIPT','GeoEVA','GeoNOXA','GeoNEMO')
GROUP BY bucket, sitio ORDER BY bucket, sitio;
