import { createOptimizedPicture } from '../../scripts/aem.js';

/*
 * Cards (icon) block: centered icon/pictogram cards (icon, heading, text) shown in a
 * slider that mirrors the source slick carousel (.aig-carousel > .aig-productcard):
 * 3 cards per view from 1024px, 2 from 768px, 1 below; prev/next arrows and square dots
 * appear only when the cards overflow. Each arrow click moves one full page.
 * Content contract: one row per card, cells = icon/image | body (heading, text, links).
 * A single-cell row whose first element is a picture or :icon: is split into icon + body.
 * Options: dark-grey (charcoal heading/description, as on the students page).
 */

const VISIBLE_PROP = '--cards-icon-visible';

function buildArrow(dir) {
  const btn = document.createElement('button');
  btn.type = 'button';
  btn.className = `cards-icon-arrow cards-icon-${dir}`;
  btn.setAttribute('aria-label', dir === 'prev' ? 'Previous' : 'Next');
  return btn;
}

/**
 * Paged slider over a native scroll-snap viewport.
 * Slides per view (and per page) come from the CSS custom property, so breakpoints live in CSS.
 */
function setupSlider(block, viewport, slides) {
  const prev = buildArrow('prev');
  const next = buildArrow('next');
  const dots = document.createElement('div');
  dots.className = 'cards-icon-dots';
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

export default function decorate(block) {
  const ul = document.createElement('ul');
  ul.className = 'cards-icon-list';

  [...block.children].forEach((row) => {
    const card = document.createElement('div');
    card.className = 'cards-icon-card';
    const cells = [...row.children];

    cells.forEach((cell) => {
      if (!cell.textContent.trim() && !cell.querySelector('picture, img, .icon, svg')) return;
      const onlyMedia = cell.querySelector('picture, img, .icon, svg') && !cell.textContent.trim();
      if (onlyMedia && !card.querySelector('.cards-icon-image')) {
        cell.className = 'cards-icon-image';
      } else {
        cell.className = 'cards-icon-body';
      }
      card.append(cell);
    });

    // single cell holding the icon followed by text: lift the icon into its own wrapper
    if (!card.querySelector('.cards-icon-image')) {
      const body = card.querySelector('.cards-icon-body');
      const first = body?.firstElementChild;
      const isMedia = first && !first.textContent.trim()
        && (first.matches('picture') || first.querySelector('picture, .icon'));
      if (isMedia) {
        const imageCell = document.createElement('div');
        imageCell.className = 'cards-icon-image';
        imageCell.append(first);
        card.prepend(imageCell);
      }
    }

    if (!card.children.length) return;
    const li = document.createElement('li');
    li.className = 'cards-icon-item';
    li.append(card);
    ul.append(li);
  });

  ul.querySelectorAll('picture > img').forEach((img) => {
    img.closest('picture').replaceWith(createOptimizedPicture(img.src, img.alt || '', false, [{ width: '240' }]));
  });

  const viewport = document.createElement('div');
  viewport.className = 'cards-icon-viewport';
  viewport.append(ul);
  block.replaceChildren(viewport);

  const slides = [...ul.children];
  if (slides.length) setupSlider(block, viewport, slides);
}
