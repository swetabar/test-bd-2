/* eslint-disable */
/* global WebImporter */
/**
 * Parser for columns-quicklinks. Base: columns. Template: content-page.
 * Source: https://www.aig.com/home/risk-solutions/business/multinational
 * Selector: main .container.flexbox-container:has(> .cmp-container > .aem-Grid > .quick-links)
 * Output: 1 row, 2 cells:
 *   intro  = everything except the .quick-links panel (teaser/teaser2023 heading, paragraphs,
 *            lists incl. the "Show more" part; .videocomponent -> poster + video link;
 *            .download -> title + "Download PDF [size]" link)
 *   links  = Quick Links title heading + list of links (.cmp-list)
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
  const desc = content.querySelector(':scope > .cmp-teaser__description') || content.querySelector('.cmp-teaser__description');
  if (pre && clean(pre.textContent)) {
    if (!title && !desc) out.push(headingFrom(pre, 'h2', document));
    else {
      const p = document.createElement('p');
      p.textContent = clean(pre.textContent);
      out.push(p);
    }
  }
  if (title && clean(title.textContent)) out.push(headingFrom(title, 'h2', document));
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

function videoContent(video, out, document) {
  const poster = video.querySelector('.video_thumbnail img, img');
  if (poster) out.push(fixUrls(poster, document));
  const srcEl = video.querySelector('[data-src], video source[src], video[src], iframe[src]');
  const href = srcEl && (srcEl.getAttribute('data-src') || srcEl.getAttribute('src'));
  if (href) out.push(linkPara(href, 'Play Video', document));
  const timeEl = video.querySelector('[data-time]');
  if (timeEl && timeEl.getAttribute('data-time')) {
    const p = document.createElement('p');
    p.textContent = timeEl.getAttribute('data-time');
    out.push(p);
  }
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
    if (child.nodeType !== 1) return;
    if (child.matches('.videocomponent')) { videoContent(child, out, document); return; }
    if (child.matches(SKIP)) return;
    if (child.matches('.cmp-teaser')) { teaserContent(child, out, document); return; }
    if (child.matches('.cmp-download')) { downloadContent(child, out, document); return; }
    if (child.matches('.cmp-title')) {
      const h = child.querySelector('h1, h2, h3, h4, h5, h6');
      if (h) out.push(headingFrom(h, 'h2', document));
      return;
    }
    // Source quirk: headings/paragraphs that wrap block content (e.g. <h3><table>) -> unwrap
    if (child.matches('h1, h2, h3, h4, h5, h6, p') && child.querySelector('table, ul, ol, div, p')) {
      collect(child, out, document);
      return;
    }
    if (child.matches(BLOCKISH)) {
      // authored Show more/less toggle (<p><a href="#less-content">Show less</a></p>): the block adds its own
      const toggle = child.querySelector('a[href="#less-content"], a[href="#more-content"]');
      if (toggle && clean(toggle.textContent) === clean(child.textContent)) return;
      if (clean(child.textContent) || child.querySelector('img')) out.push(fixUrls(child, document));
      return;
    }
    if (child.matches('img')) { out.push(fixUrls(child, document)); return; }
    if (child.matches('picture')) {
      const img = child.querySelector('img');
      if (img) out.push(fixUrls(img, document));
      return;
    }
    if (child.matches('a[href]') && !child.querySelector('div, p, h1, h2, h3, h4, img')) {
      if (clean(child.textContent)) out.push(linkPara(child.getAttribute('href'), child.textContent, document));
      return;
    }
    collect(child, out, document);
  });
}

function buildLinksCell(panel, document) {
  const out = [];
  const titleEl = panel.querySelector('.cmp-title__text, .cmp-title h1, .cmp-title h2, .cmp-title h3, h2, h3');
  if (titleEl && clean(titleEl.textContent)) out.push(headingFrom(titleEl, 'h2', document));
  const items = [...panel.querySelectorAll('.cmp-list__item, .cmp-list > li')]
    .filter((li, i, arr) => arr.indexOf(li) === i);
  if (items.length) {
    const ul = document.createElement('ul');
    items.forEach((item) => {
      const link = item.querySelector('a[href]');
      const text = clean((item.querySelector('.cmp-list__item-title') || item).textContent);
      if (!text) return;
      const li = document.createElement('li');
      if (link) {
        const a = document.createElement('a');
        a.href = absUrl(link.getAttribute('href'), document);
        a.textContent = text;
        li.append(a);
      } else {
        li.textContent = text;
      }
      ul.append(li);
    });
    if (ul.children.length) out.push(ul);
  } else {
    // Fallback: any other content in the panel (links authored as text)
    const rest = [];
    collect(panel, rest, document);
    rest.filter((el) => !(titleEl && clean(el.textContent) === clean(titleEl.textContent))).forEach((el) => out.push(el));
  }
  return out;
}

export default function parse(element, { document }) {
  const grid = element.querySelector(':scope > .cmp-container > .aem-Grid') || element;
  const panel = grid.querySelector(':scope > .quick-links') || element.querySelector('.quick-links');

  const intro = [];
  [...grid.children].forEach((child) => {
    if (child === panel) return;
    collect(child.matches('.teaserflex, .teaser, .teaser2023') ? child : child, intro, document);
  });
  const links = panel ? buildLinksCell(panel, document) : [];

  if (!intro.length && !links.length) {
    element.replaceWith(...element.childNodes);
    return;
  }

  // Featured: intro side is a .stories container (section title + one story teaser card),
  // e.g. https://www.aig.com/home/newsroom -> h2 title, image, h3 (linked) heading, text, CTA
  const featured = !!grid.querySelector(':scope > .stories');

  const cells = [[intro.length ? intro : '', links.length ? links : '']];
  const block = WebImporter.Blocks.createBlock(document, {
    name: 'columns-quicklinks',
    variants: featured ? ['featured'] : [],
    cells,
  });
  element.replaceWith(block);
}
