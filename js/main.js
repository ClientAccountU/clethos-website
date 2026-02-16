/**
 * CLETHOS — Main entry: momentum smooth scroll, GSAP reveals, header, mobile menu
 */

import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { injectSpeedInsights } from '@vercel/speed-insights';

gsap.registerPlugin(ScrollTrigger);
// Vercel Speed Insights — collects performance metrics in production on Vercel
injectSpeedInsights();

const prefersReducedMotion = () =>
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

const isTouchLikeDevice = () => {
  if (typeof window === 'undefined') return false;
  const mq = window.matchMedia ? window.matchMedia.bind(window) : null;
  const coarse = mq ? mq('(pointer: coarse)').matches : false;
  const smallScreen = mq ? mq('(max-width: 768px)').matches : false;
  const hasTouch = 'ontouchstart' in window;
  return coarse || smallScreen || hasTouch;
};

const isLowEndDevice = () => {
  if (typeof navigator === 'undefined') return false;
  const cores = typeof navigator.hardwareConcurrency === 'number' ? navigator.hardwareConcurrency : 8;
  const mem = typeof navigator.deviceMemory === 'number' ? navigator.deviceMemory : 8;
  return cores <= 4 || mem <= 4;
};

const header = document.getElementById('site-header');

// Enable momentum scroll on desktop only; mobile and touch devices use native scroll.
const USE_MOMENTUM_SCROLL = !isTouchLikeDevice();

// ——— Momentum scroll: higher ease = snappier, less lag; multiplier = scroll distance per tick ———
const momentumConfig = {
  ease: 0.085,
  multiplier: 1.4,
};

const momentumData = {
  current: 0,
  target: 0,
  ease: momentumConfig.ease,
  multiplier: momentumConfig.multiplier,
};

let momentumBounds = { max: 0 };
let momentumRaf = null;
const scrollContainer = document.getElementById('main-content') || document.body;

function updateMomentumBounds() {
  momentumBounds.max = Math.max(0, scrollContainer.scrollHeight - window.innerHeight);
}

function initMomentumScroll() {
  document.body.style.position = 'fixed';
  document.body.style.top = '0';
  document.body.style.left = '0';
  document.body.style.width = '100%';
  document.body.style.overflow = 'hidden';
  updateMomentumBounds();
  momentumData.current = 0;
  momentumData.target = 0;

}

function onMomentumWheel(e) {
  e.preventDefault();
  const delta = e.deltaY * momentumData.multiplier;
  momentumData.target += delta;
  momentumData.target = Math.max(0, Math.min(momentumData.target, momentumBounds.max));
}

function onMomentumKeydown(e) {
  const active = document.activeElement;
  const isFormControl = active && (
    active.tagName === 'INPUT' ||
    active.tagName === 'TEXTAREA' ||
    active.tagName === 'SELECT' ||
    active.isContentEditable
  );
  if (isFormControl) return;

  const pageStep = window.innerHeight * 0.8;
  if (e.key === ' ' || e.key === 'ArrowDown' || e.key === 'PageDown') {
    e.preventDefault();
    momentumData.target += (e.key === ' ') ? pageStep : pageStep * 0.5;
    momentumData.target = Math.min(momentumData.target, momentumBounds.max);
  } else if (e.key === 'ArrowUp' || e.key === 'PageUp') {
    e.preventDefault();
    momentumData.target -= pageStep * 0.5;
    momentumData.target = Math.max(0, momentumData.target);
  }
}

let touchStartY = 0;
function onMomentumTouchStart(e) {
  touchStartY = e.touches[0].clientY;
}
function onMomentumTouchMove(e) {
  const delta = (touchStartY - e.touches[0].clientY) * momentumData.multiplier;
  touchStartY = e.touches[0].clientY;
  momentumData.target += delta;
  momentumData.target = Math.max(0, Math.min(momentumData.target, momentumBounds.max));
}

