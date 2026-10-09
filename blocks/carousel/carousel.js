import { createOptimizedPicture } from '../../scripts/aem.js';

/*
 * Carousel block: a row of white article cards (optional image, eyebrow, heading, text, link)
 * in a slider that mirrors the source slick carousel (.aig-carousel > .aig-article-card):
 * 3 cards per view from 768px, 1 below; prev/next arrows and square dots appear only when
 * the cards overflow, and each arrow click moves one full page.
 * Content contract: one row per slide, cells = optional image/icon cell | content cell
 * (optional eyebrow paragraph, heading, text, links). A row with a single cell is content only.
 * Story rows (an eyebrow paragraph above the heading) use the wider 3-col card gutters.
 */

const VISIBLE_PROP = '--carousel-visible';
const SITE_HOSTS = ['aig.com', 'www.aig.com'];
const DOC_RE = /\.(pdf|mp3|mp4|webm|docx?|xlsx?|pptx?|zip)$/i;

let carouselId = 0;

/* links the source marks with the external-link glyph: other hosts and documents */
function isExternal(a) {
  try {
    const url = new URL(a.href, window.location.href);
    if (DOC_RE.test(url.pathname)) return true;
    return url.hostname !== window.location.hostname && !SITE_HOSTS.includes(url.hostname);
  } catch {
    return false;
  }
}

function buildArrow(dir, id) {
  const btn = document.createElement('button');
  btn.type = 'button';
  btn.className = `carousel-arrow carousel-${dir}`;
  btn.setAttribute('aria-label', dir === 'prev' ? 'Previous' : 'Next');
  btn.setAttribute('aria-controls', id);
  return btn;
}

/**
 * Paged slider over a native scroll-snap viewport.
 * Slides per view (and per page) come from the CSS custom property, so breakpoints live in CSS.
 */
function setupSlider(block, viewport, slides) {
  const prev = buildArrow('prev', viewport.id);
  const next = buildArrow('next', viewport.id);
  const dots = document.createElement('div');
  dots.className = 'carousel-dots';
  block.append(prev, next, dots);

  const count = slides.length;
  let visible = 0;
  let pages = 1;
  let page = 0;

  const slideWidth = () => slides[0].getBoundingClientRect().width || 1;
  const lastStart = () => Math.max(0, count - visible);
  const startOf = (p) => Math.min(p * visible, lastStart());
  const pageOf = (index) => (index >= lastStart() ? pages - 1 : Math.floor(index / visible));

  const update = () => {
    const index = Math.round(viewport.scrollLeft / slideWidth());
    page = Math.min(pages - 1, Math.max(0, pageOf(index)));
    prev.disabled = page === 0;
    next.disabled = page >= pages - 1;
    [...dots.children].forEach((dot, i) => {
      const active = i === page;
      dot.classList.toggle('active', active);
      if (active) dot.setAttribute('aria-current', 'true');
      else dot.removeAttribute('aria-current');
    });
  };

  const goTo = (p) => {
    const target = Math.min(pages - 1, Math.max(0, p));
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    viewport.scrollTo({ left: startOf(target) * slideWidth(), behavior: reduce ? 'auto' : 'smooth' });
  };

  const layout = () => {
    const v = parseInt(getComputedStyle(block).getPropertyValue(VISIBLE_PROP), 10) || 1;
    const isCarousel = count > v;
    block.classList.toggle('is-carousel', isCarousel);
    if (v !== visible) {
      visible = v;
      pages = isCarousel ? 1 + Math.ceil((count - v) / v) : 1;
      dots.replaceChildren(...Array.from({ length: isCarousel ? pages : 0 }, (_, i) => {
        const dot = document.createElement('button');
        dot.type = 'button';
        dot.setAttribute('aria-label', `${i + 1} of ${pages}`);
        dot.setAttribute('aria-controls', viewport.id);
        dot.addEventListener('click', () => goTo(i));
        return dot;
      }));
      viewport.scrollLeft = 0;
    }
    update();
  };

  prev.addEventListener('click', () => goTo(page - 1));
  next.addEventListener('click', () => goTo(page + 1));

  let ticking = false;
  viewport.addEventListener('scroll', () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => {
      ticking = false;
      update();
    });
  }, { passive: true });

  if (window.ResizeObserver) new ResizeObserver(layout).observe(viewport);
  else window.addEventListener('resize', layout);
  layout();
}

function createSlide(row, index, id) {
  const slide = document.createElement('li');
  slide.className = 'carousel-slide';
  slide.id = `carousel-${id}-slide-${index}`;
  const card = document.createElement('div');
  card.className = 'carousel-card';
  slide.append(card);

  [...row.children].forEach((cell) => {
    const hasMedia = cell.querySelector('picture, img, .icon');
    if (!cell.textContent.trim() && !hasMedia) return;
    if (hasMedia && !cell.textContent.trim() && !card.querySelector('.carousel-slide-image')) {
      cell.className = 'carousel-slide-image';
    } else {
      cell.className = 'carousel-slide-content';
    }
    card.append(cell);
  });

  card.querySelectorAll('.carousel-slide-content').forEach((content) => {
    // eyebrow: a plain paragraph directly above the heading (story date/category)
    const first = content.firstElementChild;
    if (first?.tagName === 'P' && !first.classList.contains('button-wrapper')
      && first.nextElementSibling?.matches('h1, h2, h3, h4, h5, h6')) {
      first.classList.add('carousel-slide-pretitle');
    }
    content.querySelectorAll('a.button').forEach((a) => {
      if (isExternal(a)) a.classList.add('carousel-external');
    });
  });

  const heading = card.querySelector('h1, h2, h3, h4, h5, h6');
  if (heading?.id) slide.setAttribute('aria-labelledby', heading.id);
  return slide;
}

export default function decorate(block) {
  carouselId += 1;
  const id = carouselId;
  block.id = `carousel-${id}`;
  block.setAttribute('role', 'region');
  block.setAttribute('aria-roledescription', 'Carousel');

  const rows = [...block.children].filter((row) => row.textContent.trim() || row.querySelector('picture, img'));
  const track = document.createElement('ul');
  track.className = 'carousel-slides';
  rows.forEach((row, i) => track.append(createSlide(row, i, id)));

  track.querySelectorAll('picture > img').forEach((img) => {
    img.closest('picture').replaceWith(
      createOptimizedPicture(img.src, img.alt || '', false, [{ media: '(min-width: 600px)', width: '600' }, { width: '400' }]),
    );
  });

  if (track.querySelector('.carousel-slide-pretitle')) block.classList.add('carousel-stories');

  const viewport = document.createElement('div');
  viewport.className = 'carousel-viewport';
  viewport.id = `carousel-${id}-viewport`;
  viewport.append(track);
  block.replaceChildren(viewport);

  const slides = [...track.children];
  if (slides.length) setupSlider(block, viewport, slides);
}
