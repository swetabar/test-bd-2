import { createOptimizedPicture } from '../../scripts/aem.js';

/**
 * Cards (teaser) — repeating teaser items, each a thumbnail image beside
 * a heading, paragraph and link.
 * Content contract: one row per card, cells = image | heading, text, link.
 * Cells may be omitted (text-only card) or ordered either way.
 * @param {Element} block
 */
export default function decorate(block) {
  const ul = document.createElement('ul');

  [...block.children].forEach((row) => {
    const li = document.createElement('li');
    li.className = 'cards-teaser-card';
    const image = document.createElement('div');
    image.className = 'cards-teaser-card-image';
    const body = document.createElement('div');
    body.className = 'cards-teaser-card-body';

    [...row.children].forEach((cell) => {
      const pic = cell.querySelector('picture');
      const isImageOnly = pic && !cell.textContent.trim();
      if (isImageOnly && !image.children.length) {
        image.append(pic);
      } else {
        while (cell.firstChild) body.append(cell.firstChild);
      }
    });

    // a picture authored inside the text cell is promoted to the image slot
    if (!image.children.length) {
      const strayPic = body.querySelector('picture');
      if (strayPic) {
        const parent = strayPic.parentElement;
        image.append(strayPic);
        const emptyParent = !parent.textContent.trim() && !parent.children.length;
        if (parent !== body && emptyParent) parent.remove();
      }
    }

    if (image.children.length) li.append(image);
    else li.classList.add('cards-teaser-card-no-image');
    if (body.childNodes.length) li.append(body);
    if (li.children.length) ul.append(li);
  });

  ul.querySelectorAll('picture > img').forEach((img) => {
    img.closest('picture').replaceWith(
      createOptimizedPicture(img.src, img.alt || '', false, [{ width: '500' }]),
    );
  });

  block.replaceChildren(ul);
}
