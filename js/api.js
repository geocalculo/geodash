(function () {
  "use strict";

  const sites = [
    { name: "GeoIPT", value: 3284, color: "#1d6f8a" },
    { name: "GeoEVA", value: 2418, color: "#35a37d" },
    { name: "GeoNEMO", value: 1762, color: "#c18a35" },
    { name: "GeoNOXA", value: 1214, color: "#765b9e" }
  ];
  const events = [
    ["2026-07-27T15:42:00Z", "GeoIPT", "geoquery_open", "direct", -33.4489, -70.6693],
    ["2026-07-27T15:31:00Z", "GeoEVA", "region_change", "cross_access", -36.8201, -73.0444],
    ["2026-07-27T15:18:00Z", "GeoNEMO", "basemap_change", "direct", -23.6509, -70.3975],
    ["2026-07-27T14:57:00Z", "GeoNOXA", "search_select", "share_link", -41.4689, -72.9411],
    ["2026-07-27T14:40:00Z", "GeoIPT", "labels_toggle", "direct", -29.9027, -71.2519],
    ["2026-07-27T14:22:00Z", "GeoEVA", "geolocation", "cross_access", -39.8196, -73.2452],
    ["2026-07-27T13:58:00Z", "GeoIPT", "index_load", "direct", -35.4264, -71.6554],
    ["2026-07-27T13:35:00Z", "GeoNEMO", "cross_access", "cross_access", -18.4783, -70.3126],
    ["2026-07-27T13:11:00Z", "GeoNOXA", "geoquery_open", "direct", -53.1638, -70.9171],
    ["2026-07-27T12:49:00Z", "GeoEVA", "index_load", "share_link", -38.7359, -72.5904]
  ].map(([timestamp, site, event, origin, latitude, longitude]) => ({ timestamp, site, event, origin, latitude, longitude }));

  const mock = {
    getSummary: () => ({ queriesToday: 8642, sessionsToday: 2841, openGeoQueries: 374, crossAccess: 918, changes: { queriesToday: 12.4, sessionsToday: 8.7, openGeoQueries: 5.1, crossAccess: -2.3 } }),
    getDailyActivity: (days) => {
      const values = [241,278,265,302,319,296,344,351,329,382,406,388,421,458,443,476,492,465,519,536,508,557,581,563,612,638,604,661,689,714];
      return values.slice(-days).map((value, index) => { const date = new Date(Date.UTC(2026, 6, 28 - days + index)); return { date: date.toISOString().slice(0, 10), value }; });
    },
    getSites: () => sites,
    getOrigins: () => [{ name: "direct", value: 6031 }, { name: "cross_access", value: 2264 }, { name: "share_link", value: 383 }],
    getMapPoints: () => events,
    getRecentEvents: () => events
  };

  async function request(path) {
    const base = GEODASH_CONFIG.apiBaseUrl.replace(/\/$/, "");
    if (!base) throw new Error("apiBaseUrl no está configurada");
    const response = await fetch(`${base}${path}`, { headers: { Accept: "application/json" } });
    if (!response.ok) throw new Error(`API respondió ${response.status}`);
    return response.json();
  }
  function source(method, path, ...args) {
    return GEODASH_CONFIG.mode === "mock" ? Promise.resolve(mock[method](...args)) : request(path);
  }
  window.GeoDashAPI = Object.freeze({
    getSummary: () => source("getSummary", "/summary"),
    getDailyActivity: (days = 30) => source("getDailyActivity", `/activity?days=${days}`, days),
    getSites: () => source("getSites", "/sites"),
    getOrigins: () => source("getOrigins", "/origins"),
    getMapPoints: () => source("getMapPoints", "/map-points"),
    getRecentEvents: () => source("getRecentEvents", "/events/recent")
  });
}());
