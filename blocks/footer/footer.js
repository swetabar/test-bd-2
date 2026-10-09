/**
 * Footer block (content-first).
 *
 * All copy, links and images come from the footer fragment (content/footer.plain.html).
 * Fragment contract (flat, one top-level <div> per section):
 *   1. brand section   – logo paragraph, label paragraph, image-link list (social), badge link
 *   2. nav section     – headings + lists; each heading (or a list without one) starts a column
 *   3+ legal section(s) – copyright / disclaimer paragraphs
 * This file only builds layout shells, classes and behaviour around that content.
 */

const DIALOG_PATH_PREFIX = '/fragments/';
const CONSENT_HASH = '#cookie-preferences';
const CLOSE_HASH = '#close';

/**
 * Parses fetched fragment HTML and resolves relative media against the fragment URL.
 * @param {string} html fragment markup
 * @param {string} baseUrl URL the fragment was served from
 * @returns {HTMLDivElement}
 */
function parseFragment(html, baseUrl) {
  const root = document.createElement('div');
  root.innerHTML = html;
  // Document Authoring wraps list-item content in <p> and images in <picture>: unwrap both
  root.querySelectorAll('li > p').forEach((p) => p.replaceWith(...p.childNodes));
  root.querySelectorAll('picture').forEach((picture) => {
    const img = picture.querySelector('img');
    if (img) picture.replaceWith(img);
  });
  root.querySelectorAll('img[src]').forEach((img) => {
    img.src = new URL(img.getAttribute('src'), baseUrl).href;
  });
  return root;
}

/**
 * Fetches the footer fragment. Metadata-independent dual fetch:
 * /content first (localhost / aem up), then the site root (DA/EDS production).
 * @returns {Promise<HTMLDivElement|null>}
 */
async function fetchFooterFragment() {
  let resp = await fetch('/content/footer.plain.html');
  if (!resp.ok) resp = await fetch('/footer.plain.html');
  if (!resp.ok) return null;
  return parseFragment(await resp.text(), resp.url);
}

/**
 * Fetches a dialog fragment (e.g. /fragments/foo) from /content first, then the site root.
 * @param {string} path fragment path without extension
 * @returns {Promise<HTMLDivElement|null>}
 */
async function fetchDialogFragment(path) {
  const candidates = [`/content${path}.plain.html`, `${path}.plain.html`];
  // eslint-disable-next-line no-restricted-syntax
  for (const url of candidates) {
    // eslint-disable-next-line no-await-in-loop
    const resp = await fetch(url);
    // eslint-disable-next-line no-await-in-loop
    if (resp.ok) return parseFragment(await resp.text(), resp.url);
  }
  return null;
}

/**
 * Returns the dialog fragment path a link points to, or null.
 * @param {HTMLAnchorElement} link
 * @returns {string|null}
 */
