import { createOptimizedPicture } from '../../scripts/aem.js';

/*
 * Carousel (timeline) block: the AIG history timeline. A horizontally scrolling row of
 * milestone cards hung from a progress rail (one dot per card), with previous / next
 * controls and a "Select Decade" dropdown that jumps to the first milestone of a decade.
 *
 * Content contract: one row per milestone, cells = picture | year heading + bullet list.
 * - The year is read from the first heading (or bold/first paragraph) of the content cell.
 * - Decades are NOT authored: they are derived from the years, newest first, in row order.
 * - A row with a single cell is treated as content only (no image).
 * Below 768px (as on the source) the rail and dropdown give way to one titled carousel
 * per decade ("2020's" ...), one card per view; the card nodes are moved, not cloned.
 */

let instanceCount = 0;

// below the source tablet breakpoint the timeline is grouped into one carousel per decade
const MOBILE_QUERY = '(max-width: 767px)';

const YEAR_RE = /\b(1[0-9]{3}|20[0-9]{2})\b/;

/**
 * Finds the milestone year in a card's content cell.
 * @param {Element} content
 * @returns {number|null}
 */
function findYear(content) {
  const candidate = content.querySelector('h1, h2, h3, h4, h5, h6, strong, b, p') || content;
  const match = candidate.textContent.match(YEAR_RE) || content.textContent.match(YEAR_RE);
  return match ? Number(match[1]) : null;
}

function buildCard(row, index, uid) {
  const item = document.createElement('li');
  item.className = 'carousel-timeline-item';
  item.id = `${uid}-item-${index}`;

  const card = document.createElement('div');
  card.className = 'carousel-timeline-card';

  const cells = [...row.children];
  let image = null;
  let content = null;
  cells.forEach((cell) => {
    const onlyMedia = cell.querySelector('picture, img') && !cell.textContent.trim();
    if (onlyMedia && !image) {
      image = cell;
      image.className = 'carousel-timeline-card-image';
    } else if (!content) {
      content = cell;
      content.className = 'carousel-timeline-card-body';
    } else {
      // extra cells are appended to the body rather than dropped
      content.append(...cell.childNodes);
    }
  });

  if (image) {
    const img = image.querySelector('img');
    if (img) {
      const picture = createOptimizedPicture(img.src, img.alt || '', false, [{ width: '600' }]);
      image.replaceChildren(picture);
    }
    card.append(image);
  }
  if (content) {
    // the year heading: whatever heading level the author used
    const heading = content.querySelector('h1, h2, h3, h4, h5, h6');
    if (heading) {
      heading.classList.add('carousel-timeline-year');
      if (!heading.id) heading.id = `${uid}-year-${index}`;
      item.setAttribute('aria-labelledby', heading.id);
    }
    card.append(content);
    const year = findYear(content);
    if (year) item.dataset.decade = String(Math.floor(year / 10) * 10);
  }

  item.append(card);
  return item;
}

function buildSelect(items, uid, onPick) {
  const decades = [];
  items.forEach((item) => {
    const { decade } = item.dataset;
    if (decade && !decades.includes(decade)) decades.push(decade);
  });
  if (decades.length < 2) return null;

  const wrap = document.createElement('div');
  wrap.className = 'carousel-timeline-controls';
  const label = document.createElement('label');
  label.className = 'carousel-timeline-select-label';
  label.htmlFor = `${uid}-decade`;
  label.textContent = 'AIG Timeline';
  const select = document.createElement('select');
  select.className = 'carousel-timeline-select';
  select.id = `${uid}-decade`;
  const placeholder = new Option('Select Decade', '', true, true);
  placeholder.disabled = true;
  select.append(placeholder);
  decades.forEach((decade) => select.append(new Option(`${decade}s`, decade)));
  select.addEventListener('change', () => onPick(select.value));
  wrap.append(label, select);
  return wrap;
}

function updateButtons(track, prev, next) {
  const max = track.scrollWidth - track.clientWidth;
  prev.disabled = track.scrollLeft <= 2;
  next.disabled = track.scrollLeft >= max - 2;
}

