import { createOptimizedPicture } from '../../scripts/aem.js';

/*
 * Quote block: testimonial with an optional portrait beside the quotation and attribution.
 *
 * Content contract (cells in any order, all but the quotation optional):
 * - a picture -> portrait
 * - first text cell -> quotation
 * - second text cell, or a trailing paragraph starting with a dash -> attribution
 *   (bold text in the attribution is treated as the name, the rest as role/description)
 *
 * Visual modes (authored as a block option, otherwise inferred from the content):
 * - feature:  wide image beside a left-aligned quote (article story, e.g. award artwork)
 * - headshot: narrow headshot beside a centred navy quote, "Name | Role" attribution
 * - portrait: fixed 240x288 portrait beside a large navy quote (landing band)
 * - centered: no image, large centred navy quote (landing band)
 */
const DASH_RE = /^\s*[—–-]/;
const PIPE_RE = /\s\|\s/;
const MODES = ['feature', 'headshot', 'portrait', 'centered'];
const BAND_STYLES = ['pale-blue', 'light-blue', 'light', 'grey', 'dark'];

function inferMode(block, hasImage, attribution) {
  const authored = MODES.find((m) => block.classList.contains(m));
  if (authored) return authored;
  if (!hasImage) return 'centered';
  if (attribution && PIPE_RE.test(attribution.textContent)) return 'headshot';
  const section = block.closest('.section');
  if (section && BAND_STYLES.some((s) => section.classList.contains(s))) return 'portrait';
  return 'feature';
}

/** Moves loose inline content (text, strong, em...) of a node into paragraphs. */
function wrapInline(nodes) {
  const out = [];
  let para = null;
  nodes.forEach((node) => {
    const isBlock = node.nodeType === Node.ELEMENT_NODE
      && /^(P|H[1-6]|UL|OL|DIV|BLOCKQUOTE)$/.test(node.tagName);
    if (isBlock) {
      para = null;
      out.push(node);
    } else if (node.nodeType === Node.ELEMENT_NODE || node.textContent.trim() || para) {
      if (!para) {
        para = document.createElement('p');
        para.dataset.wrapped = '';
        out.push(para);
      }
      para.append(node);
    }
  });
  out.filter((el) => el.dataset && 'wrapped' in el.dataset).forEach((el) => {
    el.removeAttribute('data-wrapped');
    const { firstChild: first, lastChild: last } = el;
    if (first.nodeType === Node.TEXT_NODE) first.textContent = first.textContent.trimStart();
    if (last.nodeType === Node.TEXT_NODE) last.textContent = last.textContent.trimEnd();
  });
  return out;
}

export default function decorate(block) {
  let picture = null;
  const textCells = [];

  [...block.querySelectorAll(':scope > div > div')].forEach((cell) => {
    const pic = cell.querySelector('picture');
    if (pic) {
      if (!picture) picture = pic;
      const holder = pic.closest('p');
      if (holder && !holder.textContent.trim()) holder.remove();
      else pic.remove();
    }
    if (cell.textContent.trim()) textCells.push(cell);
  });

  const quotation = document.createElement('blockquote');
  quotation.className = 'quote-quotation';
  let attribution = null;

  if (textCells[0]) {
    const nodes = [...textCells[0].children];
    const last = nodes[nodes.length - 1];
    if (!textCells[1] && nodes.length > 1 && last && DASH_RE.test(last.textContent)) {
      attribution = last;
      last.remove();
    }
    quotation.append(...textCells[0].childNodes);
  }
  if (textCells[1]) {
    attribution = document.createElement('div');
    attribution.append(...textCells[1].childNodes);
  }
  const mode = inferMode(block, !!picture, attribution);

  const figure = document.createElement('figure');
  figure.className = 'quote-figure';

  if (picture) {
    const img = picture.querySelector('img');
    const media = document.createElement('div');
    media.className = 'quote-image';
    media.append(img ? createOptimizedPicture(img.src, img.alt, false, [{ width: '800' }]) : picture);
    figure.append(media);
    block.classList.add('quote-has-image');
  }

  const body = document.createElement('div');
  body.className = 'quote-body';
  body.append(quotation);
  if (attribution) {
    const caption = document.createElement('figcaption');
    caption.className = 'quote-attribution';
    caption.append(...wrapInline(attribution.tagName === 'P' ? [attribution] : [...attribution.childNodes]));
    body.append(caption);
  }
  figure.append(body);

  block.classList.add(`quote-${mode}`);
  block.replaceChildren(figure);
}
