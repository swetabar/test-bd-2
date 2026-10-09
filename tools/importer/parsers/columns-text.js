/* eslint-disable */
/* global WebImporter */
/**
 * Parser for columns-text. Base: columns. Template: content-page.
 * Source: https://www.aig.com/home/risk-solutions/business/multinational
 * Selectors:
 *   main .container.aig-carousel:not(.aig-photo-panel-container *)   (slick carousel of teasers)
 *   main .container.aig-carousel-v2                                  (product cards)
 *   main .container.aig-column-grid ... (.teaserflex + .teaserflex)  (2-3 text columns)
 * Output: one row, one cell per item (teaser: optional icon image, pretitle, heading, description,
 *   CTA links). Slick clones (.slick-cloned) are skipped.
 * Option "glance": items are .aig-productcard / .aig-infographic-card, or the container is .aig-carousel-v2.
 * .title components inside the container (not part of an item) are emitted as default content
 * before the block.
 *
 * Landing-section additions (https://www.aig.com/home/about, /home/risk-solutions/why-aig, ...):
 *   - glance also when the band around the carousel (parent container) has an inline
 *     background-image on its .cmp-container AND a .title.whiteheading heading ("At a Glance"
 *     bands; items may be .aig-article-card without img/links or image-only stat teasers).
 *     The band's background image is then emitted as a FIRST single-cell image row (section
 *     background, see blocks/columns-text/README.md).
 *   - option "narrow": .aig-carousel without .aig-carousel-3-col, 4+ text-only items, not glance.
 *   - .aig-productcard carousels are cards-icon on landing pages (excluded by the landing selector).
 *   These additions only apply on pages with the fade hero (.hero-banner-with-fade, or its already
 *   converted "Hero Fade" table): content-page (hero-banner) bands look identical in the DOM, and
 *   their imported output is kept unchanged.
 */
function isFadeHeroPage(document) {
  if (document.querySelector('.container.hero-banner-with-fade')) return true;
  return [...document.querySelectorAll('table tr:first-child > th, table tr:first-child > td')]
    .some((c) => /^hero[\s-]?fade\b/i.test(c.textContent.trim()));
}

