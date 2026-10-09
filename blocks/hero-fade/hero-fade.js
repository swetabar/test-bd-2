import { createOptimizedPicture } from '../../scripts/aem.js';

const SITE_HOSTS = ['aig.com', 'www.aig.com'];
const DOC_RE = /\.(pdf|mp3|mp4|webm|docx?|xlsx?|pptx?|zip)$/i;

/**
 * True for links the source marks with the external-link icon: other hosts and documents.
 * @param {HTMLAnchorElement} a
 */
function isExternal(a) {
  try {
    const url = new URL(a.href, window.location.href);
    if (DOC_RE.test(url.pathname)) return true;
    return url.hostname !== window.location.hostname && !SITE_HOSTS.includes(url.hostname);
  } catch {
    return false;
  }
}

/**
 * Turns a leading list of links into a breadcrumb nav (same convention as hero-banner).
 * @param {Element} content
 * @returns {HTMLElement|null}
 */
function extractBreadcrumbs(content) {
  const list = content.firstElementChild;
  if (!list || !list.matches('ul, ol') || !list.querySelector(':scope > li a[href]')) return null;
  const nav = document.createElement('nav');
  nav.className = 'hero-fade-breadcrumbs';
  nav.setAttribute('aria-label', 'Breadcrumb');
  const ol = document.createElement('ol');
  ol.append(...list.children);
  if (ol.lastElementChild) ol.lastElementChild.setAttribute('aria-current', 'page');
  nav.append(ol);
  list.remove();
  return nav;
}

/**
 * Hero (fade) — full-bleed banner with a background image anchored to the
 * right and heading / text / CTA content on the left.
 * Content contract: row 1 = background image, row 2 = heading, paragraph, CTA.
 * Tolerates the image and text being in the same row or in either order.
 * When the content starts with a list (ul/ol) of links, it is rendered as a breadcrumb
 * trail above the heading (last item = current page; a "Home" link shows a house icon).
 * @param {Element} block
 */
export default function decorate(block) {
  const pictures = [...block.querySelectorAll('picture')];
  const picture = pictures[0];

  const media = document.createElement('div');
  media.className = 'hero-fade-media';
  if (picture) {
    const img = picture.querySelector('img');
    const optimized = img
      ? createOptimizedPicture(img.src, img.alt || '', true, [
        { media: '(min-width: 900px)', width: '2000' },
        { width: '900' },
      ])
      : picture;
    media.append(optimized);
    // eager-load: hero is above the fold
    const optImg = optimized.querySelector('img');
    if (optImg) optImg.loading = 'eager';
  }

  const content = document.createElement('div');
  content.className = 'hero-fade-content';
  [...block.children].forEach((row) => {
    [...row.children].forEach((cell) => {
      // drop the cell that only held the background picture
      if (picture && cell.contains(picture)) {
        picture.remove();
        if (!cell.textContent.trim() && !cell.querySelector('img, picture')) return;
      }
      while (cell.firstChild) content.append(cell.firstChild);
    });
  });

  // drop empty paragraphs left behind by authoring
  content.querySelectorAll('p').forEach((p) => {
    if (!p.textContent.trim() && !p.querySelector('img, picture')) p.remove();
  });

  // last link-only paragraph becomes the CTA wrapper
  const links = content.querySelectorAll('a');
  links.forEach((a) => {
    const p = a.closest('p');
    if (p && p.textContent.trim() === a.textContent.trim()) p.classList.add('hero-fade-cta');
  });

  const breadcrumbs = extractBreadcrumbs(content);

  const inner = document.createElement('div');
  inner.className = 'hero-fade-inner';
  if (breadcrumbs) {
    inner.append(breadcrumbs);
    block.classList.add('hero-fade-has-breadcrumbs');
    // landing-page heroes: off-site CTAs get the external-link glyph, as on the source
    content.querySelectorAll('.hero-fade-cta > a[href]').forEach((a) => {
      // document links render as the source PDF download button (file icon, size line)
      if (/\.pdf($|[?#])/i.test(a.getAttribute('href'))) {
        a.classList.add('hero-fade-pdf');
        return;
      }
      if (!isExternal(a)) return;
      const icon = document.createElement('span');
      icon.className = 'hero-fade-icon-external';
      icon.setAttribute('aria-hidden', 'true');
      icon.textContent = 'external_link';
      a.append(icon);
      a.classList.add('hero-fade-external');
    });
  }
  inner.append(content);

  block.replaceChildren(media, inner);
  if (!picture) block.classList.add('hero-fade-no-image');
}
