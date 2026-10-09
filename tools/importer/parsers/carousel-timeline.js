/* eslint-disable */
/* global WebImporter */
/**
 * Parser for carousel-timeline. Base: carousel.
 * Source: https://www.aig.com/home/about/history (main .container.aig-timeline)
 *
 * Source shape (verified on the live page):
 *   .container.aig-timeline > .cmp-container > .aem-Grid
 *     .text.aig-timeline-title h2            "The AIG Timeline"          -> default content
 *     .container.flexbox-container
 *       .teaserflex .cmp-teaser__description p+  (intro)                 -> default content
 *       .options (Select Decade drop-down)                               -> dropped
 *     .container > ... > .aig-timeline-carousel-container > .aem-Grid
 *       .aig-carousel-3-col (NOT .hideCarousel)   all 24 milestones      -> block rows
 *       .text h2 "2020's" + .aig-carousel-3-col.hideCarousel  x13       -> dropped (per-decade
 *                                                                          duplicates of the above)
 *   Milestone = .teaserflex.aig-timeline-carousel:
 *     .cmp-teaser__image img + .cmp-teaser__description (h2 > b YEAR, ul > li ...)
 *   slick may add .slick-cloned copies (infinite mode) - skipped.
 *
 * Output (library convention: carousel, 2 columns; blocks/carousel-timeline/README.md):
 *   one row per milestone, picture | year heading (h3) + bullet list.
 *   Title + intro are emitted as default content before the block; decade headings and the
 *   Select Decade drop-down are not authored (the block derives decades from the years).
 * Iteration is keyed on the block-level .teaserflex.aig-timeline-carousel wrappers.
 */
export default function parse(element, { document }) {
  const clean = (t) => (t || '').replace(/\s+/g, ' ').trim();
  const isHiddenCopy = (el) => Boolean(el.closest('.hideCarousel, .slick-cloned'));

  // ---- default content kept outside the block (title + intro)
  const defaults = [];
  const titleEl = element.querySelector('.aig-timeline-title h1, .aig-timeline-title h2, .aig-timeline-title h3');
  if (titleEl && clean(titleEl.textContent)) {
    const h2 = document.createElement('h2');
    h2.textContent = clean(titleEl.textContent);
    defaults.push(h2);
  }
  const intro = [...element.querySelectorAll('.teaserflex:not(.aig-timeline-carousel) .cmp-teaser__description')]
    .filter((d) => !d.closest('.aig-carousel, .aig-timeline-carousel-container'));
  intro.forEach((desc) => {
    [...desc.children].forEach((child) => {
      if (clean(child.textContent) || child.querySelector('img, a[href]')) defaults.push(child);
    });
  });

  // ---- milestones: the visible carousel carries all of them; the hidden per-decade carousels
  // repeat subsets. Fall back to every milestone (deduped) if no visible carousel is found.
  let milestones = [...element.querySelectorAll('.aig-timeline-carousel')].filter((m) => !isHiddenCopy(m));
  if (!milestones.length) milestones = [...element.querySelectorAll('.aig-timeline-carousel')].filter((m) => !m.closest('.slick-cloned'));

  const seen = new Set();
  const cells = [];
  milestones.forEach((m) => {
    const desc = m.querySelector('.cmp-teaser__description') || m.querySelector('.cmp-teaser__content') || m;
    const key = clean(desc.textContent);
    if (!key || seen.has(key)) return;
    seen.add(key);

    const img = m.querySelector('.cmp-teaser__image img, img');
    const content = [];
    const heading = desc.querySelector('h1, h2, h3, h4, h5, h6')
      || m.querySelector('.cmp-teaser__title');
    if (heading && clean(heading.textContent)) {
      const h3 = document.createElement('h3');
      h3.textContent = clean(heading.textContent);
      content.push(h3);
    }
    [...desc.children].forEach((child) => {
      if (child === heading || child.contains(heading)) return;
      if (!clean(child.textContent) && !child.querySelector('img, a[href]')) return;
      // trailing <br>s inside list items render as empty lines
      child.querySelectorAll('li').forEach((li) => {
        while (li.lastChild && (li.lastChild.nodeName === 'BR' || (li.lastChild.nodeType === 3 && !li.lastChild.textContent.trim()))) {
          li.lastChild.remove();
        }
      });
      content.push(child);
    });
    if (!content.length) return;
    cells.push([img || '', content]);
  });

  if (!cells.length) {
    element.replaceWith(...element.childNodes);
    return;
  }

  const block = WebImporter.Blocks.createBlock(document, { name: 'carousel-timeline', cells });
  if (defaults.length) element.before(...defaults);
  element.replaceWith(block);
}
