/* eslint-disable */
/* global WebImporter */
/**
 * Parser for video. Base: video. Template: content-page.
 * Source: https://www.aig.com/home/risk-solutions/business/multinational
 * Selectors:
 *   main .container.aig-video:has(> .cmp-container > .aem-Grid > .aig-video-vertical)  (gallery)
 *   main .container.aig-video:has(> .cmp-container > .aem-Grid > .aig-media)           (Dynamic Media gallery)
 *   main .container.aig-video.halfwidth:not(.aig-video-vertical)                        (single video)
 *   landing-section: main .container.flexbox-container:has(> .cmp-container > .aem-Grid >
 *     .container.aig-video.aig-video-vertical) - a parent holding two .aig-video-vertical videos
 *     (/home/newsroom Latest Videos) -> one gallery block, one row + caption per video.
 * Output: one row per .videocomponent (one cell): poster image, "Play Video" link to the mp4
 *   (button[data-src]), duration text (data-time, e.g. 1:22; else a m:ss data-duration such as
 *   "30:00" on article-page investor-day), caption (heading + description
 *   from the teaser(s) that follow the video in the same grid).
 * Hidden <dialog> popups and .video-popup overlays are ignored. Iteration is keyed on the
 * block-level .videocomponent wrapper, never on the play <button>.
 */
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

function captionFrom(teaser, document) {
  const out = [];
  const content = teaser.querySelector('.cmp-teaser__content') || teaser;
  const title = content.querySelector('.cmp-teaser__title');
  if (title && clean(title.textContent)) {
    const level = /^H[1-6]$/.test(title.tagName) ? title.tagName.toLowerCase() : 'h3';
    const h = document.createElement(level);
    h.textContent = clean(title.textContent);
    out.push(h);
  }
  const desc = content.querySelector('.cmp-teaser__description');
  if (desc) {
    const parts = [...desc.querySelectorAll(':scope > p, :scope > h2, :scope > h3, :scope > h4, :scope > ul, :scope > ol')]
      .filter((el) => clean(el.textContent));
    if (parts.length) parts.forEach((el) => out.push(fixUrls(el, document)));
    else if (clean(desc.textContent)) {
      const p = document.createElement('p');
      p.textContent = clean(desc.textContent);
      out.push(p);
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
    out.push(p);
  });
  return out;
}

export default function parse(element, { document }) {
  const videos = [...element.querySelectorAll('.videocomponent')]
    .filter((v) => !v.closest('dialog, .video-popup, [id^="page-dialog-video"]'));

  const cells = [];
  videos.forEach((video) => {
    const cell = [];
    const poster = video.querySelector('.video_thumbnail img, .video__container img, img');
    if (poster) cell.push(fixUrls(poster, document));

    const srcEl = video.querySelector('[data-src], video source[src], video[src], iframe[src]');
    const href = srcEl && (srcEl.getAttribute('data-src') || srcEl.getAttribute('src'));
    if (href) {
      const p = document.createElement('p');
      const a = document.createElement('a');
      a.href = absUrl(href, document);
      a.textContent = 'Play Video';
      p.append(a);
      cell.push(p);
    }
    const timeEl = video.querySelector('[data-time]');
    let time = timeEl && clean(timeEl.getAttribute('data-time'));
    if (!time) {
      // Empty data-time (article-page investor-day): use data-duration when it is already
      // formatted as m:ss (e.g. "30:00"); plain-seconds durations are not converted.
      const durEl = video.querySelector('[data-duration]');
      const dur = durEl && clean(durEl.getAttribute('data-duration'));
      if (dur && /^\d{1,2}:\d{2}(:\d{2})?$/.test(dur)) time = dur;
    }
    if (time) {
      const p = document.createElement('p');
      p.textContent = time;
      cell.push(p);
    }

    // Caption: teaser siblings after this video, up to the next video
    let sib = video.nextElementSibling;
    while (sib && !sib.matches('.videocomponent')) {
      if (sib.matches('.teaser, .teaserflex, .teaser2023, .text')) {
        if (sib.matches('.text')) {
          sib.querySelectorAll('.cmp-text > *').forEach((el) => { if (clean(el.textContent)) cell.push(fixUrls(el, document)); });
        } else {
          cell.push(...captionFrom(sib, document));
        }
      }
      sib = sib.nextElementSibling;
    }
    if (!href && !poster) return;
    cells.push([cell]);
  });

  if (!cells.length) {
    element.replaceWith(...element.childNodes);
    return;
  }

  const block = WebImporter.Blocks.createBlock(document, { name: 'video', cells });
  element.replaceWith(block);
}
