(function () {
  "use strict";
  const colors = { GeoIPT: "#1d6f8a", GeoEVA: "#35a37d", GeoNEMO: "#c18a35", GeoNOXA: "#765b9e" };
  function render(points) {
    const map = L.map("map", { scrollWheelZoom: false }).setView([-35.5, -71.2], 4);
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", { maxZoom: 19, attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>' }).addTo(map);
    points.forEach(point => {
      const marker = L.circleMarker([point.latitude, point.longitude], { radius: 7, color: "#fff", weight: 2, fillColor: colors[point.site], fillOpacity: .95 });
      const when = new Intl.DateTimeFormat("es-CL", { dateStyle: "medium", timeStyle: "short" }).format(new Date(point.timestamp));
      marker.bindPopup(`<strong>${point.site}</strong><br>${when}<br>${point.latitude.toFixed(4)}, ${point.longitude.toFixed(4)}<br>Origen: ${point.origin}`).addTo(map);
    });
    setTimeout(() => map.invalidateSize(), 100);
  }
  window.GeoDashMap = { render };
}());
