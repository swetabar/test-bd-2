/*
 * Cards (related) block: text-only related-link cards (title + "Learn more" link).
 * Content contract: one row per card; cells are merged into one body
 * (title text/heading, optional description, link). Images, if authored, are ignored structurally
 * but kept in the DOM.
 */
export default function decorate(block) {
  const ul = document.createElement('ul');
  ul.className = 'cards-related-list';

  [...block.children].forEach((row) => {
    const li = document.createElement('li');
    li.className = 'cards-related-item';
    const body = document.createElement('div');
    body.className = 'cards-related-body';
    [...row.children].forEach((cell) => body.append(...cell.childNodes));
    if (!body.textContent.trim()) return;

    // the trailing standalone link becomes the card CTA
    const links = [...body.querySelectorAll('a')];
    const cta = links[links.length - 1];
    if (cta) {
      const holder = cta.closest('p') || cta;
      if (holder.textContent.trim() === cta.textContent.trim()) {
        holder.classList.add('cards-related-cta');
      }
    }

    li.append(body);
    ul.append(li);
  });

  block.replaceChildren(ul);
}
