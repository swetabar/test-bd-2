/* eslint-disable */
/* global WebImporter */
/**
 * Parser for cards. Base: cards. Template: content-page.
 * Source: https://www.aig.com/home/risk-solutions/business/aig-programs/new-program-ideas
 * Selector: main .container.tabbed-cards
 * Source shape: .title heading + N x .teaserflex.cta-with-image.aig-article-card
 *   (portrait image, h3 name, description = role + mailto link).
 * Output: block = one row per card: image | body (heading, paragraphs, links). Iterates the
 *   .teaserflex wrappers.
 * Landing-section shapes (image-less -> one-cell rows):
 *   main .container.flexbox-container:has(... .container.thirdwidth .teaserflex.corebluetext)
 *     values grid (/home/about, /home/careers/purpose-and-values): one card per non-empty
 *     .thirdwidth teaser (bold label + list); the heading teasers before it stay default content.
 *   main .container.aig-solution-card (/home/risk-solutions/why-aig): one card per .teaser2023
 *     (h3, full "Show more" text incl. the collapsed link list, Learn more CTA); the sibling
 *     "Select Solution Type" filter (.options.custom-select, .hidden input) is dropped.
 * Non-card children (.title heading, CTA-only teasers like "Contact Our
 *   Team") are emitted as default content before/after the block in document order.
 */
