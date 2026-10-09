/* eslint-disable */
/* global WebImporter */

/**
 * Parser for hero-fade. Base: hero.
 * Sources: https://www.aig.com/home (landing-page/home),
 *   https://www.aig.com/home/about/aig-womens-open (accordion-detail)
 * Selector: .container.hero-banner-with-fade
 * Output: row 1 = background image, row 2 = heading (h1/h2 preserved), description, CTA(s).
 *
 * Shape A (home): image teaser + .halfwidth text teaser (title, description, CTAs).
 *   The image teaser's own description (hidden on the source page) is intentionally dropped.
 * Shape B (aig-womens-open): image teaser with empty content + .thirdwidth container holding a
 *   nested .breadcrumb and a title-less teaser (logo image + description), plus the page h1 in a
 *   visually hidden .title.hide-title. Content cell = h1, logo image, description, CTA(s).
 *   Only used when shape A finds no text teaser, so home output is unchanged.
 * Shape A also covers the landing-section heroes: the text teaser sits in a .halfwidth,
 *   .thirdwidth, .two-thirdwidth or unclassed (app-and-web-portal) container -> the
 *   "first teaser with a title" fallback picks it up.
 * Nested breadcrumb (any shape): emitted as a LEADING <ul> in the hero content cell (links, current
 *   page as plain text); blocks/hero-fade renders a leading list as the breadcrumb trail.
 *   Pages without a breadcrumb in the hero (home) are unaffected.
 */

// Shape B: page title (h1) from a .title component - hidden on the source, still the page heading
function titleHeading(element, document) {
  const title = [...element.querySelectorAll('.title .cmp-title__text, .title h1, .title h2')]
    .find((h) => !h.closest('.breadcrumb'));
  if (!title || !title.textContent.trim()) return null;
  const level = /^H[1-6]$/.test(title.tagName) ? title.tagName.toLowerCase() : 'h1';
  const heading = document.createElement(level);
  heading.textContent = title.textContent.trim();
  return heading;
}

function descriptionParas(desc, document) {
  const paras = [...desc.querySelectorAll('p')];
  if (!paras.length) {
    if (!desc.textContent.trim()) return [];
    const p = document.createElement('p');
    p.textContent = desc.textContent.trim();
    return [p];
  }
  return paras
    .map((p) => {
      // drop leading/trailing <br>s and blank text ("<p><br>Shiho Kuwaki wins ...")
      const isBlank = (n) => n && ((n.nodeType === 3 && !n.textContent.trim()) || n.nodeName === 'BR');
      while (isBlank(p.firstChild)) p.firstChild.remove();
      while (isBlank(p.lastChild)) p.lastChild.remove();
      p.removeAttribute('style');
      return p;
    })
    .filter((p) => p.textContent.trim() || p.querySelector('img'));
}

// Shape B: title-less teasers other than the background one (logo image + description + CTAs)
function teaserContent(element, bgImage, document) {
  const out = [];
  element.querySelectorAll('.cmp-teaser').forEach((teaser) => {
    if (teaser.closest('.breadcrumb')) return;
    const img = teaser.querySelector('.cmp-teaser__image img, .cmp-image img');
    if (img && img !== bgImage) out.push(img);
    const content = teaser.querySelector('.cmp-teaser__content');
    if (!content) return;
    const title = content.querySelector('.cmp-teaser__title');
    if (title && title.textContent.trim()) {
      const h = document.createElement('h2');
      h.textContent = title.textContent.trim();
      out.push(h);
    }
    const desc = content.querySelector('.cmp-teaser__description');
    if (desc) out.push(...descriptionParas(desc, document));
    content.querySelectorAll('.cmp-teaser__action-link').forEach((a) => {
      const p = document.createElement('p');
      p.append(a);
      out.push(p);
    });
  });
  return out;
}

function absUrl(href, document) {
  try {
    const base = document.location && document.location.href !== 'about:blank'
      ? document.location.href : 'https://www.aig.com/home';
    return new URL(href, base).href;
  } catch (e) {
    return href;
  }
}

// Nested breadcrumb -> leading <ul> for the hero content cell (removed from the source element).
// Same list as parsers/breadcrumbs.js (kept in sync; parsers are loaded standalone by the
// validator, so no cross-parser import): home first, current page as plain text.
function breadcrumbList(element, document) {
  const bc = element.querySelector('.breadcrumb');
  if (!bc) return null;
  bc.remove();
  const list = bc.querySelector('.cmp-breadcrumb__list, ol, ul');
  const items = list ? [...list.querySelectorAll('li')].filter((li, i, arr) => !arr.some((o) => o !== li && o.contains(li))) : [];
  const ul = document.createElement('ul');
  items.forEach((item, i) => {
    const text = item.textContent.replace(/\s+/g, ' ').trim();
    if (!text) return;
    const li = document.createElement('li');
    const link = item.querySelector('a[href]');
    const href = link && link.getAttribute('href');
    const isCurrent = item.classList.contains('cmp-breadcrumb__item--active') || i === items.length - 1;
    if (link && href && href !== '#' && !isCurrent) {
      const a = document.createElement('a');
      a.href = absUrl(href, document);
      a.textContent = text;
      li.append(a);
    } else {
      li.textContent = text;
    }
    ul.append(li);
  });
  return ul.children.length ? ul : null;
}

export default function parse(element, { document }) {
  const crumbs = breadcrumbList(element, document);

  // Background image: first teaser that carries an image (not the .halfwidth text teaser)
  const bgImage = element.querySelector('.teaserflex .cmp-teaser__image img, .cmp-image img, img');

  // Text teaser lives inside the .halfwidth container; fall back to any teaser with a title
  const textTeaser = element.querySelector('.halfwidth .cmp-teaser__content')
    || [...element.querySelectorAll('.cmp-teaser__content')].find((c) => c.querySelector('.cmp-teaser__title, h1, h2, h3'));

  const contentCell = [];
  if (crumbs) contentCell.push(crumbs);
  if (textTeaser) {
    const title = textTeaser.querySelector('.cmp-teaser__title, h1, h2, h3');
    if (title) {
      const level = /^H[1-6]$/.test(title.tagName) ? title.tagName.toLowerCase() : 'h2';
      const heading = document.createElement(level);
      heading.textContent = title.textContent.trim();
      contentCell.push(heading);
    }
    const desc = textTeaser.querySelector('.cmp-teaser__description');
    if (desc) {
      const paras = [...desc.querySelectorAll('p')];
      if (paras.length) {
        contentCell.push(...paras);
      } else if (desc.textContent.trim()) {
        const p = document.createElement('p');
        p.textContent = desc.textContent.trim();
        contentCell.push(p);
      }
    }
    const ctas = [...textTeaser.querySelectorAll('.cmp-teaser__action-link')];
    ctas.forEach((a) => {
      // drop icon-font glyph names (e.g. <span class="custom-icons">external_link</span>)
      a.querySelectorAll('.custom-icons').forEach((s) => s.remove());
      const p = document.createElement('p');
      p.append(a);
      contentCell.push(p);
    });
  } else {
    // Shape B: hidden page title + title-less logo teaser
    const heading = titleHeading(element, document);
    if (heading) contentCell.push(heading);
    contentCell.push(...teaserContent(element, bgImage, document));
  }

  if (!bgImage && contentCell.length <= (crumbs ? 1 : 0)) {
    element.replaceWith(...element.childNodes);
    return;
  }

  const cells = [];
  if (bgImage) cells.push([bgImage]);
  cells.push([contentCell]);

  const block = WebImporter.Blocks.createBlock(document, { name: 'hero-fade', cells });
  element.replaceWith(block);
}
