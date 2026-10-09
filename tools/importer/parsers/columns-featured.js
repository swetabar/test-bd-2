/* eslint-disable */
/* global WebImporter */
/**
 * Parser for columns-featured. Base: columns. Sources: https://www.aig.com/home (landing-page),
 *   https://www.aig.com/home/risk-solutions/business/multinational (content-page)
 * Selectors:
 *   landing-page: .teaserflex.aig-featured-story
 *   content-page: main .teaserflex.cta-with-image.lightblue   (light tinted panel, default)
 *                 main .container.hero-banner-video            (navy panel -> option "dark")
 * Output: one row: text cell (optional pretitle paragraph, heading, paragraphs/lists, CTA links) |
 *   image cell. Cell order follows the source: .imageleft / .contentRight -> image | text,
 *   otherwise (imageright / contentLeft / none) text | image.
 * The hidden video dialog inside .hero-banner-video (#page-dialog-video-play) is ignored.
 */
function linkText(a) {
  // drop icon-font glyph names (e.g. <span class="custom-icons">external_link</span>)
  const clone = a.cloneNode(true);
  clone.querySelectorAll('.custom-icons, .sr-only').forEach((s) => s.remove());
  return clone.textContent.trim();
}

export default function parse(element, { document }) {
  const isDark = element.matches('.hero-banner-video');
  // Teaser carrying the visible story (skip the hidden dialog video container)
  const teaserRoot = isDark
    ? (element.querySelector('.teaserflex:not([id^="page-dialog-video"] *)') || element)
    : element;

  const img = teaserRoot.querySelector('.cmp-teaser__image img')
    || teaserRoot.querySelector('img:not([id^="page-dialog-video"] img):not(.videocomponent img)')
    || (!isDark ? element.querySelector('img') : null);
  const content = teaserRoot.querySelector('.cmp-teaser__content') || teaserRoot;

  const textCell = [];
  const pre = content.querySelector('.cmp-teaser__pretitle');
  if (pre && pre.textContent.trim()) {
    const p = document.createElement('p');
    p.textContent = pre.textContent.trim();
    textCell.push(p);
  }
  const title = content.querySelector('.cmp-teaser__title, h2, h3, h4');
  if (title) {
    const level = /^H[1-6]$/.test(title.tagName) ? title.tagName.toLowerCase() : 'h3';
    const heading = document.createElement(level);
    heading.textContent = title.textContent.trim();
    textCell.push(heading);
  }
  const desc = content.querySelector('.cmp-teaser__description');
  if (desc) {
    const hasRich = !!desc.querySelector(':scope > ul, :scope > ol, :scope > h2, :scope > h3, :scope > h4, :scope > h5');
    const paras = hasRich
      ? [...desc.querySelectorAll(':scope > p, :scope > ul, :scope > ol, :scope > h2, :scope > h3, :scope > h4, :scope > h5')]
        .filter((el) => el.textContent.trim())
      : [...desc.querySelectorAll('p')].filter((p) => p.textContent.trim());
    if (paras.length) textCell.push(...paras);
    else if (desc.textContent.trim()) {
      const p = document.createElement('p');
      p.textContent = desc.textContent.trim();
      textCell.push(p);
    }
  }
  let ctas = [...content.querySelectorAll('.cmp-teaser__action-link')];
  if (!ctas.length && title) {
    const titleLink = title.querySelector('a[href]');
    if (titleLink) ctas = [titleLink];
  }
  ctas.forEach((a) => {
    a.textContent = linkText(a);
    const p = document.createElement('p');
    p.append(a);
    textCell.push(p);
  });

  if (!img && !textCell.length) {
    element.replaceWith(...element.childNodes);
    return;
  }

  const orderEl = teaserRoot.matches('.teaserflex') ? teaserRoot : element;
  const imageFirst = orderEl.classList.contains('imageleft') || orderEl.classList.contains('contentRight');
  const text = textCell.length ? textCell : '';
  const media = img || '';
  const cells = [imageFirst ? [media, text] : [text, media]];
  const block = WebImporter.Blocks.createBlock(document, {
    name: isDark ? 'Columns Featured (dark)' : 'columns-featured',
    cells,
  });
  element.replaceWith(block);
}
