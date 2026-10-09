import { createOptimizedPicture } from '../../scripts/aem.js';

/*
 * Feature panel block: full-bleed background image with an overlaid text panel
 * (heading, paragraph, CTA) on the left.
 * Content contract: one row, cells = image | text (order-independent: the picture-only cell is
 * the background). Without an image the panel renders on its own.
 */
export default function decorate(block) {
  const panel = document.createElement('div');
  panel.className = 'feature-panel-content';
  let background = null;

  [...block.children].forEach((row) => {
    [...row.children].forEach((cell) => {
      const pic = cell.querySelector('picture');
      if (pic && !cell.textContent.trim() && !background) {
        background = document.createElement('div');
        background.className = 'feature-panel-image';
        const img = pic.querySelector('img');
        background.append(img
          ? createOptimizedPicture(img.src, img.alt || '', false, [
            { media: '(min-width: 900px)', width: '2000' },
            { width: '900' },
          ])
          : pic);
      } else {
        panel.append(...cell.childNodes);
      }
    });
  });

  panel.querySelectorAll('p').forEach((p) => {
    const a = p.querySelector(':scope > a');
    if (a && p.textContent.trim() === a.textContent.trim()) {
      p.classList.add('feature-panel-cta');
      a.classList.add('feature-panel-button');
    }
  });

  block.replaceChildren(...(background ? [background] : []), panel);
  if (!background) block.classList.add('feature-panel-no-image');
}
