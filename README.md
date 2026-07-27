# GeoDash

Dashboard web estático para visualizar la actividad operacional del ecosistema **GeoCálculo** (GeoIPT, GeoEVA, GeoNEMO y GeoNOXA). Esta primera versión usa datos simulados y no se conecta a infraestructura externa.

## Características

- KPIs diarios, actividad de 7/30 días, distribución por sitio y origen.
- Mapa Leaflet con eventos distribuidos en Chile y cartografía OpenStreetMap.
- Tabla de eventos recientes y diseño responsive para escritorio, tablet y móvil.
- Capa de acceso a datos intercambiable, sin dependencias de npm ni proceso de build.

## Estructura

```text
index.html              Entrada compatible con GitHub Pages
css/geodash.css         Estilos y breakpoints responsive
js/config.js            Configuración pública de ejecución
js/api.js               Capa de abstracción mock/API
js/dashboard.js         Orquestación y renderizado de la interfaz
js/charts.js            Gráficos Chart.js
js/map.js               Mapa y marcadores Leaflet
assets/favicon.svg      Identidad visual mínima
```

Chart.js y Leaflet se cargan mediante CDN; el repositorio no requiere instalación ni compilación.

## Ejecución local

Por las políticas de seguridad del navegador, se recomienda servir el directorio mediante HTTP:

```bash
python3 -m http.server 8080
```

Luego abrir `http://localhost:8080`. Se requiere conexión a internet para descargar las librerías CDN, la tipografía y las teselas de OpenStreetMap.

## Publicación en GitHub Pages

1. Subir el contenido a la rama principal del repositorio.
2. En **Settings → Pages**, seleccionar **Deploy from a branch**.
3. Elegir la rama principal y la carpeta `/ (root)`.
4. Guardar y abrir la URL publicada por GitHub Pages.

Todas las rutas del sitio son relativas, por lo que funciona tanto en la raíz como bajo la ruta de un proyecto (`/geodash/`).

## Modos de datos

`js/config.js` expone únicamente configuración pública:

```js
const GEODASH_CONFIG = {
  mode: "mock",
  apiBaseUrl: ""
};
```

- **`mock`**: `js/api.js` devuelve datos locales realistas. Es el modo inicial.
- **`api`**: las mismas funciones (`getSummary`, `getDailyActivity`, `getSites`, `getOrigins`, `getMapPoints` y `getRecentEvents`) usan `fetch` contra `apiBaseUrl`. Las rutas propuestas son contratos preliminares y deberán alinearse con el Worker antes de habilitar este modo.

La interfaz consume exclusivamente `GeoDashAPI`; no conoce el origen de los datos.

## Arquitectura prevista

```text
GitHub Pages (GeoDash)
          ↓ HTTPS / JSON
Cloudflare Worker API (lectura pública controlada)
          ↓ binding privado
Cloudflare D1
```

El navegador **nunca debe conectarse directamente a D1**. No deben incorporarse tokens, Account ID, Database ID ni otras credenciales al repositorio.

## Conexión futura a D1

Para habilitar datos reales falta:

1. Implementar en un Cloudflare Worker endpoints de solo lectura compatibles con el contrato de `js/api.js`.
2. Aplicar validación, límites de frecuencia, CORS restringido, agregación y anonimización apropiadas en el Worker.
3. Probar y documentar los esquemas JSON, incluidos eventos futuros como `pdf_download` y `kml_download`.
4. Establecer en `js/config.js` la URL pública del Worker y cambiar `mode` a `"api"`.

La URL base del API es pública por naturaleza; cualquier secreto permanece exclusivamente como binding o secret del Worker.
