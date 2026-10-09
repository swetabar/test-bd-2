/* eslint-disable */
/* global WebImporter */
/**
 * Parser for breadcrumbs. Base: breadcrumbs. Template: content-page.
 * Source: https://www.aig.com/home/about/leadership-and-governance/chris-schaper
 * Selector: main > .aem-Grid > .breadcrumb   (standalone trail on leadership bio pages)
 * Output (1 column, 1 row): a list of links, home first; the last item (current page,
 *   href="#" on the source) is plain text.
 */
function absUrl(href, document) {
  try {
    const base = document.location && document.location.href !== 'about:blank'
      ? document.location.href : 'https://www.aig.com/home';
    return new URL(href, base).href;
  } catch (e) {
    return href;
  }
}

export default function parse(element, { document }) {
  const list = element.querySelector('.cmp-breadcrumb__list, ol, ul');
  const items = list ? [...list.querySelectorAll('li')].filter((li, i, arr) => !arr.some((o) => o !== li && o.contains(li))) : [];

  const ul = document.createElement('ul');
  items.forEach((item, i) => {
    const text = item.textContent.replace(/\s+/g, ' ').trim();
    if (!text) return;
    const li = document.createElement('li');
    const link = item.querySelector('a[href]');
    const href = link && link.getAttribute('href');
    const isCurrent = item.classList.contains('cmp-breadcrumb__item--active') || i === items.length - 1;
    if (link && href && href !== '#' && !isCurrent) {
      const a = document.createElement('a');
      a.href = absUrl(href, document);
      a.textContent = text;
      li.append(a);
    } else {
      li.textContent = text;
    }
    ul.append(li);
  });

  if (!ul.children.length) {
    element.replaceWith(...element.childNodes);
    return;
  }

  const block = WebImporter.Blocks.createBlock(document, { name: 'breadcrumbs', cells: [[ul]] });
  element.replaceWith(block);
}