// CSS url() values on aig.com are escaped: url(\2f content\2f dam\2f ...)
function cssUrl(style) {
  const m = (style || '').match(/background-image\s*:\s*url\(\s*(['"]?)(.*?)\1\s*\)/i);
  if (!m) return null;
  return m[2].replace(/\\([0-9a-fA-F]{1,6})\s?/g, (_, hex) => String.fromCodePoint(parseInt(hex, 16)))
    .replace(/\\(.)/g, '$1').trim() || null;
}

// "At a Glance" band: parent container with inline background image + .title.whiteheading
function glanceBand(element) {
  const band = element.parentElement && element.parentElement.closest('.container');
  if (!band) return null;
  const cmp = band.querySelector(':scope > .cmp-container');
  const src = cmp && cssUrl(cmp.getAttribute('style'));
  if (!src) return null;
  const grid = cmp.querySelector(':scope > .aem-Grid') || cmp;
  if (!grid.querySelector(':scope > .title.whiteheading')) return null;
  return { src };
}
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

function fixUrls(el, document) {
  const all = el.matches && el.matches('a[href], img[src]') ? [el] : [];
  all.push(...el.querySelectorAll('a[href], img[src]'));
  all.forEach((n) => {
    if (n.tagName === 'A') n.setAttribute('href', absUrl(n.getAttribute('href'), document));
    else n.setAttribute('src', absUrl(n.getAttribute('src'), document));
  });
  return el;
}

function headingFrom(el, fallbackLevel, document) {
  const level = /^H[1-6]$/.test(el.tagName) ? el.tagName.toLowerCase() : fallbackLevel;
  const h = document.createElement(level);
  const link = el.querySelector('a[href]');
  if (link && clean(link.textContent) === clean(el.textContent)) {
    const a = document.createElement('a');
    a.href = absUrl(link.getAttribute('href'), document);
    a.textContent = clean(el.textContent);
    h.append(a);
  } else {
    h.textContent = clean(el.textContent);
  }
  return h;
}

function itemContent(item, document) {
  const out = [];
  const img = item.querySelector('.cmp-teaser__image img, .cmp-image img');
  if (img) out.push(fixUrls(img, document));
  const content = item.querySelector('.cmp-teaser__content') || item;
  const pre = content.querySelector('.cmp-teaser__pretitle');
  if (pre && clean(pre.textContent)) {
    const p = document.createElement('p');
    p.textContent = clean(pre.textContent);
    out.push(p);
  }
  const title = content.querySelector('.cmp-teaser__title');
  if (title && clean(title.textContent)) out.push(headingFrom(title, 'h3', document));
  const desc = content.querySelector('.cmp-teaser__description');
  if (desc) {
    const parts = [...desc.querySelectorAll(':scope > p, :scope > ul, :scope > ol, :scope > h2, :scope > h3, :scope > h4, :scope > h5, :scope > table')]
      .filter((el) => clean(el.textContent) || el.querySelector('img'));
    if (parts.length) parts.forEach((el) => out.push(fixUrls(el, document)));
    else if (clean(desc.textContent)) {
      const p = document.createElement('p');
      p.textContent = clean(desc.textContent);
      out.push(p);
    }
  }
  content.querySelectorAll('.cmp-teaser__action-link').forEach((a) => {
    const p = document.createElement('p');
    const link = document.createElement('a');
    link.href = absUrl(a.getAttribute('href'), document);
    link.textContent = clean(a.textContent);
    p.append(link);
    out.push(p);
  });
  if (!out.length && clean(item.textContent)) {
    const p = document.createElement('p');
    p.textContent = clean(item.textContent);
    out.push(p);
  }
  return out;
}

export default function parse(element, { document }) {
  // Items: teasers that are not slick clones and not nested in another teaser
  let items = [...element.querySelectorAll('.teaserflex, .aig-infographic-card')]
    .filter((el) => !el.closest('.slick-cloned'))
    .filter((el, i, arr) => !arr.some((o) => o !== el && o.contains(el)));
  if (!items.length) {
    items = [...element.querySelectorAll('.slick-slide:not(.slick-cloned)')];
  }

  const fadeHeroPage = isFadeHeroPage(document);
  const band = fadeHeroPage ? glanceBand(element) : null;
  const isGlance = element.classList.contains('aig-carousel-v2')
    || items.some((el) => el.matches('.aig-productcard, .aig-infographic-card'))
    || !!band;
  const isNarrow = fadeHeroPage && !isGlance
    && element.matches('.aig-carousel:not(.aig-carousel-3-col)')
    && items.length >= 4
    && !items.some((el) => el.querySelector('img'));

  // .title components outside the items -> default content before the block
  const leading = [...element.querySelectorAll('.title .cmp-title__text, .title h1, .title h2, .title h3')]
    .filter((h) => !h.closest('.slick-cloned') && !items.some((it) => it.contains(h)))
    .filter((h, i, arr) => arr.findIndex((o) => o.closest('.title') === h.closest('.title')) === i)
    .map((h) => headingFrom(h, 'h2', document));

  // Fade-hero pages: drop icon-font glyph names (<span class="custom-icons">external_link</span>)
  // from links (content-page output keeps its existing text).
  if (fadeHeroPage) items.forEach((item) => item.querySelectorAll('.custom-icons').forEach((s) => s.remove()));

  const row = items.map((item) => itemContent(item, document)).filter((c) => c.length);

  if (!row.length) {
    element.replaceWith(...element.childNodes);
    return;
  }

  const cells = [];
  if (band) {
    // Section background: first row, single cell, image only
    const bg = document.createElement('img');
    bg.setAttribute('src', absUrl(band.src, document));
    bg.setAttribute('alt', '');
    cells.push([bg]);
  }
  cells.push(row);

  let name = 'Columns Text';
  if (isGlance) name = 'Columns Text (glance)';
  else if (isNarrow) name = 'Columns Text (narrow)';
  const block = WebImporter.Blocks.createBlock(document, { name, cells });
  element.replaceWith(...leading, block);
}
