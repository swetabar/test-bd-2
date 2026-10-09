/*
 * Downloads block: list of downloadable documents, title left, download link right
 * (e.g. ":download: Download PDF [114.6 kb]").
 * Content contract: one row per document, cells = title | download link.
 * A single-cell row is split: its last link becomes the download action, the rest is the title.
 * Options: grid (two-column layout of the same items on wide screens),
 * narrow (CSS only: two-thirds-width centred column).
 * Rows that carry a cover picture (e.g. annual / sustainability reports) render as
 * annual-report cards: cover, title, download link (3-up on wide screens).
 */

const OPTION_CLASSES = ['grid'];

/** Unwraps a lone paragraph so inline content can sit directly in its container. */
function inlineChildren(container) {
  const kids = [...container.children];
  if (kids.length === 1 && kids[0].tagName === 'P') kids[0].replaceWith(...kids[0].childNodes);
}

/** Strips global button decoration (decorateButtons) from a link and its wrapper. */
function undecorate(a) {
  a.classList.remove('button', 'link', 'primary', 'secondary', 'accent');
  if (!a.classList.length) a.removeAttribute('class');
  const p = a.closest('p.button-wrapper');
  if (p) p.replaceWith(...p.childNodes);
}

export default function decorate(block) {
  const active = [...block.classList].filter((c) => OPTION_CLASSES.includes(c));

  const ul = document.createElement('ul');
  ul.className = 'downloads-list';

  [...block.children].forEach((row) => {
    if (!row.textContent.trim()) return;
    const li = document.createElement('li');
    li.className = 'downloads-item';

    const title = document.createElement('div');
    title.className = 'downloads-title';
    const action = document.createElement('div');
    action.className = 'downloads-action';

    // a cover thumbnail (any cell) turns the item into an annual-report card
    const picture = row.querySelector('picture');
    let thumb = null;
    if (picture) {
      thumb = document.createElement('div');
      thumb.className = 'downloads-thumb';
      const holder = picture.closest('p');
      thumb.append(picture);
      if (holder && !holder.textContent.trim() && !holder.querySelector('img, picture')) holder.remove();
    }

    const cells = thumb
      ? [...row.children].filter((cell) => cell.textContent.trim() || cell.querySelector('a'))
      : [...row.children];
    if (cells.length > 1) {
      title.append(...cells[0].childNodes);
      cells.slice(1).forEach((cell) => action.append(...cell.childNodes));
    } else if (cells[0]) {
      const cell = cells[0];
      const links = cell.querySelectorAll('a');
      const last = links[links.length - 1];
      if (last) {
        const holder = last.closest('p') || last;
        action.append(holder);
      }
      title.append(...cell.childNodes);
    }

    action.querySelectorAll('a').forEach((a) => {
      undecorate(a);
      a.classList.add('downloads-link');
      // the icon is drawn by CSS; drop an authored :download: icon to avoid doubling it
      a.querySelectorAll('.icon').forEach((icon) => icon.remove());
      if (!a.hasAttribute('download') && /\.pdf($|\?)/i.test(a.getAttribute('href') || '')) {
        a.setAttribute('target', '_blank');
        a.setAttribute('rel', 'noopener');
      }
    });
    inlineChildren(action);
    inlineChildren(title);

    // as on the source, the title itself also opens the document
    const href = action.querySelector('a.downloads-link')?.getAttribute('href');
    if (href && title.textContent.trim() && !title.querySelector('a')) {
      const a = document.createElement('a');
      a.className = 'downloads-title-link';
      a.href = href;
      a.tabIndex = -1; // duplicate of the download link; keep a single tab stop per item
      const dl = action.querySelector('a.downloads-link');
      ['target', 'rel'].forEach((attr) => { if (dl.hasAttribute(attr)) a.setAttribute(attr, dl.getAttribute(attr)); });
      a.append(...title.childNodes);
      title.append(a);
    }

    if (thumb) {
      // card: cover, title, then the download link, in a column as wide as the cover
      li.classList.add('downloads-card');
      const inner = document.createElement('div');
      inner.className = 'downloads-card-inner';
      inner.append(thumb, title);
      if (action.childNodes.length) inner.append(action);
      li.append(inner);
    } else {
      // action first: it floats right on wide screens so the title wraps around it
      if (action.childNodes.length) li.append(action);
      li.append(title);
    }
    ul.append(li);
  });

  block.replaceChildren(ul);
  if (active.includes('grid')) ul.classList.add('downloads-list-grid');
  if (ul.children.length && [...ul.children].every((li) => li.classList.contains('downloads-card'))) {
    block.classList.add('downloads-cards');
  }
}