function getDialogPath(link) {
  const href = link.getAttribute('href') || '';
  if (!href.startsWith('/')) return null;
  const { pathname } = new URL(href, window.location.href);
  const path = pathname.replace(/^\/content\//, '/').replace(/\.(plain\.)?html$/, '');
  return path.startsWith(DIALOG_PATH_PREFIX) ? path : null;
}

/**
 * Opens the site consent manager preference center when one is installed.
 * @returns {boolean} true when a consent manager handled the request
 */
function openConsentPreferences() {
  const { truste } = window;
  if (truste && truste.eu && typeof truste.eu.clickListener === 'function') {
    truste.eu.clickListener();
    return true;
  }
  document.dispatchEvent(new CustomEvent('consent:open-preferences'));
  return false;
}

let dialogEl;

function closeDialog() {
  if (dialogEl && dialogEl.open) dialogEl.close();
}

/**
 * Renders fragment content into the shared modal dialog and opens it.
 * @param {string} path dialog fragment path
 */
async function openFragmentDialog(path) {
  const fragment = await fetchDialogFragment(path);
  if (!fragment) {
    window.location.href = path;
    return;
  }
  if (!dialogEl) {
    dialogEl = document.createElement('dialog');
    dialogEl.className = 'footer-dialog';
    dialogEl.addEventListener('click', (e) => {
      if (e.target === dialogEl) closeDialog();
    });
    document.body.append(dialogEl);
  }
  const panel = document.createElement('div');
  panel.className = 'footer-dialog-panel';
  const content = document.createElement('div');
  content.className = 'footer-dialog-content';
  const section = fragment.querySelector(':scope > div') || fragment;
  [...section.children].forEach((child) => {
    const closeLink = child.querySelector(`a[href="${CLOSE_HASH}"]`);
    if (closeLink) {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'footer-dialog-close';
      btn.setAttribute('aria-label', closeLink.textContent.trim());
      btn.addEventListener('click', closeDialog);
      panel.append(btn);
      return;
    }
    if (child.matches('p') && child.querySelector('img') && !child.textContent.trim()) {
      child.className = 'footer-dialog-logo';
      panel.prepend(child);
      return;
    }
    content.append(child);
  });
  content.querySelectorAll('a').forEach((a) => {
    const next = getDialogPath(a);
    if (next) {
      a.addEventListener('click', (e) => {
        e.preventDefault();
        openFragmentDialog(next);
      });
    }
  });
  const heading = content.querySelector('h1, h2, h3, h4, h5, h6');
  if (heading) {
    heading.id = heading.id || 'footer-dialog-title';
    dialogEl.setAttribute('aria-labelledby', heading.id);
  }
  const logo = panel.querySelector('.footer-dialog-logo');
  if (logo) logo.after(content);
  else panel.prepend(content);
  dialogEl.replaceChildren(panel);
  if (!dialogEl.open) dialogEl.showModal();
}

/**
 * Wires click behaviour for footer links (dialog fragments, consent manager).
 * @param {Element} root
 */
function decorateLinks(root) {
  root.querySelectorAll('a').forEach((a) => {
    const dialogPath = getDialogPath(a);
    if (dialogPath) {
      a.setAttribute('aria-haspopup', 'dialog');
      a.addEventListener('click', (e) => {
        e.preventDefault();
        openFragmentDialog(dialogPath);
      });
    } else if (a.getAttribute('href') === CONSENT_HASH) {
      a.setAttribute('role', 'button');
      a.setAttribute('aria-haspopup', 'dialog');
      a.addEventListener('click', (e) => {
        e.preventDefault();
        openConsentPreferences();
      });
    }
  });
}

/**
 * Brand section: logo, label, image-link list (social) and badge links.
 * @param {Element} section
 * @returns {HTMLDivElement}
 */
function buildBrand(section) {
  const brand = document.createElement('div');
  brand.className = 'footer-brand';
  [...section.children].forEach((child) => {
    const links = [...child.querySelectorAll('a')];
    const img = child.querySelector('img');
    if (child.matches('ul') && links.length && links.every((a) => a.querySelector('img'))) {
      child.className = 'footer-social';
      // icons render as the link background (src still comes from the fragment)
      links.forEach((a) => {
        const icon = a.querySelector('img');
        a.setAttribute('aria-label', a.getAttribute('title') || icon.alt);
        a.style.backgroundImage = `url("${icon.src}")`;
        icon.remove();
      });
    } else if (img && !links.length) {
      child.className = 'footer-logo';
    } else if (img && links.length) {
      child.className = 'footer-badge';
    } else {
      child.className = 'footer-label';
    }
    brand.append(child);
  });
  return brand;
}

/**
 * Nav section: groups headings + lists into columns.
 * A list that is not directly preceded by a heading becomes its own (heading-less) column.
 * @param {Element} section
 * @returns {HTMLElement}
 */
function buildNav(section) {
  const nav = document.createElement('nav');
  nav.className = 'footer-nav';
  nav.setAttribute('aria-label', 'Footer');
  let col = null;
  const newCol = () => {
    col = document.createElement('div');
    col.className = 'footer-col';
    nav.append(col);
    return col;
  };
  [...section.children].forEach((child) => {
    if (/^H[1-6]$/.test(child.tagName)) {
      newCol().append(child);
      child.className = 'footer-col-title';
    } else if (child.matches('ul, ol')) {
      if (!col || col.querySelector('ul, ol')) {
        newCol().classList.add('footer-col-untitled');
      }
      col.append(child);
    } else {
      (col || newCol()).append(child);
    }
  });
  return nav;
}

/**
 * Wraps content in a full-width band with a centred inner container.
 * @param {string} name band modifier
 * @param {Node[]} nodes
 * @returns {HTMLDivElement}
 */
function buildBand(name, nodes) {
  const band = document.createElement('div');
  band.className = `footer-band footer-band-${name}`;
  const inner = document.createElement('div');
  inner.className = 'footer-inner';
  inner.append(...nodes);
  band.append(inner);
  return band;
}

/**
 * loads and decorates the footer
 * @param {Element} block The footer block element
 */
export default async function decorate(block) {
  const fragment = await fetchFooterFragment();
  block.textContent = '';
  if (!fragment) return;

  const sections = [...fragment.querySelectorAll(':scope > div')];
  const [brandSection, navSection, ...legalSections] = sections;

  const mainNodes = [];
  if (brandSection) mainNodes.push(buildBrand(brandSection));
  if (navSection) mainNodes.push(buildNav(navSection));
  if (mainNodes.length) block.append(buildBand('main', mainNodes));

  const legalNodes = legalSections.flatMap((s) => [...s.children]);
  if (legalNodes.length) block.append(buildBand('legal', legalNodes));

  block.querySelectorAll('img').forEach((img) => {
    img.loading = 'lazy';
  });
  decorateLinks(block);
}
