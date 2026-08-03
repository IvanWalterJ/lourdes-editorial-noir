(() => {
  // Placeholder de prueba: reemplazar por el número real antes de publicar.
  const WHATSAPP_PLACEHOLDER_NUMBER = "5491112345678";
  const modal = document.querySelector("[data-qualifier-modal]");
  const dialog = document.querySelector("[data-qualifier-dialog]");
  const form = document.querySelector("[data-qualifier-form]");
  if (!modal || !dialog || !form) return;

  const steps = Array.from(form.querySelectorAll("[data-form-step]"));
  const counter = modal.querySelector("[data-step-counter]");
  const fill = modal.querySelector("[data-progress-fill]");
  const back = form.querySelector("[data-form-back]");
  const next = form.querySelector("[data-form-next]");
  const submit = form.querySelector("[data-form-submit]");
  let current = 0;
  let previousFocus = null;

  const fieldsFor = (step) => Array.from(step.querySelectorAll("input, textarea"));
  const firstField = (step) => fieldsFor(step)[0];
  const valueFor = (step) => {
    const checked = step.querySelector("input[type=radio]:checked");
    if (checked) return checked.value.trim();
    const control = step.querySelector("input:not([type=radio]), textarea");
    return control ? control.value.trim() : "";
  };

  const setValidityState = (step, valid) => {
    const error = step.querySelector("[data-step-error]");
    const target = step.querySelector("fieldset") || firstField(step);
    error.textContent = valid ? "" : "Completá esta respuesta para continuar.";
    if (target) target.setAttribute("aria-invalid", String(!valid));
    fieldsFor(step).forEach((field) => field.setAttribute("aria-invalid", String(!valid)));
  };

  const validateStep = (index, focusInvalid = true) => {
    const step = steps[index];
    const valid = Boolean(valueFor(step));
    setValidityState(step, valid);
    if (!valid && focusInvalid) firstField(step)?.focus();
    return valid;
  };

  const render = () => {
    steps.forEach((step, index) => { step.hidden = index !== current; });
    counter.textContent = "Paso " + (current + 1) + " de " + steps.length;
    fill.style.width = (((current + 1) / steps.length) * 100) + "%";
    back.hidden = current === 0;
    next.hidden = current === steps.length - 1;
    submit.hidden = current !== steps.length - 1;
    setTimeout(() => firstField(steps[current])?.focus(), 30);
  };

  const advance = () => {
    if (!validateStep(current)) return;
    if (current < steps.length - 1) {
      current += 1;
      render();
    }
  };

  const open = () => {
    previousFocus = document.activeElement;
    modal.hidden = false;
    document.body.classList.add("modal-open");
    current = 0;
    form.reset();
    steps.forEach((step) => setValidityState(step, true));
    render();
  };

  const close = () => {
    modal.hidden = true;
    document.body.classList.remove("modal-open");
    previousFocus?.focus();
  };

  document.querySelectorAll("[data-open-qualifier]").forEach((el) => el.addEventListener("click", open));
  modal.querySelectorAll("[data-close-qualifier]").forEach((el) => el.addEventListener("click", close));
  next.addEventListener("click", advance);
  back.addEventListener("click", () => { current = Math.max(0, current - 1); render(); });

  form.addEventListener("keydown", (event) => {
    if (event.key !== "Enter" || event.shiftKey || event.target.matches("textarea")) return;
    event.preventDefault();
    if (current < steps.length - 1) advance();
    else form.requestSubmit();
  });

  document.addEventListener("keydown", (event) => {
    if (!modal.hidden && event.key === "Escape") close();
    if (!modal.hidden && event.key === "Tab") {
      const focusable = Array.from(dialog.querySelectorAll("button:not([hidden]), input, textarea"))
        .filter((el) => !el.closest("[hidden]"));
      if (!focusable.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    }
  });

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const firstInvalid = steps.findIndex((_, index) => !validateStep(index, false));
    if (firstInvalid !== -1) {
      current = firstInvalid;
      render();
      setTimeout(() => firstField(steps[current])?.focus(), 40);
      return;
    }

    const data = new FormData(form);
    const labels = [
      ["Nombre", "name"],
      ["Tipo de negocio o agencia", "businessType"],
      ["Servicio que vende", "service"],
      ["Principal problema de contenido", "contentProblem"],
      ["¿Delega contenido?", "delegates"],
      ["Objetivo próximos 90 días", "goal90"],
      ["Rango de inversión", "investment"]
    ];
    const lines = ["Hola Lourdes, quiero consultar por una consultoría de contenido.", ""];
    labels.forEach(([label, key]) => lines.push("*" + label + ":* " + data.get(key)));
    const url = "https://wa.me/" + WHATSAPP_PLACEHOLDER_NUMBER + "?text=" + encodeURIComponent(lines.join("\n"));
    window.open(url, "_blank", "noopener,noreferrer");
  });
})();