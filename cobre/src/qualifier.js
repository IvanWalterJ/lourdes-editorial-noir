(() => {
  const modal = document.querySelector('[data-qualifier-modal]');
  const dialog = document.querySelector('[data-qualifier-dialog]');
  const form = document.querySelector('[data-qualifier-form]');
  const openLinks = Array.from(document.querySelectorAll('[data-open-qualifier]'));

  if (!modal || !dialog || !form || openLinks.length === 0) return;

  const storageKey = 'lourdes-cobre-qualification-v1';
  const steps = Array.from(form.querySelectorAll('[data-form-step]'));
  const stepNames = [
    'Nombre y apellido',
    'Marca o negocio',
    'Principal situación hoy',
    'Canales actuales',
    'Objetivo de la consultoría',
    'WhatsApp de contacto',
  ];
  const closeControls = Array.from(modal.querySelectorAll('[data-close-qualifier]'));
  const backButton = form.querySelector('[data-form-back]');
  const nextButton = form.querySelector('[data-form-next]');
  const submitButton = form.querySelector('[data-form-submit]');
  const stepCounter = modal.querySelector('[data-step-counter]');
  const stepLabel = modal.querySelector('[data-step-label]');
  const progress = modal.querySelector('[data-form-progress]');
  const progressFill = modal.querySelector('[data-progress-fill]');
  const background = Array.from(document.querySelectorAll('body > header, body > main, body > footer'));

  let currentStep = 0;
  let previousFocus = null;

  const getFocusable = () =>
    Array.from(
      dialog.querySelectorAll(
        'button:not([disabled]), input:not([disabled]), textarea:not([disabled]), a[href], [tabindex]:not([tabindex="-1"])'
      )
    ).filter((element) => !element.closest('[hidden]'));

  const collectAnswers = () => ({
    fullName: form.elements.fullName.value.trim(),
    brand: form.elements.brand.value.trim(),
    situation: form.querySelector('input[name="situation"]:checked')?.value || '',
    channels: Array.from(form.querySelectorAll('input[name="channels"]:checked')).map((input) => input.value),
    objective: form.elements.objective.value.trim(),
    contactWhatsapp: form.elements.contactWhatsapp.value.trim(),
  });

  const saveDraft = () => {
    try {
      window.localStorage.setItem(
        storageKey,
        JSON.stringify({ ...collectAnswers(), step: currentStep, updatedAt: new Date().toISOString() })
      );
    } catch {
      // The form remains fully usable when localStorage is unavailable.
    }
  };

  const restoreDraft = () => {
    try {
      const stored = window.localStorage.getItem(storageKey);
      if (!stored) return;
      const draft = JSON.parse(stored);
      if (!draft || typeof draft !== 'object') return;

      form.elements.fullName.value = typeof draft.fullName === 'string' ? draft.fullName : '';
      form.elements.brand.value = typeof draft.brand === 'string' ? draft.brand : '';
      form.elements.objective.value = typeof draft.objective === 'string' ? draft.objective : '';
      form.elements.contactWhatsapp.value = typeof draft.contactWhatsapp === 'string' ? draft.contactWhatsapp : '';

      Array.from(form.querySelectorAll('input[name="situation"]')).forEach((input) => {
        input.checked = input.value === draft.situation;
      });
      Array.from(form.querySelectorAll('input[name="channels"]')).forEach((input) => {
        input.checked = Array.isArray(draft.channels) && draft.channels.includes(input.value);
      });

      if (Number.isInteger(draft.step)) {
        currentStep = Math.min(Math.max(draft.step, 0), steps.length - 1);
      }
    } catch {
      // Ignore malformed or unavailable persisted data.
    }
  };

  const clearError = (step) => {
    const error = step.querySelector('[data-step-error]');
    if (error) error.textContent = '';
    step.querySelectorAll('[aria-invalid="true"]').forEach((field) => field.removeAttribute('aria-invalid'));
  };

  const showError = (step, message, fields) => {
    const error = step.querySelector('[data-step-error]');
    if (error) error.textContent = message;
    fields.forEach((field) => field.setAttribute('aria-invalid', 'true'));
    fields[0]?.focus();
    return false;
  };

  const validateStep = (index) => {
    const step = steps[index];
    clearError(step);

    if (index === 0) {
      const field = form.elements.fullName;
      if (!field.value.trim()) return showError(step, 'Ingresá tu nombre y apellido.', [field]);
    }

    if (index === 1) {
      const field = form.elements.brand;
      if (!field.value.trim()) return showError(step, 'Ingresá el nombre de tu marca o negocio.', [field]);
    }

    if (index === 2) {
      const fields = Array.from(step.querySelectorAll('input[name="situation"]'));
      if (!fields.some((field) => field.checked)) return showError(step, 'Elegí una situación para continuar.', fields);
    }

    if (index === 3) {
      const fields = Array.from(step.querySelectorAll('input[name="channels"]'));
      if (!fields.some((field) => field.checked)) return showError(step, 'Elegí al menos un canal.', fields);
    }

    if (index === 4) {
      const field = form.elements.objective;
      if (!field.value.trim()) return showError(step, 'Contame qué objetivo querés destrabar.', [field]);
    }

    if (index === 5) {
      const field = form.elements.contactWhatsapp;
      const digits = field.value.replace(/\D/g, '');
      if (!field.value.trim() || digits.length < 6) {
        return showError(step, 'Ingresá un WhatsApp válido con código de país y área.', [field]);
      }
    }

    return true;
  };

  const focusStep = () => {
    const target = steps[currentStep].querySelector('input:checked, input, textarea, button');
    (target || dialog).focus();
  };

  const renderStep = ({ focus = true } = {}) => {
    steps.forEach((step, index) => {
      step.hidden = index !== currentStep;
    });

    const displayedStep = currentStep + 1;
    stepCounter.textContent = `Paso ${displayedStep} de ${steps.length}`;
    stepLabel.textContent = stepNames[currentStep];
    progress.setAttribute('aria-valuenow', String(displayedStep));
    progressFill.style.width = `${(displayedStep / steps.length) * 100}%`;
    backButton.hidden = currentStep === 0;
    nextButton.hidden = currentStep === steps.length - 1;
    submitButton.hidden = currentStep !== steps.length - 1;
    saveDraft();

    if (focus) window.requestAnimationFrame(focusStep);
  };

  const openModal = (trigger) => {
    try {
      previousFocus = trigger || document.activeElement;
      modal.hidden = false;
      document.body.classList.add('modal-open');
      background.forEach((region) => region.setAttribute('inert', ''));
      renderStep();
      return !modal.hidden;
    } catch {
      modal.hidden = true;
      document.body.classList.remove('modal-open');
      background.forEach((region) => region.removeAttribute('inert'));
      return false;
    }
  };

  const closeModal = () => {
    if (modal.hidden) return;
    saveDraft();
    modal.hidden = true;
    document.body.classList.remove('modal-open');
    background.forEach((region) => region.removeAttribute('inert'));
    previousFocus?.focus();
  };

  const nextStep = () => {
    if (!validateStep(currentStep)) return;
    if (currentStep < steps.length - 1) {
      currentStep += 1;
      renderStep();
    }
  };

  const previousStep = () => {
    if (currentStep === 0) return;
    currentStep -= 1;
    renderStep();
  };

  const buildMessage = (answers) =>
    [
      'Hola Lourdes, quiero agendar una consultoría de contenido.',
      '',
      `Nombre y apellido: ${answers.fullName}`,
      `Marca o negocio: ${answers.brand}`,
      `Principal situación hoy: ${answers.situation}`,
      `Canales donde hoy comunico: ${answers.channels.join(', ')}`,
      `Objetivo que quiero destrabar: ${answers.objective}`,
      `WhatsApp de contacto: ${answers.contactWhatsapp}`,
    ].join('\n');

  const handleSubmit = (event) => {
    event.preventDefault();
    if (!validateStep(currentStep)) return;

    const answers = collectAnswers();
    saveDraft();

    // This body data attribute currently contains a TEST number and must be replaced before production.
    const recipientDigits = (document.body.dataset.whatsappNumber || '').replace(/\D/g, '');
    if (!recipientDigits) return;

    const url = `https://wa.me/${recipientDigits}?text=${encodeURIComponent(buildMessage(answers))}`;
    const opened = window.open(url, '_blank', 'noopener,noreferrer');
    if (opened) opened.opener = null;
    closeModal();
  };

  openLinks.forEach((link) => {
    link.addEventListener('click', (event) => {
      if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      if (openModal(link)) event.preventDefault();
    });
  });

  closeControls.forEach((control) => control.addEventListener('click', closeModal));
  nextButton.addEventListener('click', nextStep);
  backButton.addEventListener('click', previousStep);
  form.addEventListener('submit', handleSubmit);

  form.addEventListener('input', () => {
    clearError(steps[currentStep]);
    saveDraft();
  });
  form.addEventListener('change', () => {
    clearError(steps[currentStep]);
    saveDraft();
  });

  modal.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
      event.preventDefault();
      closeModal();
      return;
    }
    if (event.key !== 'Tab') return;

    const focusable = getFocusable();
    if (focusable.length === 0) {
      event.preventDefault();
      dialog.focus();
      return;
    }

    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  });

  restoreDraft();
  renderStep({ focus: false });
})();