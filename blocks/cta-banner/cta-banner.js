/*
 * CTA banner block: a call-to-action band (heading, supporting text, 1-2 CTA buttons).
 * Content contract: one row; cells are merged in order (heading, text, links).
 * An optional picture-only cell becomes a background image.
 */
export default function decorate(block) {
  const content = document.createElement('div');
  content.className = 'cta-banner-content';
  const text = document.createElement('div');
  text.className = 'cta-banner-text';
  let background = null;

  [...block.children].forEach((row) => {
    [...row.children].forEach((cell) => {
      const pic = cell.querySelector('picture');
      if (pic && !cell.textContent.trim() && !background) {
        background = document.createElement('div');
        background.className = 'cta-banner-background';
        background.append(pic);
      } else {
        text.append(...cell.childNodes);
      }
    });
  });

  // standalone links become a CTA group (outlined buttons)
  const ctaParas = [...text.querySelectorAll('p')].filter((p) => {
    const links = p.querySelectorAll('a');
    return links.length && [...links].map((a) => a.textContent).join('').trim() === p.textContent.trim();
  });
  content.append(text);
  if (ctaParas.length) {
    const group = document.createElement('div');
    group.className = 'cta-banner-actions';
    ctaParas.forEach((p) => {
      p.querySelectorAll('a').forEach((a) => {
        // replace the global arrow-link decoration with the banner's outlined button
        a.classList.remove('link', 'primary', 'secondary', 'accent');
        a.classList.add('button', 'cta-banner-cta');
      });
      group.append(p);
    });
    content.append(group);
  }

  block.replaceChildren(...(background ? [background] : []), content);
  if (background) block.classList.add('cta-banner-has-background');
}
