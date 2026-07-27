# GeoDash

Dashboard web estático para visualizar la actividad operacional del ecosistema **GeoCálculo** (GeoIPT, GeoEVA, GeoNEMO y GeoNOXA). El resumen superior usa datos reales de D1 a través de un Cloudflare Worker; el resto del dashboard conserva datos simulados.

## Características

- KPIs diarios, actividad de 7/30 días, distribución por sitio y origen.
- Ranking agregado de actividad por país, ordenado de mayor a menor.
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
assets/favicon.svg      Identidad visual mínima
```

Chart.js se carga mediante CDN; el repositorio no requiere instalación ni compilación.

## Ejecución local

Por las políticas de seguridad del navegador, se recomienda servir el directorio mediante HTTP:

```bash
python3 -m http.server 8080
```

Luego abrir `http://localhost:8080`. Se requiere conexión a internet para descargar Chart.js y la tipografía.

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
  mode: "api",
  apiBaseUrl: "https://hidden-mud-ce7a.geocalculo.workers.dev"
};
```

- **`mock`**: `getSummary()` devuelve el resumen local, al igual que el resto de funciones.
- **`api`**: solo `getSummary()` consulta `/api/dashboard/resumen`. `getDailyActivity()`, `getSites()`, `getOrigins()`, `getCountries()` y `getRecentEvents()` siguen entregando datos MOCK durante esta etapa híbrida.

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

## Integración híbrida con D1

La integración actual limita los datos reales a las cuatro cards superiores. Para verificarla:

1. Abrir las herramientas de desarrollo del navegador y recargar GeoDash.
2. Confirmar en **Network** la solicitud `GET /api/dashboard/resumen` y su respuesta JSON.
3. Comparar `consultas_hoy`, `sesiones_hoy`, `geoquery_abiertos` y `cross_access` con las cuatro cards, respectivamente.
4. Confirmar que no se realizan solicitudes API para gráficos, países ni eventos, que permanecen en MOCK.

La actividad por país representa el país desde el que el usuario accede al sitio, no una ubicación inferida desde la latitud o longitud de una consulta geográfica. En una integración futura, el Worker deberá capturar ese dato mediante `request.cf.country` o un mecanismo equivalente de Cloudflare y entregar la agregación con el contrato de `getCountries()`; esta V1 solo prepara la estructura MOCK y no implementa todavía la captura.

La URL base del API es pública por naturaleza; cualquier secreto permanece exclusivamente como binding o secret del Worker.
