import { createOptimizedPicture } from '../../scripts/aem.js';

/*
 * Carousel (leadership) block: people carousel, portrait + linked name, 2 / 4 / 6 per view
 * (mobile / tablet / desktop), side previous/next arrows and page dots. The person whose
 * link matches the current page is marked as current and scrolled into view.
 * Content contract: one row per person,
 * cells = portrait image | name (link to bio page), optional title.
 * A single cell holding both picture and link is also accepted.
 */

let instance = 0;

function normalizePath(path) {
  return path.replace(/\.html$/, '').replace(/\/+$/, '');
}

/**
 * True when the link target is the page being viewed. Bio links are authored as absolute
 * production URLs (e.g. /home/about/...), while the page itself may be served under a
 * different prefix (e.g. /content/home/about/...), so match on whole trailing path segments.
 */
function isCurrentPage(href) {
  try {
    const target = normalizePath(new URL(href, window.location.href).pathname).split('/').filter(Boolean);
    const here = normalizePath(window.location.pathname).split('/').filter(Boolean);
    const [shorter, longer] = target.length <= here.length ? [target, here] : [here, target];
    if (!shorter.length) return false;
    const tail = longer.slice(longer.length - shorter.length);
    return shorter.every((segment, i) => segment === tail[i]);
  } catch {
    return false;
  }
}

function pageCount(track) {
  const slide = track.querySelector('.carousel-leadership-slide');
  if (!slide || !slide.offsetWidth) return 1;
  const perView = Math.max(1, Math.round(track.clientWidth / slide.offsetWidth));
  return Math.max(1, Math.ceil(track.children.length / perView));
}

function update(block) {
  const track = block.querySelector('.carousel-leadership-slides');
  const prev = block.querySelector('.carousel-leadership-prev');
  const next = block.querySelector('.carousel-leadership-next');
  const dots = block.querySelector('.carousel-leadership-dots');
  const maxScroll = track.scrollWidth - track.clientWidth;
  const overflow = maxScroll > 2;
  block.classList.toggle('carousel-leadership-has-overflow', overflow);
  if (prev) prev.disabled = track.scrollLeft <= 2;
  if (next) next.disabled = track.scrollLeft >= maxScroll - 2;

  if (!dots) return;
  const pages = pageCount(track);
  if (dots.children.length !== pages) {
    dots.replaceChildren(...Array.from({ length: pages }, (_, i) => {
      const li = document.createElement('li');
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.setAttribute('aria-label', `Show page ${i + 1} of ${pages}`);
      btn.addEventListener('click', () => {
        track.scrollTo({ left: i * track.clientWidth, behavior: 'smooth' });
      });
      li.append(btn);
      return li;
    }));
  }
  const page = Math.round(track.scrollLeft / Math.max(1, track.clientWidth));
  const current = Math.min(pages - 1, page);
  [...dots.querySelectorAll('button')].forEach((btn, i) => {
    if (i === current) btn.setAttribute('aria-current', 'true');
    else btn.removeAttribute('aria-current');
  });
}

export default function decorate(block) {
  instance += 1;
  block.id = block.id || `carousel-leadership-${instance}`;
  block.setAttribute('role', 'region');
  block.setAttribute('aria-roledescription', 'Carousel');

  const track = document.createElement('ul');
  track.className = 'carousel-leadership-slides';

  [...block.children].forEach((row) => {
    if (!row.textContent.trim() && !row.querySelector('picture')) return;
    const li = document.createElement('li');
    li.className = 'carousel-leadership-slide';
    const picture = row.querySelector('picture');
    const link = row.querySelector('a');

    const media = document.createElement('div');
    media.className = 'carousel-leadership-image';
    if (picture) media.append(picture);

    const body = document.createElement('div');
    body.className = 'carousel-leadership-body';
    [...row.children].forEach((cell) => {
      if (cell.textContent.trim()) body.append(...cell.childNodes);
    });
    // names are plain links here, not the site's auto-decorated arrow buttons
    body.querySelectorAll('a.button').forEach((a) => a.classList.remove('button', 'link', 'primary', 'secondary', 'accent'));
    body.querySelectorAll('p.button-wrapper').forEach((p) => {
      if (p.children.length === 1 && p.firstElementChild.tagName === 'A') p.replaceWith(...p.childNodes);
      else p.classList.remove('button-wrapper');
    });

    if (link) {
      // portrait links to the same bio page as the name
      const href = link.getAttribute('href');
      const mediaLink = document.createElement('a');
      mediaLink.href = href;
      mediaLink.tabIndex = -1;
      mediaLink.setAttribute('aria-hidden', 'true');
      mediaLink.append(...media.childNodes);
      media.append(mediaLink);
      if (isCurrentPage(href)) {
        li.classList.add('carousel-leadership-current');
        link.setAttribute('aria-current', 'page');
      }
    }

    li.append(media, body);
    track.append(li);
  });

  track.querySelectorAll('picture > img').forEach((img) => {
    img.closest('picture').replaceWith(createOptimizedPicture(img.src, img.alt || '', false, [{ width: '400' }]));
  });

  const viewport = document.createElement('div');
  viewport.className = 'carousel-leadership-viewport';
  viewport.append(track);

  const controls = [];
  if (track.children.length > 1) {
    const prev = document.createElement('button');
    prev.type = 'button';
    prev.className = 'carousel-leadership-prev';
    prev.setAttribute('aria-label', 'Previous');
    track.id = `${block.id}-slides`;
    prev.setAttribute('aria-controls', track.id);
    const next = document.createElement('button');
    next.type = 'button';
    next.className = 'carousel-leadership-next';
    next.setAttribute('aria-label', 'Next');
    next.setAttribute('aria-controls', track.id);
    prev.addEventListener('click', () => track.scrollBy({ left: -track.clientWidth, behavior: 'smooth' }));
    next.addEventListener('click', () => track.scrollBy({ left: track.clientWidth, behavior: 'smooth' }));
    viewport.prepend(prev);
    viewport.append(next);

    const dots = document.createElement('ol');
    dots.className = 'carousel-leadership-dots';
    controls.push(dots);
  }

  block.replaceChildren(viewport, ...controls);

  // the block bleeds to the viewport edges; compensate for a classic (space-taking) scrollbar
  const setScrollbar = () => {
    const sbw = Math.max(0, window.innerWidth - document.documentElement.clientWidth);
    block.style.setProperty('--carousel-leadership-scrollbar', `${sbw}px`);
  };
  setScrollbar();

  // bring the current person into view once the block has been laid out
  const current = track.querySelector('.carousel-leadership-current');
  let positioned = !current;
  const onResize = () => {
    setScrollbar();
    if (!positioned && track.clientWidth) {
      positioned = true;
      track.scrollTo({ left: current.offsetLeft - track.firstElementChild.offsetLeft, behavior: 'instant' });
    }
    update(block);
  };

  track.addEventListener('scroll', () => update(block), { passive: true });
  new ResizeObserver(onResize).observe(track);
  update(block);
}