let momentumFrame = 0;
function momentumRender() {
  const velocity = momentumData.target - momentumData.current;
  momentumData.current += velocity * momentumData.ease;

  // Snap to target when very close to avoid slow drift at rest
  if (Math.abs(velocity) < 0.5) {
    momentumData.current = momentumData.target;
  }

  // Render at whole-pixel positions to avoid sub-pixel jitter, especially on video
  const renderedY = Math.round(momentumData.current);
  scrollContainer.style.transform = `translateY(-${renderedY}px)`;

  // Throttle heavier GSAP and timeline work to reduce load on low-end devices
  if (Math.abs(velocity) > 0.01) {
    if ((momentumFrame % 2) === 0) ScrollTrigger.update();
    if ((momentumFrame % 4) === 0 && typeof window.__timelineUpdate === 'function') window.__timelineUpdate();
  }
  momentumFrame++;

  if (header) header.classList.toggle('is-scrolled', renderedY > 40);
  momentumRaf = requestAnimationFrame(momentumRender);
}

// Expose scroll position for programmatic use (e.g. anchor links)
function momentumScrollTo(y) {
  momentumData.target = Math.max(0, Math.min(y, momentumBounds.max));
}

// Proxy GSAP ScrollTrigger to use momentum scroll position (only when momentum is active)
if (USE_MOMENTUM_SCROLL) {
  ScrollTrigger.scrollerProxy(window, {
    scrollTop(value) {
      if (arguments.length) {
        momentumData.target = value;
        momentumData.current = value;
      }
      return momentumData.current;
    },
  });
}

// Expose scroll position for timeline / other scripts (native scroll when momentum off)
window.__getScrollTop = USE_MOMENTUM_SCROLL ? () => momentumData.current : () => window.scrollY ?? 0;

// Start momentum scroll only when not preferring reduced motion and USE_MOMENTUM_SCROLL is true
function startMomentumScroll() {
  document.body.classList.add('momentum-scroll-active');
  initMomentumScroll();
  momentumRender();
  window.addEventListener('wheel', onMomentumWheel, { passive: false });
  window.addEventListener('resize', updateMomentumBounds);
  window.addEventListener('keydown', onMomentumKeydown, { passive: false });
  document.addEventListener('touchstart', onMomentumTouchStart, { passive: true });
  document.addEventListener('touchmove', onMomentumTouchMove, { passive: false });
  window.momentumScrollTo = momentumScrollTo;
}

if (USE_MOMENTUM_SCROLL && !prefersReducedMotion()) {
  // Defer momentum scroll until after Unicorn Studio has inited and painted on the landing page,
  // so the background is a 1:1 match when opening index.html directly vs preview (build).
  const hasLandingScene = () => document.querySelector('.landing-bg__scene[data-us-project]');
  const run = () => {
    const start = () => {
      const afterUnicornAndPaint = () => {
        const waitingForUnicorn = hasLandingScene() && !window.__unicornLandingReady;
        if (waitingForUnicorn) {
          requestAnimationFrame(afterUnicornAndPaint);
          return;
        }
        requestAnimationFrame(() => requestAnimationFrame(() => {
          startMomentumScroll();
          // Recompute scroll max when main content height changes (e.g. images on services page)
          if (scrollContainer && typeof ResizeObserver !== 'undefined') {
            const ro = new ResizeObserver(() => {
              updateMomentumBounds();
              momentumData.target = Math.min(momentumData.target, momentumBounds.max);
            });
            ro.observe(scrollContainer);
          }
        }));
      };
      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => requestAnimationFrame(afterUnicornAndPaint));
      } else {
        requestAnimationFrame(afterUnicornAndPaint);
      }
    };
    start();
  };
  run();
}

// Refresh ScrollTrigger after layout
setTimeout(() => ScrollTrigger.refresh(), 100);
window.addEventListener('load', () => {
  if (USE_MOMENTUM_SCROLL && !prefersReducedMotion()) updateMomentumBounds();
  ScrollTrigger.refresh();
});

