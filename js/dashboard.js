(function () {
  "use strict";
  const number = new Intl.NumberFormat("es-CL");
  const kpis = [
    ["consultas_hoy", "Consultas hoy", "Interacciones registradas"], ["sesiones_hoy", "Sesiones hoy", "Sesiones únicas estimadas"],
    ["geoquery_abiertos", "GeoQuery abiertos", "Consultas geográficas iniciadas"], ["cross_access", "Cross Access", "Accesos entre sitios"]
  ];
  function renderSummary(data) {
    document.getElementById("kpi-grid").innerHTML = kpis.map(([key, title, detail]) => {
      const value = data?.kpis?.[key] ?? "--";
      return `<article class="kpi"><span class="kpi__icon" aria-hidden="true"></span><p>${title}</p><strong>${value}</strong><footer><small>${detail}</small></footer></article>`;
    }).join("");
  }
  function renderEvents(events) {
    const eventList = Array.isArray(events) ? events : [];
    document.getElementById("events-body").innerHTML = eventList.map(item => {
      const evento = item && typeof item === "object" ? item : {};
      const fecha = evento.fecha_hora
        ? new Date(evento.fecha_hora)
        : null;
      const textoFecha = fecha && !Number.isNaN(fecha.getTime())
        ? fecha.toLocaleString("es-CL")
        : "—";
      const sitio = typeof evento.sitio === "string" ? evento.sitio : "—";
      const tipoEvento = typeof evento.tipo_evento === "string" ? evento.tipo_evento : "—";
      const origen = typeof evento.origen === "string" ? evento.origen : "—";
      const latitud = Number.isFinite(evento.latitud) ? evento.latitud.toFixed(4) : "—";
      const longitud = Number.isFinite(evento.longitud) ? evento.longitud.toFixed(4) : "—";

      return `<tr><td>${textoFecha}</td><td><span class="site site--${sitio.toLowerCase()}">${sitio}</span></td><td><code>${tipoEvento}</code></td><td>${origen}</td><td>${latitud}</td><td>${longitud}</td></tr>`;
    }).join("");
  }
  function renderCountries(countries) {
    const ranking = [...countries].sort((a, b) => b.total - a.total);
    const maximum = ranking[0]?.total || 0;
    const list = document.getElementById("countries-ranking");
    list.replaceChildren(...ranking.map((item, index) => {
      const row = document.createElement("li");
      row.className = "country";
      const width = maximum ? (item.total / maximum) * 100 : 0;
      row.innerHTML = `<span class="country__position">${String(index + 1).padStart(2, "0")}</span><span class="country__identity"><span class="country__name"></span><span class="country__code"></span></span><span class="country__total">${number.format(item.total)}</span><span class="country__percentage">${number.format(item.percentage)} %</span><span class="country__bar" aria-hidden="true"><span style="width:${width}%"></span></span>`;
      row.querySelector(".country__name").textContent = item.country;
      row.querySelector(".country__code").textContent = item.code;
      return row;
    }));
  }
  async function init() {
    const status = document.getElementById("data-status");
    const errorBanner = document.getElementById("error-banner");
    renderSummary(null);
    try {
      const data = await GeoDashAPI.fetchDashboard(30, 20);
      renderSummary(data);
      GeoDashCharts.activity(data.activity);
      GeoDashCharts.sites(data.sites);
      GeoDashCharts.origins(data.origins);
      renderCountries(data.countries);
      renderEvents(data.events);
      status.className = "status status--live";
      status.innerHTML = '<span aria-hidden="true"></span>Datos D1';
      errorBanner.hidden = true;
      document.getElementById("updated-at").textContent = `Actualizado ${new Intl.DateTimeFormat("es-CL", { hour: "2-digit", minute: "2-digit" }).format(new Date())}`;
    } catch (error) {
      console.error("GeoDash: no fue posible cargar el dashboard", error);
      status.className = "status";
      status.innerHTML = '<span aria-hidden="true"></span>Error de datos';
      errorBanner.hidden = false;
    }
  }
  document.querySelectorAll("[data-days]").forEach(button => button.addEventListener("click", async () => {
    document.querySelectorAll("[data-days]").forEach(item => { item.classList.toggle("is-active", item === button); item.setAttribute("aria-pressed", item === button); });
    document.getElementById("activity-title").textContent = `Actividad de los últimos ${button.dataset.days} días`;
    try {
      const data = await GeoDashAPI.fetchDashboard(Number(button.dataset.days), 20);
      GeoDashCharts.activity(data.activity);
      document.getElementById("error-banner").hidden = true;
    } catch (error) {
      console.error("GeoDash: no fue posible actualizar la actividad", error);
      document.getElementById("error-banner").hidden = false;
    }
  }));
  init();
}());
