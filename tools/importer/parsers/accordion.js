/* eslint-disable */
/* global WebImporter */
/**
 * Parser for accordion. Base: accordion. Template: content-page.
 * Source: https://www.aig.com/home/risk-solutions/business/multinational
 * Selector: main .accordion.panelcontainer:not(.cmp-tabs *)
 * Output: one row per .cmp-accordion__item: label (.cmp-accordion__title text) | body (panel content).
 * Option "highlight": a single item whose panel holds a PDF viewer (.pdfviewer / .accordion_pdf_icon /
 *   .pdf-icon). The PDF viewer (an iframe at runtime) is replaced by a link to the PDF.
 * Panel content is flattened to authorable rich text: teasers -> heading/paragraphs/lists/CTA links,
 *   .download items -> title + "Download PDF [size]" link, tables/lists/images kept, contact cards kept as text.
 * Option "cards": panels contain .aig-contact-card teasers (landing /home/contact) -> one h3-led
 *   group per contact card (see contactCards).
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

function fixUrls(el, document) {
  const all = el.matches && el.matches('a[href], img[src]') ? [el] : [];
  all.push(...el.querySelectorAll('a[href], img[src]'));
  all.forEach((n) => {
    if (n.tagName === 'A') n.setAttribute('href', absUrl(n.getAttribute('href'), document));
    else n.setAttribute('src', absUrl(n.getAttribute('src'), document));
  });
  return el;
}

function linkPara(href, text, document) {
  const p = document.createElement('p');
  const a = document.createElement('a');
  a.href = absUrl(href, document);
  a.textContent = clean(text) || href;
  p.append(a);
  return p;
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

function teaserContent(teaser, out, document) {
  const img = teaser.querySelector('.cmp-teaser__image img');
  if (img) out.push(fixUrls(img, document));
  const content = teaser.querySelector('.cmp-teaser__content') || teaser;
  const pre = content.querySelector('.cmp-teaser__pretitle');
  const title = content.querySelector('.cmp-teaser__title');
  const desc = content.querySelector('.cmp-teaser__description');
  if (pre && clean(pre.textContent)) {
    if (!title && !desc) out.push(headingFrom(pre, 'h2', document));
    else {
      const p = document.createElement('p');
      p.textContent = clean(pre.textContent);
      out.push(p);
    }
  }
  if (title && clean(title.textContent)) out.push(headingFrom(title, 'h3', document));
  if (desc) collect(desc, out, document);
  content.querySelectorAll('.cmp-teaser__action-link').forEach((a) => {
    out.push(linkPara(a.getAttribute('href'), a.textContent, document));
  });
}

function downloadContent(dl, out, document) {
  const action = dl.querySelector('a.cmp-download__action');
  const titleLink = dl.querySelector('.cmp-download__title a[href], .cmp-download__title-link');
  const label = clean((dl.querySelector('.cmp-download__action-text') || {}).textContent)
    || clean((dl.querySelector('.cmp-download__property--filename .cmp-download__property-content') || {}).textContent);
  if (label) {
    const p = document.createElement('p');
    p.textContent = label;
    out.push(p);
  }
  const href = (titleLink && titleLink.getAttribute('href')) || (action && action.getAttribute('href'));
  if (href) out.push(linkPara(href, titleLink ? titleLink.textContent : 'Download PDF', document));
}

function pdfContent(viewer, out, document) {
  const dl = viewer.querySelector('a#downloadPDF, a[download], a[href$=".pdf"]');
  const href = viewer.getAttribute('data-cmp-document-path')
    || (dl && dl.getAttribute('href'))
    || (viewer.querySelector('iframe[src]') && viewer.querySelector('iframe[src]').getAttribute('src'));
  if (!href) return;
  const name = viewer.getAttribute('data-cmp-document-file-name') || '';
  out.push(linkPara(href, (dl && clean(dl.textContent)) ? `${clean(dl.textContent)} ${name}`.trim() : (name || 'View PDF'), document));
}

const SKIP = 'script, style, noscript, dialog, button, .video-popup, .action-teaser-more, .action-teaser-less, .cmp-download__properties, meta, link';
const BLOCKISH = 'p, ul, ol, h1, h2, h3, h4, h5, h6, table, blockquote, pre';

function collect(node, out, document) {
  [...node.childNodes].forEach((child) => {
    if (child.nodeType === 3) {
      if (clean(child.textContent)) {
        const p = document.createElement('p');
        p.textContent = clean(child.textContent);
        out.push(p);
      }
      return;
    }
    if (child.nodeType !== 1 || child.matches(SKIP)) return;
    if (child.matches('.cmp-teaser')) { teaserContent(child, out, document); return; }
    if (child.matches('.cmp-download')) { downloadContent(child, out, document); return; }
    if (child.matches('.cmp-pdfviewer')) { pdfContent(child, out, document); return; }
    if (child.matches('.cmp-accordion__header')) { out.push(headingFrom(child, 'h3', document)); return; }
    if (child.matches('.cmp-title')) {
      const h = child.querySelector('h1, h2, h3, h4, h5, h6');
      if (h) out.push(headingFrom(h, 'h3', document));
      return;
    }
    // Source quirk: headings/paragraphs that wrap block content (e.g. <h3><table>) -> unwrap
    if (child.matches('h1, h2, h3, h4, h5, h6, p') && child.querySelector('table, ul, ol, div, p')) {
      collect(child, out, document);
      return;
    }
    if (child.matches(BLOCKISH)) {
      if (clean(child.textContent) || child.querySelector('img')) out.push(fixUrls(child, document));
      return;
    }
    if (child.matches('img')) { out.push(fixUrls(child, document)); return; }
    if (child.matches('picture')) {
      const img = child.querySelector('img');
      if (img) out.push(fixUrls(img, document));
      return;
    }
    if (child.matches('iframe[src]')) { out.push(linkPara(child.getAttribute('src'), child.getAttribute('title') || child.getAttribute('src'), document)); return; }
    if (child.matches('a[href]') && !child.querySelector('div, p, h1, h2, h3, h4, img')) {
      if (clean(child.textContent)) out.push(linkPara(child.getAttribute('href'), child.textContent, document));
      return;
    }
    if (child.matches('span, strong, em, b, i') && !child.querySelector('div, p')) {
      if (clean(child.textContent)) {
        const p = document.createElement('p');
        p.append(fixUrls(child, document));
        out.push(p);
      }
      return;
    }
    collect(child, out, document);
  });
}

/**
 * Option "cards" (landing-section /home/contact): panels hold .aig-contact-card teasers. Each card
 * becomes one h3-led group so the block's cards option starts a new card at every h3:
 *   h3 = the card's first line (a sole link stays a linked title, e.g. "AIG Travel"; a lead
 *        heading such as "Discover your potential..." is re-levelled; a link-only card uses its
 *        first link), then the remaining lines (labels, phone / e-mail lines, links).
 * Decorative icon images (icon_telephone / icon_email, alt="") and &nbsp; spacer paragraphs are
 * dropped; repeated CTA links are emitted once.
 */
