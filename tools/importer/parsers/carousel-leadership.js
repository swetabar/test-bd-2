/* eslint-disable */
/* global WebImporter */
/**
 * Parser for carousel-leadership. Base: carousel. Template: content-page.
 * Source: https://www.aig.com/home/about/leadership-and-governance/chris-schaper
 * Selector: main .aig-photo-panel-container .container.aig-carousel
 * Source shape: slick carousel; each slide holds .image.aig-photo-panel > .cmp-image
 *   (a.cmp-image__link > img, span.cmp-image__title = person name).
 * Output: one row per person: portrait image | name linked to the bio page.
 * Slick clones (.slick-cloned) are skipped; iteration is keyed on the block-level
 * .image.aig-photo-panel wrapper, never on the anchors. The current person is derived from
 * the URL by the block, so no marker is authored.
 */
function absUrl(href, document) {
  if (!href) return href;
  try {
    const base = document.location && document.location.href !== 'about:blank'
      ? document.location.href : 'https://www.aig.com/home';
    return new URL(href, base).href;
  } catch (e) {
    return href;
  }
}

function clean(text) {
  return (text || '').replace(/\s+/g, ' ').trim();
}

export default function parse(element, { document }) {
  let items = [...element.querySelectorAll('.image.aig-photo-panel, .aig-photo-panel')]
    .filter((el) => !el.closest('.slick-cloned'))
    .filter((el, i, arr) => !arr.some((o) => o !== el && o.contains(el)));
  if (!items.length) {
    items = [...element.querySelectorAll('.cmp-image')].filter((el) => !el.closest('.slick-cloned'));
  }

  const seen = new Set();
  const cells = [];
  items.forEach((item) => {
    const img = item.querySelector('img');
    const link = item.querySelector('a.cmp-image__link[href], a[href]');
    const name = clean((item.querySelector('.cmp-image__title') || {}).textContent)
      || (img && clean(img.getAttribute('alt')))
      || clean((item.querySelector('[data-title]') || {}).getAttribute?.('data-title'));
    const href = link ? absUrl(link.getAttribute('href'), document) : '';
    const key = `${href}|${name}`;
    if (seen.has(key)) return; // guard against duplicated slides
    seen.add(key);
    if (!img && !name) return;

    if (img) img.setAttribute('src', absUrl(img.getAttribute('src'), document));
    let nameCell = '';
    if (name) {
      const p = document.createElement('p');
      if (href) {
        const a = document.createElement('a');
        a.href = href;
        a.textContent = name;
        p.append(a);
      } else {
        p.textContent = name;
      }
      nameCell = p;
    }
    cells.push([img || '', nameCell]);
  });

  if (!cells.length) {
    element.replaceWith(...element.childNodes);
    return;
  }

  const block = WebImporter.Blocks.createBlock(document, { name: 'carousel-leadership', cells });
  element.replaceWith(block);
}
