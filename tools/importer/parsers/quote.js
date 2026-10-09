/* eslint-disable */
/* global WebImporter */
/**
 * Parser for quote. Base: quote (custom block). Template: article-page.
 * Source: https://www.aig.com/home/newsroom/stories/aig-is-honored-as-a-top-early-career-employer
 * Selectors (page-templates.json):
 *   .container.article-2023 .teaserflex.cta-with-image
 *     (a) .cmp-teaser__image img + .cmp-teaser__description: h3 quotation, then
 *         <p><b>Name, </b><span>Role</span></p> attribution
 *   .container.article-2023 .container:has(> .cmp-container > .aem-Grid > .image + .teaserflex)
 *     (b) get-with-the-program: .image.quarterwidth headshot + .teaserflex whose description is
 *         either one h3 "quotation<br><br>Name | Role" or two h3s (quotation, "Name | Role")
 *   main .teaserflex.aig-quote   (landing-section: experienced-professionals, life-at-aig)
 *     (c) optional .cmp-teaser__image portrait + description: <blockquote> quotation, then
 *         attribution paragraph(s): "<b>— Name,</b>&nbsp;Role" and/or "<b>Role</b>, City" +
 *         "Source: Indeed.com" -> all kept, in order, in the attribution cell
 * Output (1 row, 3 cells, per blocks/quote/README.md):
 *   [portrait picture | quotation paragraph(s) | attribution paragraph (bold name)]
 *   The attribution is always the second text cell so the block never has to guess it.
 * Lazy headshots: a data: placeholder src is resolved from .cmp-image[data-cmp-src]
 *   ({.width} -> a width from data-cmp-widths) or data-asset.
 */
const DOUBLE_BR = /(?:\s*<br\s*\/?>\s*){2,}/i;

function absUrl(href, document) {
  if (!href) return href;
  try {
    const base = document.location && document.location.href !== 'about:blank'
      ? document.location.href : 'https://www.aig.com/home';
    return new URL(href, base).href;
  } catch (e) {
    return href;
  }
}

function clean(text) {
  return (text || '').replace(/\u00a0/g, ' ').replace(/\s+/g, ' ').trim();
}

/**
 * Real image URL for an AEM core image. When the .cmp-image carries a data-cmp-src template it
 * always wins (fixed width): the live src may be a data: placeholder, a blob: URL, or a
 * viewport-dependent rendition. Otherwise the src, else data-asset.
 */
function imageSrc(img, width) {
  const src = (img.getAttribute('src') || '').trim();
  const holder = img.closest('[data-cmp-src], [data-asset]');
  const tpl = holder && (holder.getAttribute('data-cmp-src') || '').trim();
  if (tpl) {
    if (!tpl.includes('{.width}')) return tpl;
    const widths = (holder.getAttribute('data-cmp-widths') || '').split(',')
      .map((w) => parseInt(w, 10)).filter((w) => w > 0).sort((a, b) => a - b);
    const w = widths.find((x) => x >= width) || widths[widths.length - 1];
    return tpl.replace('{.width}', w ? `.${w}` : '');
  }
  if (src && !/^(data|blob):/i.test(src)) return src;
  return (holder && holder.getAttribute('data-asset')) || '';
}

/** Split a description into text segments: one per block child, double <br> also splits. */
function segments(desc, document) {
  const out = [];
  const blocks = [...desc.querySelectorAll(':scope > h1, :scope > h2, :scope > h3, :scope > h4, :scope > h5, :scope > h6, :scope > p, :scope > blockquote')];
  if (!blocks.length && clean(desc.textContent)) blocks.push(desc);
  blocks.forEach((el) => {
    el.innerHTML.split(DOUBLE_BR).forEach((html) => {
      const holder = document.createElement('div');
      holder.innerHTML = html;
      if (clean(holder.textContent)) out.push({ holder, tag: el.tagName });
    });
  });
  return out;
}

function looksLikeAttribution(seg, isHeadingQuote) {
  const text = clean(seg.holder.textContent);
  if (text.length > 160) return false;
  if (/^[—–-]/.test(text)) return true;
  if (/\s\|\s?|\|\s/.test(text)) return true;
  if (seg.holder.querySelector('b, strong')) return true;
  return isHeadingQuote && seg.tag === 'P';
}

function attributionParagraph(seg, document) {
  const p = document.createElement('p');
  const bold = seg.holder.querySelector('b, strong');
  if (bold) {
    // Keep the source bold run as the name, the rest as plain role text
    seg.holder.childNodes.forEach((node) => {
      const text = (node.textContent || '').replace(/\u00a0/g, ' ');
      if (!text.trim()) {
        if (text && p.childNodes.length) p.append(' ');
        return;
      }
      if (node.nodeType === 1 && /^(B|STRONG)$/.test(node.tagName)) {
        const strong = document.createElement('strong');
        strong.textContent = clean(text);
        if (p.childNodes.length) p.append(' ');
        p.append(strong);
      } else {
        const lead = /^\s/.test(text) && p.childNodes.length ? ' ' : '';
        p.append(`${lead}${clean(text)}`);
      }
    });
    // normalise the gap between the bold name and the role text
    p.normalize();
    return p;
  }
  const text = clean(seg.holder.textContent);
  const bar = text.indexOf('|');
  if (bar > 0) {
    const strong = document.createElement('strong');
    strong.textContent = text.slice(0, bar).trim();
    p.append(strong, ` | ${text.slice(bar + 1).trim()}`);
  } else {
    p.textContent = text;
  }
  return p;
}

export default function parse(element, { document }) {
  const teaser = element.matches('.teaserflex, .teaser') ? element : element.querySelector('.teaserflex, .teaser');
  const imgEl = element.querySelector('.cmp-teaser__image img')
    || element.querySelector('.image .cmp-image img, .image img')
    || element.querySelector('img');
  const desc = teaser && (teaser.querySelector('.cmp-teaser__description') || teaser.querySelector('.cmp-teaser__content'));

  const segs = desc ? segments(desc, document) : [];
  if (!segs.length) {
    element.replaceWith(...element.childNodes);
    return;
  }

  // The quotation leads; a trailing short "Name | Role" / bold-name segment is the attribution.
  const isHeadingQuote = /^H[1-6]$/.test(segs[0].tag);
  let attribution = null;
  const lastQuote = segs.map((s) => s.tag).lastIndexOf('BLOCKQUOTE');
  if (element.matches('.aig-quote') && lastQuote >= 0) {
    // (c) landing pages: .teaserflex.aig-quote -> <blockquote> quotation, then every following
    //     paragraph is attribution ("<b>— Name,</b> role", optional "Source: Indeed.com" line)
    const rest = segs.splice(lastQuote + 1);
    if (rest.length) attribution = rest.map((seg) => attributionParagraph(seg, document));
  } else if (segs.length > 1 && looksLikeAttribution(segs[segs.length - 1], isHeadingQuote)) {
    attribution = attributionParagraph(segs.pop(), document);
  }

  const quoteCell = segs.map((seg) => {
    const p = document.createElement('p');
    p.textContent = clean(seg.holder.textContent);
    return p;
  });

  let imageCell = '';
  if (imgEl) {
    const src = imageSrc(imgEl, 768);
    if (src) {
      const img = document.createElement('img');
      img.setAttribute('src', absUrl(src, document));
      img.setAttribute('alt', clean(imgEl.getAttribute('alt')));
      imageCell = img;
    }
  }

  const cells = [[imageCell, quoteCell, attribution || '']];
  const block = WebImporter.Blocks.createBlock(document, { name: 'quote', cells });
  element.replaceWith(block);
}