function scrollToItem(track, item) {
  const left = item.offsetLeft - track.firstElementChild.offsetLeft;
  track.scrollTo({ left, behavior: 'smooth' });
}

/**
 * A scrolling track between previous / next edge controls.
 * @param {string} id track id
 * @returns {{ stage: HTMLElement, track: HTMLUListElement, sync: Function }}
 */
function buildStage(id) {
  const track = document.createElement('ul');
  track.className = 'carousel-timeline-track';
  track.id = id;

  const stage = document.createElement('div');
  stage.className = 'carousel-timeline-stage';

  const prev = document.createElement('button');
  prev.type = 'button';
  prev.className = 'carousel-timeline-prev';
  prev.setAttribute('aria-label', 'Previous');
  prev.setAttribute('aria-controls', id);
  const next = document.createElement('button');
  next.type = 'button';
  next.className = 'carousel-timeline-next';
  next.setAttribute('aria-label', 'Next');
  next.setAttribute('aria-controls', id);

  const step = (dir) => {
    const item = track.firstElementChild;
    if (!item) return;
    const { marginRight } = getComputedStyle(item);
    track.scrollBy({ left: dir * (item.offsetWidth + (parseFloat(marginRight) || 0)), behavior: 'smooth' });
  };
  prev.addEventListener('click', () => step(-1));
  next.addEventListener('click', () => step(1));

  stage.append(prev, track, next);

  const sync = () => {
    stage.classList.toggle('carousel-timeline-stage-single', track.children.length < 2);
    updateButtons(track, prev, next);
  };
  track.addEventListener('scroll', sync, { passive: true });
  new ResizeObserver(sync).observe(track);
  return { stage, track, sync };
}

export default function decorate(block) {
  instanceCount += 1;
  const uid = `carousel-timeline-${instanceCount}`;
  block.setAttribute('role', 'region');
  block.setAttribute('aria-roledescription', 'Carousel');
  block.setAttribute('aria-label', 'Timeline');

  const rows = [...block.children]
    .filter((row) => row.children.length && (row.textContent.trim() || row.querySelector('picture, img')));
  const items = rows.map((row, i) => buildCard(row, i, uid));

  // desktop / tablet: one rail with every milestone
  const main = buildStage(`${uid}-track`);
  main.stage.classList.add('carousel-timeline-rail');

  // mobile: one titled carousel per decade (consecutive milestones of the same decade)
  const groups = [];
  items.forEach((item) => {
    const { decade } = item.dataset;
    const last = groups[groups.length - 1];
    if (last && (!decade || last.decade === decade)) last.items.push(item);
    else groups.push({ decade, items: [item] });
  });
  const decadesWrap = document.createElement('div');
  decadesWrap.className = 'carousel-timeline-decades';
  groups.forEach((group, i) => {
    const section = document.createElement('div');
    section.className = 'carousel-timeline-decade';
    const built = buildStage(`${uid}-decade-${i}`);
    if (group.decade) {
      const title = document.createElement('h3');
      title.className = 'carousel-timeline-decade-title';
      title.id = `${uid}-decade-title-${i}`;
      title.textContent = `${group.decade}'s`;
      section.setAttribute('aria-labelledby', title.id);
      section.append(title);
    }
    section.setAttribute('role', 'group');
    section.append(built.stage);
    decadesWrap.append(section);
    group.built = built;
  });

  const controls = buildSelect(items, uid, (decade) => {
    const target = items.find((item) => item.dataset.decade === decade);
    if (target) scrollToItem(main.track, target);
  });

  block.replaceChildren(...(controls ? [controls] : []), main.stage, decadesWrap);
  if (items.length < 2) block.classList.add('carousel-timeline-single');

  // the same card nodes move between the two layouts at the source breakpoint
  const mq = window.matchMedia(MOBILE_QUERY);
  const layout = () => {
    if (mq.matches) {
      groups.forEach((group) => {
        group.built.track.append(...group.items);
        group.built.track.scrollLeft = 0;
      });
    } else {
      main.track.append(...items);
    }
    main.sync();
    groups.forEach((group) => group.built.sync());
  };
  mq.addEventListener('change', layout);
  layout();
}
