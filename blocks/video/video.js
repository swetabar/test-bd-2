import { createOptimizedPicture } from '../../scripts/aem.js';

/*
 * Video block: one or more click-to-play videos that open in a modal player
 * (mirrors the source "aig-video" / "aig-media" components).
 *
 * Content contract: one row per video; cells are merged, all parts optional except the link.
 * - picture -> poster image
 * - link to the video (mp4/webm, YouTube, Vimeo, or any embeddable URL) -> played on click;
 *   descriptive link text (e.g. "Play Video") becomes the play button label
 * - plain duration text such as "1:30" -> duration badge on the poster
 * - heading / paragraphs -> caption
 * Layouts (derived from the number of rows):
 * - 1 row: single centered player, centered caption (shown above the poster on mobile)
 * - 2 rows: two-up gallery, left-aligned caption under each poster
 * - 3+ rows: three-up gallery, centered title (shown above the poster on mobile)
 */
const DURATION_RE = /^\d{1,2}:\d{2}(:\d{2})?$/;
const SVG_NS = 'http://www.w3.org/2000/svg';

function embedUrl(href) {
  const url = new URL(href, window.location.href);
  if (/youtu\.be$/.test(url.hostname)) return `https://www.youtube.com/embed/${url.pathname.slice(1)}?autoplay=1`;
  if (/youtube\.com$/.test(url.hostname)) {
    const id = url.searchParams.get('v') || url.pathname.split('/').pop();
    return `https://www.youtube.com/embed/${id}?autoplay=1`;
  }
  if (/vimeo\.com$/.test(url.hostname)) return `https://player.vimeo.com/video/${url.pathname.split('/').pop()}?autoplay=1`;
  return null;
}

function createPlayer(href, title) {
  if (/\.(mp4|webm|m3u8)(\?|$)/i.test(href)) {
    const video = document.createElement('video');
    video.controls = true;
    video.autoplay = true;
    video.playsInline = true;
    video.setAttribute('controlslist', 'nodownload');
    video.className = 'video-player';
    video.src = href;
    return video;
  }
  const iframe = document.createElement('iframe');
  iframe.src = embedUrl(href) || href;
  iframe.title = title || 'Video';
  iframe.allow = 'autoplay; fullscreen; picture-in-picture; encrypted-media';
  iframe.setAttribute('allowfullscreen', '');
  iframe.className = 'video-player';
  return iframe;
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
 * Opens the video in a modal dialog (source "video-popup").
 * @param {Element} block
 * @param {string} href video url
 * @param {string} title accessible name
 * @param {HTMLElement} opener element to return focus to
 */
function openVideo(block, href, title, opener) {
  const dialog = document.createElement('dialog');
  dialog.className = 'video-dialog';
  if (title) dialog.setAttribute('aria-label', title);

  const player = createPlayer(href, title);
  const close = document.createElement('button');
  close.type = 'button';
  close.className = 'video-dialog-close';
  const closeText = document.createElement('span');
  closeText.textContent = 'close';
  close.append(createCloseIcon(), closeText);

  dialog.append(player, close);
  block.append(dialog);

  close.addEventListener('click', () => dialog.close());
  // clicking the dimmed area around the player closes it
  dialog.addEventListener('click', (e) => {
    if (e.target === dialog) dialog.close();
  });
  dialog.addEventListener('close', () => {
    if (player.tagName === 'VIDEO') {
      player.pause();
      player.removeAttribute('src');
      player.load();
    }
    dialog.remove();
    opener.focus();
  });

  dialog.showModal();
  if (player.tagName === 'VIDEO') player.play().catch(() => { /* autoplay blocked; controls remain */ });
}

function buildItem(block, row) {
  const item = document.createElement('div');
  item.className = 'video-item';

  const picture = row.querySelector('picture');
  const link = [...row.querySelectorAll('a[href]')].find((a) => !a.querySelector('picture'));
  let duration = '';
  const caption = document.createElement('div');
  caption.className = 'video-caption';

  [...row.children].forEach((cell) => {
    [...cell.children].forEach((el) => {
      const text = el.textContent.trim();
      if (el.querySelector('picture') && !text) return;
      if (link && el.contains(link) && text === link.textContent.trim()) return;
      if (!duration && DURATION_RE.test(text)) {
        duration = text;
        return;
      }
      if (text) caption.append(el);
    });
  });

  const media = document.createElement('div');
  media.className = 'video-media';
  let poster = null;
  if (picture) {
    const img = picture.querySelector('img');
    poster = img
      ? createOptimizedPicture(img.src, img.alt || '', false, [{ media: '(min-width: 768px)', width: '1200' }, { width: '750' }])
      : picture;
  }

  if (link) {
    const linkText = link.textContent.trim();
    const label = linkText && !/^https?:/i.test(linkText) ? linkText : 'Play Video';
    const play = document.createElement('button');
    play.type = 'button';
    play.className = 'video-play';
    play.setAttribute('aria-haspopup', 'dialog');
    const span = document.createElement('span');
    span.className = 'video-play-label';
    span.textContent = label;
    play.append(span);
    if (poster) play.append(poster);
    const { href } = link;
    const title = caption.querySelector('h1, h2, h3, h4, h5, h6')?.textContent.trim();
    play.addEventListener('click', () => openVideo(block, href, title || label, play));
    media.append(play);
  } else if (poster) {
    media.append(poster);
  }

  if (duration) {
    const badge = document.createElement('span');
    badge.className = 'video-duration';
    badge.textContent = duration;
    media.append(badge);
  }

  item.append(media);
  if (caption.children.length) item.append(caption);
  return item;
}

export default function decorate(block) {
  const rows = [...block.children].filter((row) => row.querySelector('a[href], picture'));
  const items = rows.map((row) => buildItem(block, row));
  block.replaceChildren(...items);
  block.classList.add(items.length > 1 ? 'video-gallery' : 'video-single');
  if (items.length === 2) block.classList.add('video-gallery-2');
}
