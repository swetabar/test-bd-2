/* eslint-disable */
/* global WebImporter */
/**
 * Parser for hero-article. Base: hero. Template: article-page.
 * Source: https://www.aig.com/home/newsroom/stories/aig-is-honored-as-a-top-early-career-employer
 * Selectors (page-templates.json):
 *   main > .aem-Grid > .container:has(> .cmp-container > .aem-Grid > .breadcrumb)
 *     (a) wrapper holding .breadcrumb + media (.image / .articleimage / .videocomponent), 44 pages
 *   main > .aem-Grid > .breadcrumb
 *     (b) bare breadcrumb (7 pages); the hero media is the NEXT SIBLING
 *         (.videocomponent.play-gray-icon, or an image container) - consumed and removed here.
 * Output (1 column, hero convention; blocks/hero-article reads cells in any order):
 *   row 1 (optional): picture - the image, or the video poster (button.video_thumbnail img)
 *   row 2: breadcrumb list (current page = plain text, as in the breadcrumbs parser),
 *          then for videos a "Play Video" link (button[data-src]) and a duration paragraph
 *          (.video__container[data-time], falling back to a m:ss data-duration)
 * Ignored: .video-popup close overlay ("clear close"), hidden .videocomponent.hide.
 * Lazy images: a data: placeholder src is resolved from .cmp-image[data-cmp-src]
 *   ({.width} -> a width from data-cmp-widths) or data-asset.
 */
const TIME_RE = /^\d{1,2}:\d{2}(:\d{2})?$/;
const MEDIA_SEL = '.videocomponent, .image, .articleimage';

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
  return (text || '').replace(/\s+/g, ' ').trim();
}

/**
 * Real image URL for an AEM core image. When the .cmp-image carries a data-cmp-src template it
 * always wins (fixed width): the live src may be a data: placeholder, a blob: URL, or a
 * viewport-dependent rendition. Otherwise the src (video posters), else data-asset.
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

function buildImage(img, document, width) {
  const src = imageSrc(img, width);
  if (!src) return null;
  const out = document.createElement('img');
  out.setAttribute('src', absUrl(src, document));
  out.setAttribute('alt', clean(img.getAttribute('alt')));
  return out;
}

function buildBreadcrumbs(crumb, document) {
  const list = crumb && crumb.querySelector('.cmp-breadcrumb__list, ol, ul');
  if (!list) return null;
  const items = [...list.querySelectorAll('li')].filter((li, i, arr) => !arr.some((o) => o !== li && o.contains(li)));
  const ul = document.createElement('ul');
  items.forEach((item, i) => {
    const nameEl = item.querySelector('[itemprop="name"]') || item;
    const text = clean(nameEl.textContent);
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
  const crumb = element.matches('.breadcrumb') ? element : element.querySelector('.breadcrumb');

  // Locate the hero media: inside the wrapper (a), or the bare breadcrumb's next sibling (b).
  let media = null;
  let consumed = null;
  if (element.matches('.breadcrumb')) {
    const next = element.nextElementSibling;
    if (next && (next.matches(MEDIA_SEL) || next.querySelector(':scope > .videocomponent, :scope > .cmp-image'))) {
      media = next;
      consumed = next;
    }
  } else {
    media = element.querySelector('.videocomponent:not(.hide)')
      || element.querySelector('.articleimage, .image');
  }

  let img = null;
  const content = [];
  const ul = buildBreadcrumbs(crumb, document);
  if (ul) content.push(ul);

  if (media) {
    const video = media.matches('.videocomponent') ? media : media.querySelector('.videocomponent:not(.hide)');
    const scope = video || media;
    const posterImg = [...scope.querySelectorAll('.video_thumbnail img, .cmp-image img, img')]
      .find((i) => !i.closest('.video-popup, dialog'));
    if (posterImg) img = buildImage(posterImg, document, 1944);

    if (video) {
      const srcEl = video.querySelector('[data-src]');
      const href = srcEl && clean(srcEl.getAttribute('data-src'));
      if (href) {
        const p = document.createElement('p');
        const a = document.createElement('a');
        a.href = absUrl(href, document);
        a.textContent = 'Play Video';
        p.append(a);
        content.push(p);
        const con = video.querySelector('.video__container') || video.querySelector('[data-time], [data-duration]');
        const time = con ? clean(con.getAttribute('data-time')) : '';
        const dur = con ? clean(con.getAttribute('data-duration')) : '';
        const duration = TIME_RE.test(time) ? time : (TIME_RE.test(dur) ? dur : '');
        if (duration) {
          const d = document.createElement('p');
          d.textContent = duration;
          content.push(d);
        }
      }
    }
  }

  if (!img && !content.length) {
    element.replaceWith(...element.childNodes);
    return;
  }

  const cells = [];
  if (img) cells.push([img]);
  cells.push([content.length ? content : '']);

  const block = WebImporter.Blocks.createBlock(document, { name: 'hero-article', cells });
  element.replaceWith(block);
  if (consumed && consumed.parentNode) consumed.remove();
}
