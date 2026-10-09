/*
 * Hero banner block: text-only page-title banner.
 *
 * Content contract (one or more rows; cells are merged in order):
 * - optional list (ul/ol) of links -> breadcrumb trail (last item = current page)
 * - heading (h1/h2) -> page title
 * - optional paragraph(s) -> intro text
 * - optional paragraph(s) containing only links -> CTA group
 * - optional picture-only cell -> background image
 */
export default function decorate(block) {
  const content = document.createElement('div');
  content.className = 'hero-banner-content';
  let background = null;
  let breadcrumbs = null;

  [...block.querySelectorAll(':scope > div > div')].forEach((cell) => {
    const pic = cell.querySelector('picture');
    if (pic && !cell.textContent.trim() && !background) {
      background = document.createElement('div');
      background.className = 'hero-banner-background';
      background.append(pic);
      return;
    }
    [...cell.childNodes].forEach((node) => {
      if (!breadcrumbs && node.nodeType === Node.ELEMENT_NODE && node.matches('ul, ol')) {
        breadcrumbs = document.createElement('nav');
        breadcrumbs.className = 'hero-banner-breadcrumbs';
        breadcrumbs.setAttribute('aria-label', 'Breadcrumb');
        const ol = document.createElement('ol');
        ol.append(...node.children);
        if (ol.lastElementChild) ol.lastElementChild.setAttribute('aria-current', 'page');
        breadcrumbs.append(ol);
      } else if (node.nodeType !== Node.TEXT_NODE || node.textContent.trim()) {
        content.append(node);
      }
    });
  });

  // paragraphs made only of links become the CTA group
  const ctaParas = [...content.querySelectorAll(':scope > p')].filter((p) => {
    const links = [...p.querySelectorAll('a')];
    return links.length && links.map((a) => a.textContent).join('').trim() === p.textContent.trim();
  });
  if (ctaParas.length) {
    const group = document.createElement('div');
    group.className = 'hero-banner-actions';
    ctaParas[0].before(group);
    ctaParas.forEach((p) => {
      p.querySelectorAll('a').forEach((a) => a.classList.add('hero-banner-cta'));
      group.append(p);
    });
  }

  const inner = document.createElement('div');
  inner.className = 'hero-banner-inner';
  if (breadcrumbs) inner.append(breadcrumbs);
  inner.append(content);

  block.replaceChildren(...(background ? [background] : []), inner);
  if (background) block.classList.add('hero-banner-has-background');
}
