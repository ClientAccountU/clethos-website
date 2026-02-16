/**
 * Our Journey — scroll-based timeline: progress bar and item visibility/active state.
 * Optimized: RAF-throttled, runs only when section in view, batched reads/writes, scaleY for progress.
 */
(function () {
  var wrapper = document.getElementById('timelineWrapper');
  var progressEl = document.getElementById('timelineProgress');
  var items = document.querySelectorAll('.timeline-item');
  if (!wrapper || !progressEl || !items.length) return;

  var prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (prefersReducedMotion) {
    items.forEach(function (item) { item.classList.add('visible'); });
    return;
  }

  var rafScheduled = false;
  var wrapperHeight = 0;

  function updateTimeline() {
    var rect = wrapper.getBoundingClientRect();
    var windowHeight = window.innerHeight;
    wrapperHeight = rect.height || wrapper.offsetHeight;

    if (rect.bottom <= 0 || rect.top >= windowHeight) {
      progressEl.style.setProperty('--timeline-progress', '0');
      rafScheduled = false;
      return;
    }

    var viewportCenter = windowHeight / 2;
    var centerY = viewportCenter - rect.top;
    var fillHeight = Math.max(0, Math.min(centerY, wrapperHeight));
    var scale = wrapperHeight > 0 ? fillHeight / wrapperHeight : 0;

    progressEl.style.setProperty('--timeline-progress', String(scale));

    var triggerPoint = windowHeight * 0.75;
    var i, item, itemRect, itemTop, itemMiddle;
    for (i = 0; i < items.length; i++) {
      item = items[i];
      itemRect = item.getBoundingClientRect();
      itemTop = itemRect.top;
      itemMiddle = itemTop + itemRect.height / 2;

      if (itemTop < triggerPoint) {
        item.classList.add('visible');
      }
      if (itemMiddle < windowHeight / 2 && itemMiddle > windowHeight / 4) {
        item.classList.add('active');
      } else {
        item.classList.remove('active');
      }
    }
    rafScheduled = false;
  }

  function scheduleUpdate() {
    if (rafScheduled) return;
    rafScheduled = true;
    requestAnimationFrame(updateTimeline);
  }

  var section = wrapper.closest('.journey-section');
  var inView = true;
  if (section && 'IntersectionObserver' in window) {
    var io = new IntersectionObserver(
      function (entries) {
        inView = entries[0].isIntersecting;
      },
      { rootMargin: '100px', threshold: 0 }
    );
    io.observe(section);
  }

  function onScrollOrResize() {
    if (section && !inView) return;
    scheduleUpdate();
  }

  updateTimeline();
  window.addEventListener('scroll', onScrollOrResize, { passive: true });
  window.addEventListener('resize', onScrollOrResize);
  window.__timelineUpdate = scheduleUpdate;
})();
