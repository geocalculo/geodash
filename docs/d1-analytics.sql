-- Consultas de referencia para GET /analytics?period=day|week|month.
-- El Worker enlaza :current_start, :current_end, :previous_start y :bucket_format.
-- Todos los límites son UTC y usan intervalos [inicio, fin). Los buckets vacíos
-- deben completarse en el Worker antes de responder.

-- 1. Resumen de eventos registrados, consultas y sesiones activas.
SELECT
  SUM(CASE WHEN fecha_hora >= :current_start AND fecha_hora < :current_end THEN 1 ELSE 0 END) AS current_events,
  SUM(CASE WHEN fecha_hora >= :previous_start AND fecha_hora < :current_start THEN 1 ELSE 0 END) AS previous_events,
  SUM(CASE WHEN fecha_hora >= :current_start AND fecha_hora < :current_end AND tipo_evento = 'consulta' THEN 1 ELSE 0 END) AS consultations,
  COUNT(DISTINCT CASE WHEN fecha_hora >= :current_start AND fecha_hora < :current_end
    AND session_id IS NOT NULL AND trim(session_id) <> '' THEN session_id END) AS sessions
FROM eventos_geocalculo
WHERE fecha_hora >= :previous_start AND fecha_hora < :current_end;

-- 2. Evolución de todos los eventos. :bucket_format es '%Y-%m-%d %H:00'
-- para Hoy y '%Y-%m-%d' para Semana/Mes.
WITH buckets AS (
  SELECT strftime(:bucket_format, fecha_hora) AS bucket, COUNT(*) AS events
  FROM eventos_geocalculo
  WHERE fecha_hora >= :current_start AND fecha_hora < :current_end
  GROUP BY bucket
)
SELECT bucket, events,
  ROUND(AVG(events) OVER (ORDER BY bucket ROWS BETWEEN 2 PRECEDING AND CURRENT ROW), 1) AS moving_average
FROM buckets ORDER BY bucket;

-- 3. Distribución actual/anterior de todos los eventos por sitio.
WITH sites(site) AS (VALUES ('geoipt'),('geoeva'),('geonemo'),('geonoxa')),
counts AS (
  SELECT lower(sitio) AS site,
    SUM(CASE WHEN fecha_hora >= :current_start AND fecha_hora < :current_end THEN 1 ELSE 0 END) AS current_count,
    SUM(CASE WHEN fecha_hora >= :previous_start AND fecha_hora < :current_start THEN 1 ELSE 0 END) AS previous_count
  FROM eventos_geocalculo
  WHERE fecha_hora >= :previous_start AND fecha_hora < :current_end
    AND lower(sitio) IN ('geoipt','geoeva','geonemo','geonoxa')
  GROUP BY lower(sitio)
), complete AS (
  SELECT sites.site, COALESCE(current_count, 0) AS current_count,
    COALESCE(previous_count, 0) AS previous_count
  FROM sites LEFT JOIN counts USING (site)
)
SELECT site, current_count AS current, previous_count AS previous,
  COALESCE(ROUND(100.0 * (current_count - previous_count) / NULLIF(previous_count, 0), 1), 0) AS variation,
  COALESCE(ROUND(100.0 * current_count / NULLIF(SUM(current_count) OVER (), 0), 1), 0) AS share,
  COALESCE(ROUND(100.0 * previous_count / NULLIF(SUM(previous_count) OVER (), 0), 1), 0) AS previous_share
FROM complete ORDER BY current_count DESC;

-- 4. Composición temporal de la actividad del ecosistema.
SELECT strftime(:bucket_format, fecha_hora) AS bucket,
  SUM(tipo_evento = 'index_load') AS access,
  SUM(tipo_evento IN ('geolocation','search_result','region_change','labels_toggle','basemap_change')) AS exploration,
  SUM(tipo_evento IN ('consulta','geoquery_open')) AS query,
  SUM(tipo_evento = 'cross_access') AS ecosystem,
  SUM(tipo_evento IN ('descarga_pdf','descarga_kml')) AS conversion,
  SUM(tipo_evento NOT IN ('index_load','geolocation','search_result','region_change','labels_toggle','basemap_change','consulta','geoquery_open','cross_access','descarga_pdf','descarga_kml')) AS other
FROM eventos_geocalculo
WHERE fecha_hora >= :current_start AND fecha_hora < :current_end
GROUP BY bucket ORDER BY bucket;

-- 5. Journey: una identidad por journey_id/session_id; si ambos están vacíos,
-- cada evento se conserva como fallback. events informa el volumen real.
WITH stages(stage, position, event_name) AS (
  VALUES ('Index',1,'index_load'),('Consulta',2,'consulta'),('GeoQuery',3,'geoquery_open'),('PDF',4,'descarga_pdf'),('KML',5,'descarga_kml')
)
SELECT stages.stage, stages.position,
  COUNT(DISTINCT CASE
    WHEN NULLIF(trim(events.journey_id), '') IS NOT NULL THEN events.journey_id
    WHEN NULLIF(trim(events.session_id), '') IS NOT NULL THEN events.session_id
  END) + SUM(CASE WHEN NULLIF(trim(events.journey_id), '') IS NULL
    AND NULLIF(trim(events.session_id), '') IS NULL AND events.tipo_evento IS NOT NULL THEN 1 ELSE 0 END) AS count,
  COUNT(events.tipo_evento) AS events
FROM stages LEFT JOIN eventos_geocalculo AS events
  ON events.tipo_evento = stages.event_name
  AND events.fecha_hora >= :current_start AND events.fecha_hora < :current_end
GROUP BY stages.stage, stages.position ORDER BY stages.position;

-- 6. Tendencia de todos los eventos por sitio; el Worker pivota las filas.
SELECT strftime(:bucket_format, fecha_hora) AS bucket, lower(sitio) AS site, COUNT(*) AS events
FROM eventos_geocalculo
WHERE fecha_hora >= :current_start AND fecha_hora < :current_end
  AND lower(sitio) IN ('geoipt','geoeva','geonemo','geonoxa')
GROUP BY bucket, lower(sitio) ORDER BY bucket, site;
