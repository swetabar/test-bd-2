/* eslint-disable */
/* global WebImporter */
/**
 * Parser for columns (leadership bio split). Base: columns. Template: content-page.
 * Source: https://www.aig.com/home/about/leadership-and-governance/chris-schaper
 * Selector: main .container.aig-bio-block
 * Source shape: .thirdwidth (portrait teaser image) + .two-thirdwidth (teaser: pretitle = person name,
 *   h1 = job title, description = bio paragraphs).
 * Output: 1 row, 2 cells: portrait image | name paragraph, h1 title, bio paragraphs/lists, links.
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

export default function parse(element, { document }) {
  const grid = element.querySelector(':scope > .cmp-container > .aem-Grid') || element;
  const imageCol = grid.querySelector(':scope > .thirdwidth') || grid.firstElementChild;
  const textCol = grid.querySelector(':scope > .two-thirdwidth')
    || [...grid.children].find((c) => c !== imageCol);

  // Portrait
  const img = (imageCol && imageCol.querySelector('.cmp-teaser__image img, .cmp-image img, img'))
    || element.querySelector('img');
  if (img) fixUrls(img, document);

  // Bio text
  const text = [];
  if (textCol) {
    textCol.querySelectorAll('.cmp-teaser__content').forEach((content) => {
      const pre = content.querySelector('.cmp-teaser__pretitle');
      if (pre && clean(pre.textContent)) {
        const p = document.createElement('p');
        p.textContent = clean(pre.textContent);
        text.push(p);
      }
      const title = content.querySelector('.cmp-teaser__title');
      if (title && clean(title.textContent)) {
        const level = /^H[1-6]$/.test(title.tagName) ? title.tagName.toLowerCase() : 'h1';
        const h = document.createElement(level);
        h.textContent = clean(title.textContent);
        text.push(h);
      }
      const desc = content.querySelector('.cmp-teaser__description');
      if (desc) {
        const parts = [...desc.querySelectorAll(':scope > p, :scope > ul, :scope > ol, :scope > h2, :scope > h3, :scope > h4, :scope > blockquote')]
          .filter((el) => clean(el.textContent));
        if (parts.length) parts.forEach((el) => text.push(fixUrls(el, document)));
        else if (clean(desc.textContent)) {
          const p = document.createElement('p');
          p.textContent = clean(desc.textContent);
          text.push(p);
        }
      }
      content.querySelectorAll('.cmp-teaser__action-link').forEach((a) => {
        const p = document.createElement('p');
        const link = document.createElement('a');
        link.href = absUrl(a.getAttribute('href'), document);
        link.textContent = clean(a.textContent);
        p.append(link);
        text.push(p);
      });
    });
    // Non-teaser text components (rare)
    textCol.querySelectorAll('.cmp-text > *').forEach((el) => {
      if (clean(el.textContent)) text.push(fixUrls(el, document));
    });
  }

  if (!img && !text.length) {
    element.replaceWith(...element.childNodes);
    return;
  }

  const cells = [[img || '', text.length ? text : '']];
  const block = WebImporter.Blocks.createBlock(document, { name: 'columns', cells });
  element.replaceWith(block);
}
