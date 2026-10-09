import { createOptimizedPicture } from '../../scripts/aem.js';

/**
 * Groups each H3 and the content that follows it (until the next H3) into
 * a sub-item, and wraps all sub-items in a grid container.
 * @param {Element} panel
 */
function groupSubItems(panel) {
  const headings = [...panel.children].filter((el) => el.tagName === 'H3');
  if (!headings.length) return;
  const items = document.createElement('div');
  items.className = 'tabs-risk-items';
  headings[0].before(items);
  headings.forEach((h3) => {
    const item = document.createElement('div');
    item.className = 'tabs-risk-item';
    let next = h3.nextElementSibling;
    item.append(h3);
    while (next && next.tagName !== 'H3') {
      const current = next;
      next = next.nextElementSibling;
      item.append(current);
    }
    items.append(item);
  });
}

/**
 * Tabs (risk) — switchable audience panels. Each panel is a card holding a
 * banner image, intro text, a link and optional H3 sub-item groups.
 * Content contract: one row per tab, cells = tab label | tab content.
 * A bold tab label marks the tab that is open by default (otherwise the first).
 * @param {Element} block
 */
export default function decorate(block) {
  const blockId = `tabs-risk-${Math.random().toString(36).slice(2, 8)}`;
  const tablist = document.createElement('div');
  tablist.className = 'tabs-risk-list';
  tablist.setAttribute('role', 'tablist');

  const panels = document.createElement('div');
  panels.className = 'tabs-risk-panels';

  const tabs = [];
  let defaultIndex = 0;
  [...block.children].forEach((row, i) => {
    const cells = [...row.children];
    if (!cells.length) return;
    const labelCell = cells.length > 1 ? cells[0] : null;
    const contentCells = cells.length > 1 ? cells.slice(1) : cells;
    const label = labelCell?.textContent.trim() || `Tab ${i + 1}`;
    if (labelCell?.querySelector('strong, b')) defaultIndex = tabs.length;

    const tab = document.createElement('button');
    tab.type = 'button';
    tab.className = 'tabs-risk-tab';
    tab.id = `${blockId}-tab-${i}`;
    tab.setAttribute('role', 'tab');
    tab.textContent = label;

    const panel = document.createElement('div');
    panel.className = 'tabs-risk-panel';
    panel.id = `${blockId}-panel-${i}`;
    panel.setAttribute('role', 'tabpanel');
    panel.setAttribute('aria-labelledby', tab.id);
    tab.setAttribute('aria-controls', panel.id);
    contentCells.forEach((cell) => {
      while (cell.firstChild) panel.append(cell.firstChild);
    });

    // banner image: first picture in the panel, lifted into its own wrapper
    const pic = panel.querySelector('picture');
    if (pic) {
      const img = pic.querySelector('img');
      const banner = document.createElement('div');
      banner.className = 'tabs-risk-banner';
      const parent = pic.parentElement;
      if (img) {
        banner.append(createOptimizedPicture(img.src, img.alt || '', false, [{ width: '1200' }]));
        pic.remove();
      } else {
        banner.append(pic);
      }
      const emptyParent = !parent.textContent.trim() && !parent.children.length;
      if (parent !== panel && emptyParent) parent.remove();
      panel.prepend(banner);
    }

    groupSubItems(panel);

    // intro copy + CTA (everything between banner and sub-items) in one padded body
    const body = document.createElement('div');
    body.className = 'tabs-risk-body';
    [...panel.children]
      .filter((el) => !el.classList.contains('tabs-risk-banner') && !el.classList.contains('tabs-risk-items'))
      .forEach((el) => body.append(el));
    if (body.children.length) {
      const items = panel.querySelector(':scope > .tabs-risk-items');
      if (items) items.before(body);
      else panel.append(body);
    }

    tablist.append(tab);
    panels.append(panel);
    tabs.push({ tab, panel });
  });

  const select = (index, focus = false) => {
    tabs.forEach(({ tab, panel }, i) => {
      const active = i === index;
      tab.setAttribute('aria-selected', active);
      tab.tabIndex = active ? 0 : -1;
      panel.hidden = !active;
      if (active && focus) tab.focus();
    });
  };

  tabs.forEach(({ tab }, i) => {
    tab.addEventListener('click', () => select(i));
    tab.addEventListener('keydown', (e) => {
      let target = null;
      if (e.key === 'ArrowRight') target = (i + 1) % tabs.length;
      else if (e.key === 'ArrowLeft') target = (i - 1 + tabs.length) % tabs.length;
      else if (e.key === 'Home') target = 0;
      else if (e.key === 'End') target = tabs.length - 1;
      if (target !== null) {
        e.preventDefault();
        select(target, true);
      }
    });
  });

  block.replaceChildren(tablist, panels);
  if (tabs.length) select(defaultIndex);
}
