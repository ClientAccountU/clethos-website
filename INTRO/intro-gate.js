(function () {
  var STORAGE_KEY = 'clethos-intro-unlocked';
  var FADE_MS = 520;
  var host = location.hostname;
  window.CLETHOS_INTRO_DEV = host === 'localhost' || host === '127.0.0.1';
  var gate = document.getElementById('introGate');
  var form = document.getElementById('introGateForm');
  var input = document.getElementById('introGatePin');
  var errorEl = document.getElementById('introGateError');
  var prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function configuredPin() {
    return String(window.CLETHOS_INTRO_ACCESS_PIN || '').replace(/\D/g, '');
  }

  function finishUnlock() {
    try {
      sessionStorage.setItem(STORAGE_KEY, '1');
    } catch (err) { /* private mode */ }
    document.body.classList.remove('intro-locked', 'intro-unlocking');
    document.body.classList.add('intro-reveal');
    if (gate) {
      gate.hidden = true;
      gate.classList.remove('intro-gate--exit');
    }
    /* Defer so pitch-deck.js can register its listener (same-tick unlock misses it). */
    window.setTimeout(function () {
      window.dispatchEvent(new CustomEvent('clethos-intro-unlock'));
    }, 0);
  }

  function unlock(options) {
    var animate = options && options.animate === true && !prefersReducedMotion;

    if (animate && gate) {
      document.body.classList.add('intro-unlocking');
      document.body.classList.remove('intro-locked');
      document.body.classList.add('intro-reveal');
      gate.classList.add('intro-gate--exit');
      window.setTimeout(finishUnlock, FADE_MS);
      return;
    }

    finishUnlock();
  }

  function isUnlocked() {
    try {
      return sessionStorage.getItem(STORAGE_KEY) === '1';
    } catch (err) {
      return false;
    }
  }

  var expectedPin = configuredPin();
  var pinLength = expectedPin.length;

  if (pinLength < 4 || pinLength > 8) {
    console.warn('CLETHOS Consultancy: set an access code (4–8 digits) in INTRO/access-config.js');
  }

  if (isUnlocked() || window.CLETHOS_INTRO_DEV) {
    unlock({ animate: false });
    return;
  }

  document.body.classList.add('intro-locked');

  if (input && pinLength) {
    input.maxLength = pinLength;
    input.minLength = pinLength;
    input.placeholder = Array(pinLength + 1).join('•');
    var label = document.querySelector('label[for="introGatePin"]');
    if (label) {
      label.textContent = pinLength + '-digit access code';
    }
    input.addEventListener('input', function () {
      input.value = input.value.replace(/\D/g, '').slice(0, pinLength);
      if (errorEl) errorEl.hidden = true;
    });
  }

  if (form) {
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var entered = input ? input.value.replace(/\D/g, '') : '';
      if (entered.length === pinLength && entered === expectedPin) {
        unlock({ animate: true });
        return;
      }
      if (errorEl) {
        errorEl.hidden = false;
        errorEl.textContent = 'Incorrect code. This presentation is confidential and for invited clients only.';
      }
      if (input) {
        input.value = '';
        input.focus();
      }
    });
  }
})();
