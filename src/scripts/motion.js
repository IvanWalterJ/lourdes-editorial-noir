(() => {
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const progressBar = document.querySelector('[data-scroll-progress]');
  const revealItems = document.querySelectorAll('[data-reveal]');

  const updateProgress = () => {
    if (!progressBar) return;

    const scrollable = document.documentElement.scrollHeight - window.innerHeight;
    const progress = scrollable > 0 ? Math.min(window.scrollY / scrollable, 1) : 0;
    progressBar.style.transform = `scaleX(${progress})`;
  };

  updateProgress();
  window.addEventListener('scroll', updateProgress, { passive: true });
  window.addEventListener('resize', updateProgress, { passive: true });

  if (!prefersReducedMotion.matches && 'IntersectionObserver' in window && revealItems.length > 0) {
    try {
      const revealObserver = new IntersectionObserver(
        (entries, observer) => {
          entries.forEach((entry) => {
            if (!entry.isIntersecting) return;
            entry.target.classList.add('is-visible');
            observer.unobserve(entry.target);
          });
        },
        { threshold: 0.14, rootMargin: '0px 0px -8% 0px' }
      );

      revealItems.forEach((item) => revealObserver.observe(item));
      document.documentElement.classList.add('motion-ready');
    } catch {
      document.documentElement.classList.remove('motion-ready');
    }
  }

  const dynamicWords = document.querySelectorAll('[data-dynamic-words]');
  if (!prefersReducedMotion.matches) {
    dynamicWords.forEach((element) => {
      const words = (element.dataset.dynamicWords || '')
        .split('|')
        .map((word) => word.trim())
        .filter(Boolean);

      if (words.length < 2) return;

      let index = 0;
      let changes = 0;
      const interval = window.setInterval(() => {
        element.classList.add('is-changing');
        window.setTimeout(() => {
          index = (index + 1) % words.length;
          element.textContent = words[index];
          element.classList.remove('is-changing');
          changes += 1;

          if (changes >= words.length * 2) {
            window.clearInterval(interval);
          }
        }, 220);
      }, 1700);
    });
  }

  const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)');
  if (!prefersReducedMotion.matches && finePointer.matches) {
    document.querySelectorAll('[data-parallax-root]').forEach((root) => {
      const layers = root.querySelectorAll('[data-parallax]');
      if (layers.length === 0) return;

      root.addEventListener('pointermove', (event) => {
        const rect = root.getBoundingClientRect();
        const x = (event.clientX - rect.left) / rect.width - 0.5;
        const y = (event.clientY - rect.top) / rect.height - 0.5;

        layers.forEach((layer) => {
          const depth = Number(layer.dataset.parallax || 12);
          layer.style.setProperty('--parallax-x', `${x * depth}px`);
          layer.style.setProperty('--parallax-y', `${y * depth}px`);
        });
      });

      root.addEventListener('pointerleave', () => {
        layers.forEach((layer) => {
          layer.style.setProperty('--parallax-x', '0px');
          layer.style.setProperty('--parallax-y', '0px');
        });
      });
    });
  }
})();
