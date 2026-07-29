(function () {
  "use strict";
  let activityChart;
  let sitesChart;
  let originsChart;

  Chart.defaults.font.family = "Inter, ui-sans-serif, system-ui, sans-serif";
  Chart.defaults.color = "#62727d";
  const baseOptions = { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false }, tooltip: { backgroundColor: "#153746", padding: 12, cornerRadius: 8 } } };

  function activity(data) {
    if (activityChart) activityChart.destroy();
    activityChart = new Chart(document.getElementById("activity-chart"), {
      type: "line",
      data: {
        labels: data.map(item => item.date),
        datasets: [{ data: data.map(item => item.count), borderColor: "#1d6f8a", backgroundColor: "rgba(29,111,138,.10)", fill: true, tension: 0, pointRadius: 0, pointHoverRadius: 5, borderWidth: 2 }]
      },
      options: { ...baseOptions, interaction: { intersect: false, mode: "index" }, scales: { x: { grid: { display: false }, ticks: { maxTicksLimit: 10 } }, y: { beginAtZero: true, grid: { color: "#edf1f3" }, ticks: { precision: 0 } } } }
    });
  }

  function sites(data) {
    if (sitesChart) sitesChart.destroy();
    sitesChart = new Chart(document.getElementById("sites-chart"), { type: "bar", data: { labels: data.map(item => item.name), datasets: [{ data: data.map(item => item.value), backgroundColor: data.map(item => item.color), borderRadius: 6, barThickness: 22 }] }, options: { ...baseOptions, indexAxis: "y", scales: { x: { beginAtZero: true, grid: { color: "#edf1f3" } }, y: { grid: { display: false } } } } });
  }

  function origins(data) {
    if (originsChart) originsChart.destroy();
    originsChart = new Chart(document.getElementById("origins-chart"), { type: "doughnut", data: { labels: data.map(item => item.name), datasets: [{ data: data.map(item => item.value), backgroundColor: ["#1d6f8a", "#35a37d", "#cad4d9"], borderWidth: 3, borderColor: "#fff", hoverOffset: 4 }] }, options: { ...baseOptions, cutout: "68%", plugins: { ...baseOptions.plugins, legend: { display: true, position: "bottom", labels: { usePointStyle: true, padding: 18 } } } } });
  }

  window.GeoDashCharts = { activity, sites, origins };
}());
