/*
 * Tabs block: horizontal, wrapping tab list with one panel visible at a time.
 *
 * Content contract: one row per tab.
 * - first cell -> tab label (text)
 * - remaining cell(s) -> panel content (text, lists of links, sub-headings, ...)
 * A row with a single cell is treated as a label-only tab with an empty panel.
 *
 * Link-list panels (every content item is a standalone link, e.g. the AIG
 * Worldwide country lists) are laid out as up to three link columns:
 * - one content cell  -> links are split into three sequential columns
 * - several content cells -> each cell becomes one column (author-controlled)
 *
 * Option `cards`: each panel is a grid of bordered cards (e.g. portal login cards:
 * heading + text + link). Several content cells -> one card per cell; a single cell is
 * split into a card at every heading of its first heading level (or at each horizontal
 * rule); content before the first heading stays above the grid.
 */
let tabsCount = 0;
const ICON_TOKEN = 'external_link';

const LINK_COLUMNS = 3;
/* hosts that count as "this site" (content keeps absolute links to the source domain) */
const SITE_HOSTS = ['www.aig.com', 'aig.com'];

/**
 * Returns the link when the element holds nothing but a single link.
 * @param {Element} el
 * @returns {HTMLAnchorElement|null}
 */
function soleLink(el) {
  const links = el.querySelectorAll('a[href]');
  if (links.length !== 1) return null;
  return links[0].textContent.trim() === el.textContent.trim() ? links[0] : null;
}

/**
 * Collects the links of a cell when it contains only standalone links
 * (paragraphs or list items holding one link each).
 * @param {Element} cell
 * @returns {HTMLAnchorElement[]|null} null when the cell holds other content
 */
function cellLinks(cell) {
  const links = [];
  const items = [...cell.children];
  if (!items.length) return null;
  const ok = items.every((item) => {
    if (item.tagName === 'UL' || item.tagName === 'OL') {
      return [...item.children].every((li) => {
        const a = soleLink(li);
        if (a) links.push(a);
        return !!a;
      });
    }
    const a = item.tagName === 'A' ? item : soleLink(item);
    if (a) links.push(a);
    return !!a;
  });
  return ok && links.length ? links : null;
}

function isInternal(a) {
  try {
    const url = new URL(a.href, window.location.href);
    if (!url.protocol.startsWith('http')) return true;
    return url.origin === window.location.origin || SITE_HOSTS.includes(url.hostname);
  } catch {
    return true;
  }
}

/**
 * Normalizes an authored link into a column link: drops the auto-decorated
 * button styling and marks it internal (arrow) or external (icon, new tab).
 * @param {HTMLAnchorElement} a
 * @returns {HTMLAnchorElement}
 */
function decorateLink(a) {
  a.className = 'tabs-link';
  const label = document.createElement('span');
  label.className = 'tabs-link-label';
  label.append(...a.childNodes);
  a.append(label);
  if (isInternal(a)) {
    a.classList.add('tabs-link-internal');
  } else {
    a.target = '_blank';
    a.rel = 'noopener noreferrer';
    const icon = document.createElement('span');
    icon.className = 'icon-external';
    icon.setAttribute('aria-hidden', 'true');
    icon.textContent = 'external_link';
    // the icon may wrap onto its own line, as on the source
    a.append(document.createElement('wbr'), icon);
  }
  return a;
}

/**
 * Builds the link columns for a link-list panel.
 * @param {HTMLAnchorElement[][]} groups links per content cell
 * @returns {HTMLDivElement}
 */
function buildLinkColumns(groups) {
  let columns = groups;
  if (groups.length === 1) {
    const [links] = groups;
    const size = Math.ceil(links.length / LINK_COLUMNS);
    columns = [];
    for (let i = 0; i < links.length; i += size) columns.push(links.slice(i, i + size));
  }
  const wrap = document.createElement('div');
  wrap.className = 'tabs-links';
  columns.forEach((links) => {
    const col = document.createElement('div');
    col.className = 'tabs-links-col';
    col.append(...links.map(decorateLink));
    wrap.append(col);
  });
  return wrap;
}

/**
 * Cards option: marks off-site links (the imported ligature text "external_link", or a
 * non-site host) with the external glyph and opens them in a new tab.
 * @param {HTMLAnchorElement} a
 */
function decorateCardLink(a) {
  const text = a.lastChild;
  let external = false;
  if (text && text.nodeType === Node.TEXT_NODE && text.textContent.trimEnd().endsWith(ICON_TOKEN)) {
    text.textContent = text.textContent.replace(new RegExp(`\\s*${ICON_TOKEN}\\s*$`), '');
    if (a.title) a.title = a.title.replace(new RegExp(`\\s*${ICON_TOKEN}\\s*$`), '');
    external = true;
  }
  if (!external && isInternal(a)) return;
  a.classList.add('tabs-card-link-external');
  a.target = '_blank';
  a.rel = 'noopener noreferrer';
  const icon = document.createElement('span');
  icon.className = 'icon-external';
  icon.setAttribute('aria-hidden', 'true');
  icon.textContent = ICON_TOKEN;
  a.append(icon);
}

