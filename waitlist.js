(function () {
  const drawer = document.getElementById("waitlist-drawer");
  const form = document.getElementById("waitlist-form");
  const success = document.getElementById("waitlist-success");
  const error = document.getElementById("waitlist-error");
  const submitBtn = form.querySelector('button[type="submit"]');
  const openTriggers = document.querySelectorAll("[data-waitlist-open]");
  const closeTriggers = drawer.querySelectorAll("[data-waitlist-close]");

  const submitLabel = submitBtn.textContent;

  let lastFocused = null;

  /** Funnel analytics contract — vendor attaches at go-live via window.synkyAnalytics.track */
  function track(eventName, payload) {
    const detail = Object.assign({ event: eventName, ts: Date.now() }, payload || {});
    window.dispatchEvent(new CustomEvent("synky:" + eventName, { detail }));
    try {
      const bridge = window.synkyAnalytics;
      if (bridge && typeof bridge.track === "function") {
        bridge.track(eventName, detail);
      }
    } catch (_) {
      /* never block UX on analytics */
    }
  }

  track("page_view", { path: window.location.pathname || "/" });

  function openDrawer() {
    lastFocused = document.activeElement;
    drawer.hidden = false;
    drawer.setAttribute("aria-hidden", "false");
    document.body.classList.add("drawer-open");
    requestAnimationFrame(() => drawer.classList.add("drawer--open"));

    track("waitlist_open", { path: window.location.pathname || "/" });

    const firstInput = form.querySelector("input");
    if (firstInput) firstInput.focus();
  }

  function closeDrawer() {
    drawer.classList.remove("drawer--open");
    drawer.setAttribute("aria-hidden", "true");
    document.body.classList.remove("drawer-open");

    window.setTimeout(() => {
      if (!drawer.classList.contains("drawer--open")) {
        drawer.hidden = true;
      }
    }, 260);

    if (lastFocused && typeof lastFocused.focus === "function") {
      lastFocused.focus();
    }
  }

  function resetForm() {
    form.reset();
    form.hidden = false;
    success.hidden = true;
    error.hidden = true;
    submitBtn.disabled = false;
    submitBtn.textContent = submitLabel;
  }

  openTriggers.forEach((el) => {
    el.addEventListener("click", () => {
      resetForm();
      openDrawer();
    });
  });

  const panel = drawer.querySelector(".drawer-panel");
  const focusableSelector =
    'button:not([disabled]), input:not([disabled]), [href], textarea, select';

  panel.addEventListener("keydown", (event) => {
    if (event.key !== "Tab" || !drawer.classList.contains("drawer--open")) return;
    const focusables = [...panel.querySelectorAll(focusableSelector)];
    if (focusables.length === 0) return;
    const first = focusables[0];
    const last = focusables[focusables.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  });

  closeTriggers.forEach((el) => {
    el.addEventListener("click", closeDrawer);
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && drawer.classList.contains("drawer--open")) {
      closeDrawer();
    }
  });

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    error.hidden = true;

    if (!form.checkValidity()) {
      form.reportValidity();
      return;
    }

    submitBtn.disabled = true;
    submitBtn.textContent = "Submitting…";

    try {
      const response = await fetch(form.action, {
        method: "POST",
        body: new FormData(form),
        headers: { Accept: "application/json" },
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data.error || "Submit failed");
      }

      form.reset();
      form.hidden = true;
      success.hidden = false;

      track("waitlist_submitted", { path: window.location.pathname || "/" });
    } catch {
      error.hidden = false;
      track("waitlist_error", { path: window.location.pathname || "/" });
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = submitLabel;
    }
  });
})();
