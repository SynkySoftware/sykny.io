/**
 * Cookie consent banner (UK PECR / GDPR-oriented).
 * Non-essential analytics (GA4, Clarity) stay off until "Accept analytics".
 * "Essential only" rejects analytics with equal ease.
 */
(function () {
  const consent = window.synkyConsent;
  if (!consent) return;

  const existing = consent.get();

  function hide(banner) {
    banner.classList.remove("cookie-banner--visible");
    banner.setAttribute("aria-hidden", "true");
    window.setTimeout(function () {
      if (!banner.classList.contains("cookie-banner--visible")) {
        banner.hidden = true;
      }
    }, 280);
  }

  function show(banner) {
    banner.hidden = false;
    banner.setAttribute("aria-hidden", "false");
    requestAnimationFrame(function () {
      banner.classList.add("cookie-banner--visible");
    });
  }

  function build() {
    const banner = document.createElement("div");
    banner.id = "cookie-banner";
    banner.className = "cookie-banner";
    banner.setAttribute("role", "dialog");
    banner.setAttribute("aria-modal", "false");
    banner.setAttribute("aria-labelledby", "cookie-banner-title");
    banner.setAttribute("aria-describedby", "cookie-banner-desc");
    banner.hidden = true;
    banner.setAttribute("aria-hidden", "true");

    banner.innerHTML =
      '<div class="cookie-banner-inner">' +
      '<div class="cookie-banner-copy">' +
      '<p id="cookie-banner-title" class="cookie-banner-title">Cookies</p>' +
      '<p id="cookie-banner-desc" class="cookie-banner-desc">' +
      "We use optional analytics cookies to understand user traffic. " +
      "They are turned off until you accept. " +
      '<a href="/privacy.html">Privacy policy</a>.' +
      "</p>" +
      "</div>" +
      '<div class="cookie-banner-actions">' +
      '<button type="button" class="btn btn-outline btn-cookie" data-cookie-reject>Essential only</button>' +
      '<button type="button" class="btn btn-primary btn-cookie" data-cookie-accept>Accept cookies</button>' +
      "</div>" +
      "</div>";

    document.body.appendChild(banner);

    banner.querySelector("[data-cookie-accept]").addEventListener("click", function () {
      consent.set("accepted");
      hide(banner);
    });

    banner.querySelector("[data-cookie-reject]").addEventListener("click", function () {
      consent.set("rejected");
      hide(banner);
    });

    return banner;
  }

  const banner = build();

  if (!existing) {
    show(banner);
  }

  document.addEventListener("click", function (event) {
    const trigger = event.target.closest("[data-cookie-settings]");
    if (!trigger) return;
    event.preventDefault();
    show(banner);
  });
})();
