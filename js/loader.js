const INTRO_DURATION_MS = 2300; // 2.3 seconds

window.addEventListener('DOMContentLoaded', () => {
  const overlay = document.getElementById('intro-overlay');
  if (!overlay) return;

  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const isTouchLike =
    window.matchMedia('(pointer: coarse)').matches ||
    window.matchMedia('(max-width: 768px)').matches ||
    'ontouchstart' in window;

  let hasFinished = false;

  const finish = () => {
    if (hasFinished) return;
    hasFinished = true;

    // Fade the loader out, then navigate to the main landing page
    overlay.classList.add('intro-overlay--fade-out');
    document.body.classList.remove('intro-active');

    const onDone = () => {
      // Redirect to main landing page and mark that we've just come from the loader
      window.location.href = 'index.html?fromLoader=1';
    };

    overlay.addEventListener('transitionend', onDone, { once: true });

    // Fallback in case transitionend doesn't fire
    setTimeout(onDone, 800);
  };

  // On mobile or when reduced motion is requested, skip the cutscene and go straight to the site.
  if (prefersReducedMotion || isTouchLike) {
    finish();
  } else {
    setTimeout(finish, INTRO_DURATION_MS);
  }
});

