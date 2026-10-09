/*
 * Columns (quick links) block: intro text (~2/3) beside a boxed "Quick Links" panel (~1/3).
 * Content contract: 1 row, 2 cells.
 *   Cell 1 (intro): heading, paragraphs, optional list / CTA.
 *     When the content after the first paragraph is plain text (no links), it is collapsed
 *     behind a "Show more" / "Show less" toggle. Content with a CTA is shown in full.
 *     Block options `expandable` / `no-expand` force either behaviour.
 *   Cell 2 (quick links): a title (heading or paragraph) followed by a list of links.
 *     Links authored as one-per-paragraph are converted into a list.
 *     Below 961px the panel is shown first as a collapsed dropdown (as on the source site).
 * Authors may also place each cell in its own row; all cells are flattened in order.
 *
 * Option `featured`: the intro cell holds a featured story instead of intro text:
 *   optional leading h1/h2 (section title), then picture + heading + text + link. The story
 *   renders as an image-left card (stacked on mobile); no Show more collapse is applied.
 */

const ICON_TOKEN = 'external_link';
const MOBILE_QUERY = '(max-width: 960px)';
const SITE_HOSTS = ['aig.com', 'www.aig.com'];

/**
 * True for links to other hosts (the source marks them with the external-link glyph).
 * @param {HTMLAnchorElement} a
 */
function isOffsite(a) {
  try {
    const url = new URL(a.href, window.location.href);
    if (!/^https?:$/.test(url.protocol)) return false;
    return url.hostname !== window.location.hostname && !SITE_HOSTS.includes(url.hostname);
  } catch {
    return false;
  }
}

let instanceCount = 0;

function isLinkOnlyParagraph(el) {
  if (el.tagName !== 'P') return false;
  const a = el.querySelector(':scope > a');
  return !!a && el.textContent.trim() === a.textContent.trim();
}

/**
 * The source site marks off-site links with a "custom-icons" ligature glyph; the import keeps
 * the ligature text ("external_link") at the end of the label. Turn it back into the glyph.
 * @param {HTMLAnchorElement} a
 */
function decorateExternalLink(a) {
  const walker = document.createTreeWalker(a, NodeFilter.SHOW_TEXT);
  const texts = [];
  while (walker.nextNode()) texts.push(walker.currentNode);
  const last = texts.reverse().find((n) => n.textContent.trim());
  if (!last || !last.textContent.trimEnd().endsWith(ICON_TOKEN)) return;
  last.textContent = last.textContent.replace(new RegExp(`\\s*${ICON_TOKEN}\\s*$`), '');
  if (a.title) a.title = a.title.replace(new RegExp(`\\s*${ICON_TOKEN}\\s*$`), '');
  const icon = document.createElement('span');
  icon.className = 'icon-external';
  icon.setAttribute('aria-hidden', 'true');
  icon.textContent = ICON_TOKEN;
  a.append(icon);
  a.target = '_blank';
  a.rel = 'noopener noreferrer';
}

function shouldCollapse(block, rest) {
  if (block.classList.contains('no-expand')) return false;
  if (block.classList.contains('expandable')) return true;
  // a CTA in the trailing content means it belongs to the visible teaser
  return !rest.some((el) => el.querySelector('a[href]'));
}

function buildIntro(block, cell, id) {
  cell.className = 'columns-quicklinks-intro';
  cell.querySelectorAll('a[href]').forEach(decorateExternalLink);
  const children = [...cell.children];
  if (!children.length) return;

  // several heading groups (source "toggle content" container of teasers): only the first
  // group (its heading and all of its copy) is shown; later groups stay hidden, no toggle
  const groupTag = /^H[1-6]$/.test(children[0].tagName) ? children[0].tagName : null;
  const nextGroup = groupTag ? children.findIndex((el, i) => i > 0 && el.tagName === groupTag) : -1;
  if (nextGroup > 0 && !block.classList.contains('expandable')) {
    const hidden = document.createElement('div');
    hidden.className = 'columns-quicklinks-more';
    hidden.append(...children.slice(nextGroup));
    hidden.hidden = true;
    cell.append(hidden);
    block.classList.add('columns-quicklinks-grouped');
    return;
  }

  // visible part: leading headings plus the first non-heading element
  let split = children.findIndex((el) => !/^H[1-6]$/.test(el.tagName));
  if (split === -1) return;
  split += 1;
  const rest = children.slice(split);
  if (!rest.length || !shouldCollapse(block, rest)) return;

  block.classList.add('columns-quicklinks-expandable');

  const more = document.createElement('div');
  more.className = 'columns-quicklinks-more';
  more.id = `columns-quicklinks-more-${id}`;
  more.append(...rest);
  more.hidden = true;

  const toggle = document.createElement('button');
  toggle.type = 'button';
  toggle.className = 'columns-quicklinks-toggle';
  toggle.setAttribute('aria-expanded', 'false');
  toggle.setAttribute('aria-controls', more.id);
  toggle.textContent = 'Show more';
  toggle.addEventListener('click', () => {
    const expanded = toggle.getAttribute('aria-expanded') === 'true';
    toggle.setAttribute('aria-expanded', String(!expanded));
    toggle.textContent = expanded ? 'Show more' : 'Show less';
    more.hidden = expanded;
  });

  cell.append(more, toggle);
}

