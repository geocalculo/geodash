(function () {
  "use strict";
  const number = new Intl.NumberFormat("es-CL");
  const kpis = [
    ["queriesToday", "Consultas hoy", "Interacciones registradas"], ["sessionsToday", "Sesiones hoy", "Sesiones únicas estimadas"],
    ["openGeoQueries", "GeoQuery abiertos", "Consultas geográficas iniciadas"], ["crossAccess", "Cross Access", "Accesos entre sitios"]
  ];
  function renderSummary(data) {
    document.getElementById("kpi-grid").innerHTML = kpis.map(([key, title, detail]) => { const change = data.changes[key]; const up = change >= 0; return `<article class="kpi"><span class="kpi__icon" aria-hidden="true"></span><p>${title}</p><strong>${number.format(data[key])}</strong><footer><span class="change ${up ? "change--up" : "change--down"}">${up ? "↑" : "↓"} ${Math.abs(change)}%</span><small>${detail}</small></footer></article>`; }).join("");
  }
  function renderEvents(events) {
    document.getElementById("events-body").innerHTML = events.map(event => `<tr><td>${new Intl.DateTimeFormat("es-CL", { dateStyle: "short", timeStyle: "short" }).format(new Date(event.timestamp))}</td><td><span class="site site--${event.site.toLowerCase()}">${event.site}</span></td><td><code>${event.event}</code></td><td>${event.origin}</td><td>${event.latitude.toFixed(4)}</td><td>${event.longitude.toFixed(4)}</td></tr>`).join("");
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
    if (GEODASH_CONFIG.mode === "api") { status.className = "status status--live"; status.innerHTML = '<span aria-hidden="true"></span>D1 conectado'; }
    try {
      const [summary, activity, sites, origins, countries, events] = await Promise.all([GeoDashAPI.getSummary(), GeoDashAPI.getDailyActivity(30), GeoDashAPI.getSites(), GeoDashAPI.getOrigins(), GeoDashAPI.getCountries(), GeoDashAPI.getRecentEvents()]);
      renderSummary(summary); GeoDashCharts.activity(activity); GeoDashCharts.sites(sites); GeoDashCharts.origins(origins); renderCountries(countries); renderEvents(events);
      document.getElementById("updated-at").textContent = `Actualizado ${new Intl.DateTimeFormat("es-CL", { hour: "2-digit", minute: "2-digit" }).format(new Date())}`;
    } catch (error) { console.error("GeoDash:", error); document.getElementById("error-banner").hidden = false; }
  }
  document.querySelectorAll("[data-days]").forEach(button => button.addEventListener("click", async () => {
    document.querySelectorAll("[data-days]").forEach(item => { item.classList.toggle("is-active", item === button); item.setAttribute("aria-pressed", item === button); });
    document.getElementById("activity-title").textContent = `Actividad de los últimos ${button.dataset.days} días`;
    GeoDashCharts.activity(await GeoDashAPI.getDailyActivity(Number(button.dataset.days)));
  }));
  init();
}());
