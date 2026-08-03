(() => {
  const timeline = document.querySelector('[data-benefit-timeline]');
  if (!timeline) return;

  const items = Array.from(timeline.querySelectorAll('[data-timeline-item]'));
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

  if (reducedMotion.matches || !('IntersectionObserver' in window) || items.length === 0) {
    return;
  }

  try {
    const itemObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          entry.target.classList.toggle('is-active', entry.isIntersecting);
        });
      },
      { threshold: 0.28, rootMargin: '-24% 0px -44% 0px' }
    );

    items.forEach((item) => itemObserver.observe(item));
    timeline.classList.add('timeline-ready');

    let frameRequested = false;
    const updateProgress = () => {
      const rect = timeline.getBoundingClientRect();
      const start = window.innerHeight * 0.68;
      const distance = rect.height + window.innerHeight * 0.18;
      const progress = Math.min(Math.max((start - rect.top) / distance, 0), 1);
      timeline.style.setProperty('--timeline-progress', progress.toFixed(4));
      frameRequested = false;
    };

    const requestProgressUpdate = () => {
      if (frameRequested) return;
      frameRequested = true;
      window.requestAnimationFrame(updateProgress);
    };

    updateProgress();
    window.addEventListener('scroll', requestProgressUpdate, { passive: true });
    window.addEventListener('resize', requestProgressUpdate, { passive: true });
  } catch {
    timeline.classList.remove('timeline-ready');
    timeline.style.setProperty('--timeline-progress', '1');
  }
})();
