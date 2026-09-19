/**
 * GA4 + Microsoft Clarity — gated by cookie consent.
 * Loads only when synkyConsent is "accepted".
 *
 * Include order:
 *   analytics-config.js (sync)
 *   analytics.js (defer)
 *   cookie-consent.js (defer)
 *   waitlist.js (defer) — optional
 */
(function () {
  const cfg = window.SYNKY_ANALYTICS_CONFIG || {};
  const ga4Id = typeof cfg.ga4MeasurementId === "string" ? cfg.ga4MeasurementId.trim() : "";
  const clarityId =
    typeof cfg.clarityProjectId === "string" ? cfg.clarityProjectId.trim() : "";
  const storageKey = cfg.consentStorageKey || "synky_cookie_consent";
  const consentVersion = String(cfg.consentVersion || "1");

  const queue = [];
  let vendorsLoaded = false;
  let gaReady = false;

  function readStored() {
    try {
      const raw = localStorage.getItem(storageKey);
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      if (!parsed || parsed.v !== consentVersion) return null;
      if (parsed.choice !== "accepted" && parsed.choice !== "rejected") return null;
      return parsed.choice;
    } catch (_) {
      return null;
    }
  }

  function writeStored(choice) {
    try {
      localStorage.setItem(
        storageKey,
        JSON.stringify({
          v: consentVersion,
          choice: choice,
          ts: Date.now(),
        })
      );
    } catch (_) {
      /* private mode etc. */
    }
  }

  function sendGa4(name, payload) {
    if (!ga4Id || typeof window.gtag !== "function") return;
    const params = Object.assign({}, payload || {});
    delete params.event;
    delete params.ts;
    if (name === "page_view") return;
    window.gtag("event", name, params);
  }

  function sendClarity(name) {
    if (!clarityId || typeof window.clarity !== "function") return;
    if (name === "page_view") return;
    try {
      window.clarity("event", name);
    } catch (_) {
      /* ignore */
    }
  }

  function flush() {
    while (queue.length) {
      const item = queue.shift();
      sendGa4(item.name, item.payload);
      sendClarity(item.name);
    }
  }

  function loadGa4() {
    if (!ga4Id) {
      gaReady = true;
      flush();
      return;
    }
    window.dataLayer = window.dataLayer || [];
    window.gtag = function () {
      window.dataLayer.push(arguments);
    };
    window.gtag("js", new Date());
    window.gtag("config", ga4Id, { send_page_view: true, anonymize_ip: true });

    const s = document.createElement("script");
    s.async = true;
    s.src = "https://www.googletagmanager.com/gtag/js?id=" + encodeURIComponent(ga4Id);
    s.onload = function () {
      gaReady = true;
      flush();
    };
    s.onerror = function () {
      gaReady = true;
      queue.length = 0;
    };
    document.head.appendChild(s);
  }

  function loadClarity() {
    if (!clarityId) return;
    (function (c, l, a, r, i, t, y) {
      c[a] =
        c[a] ||
        function () {
          (c[a].q = c[a].q || []).push(arguments);
        };
      t = l.createElement(r);
      t.async = 1;
      t.src = "https://www.clarity.ms/tag/" + i;
      y = l.getElementsByTagName(r)[0];
      y.parentNode.insertBefore(t, y);
    })(window, document, "clarity", "script", clarityId);
  }

  function loadVendors() {
    if (vendorsLoaded) return;
    vendorsLoaded = true;
    loadClarity();
    loadGa4();
  }

  function getConsent() {
    return readStored();
  }

  function setConsent(choice) {
    if (choice !== "accepted" && choice !== "rejected") return;
    writeStored(choice);
    if (choice === "accepted") {
      loadVendors();
    } else {
      queue.length = 0;
    }
    window.dispatchEvent(
      new CustomEvent("synky:cookie_consent", { detail: { choice: choice } })
    );
  }

  window.synkyConsent = {
    get: getConsent,
    set: setConsent,
    storageKey: storageKey,
  };

  window.synkyAnalytics = {
    track: function (name, payload) {
      if (getConsent() !== "accepted") return;
      if (!vendorsLoaded) {
        queue.push({ name: name, payload: payload });
        return;
      }
      if (ga4Id && !gaReady) {
        queue.push({ name: name, payload: payload });
        sendClarity(name);
        return;
      }
      sendGa4(name, payload);
      sendClarity(name);
    },
  };

  // Resume vendors on return visits with prior accept
  if (getConsent() === "accepted") {
    loadVendors();
  }
})();
