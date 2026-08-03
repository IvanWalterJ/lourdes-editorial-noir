(() => {
  const modal = document.querySelector('[data-qualifier-modal]');
  const dialog = document.querySelector('[data-qualifier-dialog]');
  const form = document.querySelector('[data-qualifier-form]');
  const openButtons = Array.from(document.querySelectorAll('[data-open-qualifier]'));

  if (!modal || !dialog || !form || openButtons.length === 0) return;

  const storageKey = 'lourdes-auditoria-qualification-v1';
  const steps = Array.from(form.querySelectorAll('[data-form-step]'));
  const closeButtons = Array.from(modal.querySelectorAll('[data-close-qualifier]'));
  const backButton = form.querySelector('[data-form-back]');
  const nextButton = form.querySelector('[data-form-next]');
  const submitButton = form.querySelector('[data-form-submit]');
  const stepCounter = modal.querySelector('[data-step-counter]');
  const progress = modal.querySelector('[data-form-progress]');
  const progressFill = modal.querySelector('[data-progress-fill]');
  const configError = modal.querySelector('[data-config-error]');
  const backgroundRegions = Array.from(document.querySelectorAll('body > header, body > main, body > footer'));

  let currentStep = 0;
  let previouslyFocused = null;

  const getFocusableElements = () =>
    Array.from(
      dialog.querySelectorAll(
        'button:not([disabled]), input:not([disabled]), textarea:not([disabled]), select:not([disabled]), a[href], [tabindex]:not([tabindex="-1"])'
      )
    ).filter((element) => !element.closest('[hidden]'));

  const readDraft = () => {
    try {
      const stored = window.localStorage.getItem(storageKey);
      if (!stored) return null;
      const draft = JSON.parse(stored);
      return draft && typeof draft === 'object' ? draft : null;
    } catch {
      return null;
    }
  };

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
        JSON.stringify({
          ...collectAnswers(),
          step: currentStep,
          updatedAt: new Date().toISOString(),
        })
      );
    } catch {
      // The form remains usable when storage is unavailable or disabled.
    }
  };

  const restoreDraft = () => {
    const draft = readDraft();
    if (!draft) return;

    form.elements.fullName.value = typeof draft.fullName === 'string' ? draft.fullName : '';
    form.elements.brand.value = typeof draft.brand === 'string' ? draft.brand : '';
    form.elements.objective.value = typeof draft.objective === 'string' ? draft.objective : '';
    form.elements.contactWhatsapp.value = typeof draft.contactWhatsapp === 'string' ? draft.contactWhatsapp : '';

    if (typeof draft.situation === 'string') {
      const situation = form.querySelector(`input[name="situation"][value="${CSS.escape(draft.situation)}"]`);
      if (situation) situation.checked = true;
    }

    if (Array.isArray(draft.channels)) {
      form.querySelectorAll('input[name="channels"]').forEach((input) => {
        input.checked = draft.channels.includes(input.value);
      });
    }

    if (Number.isInteger(draft.step)) {
      currentStep = Math.min(Math.max(draft.step, 0), steps.length - 1);
    }
  };

  const clearStepError = (step) => {
    const error = step.querySelector('[data-step-error]');
    if (error) error.textContent = '';
    step.querySelectorAll('[aria-invalid="true"]').forEach((field) => field.removeAttribute('aria-invalid'));
  };

  const setStepError = (step, message, fields) => {
    const error = step.querySelector('[data-step-error]');
    if (error) error.textContent = message;
    fields.forEach((field) => field.setAttribute('aria-invalid', 'true'));
    fields[0]?.focus();
    return false;
  };

  const validateStep = (index) => {
    const step = steps[index];
    clearStepError(step);

    if (index === 0) {
      const field = form.elements.fullName;
      if (!field.value.trim()) return setStepError(step, 'Ingresá tu nombre y apellido para continuar.', [field]);
    }

    if (index === 1) {
      const field = form.elements.brand;
      if (!field.value.trim()) return setStepError(step, 'Ingresá el nombre de tu marca o negocio.', [field]);
    }

    if (index === 2) {
      const fields = Array.from(step.querySelectorAll('input[name="situation"]'));
      if (!fields.some((field) => field.checked)) {
        return setStepError(step, 'Elegí la situación que mejor representa tu momento actual.', fields);
      }
    }

    if (index === 3) {
      const fields = Array.from(step.querySelectorAll('input[name="channels"]'));
      if (!fields.some((field) => field.checked)) {
        return setStepError(step, 'Elegí al menos un canal donde hoy comunicás.', fields);
      }
    }

    if (index === 4) {
      const field = form.elements.objective;
      if (!field.value.trim()) return setStepError(step, 'Contame qué objetivo querés destrabar.', [field]);
    }

    if (index === 5) {
      const field = form.elements.contactWhatsapp;
      const digits = field.value.replace(/\D/g, '');
      if (!field.value.trim() || digits.length < 6) {
        return setStepError(step, 'Ingresá un WhatsApp válido con código de país y de área.', [field]);
      }
    }

    return true;
  };

  const focusCurrentStep = () => {
    const step = steps[currentStep];
    const focusTarget = step.querySelector('input:checked, input, textarea, button');
    (focusTarget || dialog).focus();
  };

  const renderStep = ({ focus = true } = {}) => {
    steps.forEach((step, index) => {
      step.hidden = index !== currentStep;
    });

    const humanStep = currentStep + 1;
    const percent = (humanStep / steps.length) * 100;
    stepCounter.textContent = `Paso ${humanStep} de ${steps.length}`;
    progress.setAttribute('aria-valuenow', String(humanStep));
    progressFill.style.width = `${percent}%`;
    backButton.hidden = currentStep === 0;
    nextButton.hidden = currentStep === steps.length - 1;
    submitButton.hidden = currentStep !== steps.length - 1;

    if (configError) configError.hidden = true;
    saveDraft();

    if (focus) window.requestAnimationFrame(focusCurrentStep);
  };

  const openModal = (trigger) => {
    try {
      previouslyFocused = trigger || document.activeElement;
      modal.hidden = false;
      document.body.classList.add('modal-open');
      backgroundRegions.forEach((region) => region.setAttribute('inert', ''));
      renderStep();
      return !modal.hidden;
    } catch {
      modal.hidden = true;
      document.body.classList.remove('modal-open');
      backgroundRegions.forEach((region) => region.removeAttribute('inert'));
      return false;
    }
  };

  const closeModal = () => {
    if (modal.hidden) return;
    saveDraft();
    modal.hidden = true;
    document.body.classList.remove('modal-open');
    backgroundRegions.forEach((region) => region.removeAttribute('inert'));
    previouslyFocused?.focus();
  };

  const goForward = () => {
    if (!validateStep(currentStep)) return;
    saveDraft();
    if (currentStep < steps.length - 1) {
      currentStep += 1;
      renderStep();
    }
  };

  const goBack = () => {
    if (currentStep === 0) return;
    currentStep -= 1;
    renderStep();
  };

  const buildWhatsAppMessage = (answers) =>
    [
      'Hola Lourdes, quiero agendar una auditoría de contenido.',
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

    if (currentStep < steps.length - 1) {
      goForward();
      return;
    }

    if (!validateStep(currentStep)) return;

    const answers = collectAnswers();
    saveDraft();

    // Configure body[data-whatsapp-number] with international digits before publishing.
    const configuredNumber = (document.body.dataset.whatsappNumber || '').trim();
    const recipientDigits = configuredNumber.replace(/\D/g, '');

    if (!recipientDigits) {
      if (configError) configError.hidden = false;
      return;
    }

    const message = buildWhatsAppMessage(answers);
    const url = `https://wa.me/${recipientDigits}?text=${encodeURIComponent(message)}`;
    const openedWindow = window.open(url, '_blank', 'noopener,noreferrer');
    if (openedWindow) openedWindow.opener = null;
    closeModal();
  };

  openButtons.forEach((button) => {
    button.addEventListener('click', (event) => {
      if (openModal(button)) event.preventDefault();
    });
  });

  closeButtons.forEach((button) => {
    button.addEventListener('click', closeModal);
  });

  nextButton.addEventListener('click', goForward);
  backButton.addEventListener('click', goBack);
  form.addEventListener('submit', handleSubmit);

  form.addEventListener('input', (event) => {
    clearStepError(steps[currentStep]);
    if (configError) configError.hidden = true;
    if (event.target.matches('input, textarea')) saveDraft();
  });

  form.addEventListener('change', () => {
    clearStepError(steps[currentStep]);
    saveDraft();
  });

  modal.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
      event.preventDefault();
      closeModal();
      return;
    }

    if (event.key !== 'Tab') return;

    const focusable = getFocusableElements();
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