function isIcon(img) {
  return !clean(img.getAttribute('alt')) && /\/icons?\/|icon[_-]/i.test(img.getAttribute('src') || '');
}

function contactCards(panel, out, document) {
  const cards = [...panel.querySelectorAll('.aig-contact-card')]
    .filter((c, i, arr) => !arr.some((o) => o !== c && o.contains(c)));
  cards.forEach((card) => {
    const nodes = [];
    collect(card, nodes, document);
    const seen = new Set();
    const lines = [];
    nodes.forEach((n) => {
      if (n.matches('img') && isIcon(n)) return;
      n.querySelectorAll('img').forEach((img) => { if (isIcon(img)) img.remove(); });
      const walker = document.createTreeWalker(n, 4);
      while (walker.nextNode()) walker.currentNode.textContent = walker.currentNode.textContent.replace(/\u00a0/g, ' ');
      if (!clean(n.textContent) && !n.querySelector('img') && !n.matches('img')) return;
      const sole = n.querySelector('a[href]');
      const key = sole && clean(sole.textContent) === clean(n.textContent) ? `link:${sole.getAttribute('href')}` : null;
      if (key && seen.has(key)) return;
      if (key) seen.add(key);
      lines.push(n);
    });
    if (!lines.length) return;
    const [first, ...rest] = lines;
    const h3 = document.createElement('h3');
    const link = first.matches('a[href]') ? first : first.querySelector('a[href]');
    if (link && clean(link.textContent) === clean(first.textContent)) {
      const a = document.createElement('a');
      a.href = absUrl(link.getAttribute('href'), document);
      a.textContent = clean(link.textContent);
      h3.append(a);
    } else {
      h3.textContent = clean(first.textContent);
    }
    out.push(h3, ...rest);
  });
}

// Pages whose contact-card accordions use the Cards option (block mapping option hint for the
// landing-section template). Content-page accordions with .aig-contact-card teasers (e.g.
// /home/newsroom/media-contacts) are already migrated as a plain Accordion and must stay so.
const CARDS_OPTION_PATHS = [/^\/home\/contact\/?$/];

function pagePath(url, params, document) {
  const raw = (params && params.originalURL) || url
    || (document.location && document.location.href !== 'about:blank' ? document.location.href : '');
  try {
    return new URL(raw).pathname.replace(/\.html?$/, '');
  } catch (e) {
    return '';
  }
}

export default function parse(element, { document, url, params }) {
  const items = [...element.querySelectorAll('.cmp-accordion__item')]
    .filter((item) => item.closest('.accordion.panelcontainer') === element || item.closest('.cmp-accordion') === element.querySelector('.cmp-accordion'));

  const isHighlight = items.length === 1 && !!element.querySelector(
    '.cmp-accordion__title.accordion_pdf_icon, .accordion_pdf_icon, .pdfviewer, .cmp-pdfviewer, .pdf-icon',
  );

  const isCards = !isHighlight && !!element.querySelector('.cmp-accordion__panel .aig-contact-card')
    && CARDS_OPTION_PATHS.some((re) => re.test(pagePath(url, params, document)));

  const cells = [];
  items.forEach((item) => {
    const titleEl = item.querySelector(':scope > .cmp-accordion__header .cmp-accordion__title')
      || item.querySelector(':scope > .cmp-accordion__header')
      || item.querySelector('.cmp-accordion__title');
    const label = clean(titleEl && titleEl.textContent);
    const panel = item.querySelector(':scope > .cmp-accordion__panel') || item.querySelector('.cmp-accordion__panel');
    const body = [];
    if (panel && isCards && panel.querySelector('.aig-contact-card')) contactCards(panel, body, document);
    else if (panel) collect(panel, body, document);
    if (!label && !body.length) return;
    cells.push([label, body.length ? body : '']);
  });

  if (!cells.length) {
    element.replaceWith(...element.childNodes);
    return;
  }

  const block = WebImporter.Blocks.createBlock(document, {
    name: isHighlight ? 'Accordion (highlight)' : (isCards ? 'Accordion (cards)' : 'Accordion'),
    cells,
  });
  element.replaceWith(block);
}
