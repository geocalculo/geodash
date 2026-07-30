(function () {
  "use strict";
  const number = new Intl.NumberFormat("es-CL", { maximumFractionDigits: 1 });
  const periods = { day: { unit: "hora", previous: "vs ayer" }, week: { unit: "día", previous: "vs 7 días anteriores" }, month: { unit: "día", previous: "vs 30 días anteriores" } };
  const sites = ["geoipt", "geoeva", "geonemo", "geonoxa"];
  const siteLabel = site => `Geo${site.slice(3).toUpperCase()}`;
  let selectedPeriod = "week";
  let loading = false;

  function safeNumber(value) { const parsed = Number(value); return Number.isFinite(parsed) ? parsed : 0; }
  function percent(value) { return `${number.format(safeNumber(value))} %`; }
  function changeMarkup(value) { const change = safeNumber(value); return { text: `${change >= 0 ? "▲" : "▼"} ${percent(Math.abs(change))}`, className: change >= 0 ? "change-up" : "change-down" }; }
  function normalizeTrend(data) { return (Array.isArray(data) ? data : []).map(item => ({ label: String(item.label || "—"), timestamp: item.timestamp || "", events: safeNumber(item.events), moving_average: safeNumber(item.moving_average) })); }

  function loadTrend(data) {
    const points = normalizeTrend(data.trend);
    const values = points.map(point => point.events);
    GeoDashCharts.trend(points);
    document.getElementById("trend-subtitle").textContent = `Interacciones registradas por ${periods[selectedPeriod].unit} durante el período seleccionado`;
    document.getElementById("trend-total").textContent = number.format(values.reduce((sum, value) => sum + value, 0));
    document.getElementById("trend-average").textContent = number.format(values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : 0);
    document.getElementById("trend-max").textContent = number.format(values.length ? Math.max(...values) : 0);
    document.getElementById("trend-min").textContent = number.format(values.length ? Math.min(...values) : 0);
    document.getElementById("trend-variation").textContent = percent(data.summary?.variation);
  }

  function loadSiteDistribution(data) {
    const source = Array.isArray(data.site_distribution) ? data.site_distribution : [];
    const items = sites.map(site => { const item = source.find(row => String(row.site).toLowerCase() === site) || {}; return { site, label: siteLabel(site), current: safeNumber(item.current), previous: safeNumber(item.previous), variation: safeNumber(item.variation), share: safeNumber(item.share), previous_share: safeNumber(item.previous_share) }; });
    GeoDashCharts.distribution(items);
    document.getElementById("site-breakdown").replaceChildren(...items.map(item => {
      const row = document.createElement("div"); row.className = "site-row";
      const dot = document.createElement("i"); dot.className = "site-row__dot"; dot.style.background = GeoDashCharts.colors[item.site];
      const detail = document.createElement("div"); const name = document.createElement("strong"); name.textContent = item.label; const count = document.createElement("small"); count.textContent = `${number.format(item.current)} eventos · ${percent(item.share)}`; detail.append(name, count);
      const change = document.createElement("strong"); const view = changeMarkup(item.variation); change.className = view.className; change.textContent = view.text; row.append(dot, detail, change); return row;
    }));
  }

  function loadComposition(data) {
    const keys = Object.keys(GeoDashCharts.categoryLabels);
    const points = (Array.isArray(data.event_composition) ? data.event_composition : []).map(item => Object.assign({ label: String(item.label || "—"), timestamp: item.timestamp || "" }, Object.fromEntries(keys.map(key => [key, safeNumber(item[key])]))));
    GeoDashCharts.composition(points);
    const totals = Object.fromEntries(keys.map(key => [key, points.reduce((sum, point) => sum + point[key], 0)]));
    const total = Object.values(totals).reduce((sum, value) => sum + value, 0);
    const dominant = keys.reduce((best, key) => totals[key] > totals[best] ? key : best, keys[0]);
    const summary = document.getElementById("composition-summary"); summary.replaceChildren();
    [["Categoría dominante", GeoDashCharts.categoryLabels[dominant]], ["Participación", percent(total ? totals[dominant] / total * 100 : 0)], ["Eventos de conversión", number.format(totals.conversion)]].forEach(([label, value]) => { const item = document.createElement("span"); item.innerHTML = `<small>${label}</small><strong>${value}</strong>`; summary.append(item); });
  }

  function loadJourney(data) {
    const stages = Array.isArray(data.journey) ? data.journey : [];
    const first = safeNumber(stages[0]?.count); const finalConversion = safeNumber(data.summary?.final_conversion);
    document.getElementById("journey").replaceChildren(...stages.map((stage, index) => {
      const count = safeNumber(stage.count); const previous = safeNumber(stages[index - 1]?.count); const stageConversion = index ? (previous ? count / previous * 100 : 0) : 100; const abandonment = index ? Math.max(0, 100 - stageConversion) : 0;
      const wrapper = document.createElement("div"); wrapper.className = "journey__stage";
      if (index) { const connector = document.createElement("div"); connector.className = "journey__connector"; connector.innerHTML = `→<small>−${percent(abandonment)}</small>`; wrapper.append(connector); }
      const body = document.createElement("div"); body.className = "journey__body"; body.innerHTML = `<span class="journey__name">${stage.stage || "—"}</span><strong class="journey__value">${number.format(count)}</strong><span class="journey__rate">${index ? percent(stageConversion) + " desde etapa anterior" : "Inicio del journey"}</span>`; wrapper.append(body); return wrapper;
    }));
    document.getElementById("journey-conversion").textContent = percent(finalConversion || (first ? safeNumber(stages.at(-1)?.count) / first * 100 : 0));
    const eventStages = [["Consultas registradas", "Consulta"], ["GeoQuery ejecutadas", "GeoQuery"], ["Descargas PDF", "PDF"], ["Descargas KML", "KML"]];
    document.getElementById("journey-details").replaceChildren(...eventStages.map(([label, stageName]) => { const item = document.createElement("span"); const stage = stages.find(row => row.stage === stageName); item.innerHTML = `<small>${label}</small><strong>${number.format(safeNumber(stage?.events ?? stage?.count))}</strong>`; return item; }));
  }

  function loadSiteTrend(data) { const points = (Array.isArray(data.site_trend) ? data.site_trend : []).map(item => Object.assign({ label: String(item.label || "—"), timestamp: item.timestamp || "" }, Object.fromEntries(sites.map(site => [site, safeNumber(item[site])])))); GeoDashCharts.siteTrend(points); }

  async function loadDashboard(options = {}) {
    if (loading) return; loading = true;
    const status = document.getElementById("data-status"); const error = document.getElementById("error-banner"); status.className = "status"; status.innerHTML = '<span aria-hidden="true"></span>Actualizando…';
    try {
      const data = await GeoDashAPI.fetchAnalytics(selectedPeriod, options); loadTrend(data); loadSiteDistribution(data); loadComposition(data); loadJourney(data); loadSiteTrend(data);
      document.getElementById("summary-total").textContent = number.format(safeNumber(data.summary?.current)); document.getElementById("summary-sessions").textContent = number.format(safeNumber(data.summary?.sessions));
      const change = changeMarkup(data.summary?.variation); const changeNode = document.getElementById("summary-change"); changeNode.textContent = change.text; changeNode.className = `trend ${change.className === "change-up" ? "is-up" : "is-down"}`; document.getElementById("summary-comparison").textContent = periods[selectedPeriod].previous;
      status.className = "status status--live"; status.innerHTML = '<span aria-hidden="true"></span>Datos D1 · UTC'; error.hidden = true; document.getElementById("updated-at").textContent = `Actualizado ${new Intl.DateTimeFormat("es-CL", { hour: "2-digit", minute: "2-digit", timeZone: "UTC" }).format(new Date())} UTC`;
    } catch (reason) { console.error("GeoDash: no fue posible cargar analytics", reason); status.innerHTML = '<span aria-hidden="true"></span>Error de datos'; error.hidden = false; } finally { loading = false; }
  }
  document.querySelectorAll("[data-period]").forEach(button => button.addEventListener("click", () => { selectedPeriod = button.dataset.period; document.querySelectorAll("[data-period]").forEach(item => { const active = item === button; item.classList.toggle("is-active", active); item.setAttribute("aria-pressed", String(active)); }); loadDashboard(); }));
  loadDashboard(); setInterval(() => loadDashboard({ refresh: true }), 5 * 60 * 1000);
}());