/**
 * Featured option: leading section headings stay on top, the rest becomes a story card.
 * @param {Element} cell intro cell
 */
function buildFeatured(cell) {
  cell.className = 'columns-quicklinks-intro';
  cell.querySelectorAll('a[href]').forEach(decorateExternalLink);
  const children = [...cell.children];
  const start = children.findIndex((el) => !/^H[12]$/.test(el.tagName) || el.querySelector('picture'));
  if (start === -1) return;
  const rest = children.slice(start);

  const story = document.createElement('div');
  story.className = 'columns-quicklinks-story';
  const content = document.createElement('div');
  content.className = 'columns-quicklinks-story-content';
  content.append(...rest);

  const picture = content.querySelector('picture');
  if (picture) {
    const media = document.createElement('div');
    media.className = 'columns-quicklinks-story-image';
    const holder = picture.parentElement;
    media.append(picture);
    if (holder !== content && !holder.textContent.trim() && !holder.querySelector('img, picture')) {
      holder.remove();
    }
    story.append(media);
  } else {
    story.classList.add('columns-quicklinks-story-no-image');
  }
  story.append(content);
  cell.append(story);
}

/**
 * Small screens: the title row toggles the link list (dropdown). Large screens: always open.
 */
function setupDropdown(panel, header, list, id) {
  if (!header || !list) return;
  list.id = list.id || `columns-quicklinks-list-${id}`;
  const mq = window.matchMedia(MOBILE_QUERY);

  const setOpen = (open) => {
    panel.classList.toggle('is-open', open);
    if (mq.matches) header.setAttribute('aria-expanded', String(open));
  };
  const toggle = () => {
    if (mq.matches) setOpen(!panel.classList.contains('is-open'));
  };
  const applyMode = () => {
    if (mq.matches) {
      header.setAttribute('role', 'button');
      header.tabIndex = 0;
      header.setAttribute('aria-controls', list.id);
      header.setAttribute('aria-expanded', String(panel.classList.contains('is-open')));
    } else {
      ['role', 'tabindex', 'aria-controls', 'aria-expanded'].forEach((a) => header.removeAttribute(a));
    }
  };

  header.addEventListener('click', toggle);
  header.addEventListener('keydown', (e) => {
    if (!mq.matches || (e.key !== 'Enter' && e.key !== ' ')) return;
    e.preventDefault();
    toggle();
  });
  mq.addEventListener('change', applyMode);
  applyMode();
}

function buildLinks(cell, id) {
  cell.className = 'columns-quicklinks-panel';
  const children = [...cell.children];

  // title: first heading, or first paragraph that is not a lone link
  const title = children.find((el) => /^H[1-6]$/.test(el.tagName))
    || children.find((el) => el.tagName === 'P' && !isLinkOnlyParagraph(el));

  let list = cell.querySelector('ul, ol');
  if (!list) {
    // links authored one per paragraph
    const linkParas = children.filter(isLinkOnlyParagraph);
    if (linkParas.length) {
      list = document.createElement('ul');
      linkParas.forEach((p) => {
        const li = document.createElement('li');
        li.append(...p.childNodes);
        list.append(li);
        p.remove();
      });
      cell.append(list);
    }
  }

  let header;
  if (title) {
    header = document.createElement('div');
    header.className = 'columns-quicklinks-title';
    title.replaceWith(header);
    header.append(title);
  }
  if (list) {
    list.classList.add('columns-quicklinks-list');
    list.querySelectorAll(':scope > li').forEach((li) => {
      if (li.querySelector('a')) li.classList.add('columns-quicklinks-item');
    });
    // off-site links: external-link glyph instead of the arrow, as on the source list
    list.querySelectorAll(':scope > li > a[href]').forEach((a) => {
      decorateExternalLink(a);
      if (!a.querySelector('.icon-external') && isOffsite(a)) {
        const icon = document.createElement('span');
        icon.className = 'icon-external';
        icon.setAttribute('aria-hidden', 'true');
        icon.textContent = ICON_TOKEN;
        a.append(icon);
        a.target = '_blank';
        a.rel = 'noopener noreferrer';
      }
      if (a.querySelector('.icon-external')) a.classList.add('columns-quicklinks-external');
    });
  }
  setupDropdown(cell, header, list, id);
}

export default function decorate(block) {
  instanceCount += 1;
  const cells = [];
  [...block.children].forEach((row) => {
    [...row.children].forEach((cell) => {
      if (!cell.textContent.trim() && !cell.querySelector('picture, a')) return;
      cells.push(cell);
    });
  });
  if (!cells.length) return;

  const grid = document.createElement('div');
  grid.className = 'columns-quicklinks-grid';

  const [intro, ...others] = cells;
  if (block.classList.contains('featured')) buildFeatured(intro);
  else buildIntro(block, intro, instanceCount);
  grid.append(intro);
  if (others.length) {
    const panel = others.shift();
    // extra cells are appended to the panel rather than dropped
    others.forEach((extra) => panel.append(...extra.childNodes));
    buildLinks(panel, instanceCount);
    grid.append(panel);
  } else {
    grid.classList.add('columns-quicklinks-single');
  }

  block.replaceChildren(grid);
}
