(function () {
  "use strict";
  const cache = new Map();
  const CACHE_TTL = 5 * 60 * 1000;

  async function fetchAnalytics(period = "week", options = {}) {
    const allowed = ["today", "week", "month"];
    if (!allowed.includes(period)) throw new Error("Período no válido");
    const base = GEODASH_CONFIG.apiBaseUrl.replace(/\/$/, "");
    if (!base) throw new Error("apiBaseUrl no está configurada");

    const saved = cache.get(period);
    if (!options.refresh && saved && Date.now() - saved.time < CACHE_TTL) return saved.data;

    const response = await fetch(`${base}/analytics?period=${period}`, { headers: { Accept: "application/json" } });
    if (!response.ok) throw new Error(`API respondió ${response.status}`);
    const data = await response.json();
    cache.set(period, { data, time: Date.now() });
    return data;
  }

  window.GeoDashAPI = Object.freeze({ fetchAnalytics });
}());
