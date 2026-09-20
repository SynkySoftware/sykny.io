(function () {
  const trigger = document.querySelector("[data-faq-policy-toggle]");
  const panel = document.getElementById("bootstrap-policy-panel");
  if (!trigger || !panel) return;

  function setOpen(open) {
    trigger.setAttribute("aria-expanded", open ? "true" : "false");
    if (open) {
      panel.hidden = false;
      // Next frame so grid-rows transition runs from 0fr
      requestAnimationFrame(function () {
        panel.classList.add("is-open");
      });
    } else {
      panel.classList.remove("is-open");
      window.setTimeout(function () {
        if (!panel.classList.contains("is-open")) {
          panel.hidden = true;
        }
      }, 260);
    }
  }

  trigger.addEventListener("click", function () {
    const open = trigger.getAttribute("aria-expanded") !== "true";
    setOpen(open);
  });

  document.addEventListener("keydown", function (event) {
    if (event.key !== "Escape") return;
    if (trigger.getAttribute("aria-expanded") !== "true") return;
    setOpen(false);
    trigger.focus();
  });
})();
