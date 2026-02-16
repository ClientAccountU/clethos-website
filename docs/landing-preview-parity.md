# Why the landing page can look different in preview vs opening index.html directly

## The problem

When you open `index.html` in the browser (e.g. via a static server or file), the Unicorn Studio background looks correct: full S-curve, right scale and position. When you view the **built** site (e.g. `dist/index.html` or “preview”), the same background can look zoomed in or wrong. That happens even if the HTML and CSS for the landing block are the same.

## Why it happens

1. **Different load order**  
   In the source page you load several CSS files and `main.js` as a module. In the build, CSS is bundled and the main script is moved to the end of `<body>`. So scripts and styles run in a slightly different order.

2. **When the canvas is created**  
   Unicorn Studio measures its container and creates a WebGL canvas based on that size. If it runs when the container has one size (e.g. full viewport) and then something changes layout (see below), the canvas is already the wrong size and the scene looks zoomed or cropped.

3. **`body { position: fixed }`**  
   The momentum scroll in `main.js` sets `document.body.style.position = 'fixed'` and uses `transform: translateY(-y)` for scrolling. That runs as soon as the main script runs (after DOMContentLoaded + rAF). If that happens **before** Unicorn has run and created its canvas, the “fixed” containing block is already in place when Unicorn measures. If it happens **after**, Unicorn measured with a different layout. So a small timing difference between “open index.html” and “preview (build)” changes when the canvas is created and how it looks.

4. **One environment, one order**  
   When you open `index.html` directly, one order of events occurs. In preview, the built bundle and script position can change when DOMContentLoaded fires vs when the module runs, so you get a different order and a different result.

So it’s “difficult” because the result depends on **exact timing** of:
- DOMContentLoaded  
- Unicorn Studio `init()`  
- Main script running and setting `body` to `position: fixed`  

and that timing is not the same in the two environments.

## What we did to get 1:1

- **Single init**  
  Unicorn is initialised only once from the inline script in `index.html`, on DOMContentLoaded (or immediately if the document is already loaded).

- **Explicit container size**  
  The scene container has inline `style="width: 100%; height: 100%; min-height: 100vh;"` so its size is well-defined before any CSS or script runs.

- **Momentum scroll only after Unicorn has run and painted**  
  On the landing page, `main.js` does **not** set `body` to `position: fixed` until:
  1. The inline script has run `UnicornStudio.init()` and set `window.__unicornLandingReady`.
  2. Two `requestAnimationFrame` callbacks have run so the browser has had a chance to paint the Unicorn scene.

  So Unicorn always measures and creates its canvas in the same layout (body not yet fixed), and only then does momentum scroll start. That keeps “open index.html” and “preview” in sync.

- **No wait on other pages**  
  On pages without a Unicorn landing scene, we don’t wait for `__unicornLandingReady`; we start momentum after the usual rAF so other pages aren’t affected.

With this, the landing page should be a one-to-one clone in both “open index.html directly” and “preview”.
