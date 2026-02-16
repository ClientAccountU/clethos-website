/**
 * Our Journey — scroll-based timeline: progress bar and item visibility/active state
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

  function updateTimeline() {
    var rect = wrapper.getBoundingClientRect();
    var windowHeight = window.innerHeight;
    var wrapperHeight = rect.height || wrapper.offsetHeight;

    // Hide bar when timeline is fully above or below viewport
    if (rect.bottom <= 0 || rect.top >= windowHeight) {
      progressEl.style.height = '0';
    } else {
      // Fill amount is how far the viewport center has travelled
      // from the top of the timeline, clamped to its total height.
      var viewportCenter = windowHeight / 2;
      var centerY = viewportCenter - rect.top;
      var fillHeight = Math.max(0, Math.min(centerY, wrapperHeight));
      progressEl.style.height = fillHeight + 'px';
    }

    var triggerPoint = windowHeight * 0.75;
    items.forEach(function (item) {
      var itemRect = item.getBoundingClientRect();
      var itemTop = itemRect.top;
      var itemMiddle = itemTop + itemRect.height / 2;

      if (itemTop < triggerPoint) {
        item.classList.add('visible');
      }
      if (itemMiddle < windowHeight / 2 && itemMiddle > windowHeight / 4) {
        item.classList.add('active');
      } else {
        item.classList.remove('active');
      }
    });
  }

  updateTimeline();
  window.addEventListener('scroll', updateTimeline, { passive: true });
  window.addEventListener('resize', updateTimeline);
  window.__timelineUpdate = updateTimeline;
})();
