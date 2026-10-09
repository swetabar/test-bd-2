/*
 * Columns (text) block: equal-width text columns (heading, text, optional links).
 * Content contract: each row holds N cells, one per column (2-4 typical).
 * Rows are flattened into one track so authors may also put one column per row.
 * Optional background: a first row with a single image-only cell becomes the section background.
 * When there are more columns than fit (always on mobile), the track becomes a carousel
 * with previous/next arrows and dots (mirrors the source slick carousel).
 * Options: glance (white stat/fact cards), narrow (4-up centred slots).
 * Glance over a background row (landing pages): heading-led columns render as article
 * cards; copy / figure heading / caption columns render as centred stat cards.
 */

const OPTION_CLASSES = ['glance', 'narrow'];

function isImageOnly(cell) {
  return !!cell && !!cell.querySelector('picture, img') && !cell.textContent.trim();
}

/* first row = one image-only cell (and more rows follow): use it as the section background */
function extractBackground(block) {
  const rows = [...block.children];
  if (rows.length < 2) return;
  const [first] = rows;
  const cells = [...first.children];
  if (cells.length !== 1 || !isImageOnly(cells[0])) return;
  const picture = cells[0].querySelector('picture') || cells[0].querySelector('img');
  first.remove();
  block.classList.add('columns-text-bg');
  const section = block.closest('.section');
  const bg = document.createElement('div');
  bg.className = 'columns-text-background';
  bg.append(picture);
  if (section) {
    section.classList.add('columns-text-has-background');
    section.prepend(bg);
  } else {
    block.prepend(bg);
  }
}

function buildArrow(dir) {
  const btn = document.createElement('button');
  btn.type = 'button';
  btn.className = `columns-text-arrow columns-text-${dir}`;
  btn.setAttribute('aria-label', dir === 'prev' ? 'Previous' : 'Next');
  return btn;
}

function setupCarousel(block, viewport, slides) {
  const prev = buildArrow('prev');
  const next = buildArrow('next');
  const dots = document.createElement('div');
  dots.className = 'columns-text-dots';
  block.append(prev, next, dots);

  let visible = 0;
  let pages = 1;
  let index = 0;

  const slideWidth = () => slides[0].getBoundingClientRect().width || 1;

  const update = () => {
    index = Math.min(pages - 1, Math.max(0, Math.round(viewport.scrollLeft / slideWidth())));
    prev.disabled = index === 0;
    next.disabled = index >= pages - 1;
    [...dots.children].forEach((dot, i) => {
      const active = i === index;
      dot.classList.toggle('active', active);
      if (active) dot.setAttribute('aria-current', 'true');
      else dot.removeAttribute('aria-current');
    });
  };

  const goTo = (i) => {
    const target = Math.min(pages - 1, Math.max(0, i));
    viewport.scrollTo({ left: target * slideWidth(), behavior: 'smooth' });
  };

  const layout = () => {
    const v = parseInt(getComputedStyle(block).getPropertyValue('--columns-text-visible'), 10) || 1;
    const isCarousel = slides.length > v;
    block.classList.toggle('is-carousel', isCarousel);
    if (v !== visible) {
      visible = v;
      pages = isCarousel ? slides.length - v + 1 : 1;
      dots.replaceChildren(...Array.from({ length: isCarousel ? pages : 0 }, (_, i) => {
        const dot = document.createElement('button');
        dot.type = 'button';
        dot.setAttribute('aria-label', `${i + 1} of ${pages}`);
        dot.addEventListener('click', () => goTo(i));
        return dot;
      }));
      if (!isCarousel) viewport.scrollLeft = 0;
    }
    update();
  };

  prev.addEventListener('click', () => goTo(index - 1));
  next.addEventListener('click', () => goTo(index + 1));

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
  const active = [...block.classList].filter((c) => OPTION_CLASSES.includes(c));

  extractBackground(block);

  const cols = [];
  [...block.children].forEach((row) => {
    [...row.children].forEach((cell) => {
      if (!cell.textContent.trim() && !cell.querySelector('picture, a')) return;
      cell.className = 'columns-text-column';
      cell.querySelectorAll('p').forEach((p) => {
        // standalone links become a stacked link list
        const a = p.querySelector(':scope > a');
        if (a && p.textContent.trim() === a.textContent.trim()) p.classList.add('columns-text-link');
        // paragraph holding only an image is the column icon
        if (isImageOnly(p)) p.classList.add('columns-text-icon');
      });
      if (active.includes('glance')) cell.classList.add('columns-text-box');
      cols.push(cell);
    });
  });

  // glance over a background: columns led by copy with a heading in the middle are
  // "stat" cards (pretitle / big figure / caption, source infographic cards)
  if (active.includes('glance') && block.classList.contains('columns-text-bg') && cols.length
    && cols.every((col) => {
      const first = col.firstElementChild;
      return first && !/^H[1-6]$/.test(first.tagName) && col.querySelector('h1, h2, h3, h4, h5, h6');
    })) {
    block.classList.add('columns-text-stats');
  }

  const slides = cols.map((col) => {
    const slide = document.createElement('div');
    slide.className = 'columns-text-slide';
    slide.append(col);
    return slide;
  });

  const grid = document.createElement('div');
  grid.className = 'columns-text-grid';
  grid.dataset.count = String(Math.min(cols.length, 4));
  grid.append(...slides);

  const viewport = document.createElement('div');
  viewport.className = 'columns-text-viewport';
  viewport.append(grid);

  block.replaceChildren(viewport);
  if (cols.length > 3) block.classList.add('columns-text-many');

  if (slides.length) setupCarousel(block, viewport, slides);
}
