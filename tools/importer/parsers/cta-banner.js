/* eslint-disable */
/* global WebImporter */
/**
 * Parser for cta-banner. Base: hero. Template: content-page.
 * Source: https://www.aig.com/home/risk-solutions/business/multinational
 * Selector: main .container.coreblue .container.flexbox-container.vert-center:has(> .cmp-container > .aem-Grid > .quarterwidth)
 * Source shape: .threequarterwidth teaser (h2 title + description) + .quarterwidth teaser (.white-border CTA link).
 * Output (1 column, 1 row): heading, supporting paragraph(s), CTA link paragraph(s).
 *   Optional background image gets its own first row.
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
  const content = [];
  let bgImage = null;

  const teasers = [...element.querySelectorAll('.cmp-teaser')];
  teasers.forEach((teaser) => {
    const img = teaser.querySelector('.cmp-teaser__image img');
    if (img && !bgImage) bgImage = fixUrls(img, document);
    const body = teaser.querySelector('.cmp-teaser__content') || teaser;
    const title = body.querySelector('.cmp-teaser__title');
    if (title && clean(title.textContent)) {
      const level = /^H[1-6]$/.test(title.tagName) ? title.tagName.toLowerCase() : 'h2';
      const h = document.createElement(level);
      h.textContent = clean(title.textContent);
      content.push(h);
    }
    const desc = body.querySelector('.cmp-teaser__description');
    if (desc) {
      const parts = [...desc.querySelectorAll(':scope > p, :scope > ul, :scope > ol, :scope > h3, :scope > h4')]
        .filter((el) => clean(el.textContent));
      if (parts.length) {
        parts.forEach((el) => {
          // normalise link-only paragraphs (CTA) so the block's CTA detection matches
          const links = [...el.querySelectorAll('a[href]')];
          if (el.tagName === 'P' && links.length && clean(links.map((a) => a.textContent).join(' ')) === clean(el.textContent)) {
            const p = document.createElement('p');
            links.forEach((a) => {
              const link = document.createElement('a');
              link.href = absUrl(a.getAttribute('href'), document);
              link.textContent = clean(a.textContent);
              p.append(link);
            });
            content.push(p);
          } else {
            content.push(fixUrls(el, document));
          }
        });
      } else if (clean(desc.textContent)) {
        const p = document.createElement('p');
        p.textContent = clean(desc.textContent);
        content.push(p);
      }
    }
    body.querySelectorAll('.cmp-teaser__action-link').forEach((a) => {
      const p = document.createElement('p');
      const link = document.createElement('a');
      link.href = absUrl(a.getAttribute('href'), document);
      link.textContent = clean(a.textContent);
      p.append(link);
      content.push(p);
    });
  });

  if (!teasers.length) {
    // Fallback: plain headings/paragraphs/links in the band
    element.querySelectorAll('h1, h2, h3, p').forEach((el) => {
      if (clean(el.textContent)) content.push(fixUrls(el, document));
    });
  }

  if (!content.length && !bgImage) {
    element.replaceWith(...element.childNodes);
    return;
  }

  const cells = [];
  if (bgImage) cells.push([bgImage]);
  cells.push([content]);
  const block = WebImporter.Blocks.createBlock(document, { name: 'cta-banner', cells });
  element.replaceWith(block);
}
