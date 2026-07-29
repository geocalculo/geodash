(function () {
  "use strict";

  async function fetchDashboard(days = 30, limit = 20) {
    const base = GEODASH_CONFIG.apiBaseUrl.replace(/\/$/, "");
    if (!base) throw new Error("apiBaseUrl no está configurada");

    const query = new URLSearchParams({ days: String(days), limit: String(limit) });
    const response = await fetch(`${base}/dashboard?${query}`, {
      headers: { Accept: "application/json" }
    });
    if (!response.ok) throw new Error(`API respondió ${response.status}`);

    return response.json();
  }

  window.GeoDashAPI = Object.freeze({ fetchDashboard });
}());
