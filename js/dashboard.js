(function () {
  "use strict";
  const number = new Intl.NumberFormat("es-CL");
  const periods = {
    today: { noun: "hoy", unit: "hora", previous: "vs ayer" },
    week: { noun: "semana actual", unit: "día", previous: "vs semana anterior" },
    month: { noun: "mes actual", unit: "día", previous: "vs mes anterior" }
  };
  let selectedPeriod = "week";
  let loading = false;

  function safeNumber(value) { const parsed = Number(value); return Number.isFinite(parsed) ? parsed : 0; }
  function movingAverage(values, windowSize = 3) {
    return values.map((_, index) => {
      const slice = values.slice(Math.max(0, index - windowSize + 1), index + 1);
      return Math.round((slice.reduce((sum, value) => sum + value, 0) / slice.length) * 10) / 10;
    });
  }
  function changeMarkup(value) {
    const change = safeNumber(value);
    const direction = change >= 0 ? "↑" : "↓";
    return { text: `${direction} ${number.format(Math.abs(change))} %`, className: change >= 0 ? "change-up" : "change-down" };
  }

  function loadTrend(data) {
    const points = Array.isArray(data?.trend) ? data.trend.map(item => ({ label: item.label || item.bucket, count: safeNumber(item.count) })) : [];
    const values = points.map(point => point.count);
    const average = movingAverage(values);
    GeoDashCharts.trend(points, average);
    document.getElementById("trend-subtitle").textContent = `Consultas por ${periods[selectedPeriod].unit} · ${periods[selectedPeriod].noun}`;
    document.getElementById("trend-average").textContent = number.format(average.at(-1) || 0);
    document.getElementById("trend-max").textContent = number.format(values.length ? Math.max(...values) : 0);
    document.getElementById("trend-min").textContent = number.format(values.length ? Math.min(...values) : 0);
  }

  function loadSiteDistribution(data) {
    const items = Array.isArray(data?.siteDistribution) ? data.siteDistribution.map(item => ({ site: item.site, count: safeNumber(item.count), percentage: safeNumber(item.percentage), change: safeNumber(item.change) })) : [];
    GeoDashCharts.distribution(items);
    const container = document.getElementById("site-breakdown");
    container.replaceChildren(...items.map(item => {
      const row = document.createElement("div"); row.className = "site-row";
      const dot = document.createElement("i"); dot.className = "site-row__dot"; dot.style.background = GeoDashCharts.colors[item.site] || "#71838b";
      const detail = document.createElement("div"); const name = document.createElement("strong"); name.textContent = item.site; const count = document.createElement("small"); count.textContent = `${number.format(item.count)} · ${number.format(item.percentage)} %`; detail.append(name, count);
      const change = document.createElement("strong"); const view = changeMarkup(item.change); change.className = view.className; change.textContent = view.text;
      row.append(dot, detail, change); return row;
    }));
  }

  function loadHeatmap(data) {
    const rows = Array.isArray(data?.heatmap) ? data.heatmap : [];
    const max = Math.max(0, ...rows.flatMap(row => (row.hours || []).map(safeNumber)));
    const map = document.getElementById("heatmap"); map.replaceChildren();
    map.append(document.createElement("span"));
    for (let hour = 0; hour < 24; hour += 1) { const label = document.createElement("span"); label.className = "heatmap__hour"; label.textContent = hour % 3 === 0 ? String(hour).padStart(2, "0") : ""; map.append(label); }
    rows.forEach(row => {
      const label = document.createElement("span"); label.className = "heatmap__label"; label.textContent = row.label; map.append(label);
      Array.from({ length: 24 }, (_, hour) => safeNumber(row.hours?.[hour])).forEach((value, hour) => { const cell = document.createElement("span"); cell.className = "heatmap__cell"; cell.dataset.level = max ? String(Math.ceil((value / max) * 5)) : "0"; cell.title = `${row.label}, ${String(hour).padStart(2, "0")}:00 · ${number.format(value)} consultas`; map.append(cell); });
    });
    document.getElementById("heatmap-subtitle").textContent = selectedPeriod === "today" ? "Actividad durante las últimas 24 horas" : "Actividad por día y hora";
  }

  function loadJourney(data) {
    const stages = Array.isArray(data?.journey) ? data.journey : [];
    const first = safeNumber(stages[0]?.count); const final = safeNumber(stages.at(-1)?.count);
    const conversion = first ? (final / first) * 100 : 0;
    const container = document.getElementById("journey"); container.replaceChildren(...stages.map((stage, index) => {
      const wrapper = document.createElement("div"); wrapper.className = "journey__stage";
      if (index) { const previous = safeNumber(stages[index - 1].count); const abandonment = previous ? 100 - (safeNumber(stage.count) / previous * 100) : 0; const connector = document.createElement("div"); connector.className = "journey__connector"; connector.innerHTML = `→<small>−${number.format(Math.max(0, Math.round(abandonment)))} %</small>`; wrapper.append(connector); }
      const body = document.createElement("div"); body.className = "journey__body"; const name = document.createElement("span"); name.className = "journey__name"; name.textContent = stage.stage; const value = document.createElement("strong"); value.className = "journey__value"; value.textContent = number.format(safeNumber(stage.count)); const rate = document.createElement("span"); rate.className = "journey__rate"; rate.textContent = `${number.format(first ? safeNumber(stage.count) / first * 100 : 0)} % del inicio`; body.append(name, value, rate); wrapper.append(body); return wrapper;
    }));
    document.getElementById("journey-conversion").textContent = `${number.format(conversion)} %`;
    return conversion;
  }

  function loadSiteTrend(data) {
    const trend = data?.siteTrend || {};
    const labels = Array.isArray(trend.labels) ? trend.labels : [];
    const series = Array.isArray(trend.series) ? trend.series.map(item => ({ site: item.site, values: (item.values || []).map(safeNumber), average: movingAverage((item.values || []).map(safeNumber)) })) : [];
    GeoDashCharts.siteTrend(labels, series);
  }

  async function loadDashboard(options = {}) {
    if (loading) return; loading = true;
    const status = document.getElementById("data-status"); const error = document.getElementById("error-banner");
    status.className = "status"; status.innerHTML = '<span aria-hidden="true"></span>Actualizando…';
    try {
      const data = await GeoDashAPI.fetchAnalytics(selectedPeriod, options);
      loadTrend(data); loadSiteDistribution(data); loadHeatmap(data); const conversion = loadJourney(data); loadSiteTrend(data);
      const total = safeNumber(data?.summary?.current); const change = changeMarkup(data?.summary?.change);
      document.getElementById("summary-total").textContent = number.format(total);
      const changeNode = document.getElementById("summary-change"); changeNode.textContent = change.text; changeNode.className = `trend ${change.className === "change-up" ? "is-up" : "is-down"}`;
      document.getElementById("summary-comparison").textContent = periods[selectedPeriod].previous;
      document.getElementById("summary-conversion").textContent = `${number.format(conversion)} %`;
      status.className = "status status--live"; status.innerHTML = '<span aria-hidden="true"></span>Datos D1'; error.hidden = true;
      document.getElementById("updated-at").textContent = `Actualizado ${new Intl.DateTimeFormat("es-CL", { hour: "2-digit", minute: "2-digit" }).format(new Date())}`;
    } catch (reason) { console.error("GeoDash: no fue posible cargar analytics", reason); status.innerHTML = '<span aria-hidden="true"></span>Error de datos'; error.hidden = false; }
    finally { loading = false; }
  }

  document.querySelectorAll("[data-period]").forEach(button => button.addEventListener("click", () => {
    selectedPeriod = button.dataset.period;
    document.querySelectorAll("[data-period]").forEach(item => { const active = item === button; item.classList.toggle("is-active", active); item.setAttribute("aria-pressed", String(active)); });
    loadDashboard();
  }));
  loadDashboard();
  setInterval(() => loadDashboard({ refresh: true }), 5 * 60 * 1000);
}());
