import { createOptimizedPicture } from '../../scripts/aem.js';

/**
 * Columns (featured) — a featured story split into a text panel (heading,
 * paragraph, links) and an image. Panel/image placement follows authored
 * cell order (text | image is the default design).
 * Content contract: one row, cells = text | image. Extra rows render the same way.
 * Image-first rows (image | text) render as the source promo split (55/45, solid navy CTA).
 * Standalone links to other hosts or documents get the external-link glyph.
 * Options: dark (full-bleed image with a navy text panel over its left 40%, boxed CTA).
 * @param {Element} block
 */
const OPTION_CLASSES = ['dark'];
const SITE_HOSTS = ['aig.com', 'www.aig.com'];
const DOC_RE = /\.(pdf|mp3|mp4|webm|docx?|xlsx?|pptx?|zip)$/i;

/**
 * True for links the source marks with the external-link icon:
 * other hosts and downloadable documents/media.
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

export default function decorate(block) {
  const active = [...block.classList].filter((c) => OPTION_CLASSES.includes(c));

  [...block.children].forEach((row) => {
    row.classList.add('columns-featured-row');
    const cells = [...row.children];
    let imageFound = false;

    cells.forEach((cell) => {
      const pic = cell.querySelector('picture');
      if (pic && !imageFound && !cell.textContent.trim()) {
        imageFound = true;
        cell.classList.add('columns-featured-image');
      } else {
        cell.classList.add('columns-featured-body');
      }
    });

    if (!imageFound) row.classList.add('columns-featured-row-no-image');
    if (cells[0]?.classList.contains('columns-featured-image')) {
      row.classList.add('columns-featured-row-image-left');
    }

    // links that sit alone in a paragraph become a stacked link list
    row.querySelectorAll('.columns-featured-body p').forEach((p) => {
      const a = p.querySelector(':scope > a');
      if (a && p.textContent.trim() === a.textContent.trim()) {
        p.classList.add('columns-featured-link');
        if (isExternal(a)) a.classList.add('columns-featured-external');
      }
    });

    // dark: standalone links render as boxed CTA buttons
    if (active.includes('dark')) {
      row.querySelectorAll('.columns-featured-link > a').forEach((a) => a.classList.add('columns-featured-cta'));
    }
  });

  block.querySelectorAll('picture > img').forEach((img) => {
    img.closest('picture').replaceWith(
      createOptimizedPicture(img.src, img.alt || '', false, [
        { media: '(min-width: 900px)', width: '1200' },
        { width: '750' },
      ]),
    );
  });
}
