/*
 * Accordion block
 * Content contract: one row per item, cells = label | body.
 * A row with only a label cell renders as a label with an empty body.
 * Options: highlight (single prominent bar, e.g. a downloadable document with a leading icon).
 *          cards (each body is split into a grid of bordered cards, e.g. contact cards: a new
 *          card starts at every heading of the body's first heading level, or at each
 *          horizontal rule; content before the first heading stays above the grid).
 */

const OPTION_CLASSES = ['highlight', 'cards'];
const COLUMN_HEADING = 'H4';
const COLUMN_COUNT = 3;
const ICON_TOKEN = 'external_link';

/**
 * Off-site links keep the source "custom-icons" ligature text at the end of the label;
 * turn it back into the glyph (cards option only).
 * @param {HTMLAnchorElement} a
 */
function decorateExternalLink(a) {
  const text = a.lastChild;
  if (!text || text.nodeType !== Node.TEXT_NODE) return;
  if (!text.textContent.trimEnd().endsWith(ICON_TOKEN)) return;
  text.textContent = text.textContent.replace(new RegExp(`\\s*${ICON_TOKEN}\\s*$`), '');
  if (a.title) a.title = a.title.replace(new RegExp(`\\s*${ICON_TOKEN}\\s*$`), '');
  const icon = document.createElement('span');
  icon.className = 'accordion-card-icon-external';
  icon.setAttribute('aria-hidden', 'true');
  icon.textContent = ICON_TOKEN;
  a.append(icon);
  a.classList.add('accordion-card-link-external');
  a.target = '_blank';
  a.rel = 'noopener noreferrer';
}

const PHONE_RE = /^\+?\s*\(?\d/;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i;

/**
 * Cards option: phone-number lines (leading bold number) and e-mail address lines get the
 * source's 32px telephone / e-mail icon in front (decorative; dropped by the import).
 * @param {HTMLElement} card
 */
function decorateContactLines(card) {
  card.querySelectorAll(':scope > p').forEach((p) => {
    if (p.querySelector('img, picture')) return;
    const text = p.textContent.trim();
    const lead = p.firstElementChild;
    const isPhone = !!lead && lead.matches('strong, b') && p.firstChild === lead
      && PHONE_RE.test(lead.textContent.trim());
    const isEmail = EMAIL_RE.test(text);
    if (!isPhone && !isEmail) return;
    const icon = document.createElement('img');
    icon.className = 'accordion-card-contact-icon';
    icon.src = `${window.hlx?.codeBasePath || ''}/icons/${isPhone ? 'phone' : 'email'}.svg`;
    icon.alt = '';
    icon.width = 32;
    icon.height = 32;
    icon.loading = 'lazy';
    p.prepend(icon, ' ');
  });
}

/**
 * Cards option: splits a panel body into a grid of cards.
 * @param {HTMLElement} body
 */
function decorateCards(body) {
  const children = [...body.children];
  if (!children.length) return;
  // unwrapped text would be lost when regrouping: leave such bodies as a single flow
  const hasLooseText = [...body.childNodes]
    .some((n) => n.nodeType === Node.TEXT_NODE && n.textContent.trim());
  if (hasLooseText) return;

  const intro = [];
  const groups = [];
  const hasRule = children.some((el) => el.tagName === 'HR');
  const firstHeading = children.find((el) => /^H[2-6]$/.test(el.tagName));
  if (hasRule) {
    groups.push([]);
    children.forEach((el) => {
      if (el.tagName === 'HR') groups.push([]);
      else groups[groups.length - 1].push(el);
    });
  } else if (firstHeading) {
    children.forEach((el) => {
      if (el.tagName === firstHeading.tagName) groups.push([el]);
      else if (groups.length) groups[groups.length - 1].push(el);
      else intro.push(el);
    });
  } else {
    groups.push(children);
  }

  const grid = document.createElement('div');
  grid.className = 'accordion-cards';
  groups.filter((group) => group.length).forEach((group) => {
    const card = document.createElement('div');
    card.className = 'accordion-card';
    card.append(...group);
    const [first] = group;
    if (/^H[2-6]$/.test(first.tagName)) {
      first.classList.add('accordion-card-title');
      const link = first.querySelector('a[href]');
      if (link && link.textContent.trim() === first.textContent.trim()) {
        first.classList.add('accordion-card-title-link');
      }
    }
    card.querySelectorAll('a[href]').forEach(decorateExternalLink);
    decorateContactLines(card);
    grid.append(card);
  });

  body.classList.add('accordion-item-body-cards');
  body.replaceChildren(...intro, grid);
}

/**
 * Case-study bodies (heading + paragraph(s), repeated three times, e.g.
 * Challenge / Solution / AIG Benefit) render as side-by-side columns.
 * Any other body shape is left untouched.
 * @param {HTMLElement} body
 */
function decorateColumns(body) {
  const children = [...body.children];
  if (!children.length || children[0].tagName !== COLUMN_HEADING) return;
  if (children.some((el) => el.tagName !== COLUMN_HEADING && el.tagName !== 'P')) return;
  const hasLooseText = [...body.childNodes]
    .some((n) => n.nodeType === Node.TEXT_NODE && n.textContent.trim());
  if (hasLooseText) return;

  const groups = [];
  children.forEach((el) => {
    if (el.tagName === COLUMN_HEADING) groups.push([el]);
    else groups[groups.length - 1].push(el);
  });
  if (groups.length !== COLUMN_COUNT || groups.some((g) => g.length < 2)) return;

  body.classList.add('accordion-item-body-columns');
  body.replaceChildren(...groups.map((group) => {
    const col = document.createElement('div');
    col.className = 'accordion-item-column';
    col.append(...group);
    return col;
  }));
}

export default function decorate(block) {
  const active = [...block.classList].filter((c) => OPTION_CLASSES.includes(c));

  [...block.children].forEach((row, index) => {
    const cells = [...row.children];
    if (!cells.length) {
      row.remove();
      return;
    }

    const [labelCell, ...bodyCells] = cells;

    const summary = document.createElement('summary');
    summary.className = 'accordion-item-label';
    const labelText = document.createElement('span');
    labelText.className = 'accordion-item-label-text';
    labelText.append(...labelCell.childNodes);
    summary.append(labelText);

    const body = document.createElement('div');
    body.className = 'accordion-item-body';
    bodyCells.forEach((cell) => body.append(...cell.childNodes));
    if (active.includes('cards')) decorateCards(body);
    else decorateColumns(body);

    const details = document.createElement('details');
    details.className = 'accordion-item';
    const id = `accordion-${Math.random().toString(36).slice(2, 8)}-${index}`;
    body.id = id;
    summary.setAttribute('aria-controls', id);
    details.append(summary, body);
    if (!body.textContent.trim() && !body.querySelector('img, picture, a')) {
      details.classList.add('accordion-item-empty');
    }
    row.replaceWith(details);
  });

  if (active.includes('highlight')) {
    block.querySelectorAll('.accordion-item-label').forEach((label) => {
      if (label.querySelector('.icon')) label.classList.add('accordion-item-label-with-icon');
    });
  }
}
