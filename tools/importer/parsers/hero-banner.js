/* eslint-disable */
/* global WebImporter */
/**
 * Parser for hero-banner. Base: hero. Template: content-page.
 * Source: https://www.aig.com/home/risk-solutions/business/multinational
 * Selector: main .container.hero-banner-with-fade
 * Output (1 column): optional background image row, then one content row holding
 *   breadcrumb list of links (last = current page as text), page title heading (level kept,
 *   usually h1), intro paragraph(s), CTA link paragraph(s).
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

function buildBreadcrumbList(list, document) {
  const items = [...list.querySelectorAll('li')]
    .filter((li, i, arr) => !arr.some((o) => o !== li && o.contains(li)));
  if (!items.length) return null;
  const ul = document.createElement('ul');
  items.forEach((item, i) => {
    const text = item.textContent.replace(/\s+/g, ' ').trim();
    if (!text) return;
    const li = document.createElement('li');
    const link = item.querySelector('a[href]');
    const href = link && link.getAttribute('href');
    const isCurrent = i === items.length - 1 || item.classList.contains('cmp-breadcrumb__item--active');
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
  return ul.children.length ? ul : null;
}

export default function parse(element, { document }) {
  const contentCell = [];

  // Breadcrumb trail (.breadcrumb .cmp-breadcrumb__list)
  const crumbList = element.querySelector('.cmp-breadcrumb__list, .breadcrumb ol, .breadcrumb ul');
  if (crumbList) {
    const ul = buildBreadcrumbList(crumbList, document);
    if (ul) contentCell.push(ul);
  }

  // Title / intro teaser: first teaser content that carries a title
  const teasers = [...element.querySelectorAll('.cmp-teaser__content')];
  const textTeaser = teasers.find((c) => c.querySelector('.cmp-teaser__title, h1, h2')) || teasers[0];

  if (textTeaser) {
    const title = textTeaser.querySelector('.cmp-teaser__title, h1, h2, h3');
    if (title) {
      const level = /^H[1-6]$/.test(title.tagName) ? title.tagName.toLowerCase() : 'h1';
      const heading = document.createElement(level);
      heading.textContent = title.textContent.replace(/\s+/g, ' ').trim();
      contentCell.push(heading);
    }
    const desc = textTeaser.querySelector('.cmp-teaser__description');
    if (desc) {
      const parts = [...desc.querySelectorAll(':scope > p, :scope > ul, :scope > ol, :scope > h2, :scope > h3, :scope > h4')]
        .filter((el) => el.textContent.trim());
      if (parts.length) contentCell.push(...parts);
      else if (desc.textContent.trim()) {
        const p = document.createElement('p');
        p.textContent = desc.textContent.trim();
        contentCell.push(p);
      }
    }
    textTeaser.querySelectorAll('.cmp-teaser__action-link').forEach((a) => {
      const link = document.createElement('a');
      link.href = absUrl(a.getAttribute('href') || '', document);
      link.textContent = a.textContent.replace(/\s+/g, ' ').trim();
      const p = document.createElement('p');
      p.append(link);
      contentCell.push(p);
    });
  } else {
    const h = element.querySelector('h1, h2');
    if (h) contentCell.push(h);
  }

  // Optional background image (rare; most banners are a plain navy band)
  const bgImage = element.querySelector('.cmp-teaser__image img, .cmp-image img');
  if (bgImage) {
    const src = bgImage.getAttribute('src');
    if (src) bgImage.setAttribute('src', absUrl(src, document));
  }

  if (!contentCell.length && !bgImage) {
    element.replaceWith(...element.childNodes);
    return;
  }

  const cells = [];
  if (bgImage) cells.push([bgImage]);
  cells.push([contentCell]);
  const block = WebImporter.Blocks.createBlock(document, { name: 'hero-banner', cells });
  element.replaceWith(block);
}