/**
 * Cards option: builds the card grid of one panel.
 * @param {Element[]} cells content cells of the tab row
 * @returns {Node[]} intro elements followed by the grid
 */
function buildCards(cells) {
  const intro = [];
  let groups;
  if (cells.length > 1) {
    groups = cells.map((cell) => [...cell.childNodes]);
  } else {
    const nodes = [...cells[0].childNodes];
    const elements = nodes.filter((n) => n.nodeType === Node.ELEMENT_NODE);
    const hasRule = elements.some((el) => el.tagName === 'HR');
    const firstHeading = elements.find((el) => /^H[2-6]$/.test(el.tagName));
    groups = [];
    if (hasRule) {
      groups.push([]);
      nodes.forEach((n) => {
        if (n.nodeType === Node.ELEMENT_NODE && n.tagName === 'HR') groups.push([]);
        else groups[groups.length - 1].push(n);
      });
    } else if (firstHeading) {
      nodes.forEach((n) => {
        const isSplit = n.nodeType === Node.ELEMENT_NODE && n.tagName === firstHeading.tagName;
        if (isSplit) groups.push([n]);
        else if (groups.length) groups[groups.length - 1].push(n);
        else intro.push(n);
      });
    } else {
      groups.push(nodes);
    }
  }

  const grid = document.createElement('div');
  grid.className = 'tabs-cards';
  groups
    .filter((group) => group.some((n) => n.nodeType === Node.ELEMENT_NODE || n.textContent.trim()))
    .forEach((group) => {
      const card = document.createElement('div');
      card.className = 'tabs-card';
      card.append(...group);
      card.querySelectorAll('a[href]').forEach(decorateCardLink);
      grid.append(card);
    });
  return [...intro, grid];
}

export default function decorate(block) {
  tabsCount += 1;
  const isCards = block.classList.contains('cards');
  const uid = `tabs-${tabsCount}`;
  const rows = [...block.children].filter((row) => row.children.length && row.textContent.trim());

  const tablist = document.createElement('div');
  tablist.className = 'tabs-list';
  tablist.setAttribute('role', 'tablist');

  const panels = [];
  const buttons = [];

  const select = (index, focus = false) => {
    buttons.forEach((btn, i) => {
      const active = i === index;
      btn.setAttribute('aria-selected', active);
      btn.tabIndex = active ? 0 : -1;
      panels[i].hidden = !active;
    });
    if (focus) buttons[index].focus();
  };

  rows.forEach((row, i) => {
    const [labelCell, ...contentCells] = [...row.children];
    const tabId = `${uid}-tab-${i}`;
    const panelId = `${uid}-panel-${i}`;

    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'tabs-tab';
    button.id = tabId;
    button.setAttribute('role', 'tab');
    button.setAttribute('aria-controls', panelId);
    const heading = labelCell.querySelector('h1, h2, h3, h4, h5, h6, p');
    button.textContent = (heading || labelCell).textContent.trim();
    button.addEventListener('click', () => select(i));
    tablist.append(button);
    buttons.push(button);

    const panel = document.createElement('div');
    panel.className = 'tabs-panel';
    panel.id = panelId;
    panel.setAttribute('role', 'tabpanel');
    panel.setAttribute('aria-labelledby', tabId);
    panel.tabIndex = 0;

    const cells = contentCells.filter((cell) => cell.textContent.trim() || cell.querySelector('img'));
    if (isCards && cells.length) {
      panel.classList.add('tabs-panel-cards');
      panel.append(...buildCards(cells));
      panels.push(panel);
      return;
    }
    const groups = cells.map(cellLinks);
    if (cells.length && groups.every(Boolean)) {
      panel.classList.add('tabs-panel-links');
      panel.append(buildLinkColumns(groups));
    } else {
      cells.forEach((cell) => panel.append(...cell.childNodes));
    }
    panels.push(panel);
  });

  tablist.addEventListener('keydown', (e) => {
    const current = buttons.indexOf(document.activeElement);
    if (current < 0) return;
    let next = null;
    if (e.key === 'ArrowRight') next = (current + 1) % buttons.length;
    if (e.key === 'ArrowLeft') next = (current - 1 + buttons.length) % buttons.length;
    if (e.key === 'Home') next = 0;
    if (e.key === 'End') next = buttons.length - 1;
    if (next !== null) {
      e.preventDefault();
      select(next, true);
    }
  });

  block.replaceChildren(tablist, ...panels);
  if (buttons.length) select(0);
}
