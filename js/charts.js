(function () {
  "use strict";
  const instances = {};
  const colors = { geoipt: "#176f8b", geoeva: "#218662", geonoxa: "#725a9e", geonemo: "#bf812b" };
  const categoryColors = { access: "#176f8b", exploration: "#218662", query: "#bf812b", ecosystem: "#725a9e", conversion: "#b25252", other: "#9aabb1" };
  const categoryLabels = { access: "Acceso", exploration: "Exploración", query: "Consulta", ecosystem: "Ecosistema", conversion: "Conversión", other: "Otros" };
  Chart.defaults.font.family = "Inter, ui-sans-serif, system-ui, sans-serif";
  Chart.defaults.color = "#71838b";
  const common = { responsive: true, maintainAspectRatio: false, interaction: { intersect: false, mode: "index" }, plugins: { legend: { display: false }, tooltip: { backgroundColor: "#153746", padding: 12, cornerRadius: 8 } } };
  const axes = { x: { grid: { display: false }, ticks: { maxTicksLimit: 12 } }, y: { beginAtZero: true, grid: { color: "#edf2f3" }, ticks: { precision: 0 } } };

  function replace(name, config) {
    if (instances[name]) instances[name].destroy();
    instances[name] = new Chart(document.getElementById(name), config);
  }
  function trend(points) {
    replace("trend-chart", { type: "line", data: { labels: points.map(point => point.label), datasets: [
      { label: "Eventos registrados", data: points.map(point => point.events), borderColor: colors.geoipt, backgroundColor: "rgba(23,111,139,.08)", fill: true, tension: .35, pointRadius: 0, pointHoverRadius: 4, borderWidth: 2 },
      { label: "Promedio móvil", data: points.map(point => point.moving_average), borderColor: "#9aabb1", borderDash: [5, 5], tension: .35, pointRadius: 0, borderWidth: 1.5 }
    ] }, options: { ...common, scales: axes, plugins: { ...common.plugins, legend: { display: true, align: "end", labels: { usePointStyle: true, boxWidth: 7 } } } } });
  }
  function distribution(items) {
    replace("distribution-chart", { type: "bar", data: { labels: ["Período actual", "Período anterior"], datasets: items.map(item => ({ label: item.label, data: [item.share, item.previous_share], backgroundColor: colors[item.site], borderWidth: 0, barThickness: 24 })) }, options: { ...common, indexAxis: "y", scales: { x: { stacked: true, display: false, max: 100 }, y: { stacked: true, grid: { display: false } } }, plugins: { ...common.plugins, legend: { display: true, position: "bottom", labels: { usePointStyle: true, boxWidth: 7, padding: 12 } }, tooltip: { ...common.plugins.tooltip, callbacks: { label: context => `${context.dataset.label}: ${context.raw}%` } } } } });
  }
  function composition(points) {
    const keys = Object.keys(categoryLabels);
    replace("composition-chart", { type: "bar", data: { labels: points.map(point => point.label), datasets: keys.map(key => ({ label: categoryLabels[key], data: points.map(point => point[key]), backgroundColor: categoryColors[key], borderWidth: 0 })) }, options: { ...common, scales: { x: { stacked: true, grid: { display: false }, ticks: { maxTicksLimit: 8 } }, y: { stacked: true, beginAtZero: true, grid: { color: "#edf2f3" }, ticks: { precision: 0 } } }, plugins: { ...common.plugins, legend: { display: true, position: "bottom", onClick: Chart.defaults.plugins.legend.onClick, labels: { usePointStyle: true, boxWidth: 7, padding: 10 } } } } });
  }
  function siteTrend(points) {
    replace("site-trend-chart", { type: "line", data: { labels: points.map(point => point.label), datasets: Object.keys(colors).map(site => ({ label: `Geo${site.slice(3).toUpperCase()}`, data: points.map(point => point[site]), borderColor: colors[site], tension: .35, pointRadius: 0, pointHoverRadius: 4, borderWidth: 2 })) }, options: { ...common, scales: axes, plugins: { ...common.plugins, legend: { display: true, position: "bottom", labels: { usePointStyle: true, boxWidth: 7 } } } } });
  }
  window.GeoDashCharts = Object.freeze({ trend, distribution, composition, siteTrend, colors, categoryLabels });
}());
