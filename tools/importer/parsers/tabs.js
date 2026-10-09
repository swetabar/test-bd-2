/* eslint-disable */
/* global WebImporter */
/**
 * Parser for tabs. Base: tabs. Template: content-page.
 * Source: https://www.aig.com/home/worldwide
 * Selector: main .tabs.panelcontainer:not(.accordion *)
 * Output: one row per tab: label (.cmp-tabs__tab text) | panel content.
 * Tabs are paired with panels via aria-controls, the "-tab"/"-tabpanel" id convention, then index.
 * Panel content is flattened to authorable rich text: teasers -> heading/paragraphs/CTA links,
 *   nested accordions -> h3 label + body, .download -> title + "Download PDF [size]" link,
 *   contact cards / text / lists / tables / images kept. Form controls (contact forms, claim finder
 *   selects) are not authorable content and are dropped; their headings/text are kept.
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

function textOf(el) {
  const clone = el.cloneNode(true);
  clone.querySelectorAll('.custom-icons, .sr-only, .cmp-accordion__icon').forEach((s) => s.remove());
  return clean(clone.textContent);
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

function linkPara(href, text, document) {
  const p = document.createElement('p');
  const a = document.createElement('a');
  a.href = absUrl(href, document);
  a.textContent = clean(text) || href;
  p.append(a);
  return p;
}

function headingFrom(el, fallbackLevel, document) {
  const level = /^H[1-6]$/.test(el.tagName) ? el.tagName.toLowerCase() : fallbackLevel;
  const h = document.createElement(level);
  const link = el.querySelector('a[href]');
  const text = textOf(el);
  if (link && textOf(link) === text) {
    const a = document.createElement('a');
    a.href = absUrl(link.getAttribute('href'), document);
    a.textContent = text;
    h.append(a);
  } else {
    h.textContent = text;
  }
  return h;
}

function teaserContent(teaser, out, document) {
  const img = teaser.querySelector('.cmp-teaser__image img');
  if (img) out.push(fixUrls(img, document));
  const content = teaser.querySelector('.cmp-teaser__content') || teaser;
  const pre = content.querySelector('.cmp-teaser__pretitle');
  const title = content.querySelector('.cmp-teaser__title');
  const desc = content.querySelector('.cmp-teaser__description');
  if (pre && clean(pre.textContent)) {
    if (!title && !desc) out.push(headingFrom(pre, 'h2', document));
    else {
      const p = document.createElement('p');
      p.textContent = clean(pre.textContent);
      out.push(p);
    }
  }
  if (title && clean(title.textContent)) out.push(headingFrom(title, 'h3', document));
  if (desc) collect(desc, out, document);
  content.querySelectorAll('.cmp-teaser__action-link').forEach((a) => {
    out.push(linkPara(a.getAttribute('href'), textOf(a), document));
  });
}

function downloadContent(dl, out, document) {
  const action = dl.querySelector('a.cmp-download__action');
  const titleLink = dl.querySelector('.cmp-download__title a[href], .cmp-download__title-link');
  const label = clean((dl.querySelector('.cmp-download__action-text') || {}).textContent)
    || clean((dl.querySelector('.cmp-download__property--filename .cmp-download__property-content') || {}).textContent);
  if (label) {
    const p = document.createElement('p');
    p.textContent = label;
    out.push(p);
  }
  const href = (titleLink && titleLink.getAttribute('href')) || (action && action.getAttribute('href'));
  if (href) out.push(linkPara(href, titleLink ? titleLink.textContent : 'Download PDF', document));
}

const SKIP = 'script, style, noscript, dialog, form, iframe[src*="recaptcha"], button, select, input, textarea, option,.video-popup, .action-teaser-more, .action-teaser-less, .cmp-download__properties, meta, link, .custom-icons';
const BLOCKISH = 'p, ul, ol, h1, h2, h3, h4, h5, h6, table, blockquote, pre';

function collect(node, out, document) {
  [...node.childNodes].forEach((child) => {
    if (child.nodeType === 3) {
      if (clean(child.textContent)) {
        const p = document.createElement('p');
        p.textContent = clean(child.textContent);
        out.push(p);
      }
      return;
    }
    if (child.nodeType !== 1) return;
    if (child.matches('.videocomponent')) {
      const poster = child.querySelector('img');
      if (poster) out.push(fixUrls(poster, document));
      const src = child.querySelector('[data-src]');
      if (src) out.push(linkPara(src.getAttribute('data-src'), 'Play Video', document));
      return;
    }
    if (child.matches(SKIP)) return;
    if (child.matches('label')) {
      // form field labels are form chrome, not content
      return;
    }
    if (child.matches('.cmp-teaser')) { teaserContent(child, out, document); return; }
    if (child.matches('.cmp-download')) { downloadContent(child, out, document); return; }
    if (child.matches('.cmp-accordion__header')) { out.push(headingFrom(child.querySelector('.cmp-accordion__title') || child, 'h3', document)); return; }
    if (child.matches('.cmp-title')) {
      const h = child.querySelector('h1, h2, h3, h4, h5, h6');
      if (h) out.push(headingFrom(h, 'h3', document));
      return;
    }
    // Source quirk: headings/paragraphs that wrap block content (e.g. <h3><table>) -> unwrap
    if (child.matches('h1, h2, h3, h4, h5, h6, p') && child.querySelector('table, ul, ol, div, p')) {
      collect(child, out, document);
      return;
    }
    if (child.matches(BLOCKISH)) {
      if (clean(child.textContent) || child.querySelector('img')) out.push(fixUrls(child, document));
      return;
    }
    if (child.matches('img')) { out.push(fixUrls(child, document)); return; }
    if (child.matches('picture')) {
      const img = child.querySelector('img');
      if (img) out.push(fixUrls(img, document));
      return;
    }
    if (child.matches('iframe[src]')) { out.push(linkPara(child.getAttribute('src'), child.getAttribute('title') || child.getAttribute('src'), document)); return; }
    if (child.matches('a[href]') && !child.querySelector('div, p, h1, h2, h3, h4, img')) {
      if (textOf(child)) out.push(linkPara(child.getAttribute('href'), textOf(child), document));
      return;
    }
    if (child.matches('span, strong, em, b, i, u') && !child.querySelector('div, p')) {
      if (clean(child.textContent)) {
        const p = document.createElement('p');
        p.append(fixUrls(child, document));
        out.push(p);
      }
      return;
    }
    collect(child, out, document);
  });
}

export default function parse(element, { document }) {
  const root = element.querySelector('.cmp-tabs') || element;
  const tablist = root.querySelector(':scope > .cmp-tabs__tablist, :scope > [role="tablist"]')
    || root.querySelector('.cmp-tabs__tablist, [role="tablist"]');
  let tabEls = tablist ? [...tablist.querySelectorAll(':scope > .cmp-tabs__tab, :scope > [role="tab"]')] : [];
  if (!tabEls.length && tablist) {
    // Landing-section .tab-card carousels (.thumbnail-photo-gallery photo thumbnails,
    // .aig-tab-layout icon tiles): slick wraps each <li role="tab"> in
    // .slick-list > .slick-track > .slick-slide > div. Clones are skipped. The tile image
    // (thumbnail/icon) is tab chrome - the tabs block label is text - so only the text is kept.
    tabEls = [...tablist.querySelectorAll('.cmp-tabs__tab, [role="tab"]')]
      .filter((t) => !t.closest('.slick-cloned'))
      .filter((t, i, arr) => !arr.some((o) => o !== t && o.contains(t)));
  }
  let panelEls = [...root.querySelectorAll(':scope > .cmp-tabs__tabpanel, :scope > [role="tabpanel"]')];
  if (!panelEls.length) {
    panelEls = [...root.querySelectorAll('.cmp-tabs__tabpanel')].filter((p) => p.closest('.cmp-tabs') === root);
  }

  const cells = [];
  tabEls.forEach((tab, i) => {
    let panel = null;
    const controls = tab.getAttribute('aria-controls');
    if (controls) panel = panelEls.find((p) => p.id === controls) || null;
    if (!panel && tab.id && tab.id.endsWith('-tab')) panel = panelEls.find((p) => p.id === `${tab.id}panel`) || null;
    if (!panel) panel = panelEls[i] || null;

    const label = textOf(tab);
    const body = [];
    if (panel) collect(panel, body, document);
    if (!label && !body.length) return;
    cells.push([label, body.length ? body : '']);
  });

  if (!cells.length) {
    element.replaceWith(...element.childNodes);
    return;
  }

  const block = WebImporter.Blocks.createBlock(document, { name: 'tabs', cells });
  element.replaceWith(block);
}
