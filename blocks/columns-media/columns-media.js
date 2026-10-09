import { createOptimizedPicture } from '../../scripts/aem.js';

const DURATION_RE = /^\d{1,2}(:\d{2}){1,2}$/;
const SVG_NS = 'http://www.w3.org/2000/svg';
const SITE_HOSTS = ['aig.com', 'www.aig.com'];
const DOC_RE = /\.(pdf|mp3|mp4|webm|docx?|xlsx?|pptx?|zip)$/i;

/**
 * True for links the source marks with the external-link icon:
 * other hosts and downloadable documents/media.
 * @param {HTMLAnchorElement} a
 */
function isExternal(a) {
  try {
    const url = new URL(a.href, window.location.href);
    if (DOC_RE.test(url.pathname)) return true;
    return url.hostname !== window.location.hostname && !SITE_HOSTS.includes(url.hostname);
  } catch {
    return false;
  }
}

function createCloseIcon() {
  const svg = document.createElementNS(SVG_NS, 'svg');
  svg.setAttribute('viewBox', '0 0 16 16');
  svg.setAttribute('width', '16');
  svg.setAttribute('height', '16');
  svg.setAttribute('aria-hidden', 'true');
  svg.setAttribute('focusable', 'false');
  const path = document.createElementNS(SVG_NS, 'path');
  path.setAttribute('d', 'M1 1 15 15M15 1 1 15');
  path.setAttribute('stroke', 'currentColor');
  path.setAttribute('stroke-width', '1.4');
  path.setAttribute('fill', 'none');
  svg.append(path);
  return svg;
}

/**
 * Opens the video in a modal dialog (mirrors the source "video-popup").
 * @param {Element} block
 * @param {string} src mp4 url
 * @param {string} title accessible name for the dialog
 * @param {HTMLElement} opener element to return focus to
 */
function openVideo(block, src, title, opener) {
  const dialog = document.createElement('dialog');
  dialog.className = 'columns-media-dialog';
  if (title) dialog.setAttribute('aria-label', title);

  const video = document.createElement('video');
  video.controls = true;
  video.autoplay = true;
  video.playsInline = true;
  video.setAttribute('controlslist', 'nodownload');
  video.src = src;

  const close = document.createElement('button');
  close.type = 'button';
  close.className = 'columns-media-dialog-close';
  const closeText = document.createElement('span');
  closeText.textContent = 'close';
  close.append(createCloseIcon(), closeText);

  dialog.append(video, close);
  block.append(dialog);

  close.addEventListener('click', () => dialog.close());
  // clicking the dimmed backdrop (the dialog itself, outside the video) closes it
  dialog.addEventListener('click', (e) => {
    if (e.target === dialog) dialog.close();
  });
  dialog.addEventListener('close', () => {
    video.pause();
    video.removeAttribute('src');
    video.load();
    dialog.remove();
    opener.focus();
  });

  dialog.showModal();
  video.play().catch(() => { /* autoplay may be blocked; controls remain */ });
}

/**
 * Turns a media cell holding poster + link (+ optional duration) into a
 * play button that opens the video in a modal.
 * @param {Element} block
 * @param {Element} cell
 * @param {HTMLAnchorElement} link
 * @param {string} title
 */
function decorateVideo(block, cell, link, title) {
  const pic = cell.querySelector('picture');
  const src = link.href;
  const label = link.textContent.trim() || 'Play Video';
  const durationEl = [...cell.querySelectorAll('p, span, div')]
    .find((el) => !el.querySelector('picture, a') && DURATION_RE.test(el.textContent.trim()));
  const duration = durationEl ? durationEl.textContent.trim() : '';

  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'columns-media-play';
  button.setAttribute('aria-haspopup', 'dialog');
  const labelEl = document.createElement('span');
  labelEl.className = 'columns-media-play-label';
  labelEl.textContent = label;
  button.append(labelEl, pic);

  const children = [button];
  if (duration) {
    const durEl = document.createElement('span');
    durEl.className = 'columns-media-duration';
    durEl.textContent = duration;
    children.push(durEl);
  }
  cell.replaceChildren(...children);
  cell.classList.add('columns-media-video');

  button.addEventListener('click', () => openVideo(block, src, title || label, button));
  return button;
}

/**
 * The source teaser title links to the video; imports carry that as a trailing
 * standalone link repeating the heading. Fold it back into the heading.
 * @param {Element} row
 * @param {string} src video url
 * @param {HTMLButtonElement} button play button that opens the modal
 */
function foldTitleLink(row, src, button) {
  const heading = row.querySelector('.columns-media-text :is(h1, h2, h3, h4, h5, h6)');
  if (!heading) return;
  const title = heading.textContent.trim();
  const dup = [...row.querySelectorAll('.columns-media-text p')].find((p) => {
    const a = p.querySelector(':scope > a[href]');
    return a && p.textContent.trim() === a.textContent.trim()
      && a.textContent.trim() === title && a.href === src;
  });
  if (!dup) return;
  const a = dup.querySelector('a');
  a.className = 'columns-media-title-link';
  a.replaceChildren(...heading.childNodes);
  heading.append(a);
  dup.remove();
  a.addEventListener('click', (e) => {
    e.preventDefault();
    button.click();
  });
}

/**
 * Columns (media) — rows pairing a media cell (image, or video poster plus a
 * play link and optional duration) with a text cell (heading, paragraph, link).
 * Left/right placement on desktop follows authored cell order; on mobile the
 * media always stacks above the text.
 * Content contract: one row per item, cells = media | text (either order).
 * @param {Element} block
 */
export default function decorate(block) {
  // optimize same-origin images before restructuring (external hosts ignore params)
  block.querySelectorAll('picture > img').forEach((img) => {
    let sameOrigin = false;
    try {
      sameOrigin = new URL(img.src, window.location.href).origin === window.location.origin;
    } catch { /* keep as authored */ }
    if (!sameOrigin) return;
    img.closest('picture').replaceWith(
      createOptimizedPicture(img.src, img.alt || '', false, [
        { media: '(min-width: 768px)', width: '1200' },
        { width: '750' },
      ]),
    );
  });

  [...block.children].forEach((row) => {
    row.classList.add('columns-media-row');
    const cells = [...row.children];
    if (cells.length < 2) row.classList.add('columns-media-row-single');

    let mediaCell = null;
    cells.forEach((cell) => {
      const pic = cell.querySelector('picture');
      // the media cell is the first cell holding a picture and no heading
      const hasHeading = !!cell.querySelector('h1, h2, h3, h4, h5, h6');
      if (pic && !mediaCell && !hasHeading) {
        mediaCell = cell;
        cell.classList.add('columns-media-media');
      } else {
        cell.classList.add('columns-media-text');
      }
    });

    if (mediaCell) {
      const link = mediaCell.querySelector('a[href]');
      if (link && !link.querySelector('picture')) {
        const heading = row.querySelector('.columns-media-text h1, .columns-media-text h2, .columns-media-text h3, .columns-media-text h4');
        const { href } = link;
        const button = decorateVideo(block, mediaCell, link, heading ? heading.textContent.trim() : '');
        row.classList.add('columns-media-row-video');
        foldTitleLink(row, href, button);
      }
      // media position drives row direction on desktop
      if (cells[0] && cells[0] !== mediaCell) row.classList.add('columns-media-row-media-right');
    }

    row.querySelectorAll('.columns-media-text p.button-wrapper > a.button').forEach((a) => {
      if (isExternal(a)) a.classList.add('columns-media-external');
    });
  });
}
