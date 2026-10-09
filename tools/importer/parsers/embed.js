/* eslint-disable */
/* global WebImporter */
/**
 * Parser for embed. Base: embed. Template: content-page.
 * Source: https://www.aig.com/home/investor-relations/sec-filings
 * Selector: main .embed:not(.accordion *)
 * Source shape: .cmp-embed > .iframe-block > iframe[src] (investor-relations widgets, news feeds),
 *   or an embedded HTML snippet / URL embed.
 * Output (1 column, 1 row): optional heading/text shown above, then a link to the embed URL.
 * The iframe is replaced by the link here because the cleanup transformer removes iframes after
 * parsing. Inline <script> embeds without a URL have nothing authorable and are unwrapped.
 * Only the .embed element itself is replaced: content sharing its container stays in place as
 * default content (landing /home/investor-relations: the current-stock-price iframe sits in the
 * .lightblue container next to .upcoming-events "Upcoming Events" - kept after the block).
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
  const iframe = element.querySelector('iframe[src], iframe[data-src]');
  const urlEl = element.querySelector('[data-cmp-embed-url], [data-url], a[href]');
  let src = iframe && (iframe.getAttribute('src') || iframe.getAttribute('data-src'));
  if (!src && urlEl) src = urlEl.getAttribute('data-cmp-embed-url') || urlEl.getAttribute('data-url') || urlEl.getAttribute('href');

  const content = [];
  // Optional heading / text authored around the iframe (not the iframe fallback text)
  element.querySelectorAll('h1, h2, h3, h4, h5, h6, p').forEach((el) => {
    if (iframe && iframe.contains(el)) return;
    if (!clean(el.textContent)) return;
    if (el.querySelector('iframe')) return;
    content.push(el);
  });

  if (!src) {
    if (!content.length) {
      element.replaceWith(...element.childNodes);
      return;
    }
  } else {
    const p = document.createElement('p');
    const a = document.createElement('a');
    a.href = absUrl(src, document);
    a.textContent = absUrl(src, document);
    p.append(a);
    content.push(p);
  }

  const block = WebImporter.Blocks.createBlock(document, { name: 'embed', cells: [[content]] });
  element.replaceWith(block);
}
