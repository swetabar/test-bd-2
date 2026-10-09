/* eslint-disable */
/* global WebImporter */
/**
 * Parser for social-share. Base: embed (custom block). Template: article-page.
 * Source: https://www.aig.com/home/newsroom/stories/aig-is-honored-as-a-top-early-career-employer
 * Selector: .container.article-2023 .sharing
 *   (not main-scoped: on 4 stories the article container is a sibling of <main>)
 * Source shape: .sharethis > ul > li.facebook | li.linkedin | li.email (+ .email-modal popup,
 *   removed by aig-cleanup). The Facebook anchor is often re-rendered as an FB plugin iframe
 *   with no text, so networks are read from the <li> class names, never from link text.
 * Output (1 column, 1 row, per blocks/social-share/README.md): a list naming each network in
 *   source order. Facebook / LinkedIn / X items link to the source share URL (the authored link
 *   overrides the block's generated one); email ("#" on the source) is plain text so the block
 *   builds its own mailto: link.
 */
const LABELS = { facebook: 'Facebook', linkedin: 'LinkedIn', x: 'X', email: 'Email' };

function absUrl(href, document) {
  try {
    const base = document.location && document.location.href !== 'about:blank'
      ? document.location.href : 'https://www.aig.com/home';
    return new URL(href, base).href;
  } catch (e) {
    return href;
  }
}

function networkOf(li) {
  const cls = ` ${(li.getAttribute('class') || '').toLowerCase()} `;
  if (/facebook|\bfb\b/.test(cls)) return 'facebook';
  if (/linkedin/.test(cls)) return 'linkedin';
  if (/twitter|\sx\s/.test(cls)) return 'x';
  if (/e-?mail|\smail\s/.test(cls)) return 'email';
  // Fallback: link target, then visible text
  const a = li.querySelector('a[href]');
  const probe = `${a ? a.getAttribute('href') : ''} ${li.textContent || ''}`.toLowerCase();
  if (probe.includes('facebook.com')) return 'facebook';
  if (probe.includes('linkedin.com')) return 'linkedin';
  if (probe.includes('twitter.com') || probe.includes('x.com/')) return 'x';
  if (probe.includes('mailto:') || /\bmail\b/.test(probe)) return 'email';
  return null;
}

export default function parse(element, { document }) {
  let items = [...element.querySelectorAll('.sharethis > ul > li')];
  if (!items.length) {
    items = [...element.querySelectorAll('li')].filter((li) => !li.closest('.email-modal, .emailbox'));
  }

  const ul = document.createElement('ul');
  const seen = new Set();
  items.forEach((item) => {
    const network = networkOf(item);
    if (!network || seen.has(network)) return;
    seen.add(network);
    const li = document.createElement('li');
    const link = item.querySelector('a[href]');
    const href = link && (link.getAttribute('href') || '').trim();
    if (network !== 'email' && href && /^(https?:)?\/\//i.test(href)) {
      const a = document.createElement('a');
      a.href = absUrl(href, document);
      a.textContent = LABELS[network];
      li.append(a);
    } else {
      li.textContent = LABELS[network];
    }
    ul.append(li);
  });

  if (!ul.children.length) {
    element.replaceWith(...element.childNodes);
    return;
  }

  const block = WebImporter.Blocks.createBlock(document, { name: 'social-share', cells: [[ul]] });
  element.replaceWith(block);
}