// ——— Header scroll state ———
if (header) {
  function setScrolled() {
    const y = USE_MOMENTUM_SCROLL && !prefersReducedMotion() ? momentumData.current : (window.scrollY ?? 0);
    header.classList.toggle('is-scrolled', y > 40);
  }
  if (!USE_MOMENTUM_SCROLL || prefersReducedMotion()) {
    window.addEventListener('scroll', setScrolled, { passive: true });
  }
  setScrolled();
}

// ——— Anchor links ———
document.addEventListener('click', (e) => {
  const a = e.target.closest('a[href^="#"]');
  if (!a || a.getAttribute('href') === '#') return;
  const id = a.getAttribute('href').slice(1);
  const el = id ? document.getElementById(id) : null;
  if (!el) return;
  if (USE_MOMENTUM_SCROLL && !prefersReducedMotion()) {
    e.preventDefault();
    const top = momentumData.current + el.getBoundingClientRect().top;
    momentumData.target = Math.max(0, Math.min(top, momentumBounds.max));
  } else {
    el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
});

// ——— Mobile menu (portal on mobile so it is never clipped by header) ———
const menuBtn = document.getElementById('menu-btn');
const mainNav = document.getElementById('main-nav');
const siteHeader = document.getElementById('site-header');
if (menuBtn && mainNav && siteHeader) {
  const backdrop = document.createElement('div');
  backdrop.className = 'site-header__nav-backdrop';
  backdrop.setAttribute('aria-hidden', 'true');
  siteHeader.insertBefore(backdrop, siteHeader.firstChild);

  const body = document.body;
  const headerInner = siteHeader.querySelector('.site-header__inner');
  let menuScrollY = 0;

  const unlockBodyScroll = () => {
    if (body.dataset.menuLock === '1') {
      body.style.position = '';
      body.style.top = '';
      body.style.left = '';
      body.style.right = '';
      body.style.width = '';
      body.style.overflow = '';
      window.scrollTo(0, menuScrollY || 0);
      delete body.dataset.menuLock;
    }
  };

  const closeMenu = () => {
    mainNav.classList.remove('is-open');
    menuBtn.setAttribute('aria-expanded', 'false');
    menuBtn.setAttribute('aria-label', 'Toggle menu');
    backdrop.classList.remove('is-visible');
    unlockBodyScroll();
  };

  const media = window.matchMedia('(max-width: 768px)');

  // On mobile, move nav and backdrop to body so nothing can clip the menu
  const moveMenuToBody = () => {
    if (!headerInner || mainNav.parentNode === body) return;
    headerInner.removeChild(mainNav);
    siteHeader.removeChild(backdrop);
    body.appendChild(backdrop);
    body.appendChild(mainNav);
    body.classList.add('mobile-menu-portal');
  };

  const moveMenuToHeader = () => {
    if (mainNav.parentNode !== body) return;
    body.removeChild(backdrop);
    body.removeChild(mainNav);
    body.classList.remove('mobile-menu-portal');
    siteHeader.insertBefore(backdrop, siteHeader.firstChild);
    headerInner.insertBefore(mainNav, menuBtn);
  };

  const showBtn = () => { menuBtn.removeAttribute('hidden'); moveMenuToBody(); };
  const hideBtn = () => { menuBtn.setAttribute('hidden', ''); moveMenuToHeader(); closeMenu(); };
  media.addEventListener('change', (e) => (e.matches ? showBtn() : hideBtn()));
  if (media.matches) showBtn();

  menuBtn.addEventListener('click', () => {
    const open = mainNav.classList.toggle('is-open');
    menuBtn.setAttribute('aria-expanded', open);
    menuBtn.setAttribute('aria-label', open ? 'Close menu' : 'Toggle menu');
    backdrop.classList.toggle('is-visible', open);

    const vw = window.innerWidth || document.documentElement.clientWidth || 0;
    const isMobileLikeWidth = vw <= 900;

    if (open && isMobileLikeWidth) {
      mainNav.scrollTop = 0;
      menuScrollY = window.scrollY || window.pageYOffset || 0;
      body.dataset.menuLock = '1';
      body.style.position = 'fixed';
      body.style.top = `-${menuScrollY}px`;
      body.style.left = '0';
      body.style.right = '0';
      body.style.width = '100%';
      body.style.overflow = 'hidden';
    } else {
      unlockBodyScroll();
    }
  });

  backdrop.addEventListener('click', () => { if (media.matches) closeMenu(); });

  mainNav.querySelectorAll('a').forEach((link) => {
    link.addEventListener('click', () => { if (media.matches) closeMenu(); });
  });
}

// ——— Hero background videos: keep autoplaying reliably ———
document.querySelectorAll('.solutions-hero__video').forEach((video) => {
  const ensurePlaying = () => {
    if (video.paused && !video.ended) {
      video.play().catch(() => {});
    }
  };
  video.addEventListener('canplay', ensurePlaying, { once: true });
  video.addEventListener('pause', ensurePlaying);
});

// ——— Scroll-triggered reveals (respect reduced motion) ———
const reveal = (selector, opts = {}) => {
  const el = document.querySelector(selector);
  if (!el) return;
  if (prefersReducedMotion()) return;
  gsap.from(el, {
    y: opts.y ?? 32,
    opacity: opts.opacity ?? 0,
    duration: opts.duration ?? 0.6,
    ease: 'power3.out',
    scrollTrigger: { trigger: el, start: 'top 85%', toggleActions: 'play none none none' },
    ...opts,
  });
};

if (!prefersReducedMotion() && !isLowEndDevice()) {
  reveal('.hero__title', { y: 40 });
  reveal('.hero__subtitle', { y: 24, delay: 0.1 });
  reveal('.hero__cta', { y: 24, delay: 0.2 });
  reveal('.section-header');
  reveal('.card', { stagger: 0.12, y: 24 });
  reveal('.testimonial', { stagger: 0.1, y: 24 });
  reveal('.two-col__content');
  reveal('.two-col__media');
}

// ——— About section video: ensure loop works (fallback for browsers that ignore loop attribute) ———
const aboutVideo = document.querySelector('.about-section__video');
if (aboutVideo) {
  const ensureAboutVideoPlaying = () => {
    if (aboutVideo.paused || aboutVideo.ended) {
      if (aboutVideo.ended) aboutVideo.currentTime = 0;
      aboutVideo.play().catch(() => {});
    }
  };

  aboutVideo.addEventListener('ended', () => {
    aboutVideo.currentTime = 0;
    ensureAboutVideoPlaying();
  });

  // If the browser pauses the video when it goes off-screen, resume when possible
  aboutVideo.addEventListener('pause', () => {
    if (!document.hidden) {
      ensureAboutVideoPlaying();
    }
  });

  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          ensureAboutVideoPlaying();
        }
      });
    }, { threshold: 0.3 });

    observer.observe(aboutVideo);
  }

  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) {
      ensureAboutVideoPlaying();
    }
  });

  window.addEventListener('pageshow', () => {
    ensureAboutVideoPlaying();
  });
}

// ——— Counter animation for stats (respect reduced motion, skip on low-end) ———
if (!prefersReducedMotion() && !isLowEndDevice()) {
  document.querySelectorAll('[data-counter]').forEach((el) => {
    const end = parseInt(el.textContent, 10);
    if (Number.isNaN(end)) return;
    const obj = { val: 0 };
    gsap.to(obj, {
      val: end,
      duration: 1.8,
      ease: 'power2.out',
      scrollTrigger: { trigger: el, start: 'top 85%', once: true },
      onUpdate: () => { el.textContent = Math.round(obj.val); },
    });
  });
}

