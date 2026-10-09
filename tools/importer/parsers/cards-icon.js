/* eslint-disable */
/* global WebImporter */
/**
 * Parser for cards-icon. Base: cards. Template: landing-section.
 * Sources: https://www.aig.com/home/careers/students-and-graduates, /home/careers,
 *   /home/risk-solutions/business/accident-and-health/aig-travel-protect
 * Selector: main .container.aig-carousel:has(.aig-productcard)
 * Source shape: slick carousel; each slide holds a .teaserflex.aig-productcard with an icon
 *   image (.cmp-teaser__image) and a short statement: .cmp-teaser__title (h3) and/or a
 *   .cmp-teaser__description (h3 label + p, or a single bold p), optional inline links / CTAs.
 * Output (blocks/cards-icon/README.md): one row per card, 2 cells: icon image | body
 *   (heading, text, optional link). Slick clones (.slick-cloned) and slick arrows/dots are skipped.
 * Items are keyed on the .aig-productcard teaser wrappers (block-level divs), not on anchors.
 */
function absUrl(href, document) {
  if (!href) return href;
  if (/^(mailto:|tel:|javascript:|#)/i.test(href)) return href;
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

// strip inline styles / tabindex, absolutize links, drop leading/trailing <br>s
function tidy(el, document) {
  [el, ...el.querySelectorAll('*')].forEach((n) => {
    n.removeAttribute('style');
    n.removeAttribute('tabindex');
    if (n.tagName === 'A' && n.getAttribute('href')) n.setAttribute('href', absUrl(n.getAttribute('href'), document));
  });
  const isBlank = (n) => n && ((n.nodeType === 3 && !n.textContent.trim()) || n.nodeName === 'BR');
  while (isBlank(el.firstChild)) el.firstChild.remove();
  while (isBlank(el.lastChild)) el.lastChild.remove();
  return el;
}

function bodyCell(teaser, document) {
  const out = [];
  const content = teaser.querySelector('.cmp-teaser__content') || teaser;
  const pre = content.querySelector('.cmp-teaser__pretitle');
  if (pre && clean(pre.textContent)) {
    const p = document.createElement('p');
    p.textContent = clean(pre.textContent);
    out.push(p);
  }
  const title = content.querySelector('.cmp-teaser__title');
  if (title && clean(title.textContent)) {
    const level = /^H[1-6]$/.test(title.tagName) ? title.tagName.toLowerCase() : 'h3';
    const h = document.createElement(level);
    const link = title.querySelector('a[href]');
    if (link) {
      const a = document.createElement('a');
      a.href = absUrl(link.getAttribute('href'), document);
      a.textContent = clean(title.textContent);
      h.append(a);
    } else {
      h.textContent = clean(title.textContent);
    }
    out.push(h);
  }
  const desc = content.querySelector('.cmp-teaser__description');
  if (desc) {
    const parts = [...desc.querySelectorAll(':scope > p, :scope > ul, :scope > ol, :scope > h2, :scope > h3, :scope > h4, :scope > h5, :scope > h6')]
      .filter((el) => clean(el.textContent));
    if (parts.length) parts.forEach((el) => out.push(tidy(el, document)));
    else if (clean(desc.textContent)) {
      const p = document.createElement('p');
      p.textContent = clean(desc.textContent);
      out.push(p);
    }
  }
  content.querySelectorAll('.cmp-teaser__action-link').forEach((a) => {
    const text = clean([...a.childNodes].filter((n) => !(n.nodeType === 1 && n.matches('.custom-icons'))).map((n) => n.textContent).join(''));
    if (!text) return;
    const p = document.createElement('p');
    const link = document.createElement('a');
    link.href = absUrl(a.getAttribute('href'), document);
    link.textContent = text;
    p.append(link);
    out.push(p);
  });
  return out;
}

export default function parse(element, { document }) {
  // Cards: product-card teasers outside slick clones (fallback: any teaser in a real slide)
  let items = [...element.querySelectorAll('.teaserflex.aig-productcard, .aig-productcard')]
    .filter((el) => !el.closest('.slick-cloned'))
    .filter((el, i, arr) => !arr.some((o) => o !== el && o.contains(el)));
  if (!items.length) {
    items = [...element.querySelectorAll('.slick-slide:not(.slick-cloned) .teaserflex')];
  }

  const cells = [];
  items.forEach((teaser) => {
    const img = teaser.querySelector('.cmp-teaser__image img, .cmp-image img, img');
    const body = bodyCell(teaser, document);
    if (!img && !body.length) return;
    if (img) img.setAttribute('src', absUrl(img.getAttribute('src'), document));
    cells.push([img || '', body.length ? body : '']);
  });

  if (!cells.length) {
    element.replaceWith(...element.childNodes);
    return;
  }

  const block = WebImporter.Blocks.createBlock(document, { name: 'cards-icon', cells });
  element.replaceWith(block);
}
