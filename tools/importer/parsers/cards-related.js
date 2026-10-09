/* eslint-disable */
/* global WebImporter */
/**
 * Parser for cards-related. Base: cards. Template: content-page.
 * Source: https://www.aig.com/home/risk-solutions/business/multinational
 * Selector: main .aig-autopilot
 * Source shape: h3 "Related Content" + ul > li (p title, .autopilot-cta a "Learn More").
 * Output: the h3 label is emitted as default content before the block (the block does not
 *   render a heading); block = one row per card, one cell: title paragraph + link paragraph.
 * Iterates the block-level <li> items (never the anchors).
 * Landing-section variant (/home/app-and-web-portal): .flexcontainer > section.flplanscontainer
 *   (h3 label + .flexicontainer > .column > .flplans: p title, p > a "Learn More") - same output.
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
  const label = element.querySelector(':scope > h2, :scope > h3, :scope > h4')
    || element.querySelector(':scope > .flplanscontainer > h2, :scope > .flplanscontainer > h3, :scope > .flplanscontainer > h4');

  let items = [...element.querySelectorAll(':scope > ul > li')];
  // .flexcontainer > section.flplanscontainer > .flexicontainer > .column > .flplans (p title, p > a)
  if (!items.length) {
    items = [...element.querySelectorAll('.flexicontainer > .column')]
      .map((col) => col.querySelector(':scope > .flplans') || col);
  }
  if (!items.length) items = [...element.querySelectorAll('li')];

  const cells = [];
  items.forEach((li) => {
    const cell = [];
    const links = [...li.querySelectorAll('a[href]')];
    const ctaLink = li.querySelector('.autopilot-cta a[href]') || links[links.length - 1];

    // Title: text blocks that are not the CTA wrapper
    const titleEls = [...li.querySelectorAll(':scope > p, :scope > h2, :scope > h3, :scope > h4, :scope > div:not(.autopilot-cta)')]
      .filter((el) => el.textContent.trim() && !(ctaLink && el.contains(ctaLink)));
    titleEls.forEach((el) => {
      const p = document.createElement(/^H[1-6]$/.test(el.tagName) ? el.tagName.toLowerCase() : 'p');
      p.textContent = el.textContent.replace(/\s+/g, ' ').trim();
      cell.push(p);
    });

    if (ctaLink) {
      const a = document.createElement('a');
      a.href = absUrl(ctaLink.getAttribute('href'), document);
      a.textContent = ctaLink.textContent.replace(/\s+/g, ' ').trim() || 'Learn More';
      const p = document.createElement('p');
      p.append(a);
      cell.push(p);
    }
    if (cell.length) cells.push([cell]);
  });

  if (!cells.length) {
    element.replaceWith(...element.childNodes);
    return;
  }

  const block = WebImporter.Blocks.createBlock(document, { name: 'cards-related', cells });
  if (label && label.textContent.trim()) {
    const heading = document.createElement(label.tagName.toLowerCase());
    heading.textContent = label.textContent.trim();
    element.replaceWith(heading, block);
  } else {
    element.replaceWith(block);
  }
}
