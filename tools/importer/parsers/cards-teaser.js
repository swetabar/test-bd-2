/* eslint-disable */
/* global WebImporter */
/**
 * Parser for cards-teaser. Base: cards. Source: https://www.aig.com/home
 * Selector: .hero-banner-2022 .container.paleblue
 * Output: one row per teaser card: image | h2 title, description, CTA link.
 * Iterates the inner .cmp-teaser wrapper (block-level) rather than any anchor.
 */
export default function parse(element, { document }) {
  let teasers = [...element.querySelectorAll('.teaserflex .cmp-teaser')];
  if (!teasers.length) teasers = [...element.querySelectorAll('.cmp-teaser')];

  const cells = [];
  teasers.forEach((teaser) => {
    const img = teaser.querySelector('.cmp-teaser__image img, img');
    const content = teaser.querySelector('.cmp-teaser__content') || teaser;

    const textCell = [];
    const title = content.querySelector('.cmp-teaser__title, h2, h3');
    if (title) {
      const level = /^H[1-6]$/.test(title.tagName) ? title.tagName.toLowerCase() : 'h2';
      const heading = document.createElement(level);
      heading.textContent = title.textContent.trim();
      textCell.push(heading);
    }
    const desc = content.querySelector('.cmp-teaser__description');
    if (desc) {
      const paras = [...desc.querySelectorAll('p')];
      if (paras.length) textCell.push(...paras);
      else if (desc.textContent.trim()) {
        const p = document.createElement('p');
        p.textContent = desc.textContent.trim();
        textCell.push(p);
      }
    }
    let ctas = [...content.querySelectorAll('.cmp-teaser__action-link')];
    if (!ctas.length) {
      // No explicit CTA: keep the title link so the card stays clickable
      const titleLink = title && title.querySelector('a[href]');
      if (titleLink) ctas = [titleLink];
    }
    ctas.forEach((a) => {
      const p = document.createElement('p');
      p.append(a);
      textCell.push(p);
    });

    if (!img && !textCell.length) return;
    cells.push([img || '', textCell]);
  });

  if (!cells.length) {
    element.replaceWith(...element.childNodes);
    return;
  }

  const block = WebImporter.Blocks.createBlock(document, { name: 'cards-teaser', cells });
  element.replaceWith(block);
}
