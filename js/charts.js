(function () {
  "use strict";
  const charts = {};
  Chart.defaults.font.family = "Inter, ui-sans-serif, system-ui, sans-serif";
  Chart.defaults.color = "#62727d";
  const baseOptions = { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false }, tooltip: { backgroundColor: "#153746", padding: 12, cornerRadius: 8 } } };
  function activity(data) {
    const config = { type: "line", data: { labels: data.map(d => new Intl.DateTimeFormat("es-CL", { day: "2-digit", month: "short", timeZone: "UTC" }).format(new Date(`${d.date}T00:00:00Z`))), datasets: [{ data: data.map(d => d.value), borderColor: "#1d6f8a", backgroundColor: "rgba(29,111,138,.10)", fill: true, tension: .35, pointRadius: 0, pointHoverRadius: 5, borderWidth: 2 }] }, options: { ...baseOptions, interaction: { intersect: false, mode: "index" }, scales: { x: { grid: { display: false }, ticks: { maxTicksLimit: 10 } }, y: { beginAtZero: true, grid: { color: "#edf1f3" }, ticks: { precision: 0 } } } } };
    if (charts.activity) { charts.activity.data = config.data; charts.activity.update(); } else charts.activity = new Chart(document.getElementById("activity-chart"), config);
  }
  function sites(data) {
    charts.sites = new Chart(document.getElementById("sites-chart"), { type: "bar", data: { labels: data.map(d => d.name), datasets: [{ data: data.map(d => d.value), backgroundColor: data.map(d => d.color), borderRadius: 6, barThickness: 22 }] }, options: { ...baseOptions, indexAxis: "y", scales: { x: { beginAtZero: true, grid: { color: "#edf1f3" } }, y: { grid: { display: false } } } } });
  }
  function origins(data) {
    charts.origins = new Chart(document.getElementById("origins-chart"), { type: "doughnut", data: { labels: data.map(d => d.name), datasets: [{ data: data.map(d => d.value), backgroundColor: ["#1d6f8a", "#35a37d", "#cad4d9"], borderWidth: 3, borderColor: "#fff", hoverOffset: 4 }] }, options: { ...baseOptions, cutout: "68%", plugins: { ...baseOptions.plugins, legend: { display: true, position: "bottom", labels: { usePointStyle: true, padding: 18 } } } } });
  }
  window.GeoDashCharts = { activity, sites, origins };
}());
