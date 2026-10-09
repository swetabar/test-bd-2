/* eslint-disable */
/* global WebImporter */
/**
 * Parser for downloads. Base: cards. Template: content-page.
 * Source: https://www.aig.com/home/risk-solutions/business/multinational
 * Selector: main .aem-Grid:has(> .download):not(.accordion *):not(.container:has(~ .quick-links) *)
 * The instance is the .aem-Grid that directly contains .download components.
 * Output: one row per .download: title (.cmp-download__action-text, else filename) |
 *   link "Download PDF [size]" (.cmp-download__title-link text, href kept absolute).
 * Non-download siblings in the grid (e.g. the "Downloadable Materials" heading teaser) are emitted
 * as default content in document order: before the block, or between blocks if they split the run.
 * Option "grid": the items are .download.halfwidth (two-column layout).
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

function headingFrom(el, fallbackLevel, document) {
  const level = /^H[1-6]$/.test(el.tagName) ? el.tagName.toLowerCase() : fallbackLevel;
  const h = document.createElement(level);
  h.textContent = clean(el.textContent);
  return h;
}

// Default content from a non-download grid child (heading teaser, title, text)
function defaultContent(node, document) {
  const out = [];
  node.querySelectorAll('.cmp-teaser__title, .cmp-title__text, .cmp-text > *, .cmp-teaser__description > *').forEach((el) => {
    if (!clean(el.textContent)) return;
    if (el.matches('.cmp-teaser__title, .cmp-title__text')) out.push(headingFrom(el, 'h2', document));
    else out.push(fixUrls(el, document));
  });
  node.querySelectorAll('.cmp-teaser__action-link').forEach((a) => {
    const p = document.createElement('p');
    const link = document.createElement('a');
    link.href = absUrl(a.getAttribute('href'), document);
    link.textContent = clean(a.textContent);
    p.append(link);
    out.push(p);
  });
  if (!out.length && clean(node.textContent)) {
    const p = document.createElement('p');
    p.textContent = clean(node.textContent);
    out.push(p);
  }
  return out;
}

// Visible rich description of a download card (.cmp-download__description, e.g. producer
// notifications "<h2>New Mexico</h2><p>10/21/2024</p><p>Emergency Order ...</p>" or
// M&A claims reports "<h3>Small Deals ...</h3><p>2023 Report: ...</p>"). Headings become
// bold paragraphs so the cell stays block-local; returns [] when there is no description.
function descriptionNodes(dl, document) {
  const desc = dl.querySelector('.cmp-download__description');
  if (!desc || !clean(desc.textContent)) return [];
  const out = [];
  [...desc.children].forEach((child) => {
    if (!clean(child.textContent)) return;
    if (/^H[1-6]$/.test(child.tagName)) {
      const p = document.createElement('p');
      const strong = document.createElement('strong');
      strong.textContent = clean(child.textContent);
      p.append(strong);
      out.push(p);
    } else {
      out.push(fixUrls(child, document));
    }
  });
  if (!out.length) {
    const p = document.createElement('p');
    p.textContent = clean(desc.textContent);
    out.push(p);
  }
  return out;
}

function downloadRow(dl, document) {
  const action = dl.querySelector('a.cmp-download__action');
  const titleLink = dl.querySelector('.cmp-download__title-link, .cmp-download__title a[href]');
  const actionText = clean((dl.querySelector('.cmp-download__action-text') || {}).textContent);
  const description = descriptionNodes(dl, document);
  // Title cell: the visible description when the card has one (the action text then becomes
  // the link label), else the action text, else the (hidden) filename property.
  let label;
  let linkText = clean(titleLink && titleLink.textContent);
  if (description.length) {
    const cell = document.createElement('div');
    cell.append(...description);
    label = cell;
    linkText = linkText || actionText;
  } else {
    label = actionText
      || clean((dl.querySelector('.cmp-download__property--filename .cmp-download__property-content') || {}).textContent);
  }
  const href = (titleLink && titleLink.getAttribute('href')) || (action && action.getAttribute('href'));
  if (!label && !href) return null;
  let linkCell = '';
  if (href) {
    const p = document.createElement('p');
    const a = document.createElement('a');
    a.href = absUrl(href, document);
    a.textContent = linkText || 'Download PDF';
    p.append(a);
    linkCell = p;
  }
  return [label || '', linkCell];
}

// Download-only container: .container > .cmp-container > .aem-Grid whose content children are all .download
function downloadOnlyGrid(container) {
  if (!container || !container.classList || !container.classList.contains('container')) return null;
  const grid = container.querySelector(':scope > .cmp-container > .aem-Grid');
  if (!grid) return null;
  const kids = [...grid.children].filter((c) => clean(c.textContent) || c.querySelector('a[href]'));
  return kids.length && kids.every((c) => c.matches('.download')) ? grid : null;
}

// Card-style lists put every .download in its own container (e.g. producer notifications:
// 10 x .container.aig-archive.quarterwidth > ... > .download). When ALL content siblings of
// this instance's container are such single-download containers, return their grids so the
// first instance emits ONE block for the whole run; later instances are marked as merged.
const MERGED_ATTR = 'data-excat-downloads-merged';
function siblingDownloadGrids(element) {
  const container = element.parentElement && element.parentElement.parentElement;
  if (!container || downloadOnlyGrid(container) !== element) return [element];
  const parent = container.parentElement;
  if (!parent) return [element];
  const siblings = [...parent.children].filter((c) => clean(c.textContent) || c.querySelector('a[href], img'));
  const grids = siblings.map((c) => downloadOnlyGrid(c));
  if (siblings.length < 2 || grids.some((g) => !g)) return [element];
  return grids;
}

export default function parse(element, { document }) {
  if (element.hasAttribute(MERGED_ATTR)) return; // already emitted by the first grid of its run
  const grids = siblingDownloadGrids(element);
  if (grids.length > 1) {
    // Collect every sibling container's downloads into this grid, then drop the emptied containers.
    grids.slice(1).forEach((g) => {
      g.setAttribute(MERGED_ATTR, '');
      element.append(...g.children);
      const c = g.parentElement && g.parentElement.parentElement;
      if (c) c.remove();
    });
  }
  const children = [...element.children];
  if (!children.some((c) => c.matches('.download'))) {
    // Annual-report cards in a slider (landing-section, /home/about/corporate-responsibility/
    // sustainability): .aig-annual-card-container .container.aig-carousel > ... slick wrappers ...
    // > .download.aig-annual-card. One row per card, slick clones skipped; the decorative cover
    // thumbnail (alt="") inside the description heading is dropped, its title text kept.
    const nested = [...element.querySelectorAll('.download')]
      .filter((d) => !d.closest('.slick-cloned') && !d.parentElement.closest('.download'));
    const rows = nested.map((d) => downloadRow(d.querySelector('.cmp-download') || d, document)).filter(Boolean);
    if (rows.length) {
      const grid = nested.some((d) => d.matches('.aig-annual-card, .halfwidth'));
      const block = WebImporter.Blocks.createBlock(document, { name: grid ? 'Downloads (grid)' : 'Downloads', cells: rows });
      element.replaceWith(block);
      return;
    }
  }
  const downloads = children.filter((c) => c.matches('.download'));
  if (!downloads.length) {
    element.replaceWith(...element.childNodes);
    return;
  }
  const isGrid = downloads.some((d) => d.classList.contains('halfwidth'));
  const name = isGrid ? 'Downloads (grid)' : 'Downloads';

  const output = [];
  let rows = [];
  const flush = () => {
    if (rows.length) {
      output.push(WebImporter.Blocks.createBlock(document, { name, cells: rows }));
      rows = [];
    }
  };

  children.forEach((child) => {
    if (child.matches('.download')) {
      const dl = child.querySelector('.cmp-download') || child;
      const row = downloadRow(dl, document);
      if (row) rows.push(row);
    } else {
      const content = defaultContent(child, document);
      if (content.length) {
        flush();
        output.push(...content);
      }
    }
  });
  flush();

  const block = output.find((n) => n.tagName === 'TABLE') || null;
  if (!block) {
    element.replaceWith(...element.childNodes);
    return;
  }
  element.replaceWith(...output);
}
