const INTRO_DURATION_MS = 2300; // 2.3 seconds

window.addEventListener('DOMContentLoaded', () => {
  const overlay = document.getElementById('intro-overlay');
  if (!overlay) return;

  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  let hasFinished = false;

  const finish = () => {
    if (hasFinished) return;
    hasFinished = true;

    // Fade the loader out, then navigate to the main landing page
    overlay.classList.add('intro-overlay--fade-out');
    document.body.classList.remove('intro-active');

    const onDone = () => {
      try {
        sessionStorage.setItem('clethosLoaderDone', '1');
      } catch (e) {
        // Ignore if sessionStorage is unavailable
      }
      window.location.href = '/';
    };

    overlay.addEventListener('transitionend', onDone, { once: true });

    // Fallback in case transitionend doesn't fire
    setTimeout(onDone, 800);
  };

  // Respect reduced motion settings but otherwise show the full cutscene on all devices.
  if (prefersReducedMotion) {
    finish();
  } else {
    setTimeout(finish, INTRO_DURATION_MS);
  }
});

