/**
 * Helpers for header/footer fragments (nav.plain.html, footer.plain.html) so they render the
 * same from the local preview (raw authored markup) and from Document Authoring delivery.
 */

/**
 * Turns icon tokens into code-hosted images (/icons/<name>.svg): Document Authoring delivers
 * `:name:` as <span class="icon icon-name">, the raw local fragment keeps the literal token.
 * The image alt comes from the enclosing link's title.
 * @param {Element} root
 */
export function iconsToImages(root) {
  const toImg = (name, ref) => {
    const img = document.createElement('img');
    img.src = `${window.hlx.codeBasePath}/icons/${name}.svg`;
    img.alt = ref.closest('a')?.title || name;
    return img;
  };
  root.querySelectorAll('span.icon').forEach((span) => {
    const cls = [...span.classList].find((c) => c.startsWith('icon-'));
    if (cls) span.replaceWith(toImg(cls.substring(5), span));
  });
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  const tokens = [];
  while (walker.nextNode()) {
    if (/^\s*:[a-z0-9-]+:\s*$/.test(walker.currentNode.textContent)) tokens.push(walker.currentNode);
  }
  tokens.forEach((node) => {
    node.replaceWith(toImg(node.textContent.trim().slice(1, -1), node.parentElement));
  });
}

/**
 * Document Authoring delivers fragments with list-item content wrapped in <p>
 * (<li><p><a>…</a></p><ul>…) and images wrapped in <picture>. Unwrap both so the fragment
 * has the same shape as the authored/local markup (<li><a>…</a><ul>…, <img>), and turn
 * icon tokens into images.
 * @param {Element} root
 */
export function normalizeFragment(root) {
  root.querySelectorAll('li > p').forEach((p) => p.replaceWith(...p.childNodes));
  root.querySelectorAll('picture').forEach((picture) => {
    const img = picture.querySelector('img');
    if (img) picture.replaceWith(img);
  });
  iconsToImages(root);
}
