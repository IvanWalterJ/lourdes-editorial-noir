(() => {
  const timeline = document.querySelector('[data-benefit-timeline]');
  if (!timeline) return;

  const items = Array.from(timeline.querySelectorAll('[data-timeline-item]'));
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

  if (reducedMotion.matches || !('IntersectionObserver' in window) || items.length === 0) return;

  try {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          entry.target.classList.toggle('is-active', entry.isIntersecting);
        });
      },
      { threshold: 0.3, rootMargin: '-22% 0px -42% 0px' }
    );

    items.forEach((item) => observer.observe(item));
    timeline.classList.add('timeline-enhanced');

    let framePending = false;
    const updateProgress = () => {
      const rect = timeline.getBoundingClientRect();
      const start = window.innerHeight * 0.68;
      const distance = rect.height + window.innerHeight * 0.18;
      const progress = Math.min(Math.max((start - rect.top) / distance, 0), 1);
      timeline.style.setProperty('--timeline-progress', progress.toFixed(4));
      framePending = false;
    };

    const requestUpdate = () => {
      if (framePending) return;
      framePending = true;
      window.requestAnimationFrame(updateProgress);
    };

    updateProgress();
    window.addEventListener('scroll', requestUpdate, { passive: true });
    window.addEventListener('resize', requestUpdate, { passive: true });
  } catch {
    timeline.classList.remove('timeline-enhanced');
    timeline.style.setProperty('--timeline-progress', '1');
  }
})();