function absUrl(href, document) {
  if (!href) return href;
  if (/^(mailto:|tel:|javascript:|#)/i.test(href)) return href;
  try {
    const base = document.location && document.location.href !== 'about:blank'
      ? document.location.href : 'https://www.aig.com/home';
    return new URL(href, base).href;
  } catch (e) {
    return href;
  }
}

function clean(text) {
  return (text || '').replace(/\s+/g, ' ').trim();
}

function fixUrls(el, document) {
  const all = el.matches && el.matches('a[href], img[src]') ? [el] : [];
  all.push(...el.querySelectorAll('a[href], img[src]'));
  all.forEach((n) => {
    if (n.tagName === 'A') n.setAttribute('href', absUrl(n.getAttribute('href'), document));
    else n.setAttribute('src', absUrl(n.getAttribute('src'), document));
  });
  el.querySelectorAll('.custom-icons').forEach((s) => s.remove());
  return el;
}

/**
 * Body of an image-less card (values grid / solution cards): optional heading (title link kept),
 * description blocks - including the collapsed "Show more" text (.cmp-teaser__more-description),
 * minus the Show more/less toggles - then CTA links. A paragraph that is only a bold run (the
 * values label, e.g. "TAKE OWNERSHIP") is rebuilt as a clean <p><strong>.
 */
function textCardBody(card, document) {
  const body = [];
  const content = card.querySelector('.cmp-teaser__content') || card;
  const title = content.querySelector('.cmp-teaser__title');
  if (title && clean(title.textContent)) {
    const level = /^H[1-6]$/.test(title.tagName) ? title.tagName.toLowerCase() : 'h3';
    const h = document.createElement(level);
    const link = title.querySelector('a[href]');
    if (link) {
      const a = document.createElement('a');
      a.href = absUrl(link.getAttribute('href'), document);
      a.textContent = clean(title.textContent);
      h.append(a);
    } else {
      h.textContent = clean(title.textContent);
    }
    body.push(h);
  }
  const desc = content.querySelector('.cmp-teaser__description');
  if (desc) {
    const parts = [...desc.querySelectorAll('p, ul, ol, h3, h4, h5')]
      .filter((el) => !el.closest('.action-teaser-more, .action-teaser-less'))
      .filter((el, i, arr) => !arr.some((o) => o !== el && o.contains(el)))
      .filter((el) => clean(el.textContent) || el.querySelector('img'));
    parts.forEach((el) => {
      const only = el.tagName === 'P' && el.children.length === 1 && el.querySelector(':scope > b, :scope > strong');
      if (only && clean(only.textContent) === clean(el.textContent)) {
        const p = document.createElement('p');
        const strong = document.createElement('strong');
        strong.textContent = clean(el.textContent);
        p.append(strong);
        body.push(p);
      } else {
        body.push(fixUrls(el, document));
      }
    });
    if (!parts.length && clean(desc.textContent)) {
      const p = document.createElement('p');
      p.textContent = clean(desc.textContent);
      body.push(p);
    }
  }
  content.querySelectorAll('.cmp-teaser__action-link').forEach((a) => {
    const p = document.createElement('p');
    const link = document.createElement('a');
    link.href = absUrl(a.getAttribute('href'), document);
    const clone = a.cloneNode(true);
    clone.querySelectorAll('.custom-icons').forEach((s) => s.remove());
    link.textContent = clean(clone.textContent);
    p.append(link);
    body.push(p);
  });
  return body;
}

export default function parse(element, { document }) {
  // Cards = teasers with an image (.cta-with-image / .aig-article-card); other grid children
  // (.title heading, CTA-only teasers such as "Contact Our Team") are default content.
  const teasers = [...element.querySelectorAll('.teaserflex, .teaser2023')]
    .filter((el, i, arr) => !arr.some((o) => o !== el && o.contains(el)));
  // Landing-section shapes have no images -> one-cell rows (library "no images" layout; the local
  // cards block renders image-less rows full width, so no option class is needed):
  //   values grid: .container.thirdwidth > ... > .teaserflex.corebluetext (empty trailing card skipped)
  //   solution cards: .container.aig-solution-card > .teaser2023.dt50 (Show more text captured)
  const valueCards = [...element.querySelectorAll('.container.thirdwidth .teaserflex.corebluetext')]
    .filter((el) => clean(el.textContent));
  const isSolution = element.matches('.aig-solution-card');
  if (isSolution && element.parentElement) {
    // The "Select Solution Type" filter (.options.custom-select drop-down + its .hidden
    // content-fragment URL input) sits beside the cards in the same grid: form chrome, dropped.
    [...element.parentElement.children]
      .filter((sib) => sib !== element && sib.matches('.options.custom-select, .hidden'))
      .forEach((sib) => sib.remove());
  }
  const textOnly = valueCards.length > 0 || isSolution;
  let cards = valueCards.length ? valueCards
    : teasers.filter((el) => el.matches('.aig-article-card, .cta-with-image') || el.querySelector('.cmp-teaser__image img'));
  if (!cards.length) cards = teasers.filter((el) => el.querySelector('.cmp-teaser__title'));

  const leading = [];
  const trailing = [];
  const firstCard = cards[0];
  const extras = [...element.querySelectorAll('.title, .teaserflex, .teaser2023, .text')]
    .filter((el) => !cards.some((c) => c === el || c.contains(el) || el.contains(c)))
    .filter((el, i, arr) => !arr.some((o) => o !== el && o.contains(el)));
  extras.forEach((el) => {
    // eslint-disable-next-line no-bitwise
    const target = firstCard && (el.compareDocumentPosition(firstCard) & 4) ? leading : trailing;
    el.querySelectorAll('.cmp-title__text, .cmp-teaser__title, .cmp-teaser__description > *, .cmp-text > *').forEach((n) => {
      if (!clean(n.textContent)) return;
      if (n.matches('.cmp-title__text, .cmp-teaser__title')) {
        const level = /^H[1-6]$/.test(n.tagName) ? n.tagName.toLowerCase() : 'h2';
        const heading = document.createElement(level);
        heading.textContent = clean(n.textContent);
        target.push(heading);
      } else {
        target.push(fixUrls(n, document));
      }
    });
    el.querySelectorAll('.cmp-teaser__action-link').forEach((a) => {
      const p = document.createElement('p');
      const link = document.createElement('a');
      link.href = absUrl(a.getAttribute('href'), document);
      const clone = a.cloneNode(true);
      clone.querySelectorAll('.custom-icons').forEach((s) => s.remove());
      link.textContent = clean(clone.textContent);
      p.append(link);
      target.push(p);
    });
  });

  const cells = [];
  if (textOnly) {
    cards.forEach((card) => {
      const body = textCardBody(card, document);
      if (body.length) cells.push([body]);
    });
  }
  (textOnly ? [] : cards).forEach((card) => {
    const img = card.querySelector('.cmp-teaser__image img, img');
    if (img) fixUrls(img, document);
    const content = card.querySelector('.cmp-teaser__content') || card;
    const body = [];
    const pre = content.querySelector('.cmp-teaser__pretitle');
    if (pre && clean(pre.textContent)) {
      const p = document.createElement('p');
      p.textContent = clean(pre.textContent);
      body.push(p);
    }
    const title = content.querySelector('.cmp-teaser__title');
    if (title && clean(title.textContent)) {
      const level = /^H[1-6]$/.test(title.tagName) ? title.tagName.toLowerCase() : 'h3';
      const h = document.createElement(level);
      const link = title.querySelector('a[href]');
      if (link) {
        const a = document.createElement('a');
        a.href = absUrl(link.getAttribute('href'), document);
        a.textContent = clean(title.textContent);
        h.append(a);
      } else {
        h.textContent = clean(title.textContent);
      }
      body.push(h);
    }
    const desc = content.querySelector('.cmp-teaser__description');
    if (desc) {
      const parts = [...desc.querySelectorAll(':scope > p, :scope > ul, :scope > ol, :scope > h3, :scope > h4')]
        .filter((el) => clean(el.textContent));
      if (parts.length) parts.forEach((el) => body.push(fixUrls(el, document)));
      else if (clean(desc.textContent)) {
        const p = document.createElement('p');
        p.textContent = clean(desc.textContent);
        body.push(p);
      }
    }
    content.querySelectorAll('.cmp-teaser__action-link').forEach((a) => {
      const p = document.createElement('p');
      const link = document.createElement('a');
      link.href = absUrl(a.getAttribute('href'), document);
      const clone = a.cloneNode(true);
      clone.querySelectorAll('.custom-icons').forEach((s) => s.remove());
      link.textContent = clean(clone.textContent);
      p.append(link);
      body.push(p);
    });
    if (!img && !body.length) return;
    cells.push([img || '', body.length ? body : '']);
  });

  if (!cells.length) {
    element.replaceWith(...element.childNodes);
    return;
  }

  const block = WebImporter.Blocks.createBlock(document, { name: 'cards', cells });
  element.replaceWith(...leading, block, ...trailing);
}
