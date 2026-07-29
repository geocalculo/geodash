(function () {
  "use strict";
  const instances = {};
  const colors = { GeoIPT: "#176f8b", GeoEVA: "#218662", GeoNOXA: "#725a9e", GeoNEMO: "#bf812b" };
  Chart.defaults.font.family = "Inter, ui-sans-serif, system-ui, sans-serif";
  Chart.defaults.color = "#71838b";
  const common = { responsive: true, maintainAspectRatio: false, interaction: { intersect: false, mode: "index" }, plugins: { legend: { display: false }, tooltip: { backgroundColor: "#153746", padding: 12, cornerRadius: 8 } } };
  const axes = { x: { grid: { display: false }, ticks: { maxTicksLimit: 12 } }, y: { beginAtZero: true, grid: { color: "#edf2f3" }, ticks: { precision: 0 } } };

  function replace(name, config) {
    if (instances[name]) instances[name].destroy();
    instances[name] = new Chart(document.getElementById(name), config);
  }
  function trend(points, average) {
    replace("trend-chart", { type: "line", data: { labels: points.map(point => point.label), datasets: [
      { label: "Consultas", data: points.map(point => point.count), borderColor: colors.GeoIPT, backgroundColor: "rgba(23,111,139,.08)", fill: true, tension: .35, pointRadius: 0, pointHoverRadius: 4, borderWidth: 2 },
      { label: "Promedio móvil", data: average, borderColor: "#9aabb1", borderDash: [5, 5], tension: .35, pointRadius: 0, borderWidth: 1.5 }
    ] }, options: { ...common, scales: axes, plugins: { ...common.plugins, legend: { display: true, align: "end", labels: { usePointStyle: true, boxWidth: 7 } } } } });
  }
  function distribution(items) {
    replace("distribution-chart", { type: "bar", data: { labels: ["Participación"], datasets: items.map(item => ({ label: item.site, data: [item.percentage], backgroundColor: colors[item.site], borderWidth: 0, barThickness: 30 })) }, options: { ...common, indexAxis: "y", scales: { x: { stacked: true, display: false, max: 100 }, y: { stacked: true, display: false } }, plugins: { ...common.plugins, legend: { display: true, position: "bottom", labels: { usePointStyle: true, boxWidth: 7, padding: 14 } }, tooltip: { ...common.plugins.tooltip, callbacks: { label: context => `${context.dataset.label}: ${context.raw}%` } } } } });
  }
  function siteTrend(labels, series) {
    replace("site-trend-chart", { type: "line", data: { labels, datasets: series.flatMap(item => [
      { label: item.site, data: item.values, borderColor: colors[item.site], tension: .35, pointRadius: 0, pointHoverRadius: 4, borderWidth: 2 },
      { label: `${item.site} · promedio`, data: item.average || [], borderColor: colors[item.site], borderDash: [3, 4], tension: .35, pointRadius: 0, borderWidth: 1, hidden: true }
    ]) }, options: { ...common, scales: axes, plugins: { ...common.plugins, legend: { display: true, position: "bottom", labels: { usePointStyle: true, filter: item => !item.text.includes("promedio") } } } } });
  }
  window.GeoDashCharts = Object.freeze({ trend, distribution, siteTrend, colors });
}());
