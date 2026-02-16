/**
 * CLETHOS — Shared header and footer (injected into pages for consistency)
 * Used by non-index pages; index has inline header/footer.
 */
export function getHeader(currentPage = '') {
  const navLinks = [
    { href: 'services.html', label: 'Services' },
    { href: 'about.html', label: 'About' },
    { href: 'research.html', label: 'Research' },
    { href: 'contact.html', label: 'Contact' },
  ];
  const links = navLinks.map(({ href, label }) => {
    const active = currentPage === href ? ' aria-current="page"' : '';
    return `<a href="${href}"${active}>${label}</a>`;
  }).join('\n        ');
  return `
  <header class="site-header" id="site-header" role="banner">
    <div class="site-header__inner">
      <a href="index.html" class="site-header__logo" aria-label="CLETHOS home">CLETHOS</a>
      <nav class="site-header__nav" id="main-nav" aria-label="Main navigation">
        ${links}
        <a href="contact.html" class="btn btn--primary">Get in touch</a>
      </nav>
      <button type="button" class="site-header__menu-btn" id="menu-btn" aria-label="Toggle menu" aria-expanded="false" aria-controls="main-nav" hidden>
        <span></span><span></span><span></span>
      </button>
    </div>
  </header>`;
}

export function getFooter() {
  return `
  <footer class="site-footer" role="contentinfo">
    <div class="site-footer__inner">
      <div class="site-footer__grid">
        <div>
          <div class="site-footer__brand">CLETHOS</div>
          <p class="site-footer__tagline">Treasury infrastructure for modern business.</p>
        </div>
        <div class="site-footer__links">
          <h4>Product</h4>
          <a href="services.html">Services</a>
          <a href="contact.html">Contact</a>
        </div>
        <div class="site-footer__links">
          <h4>Company</h4>
          <a href="about.html">About</a>
          <a href="research.html">Research</a>
          <a href="legal.html">Legal</a>
        </div>
      </div>
      <div class="site-footer__bottom">
        <p>© 2026 CLETHOS. All rights reserved.</p>
      </div>
    </div>
  </footer>`;
}
