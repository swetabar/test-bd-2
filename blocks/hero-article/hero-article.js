import { createOptimizedPicture } from '../../scripts/aem.js';

/*
 * Hero article block: article-page hero with an optional breadcrumb trail above a
 * full-width media stage (image, optionally a video link that turns the image into a
 * poster with a play button; the video plays in a modal).
 *
 * Content contract (rows, any order, all optional):
 * - a row with a list (ul/ol) of links -> breadcrumb trail (last item = current page)
 * - a row with a picture -> media stage
 * - a link to a video (mp4/webm/youtube/vimeo) -> play button on the media stage
 * - short plain text such as "2:29" next to the video link -> duration label
 */

const VIDEO_RE = /\.(mp4|webm|m3u8)(\?|$)|youtube\.com|youtu\.be|vimeo\.com/i;
const DURATION_RE = /^\d{1,2}:\d{2}(:\d{2})?$/;

function toEmbedUrl(href) {
  const url = new URL(href, window.location.href);
  if (/youtu\.be/.test(url.hostname)) return `https://www.youtube.com/embed/${url.pathname.slice(1)}?autoplay=1`;
  if (/youtube\.com/.test(url.hostname)) {
    const id = url.searchParams.get('v') || url.pathname.split('/').pop();
    return `https://www.youtube.com/embed/${id}?autoplay=1`;
  }
  if (/vimeo\.com/.test(url.hostname)) return `https://player.vimeo.com/video/${url.pathname.split('/').pop()}?autoplay=1`;
  return null;
}

function createPlayer(href, label) {
  const embed = toEmbedUrl(href);
  let player;
  if (embed) {
    player = document.createElement('iframe');
    player.src = embed;
    player.allow = 'autoplay; fullscreen; picture-in-picture';
    player.setAttribute('allowfullscreen', '');
    player.title = label;
  } else {
    player = document.createElement('video');
    player.src = href;
    player.controls = true;
    player.autoplay = true;
    player.playsInline = true;
    player.setAttribute('controlslist', 'nodownload');
    player.setAttribute('aria-label', label);
  }
  player.className = 'hero-article-player';
  return player;
}

function openModal(block, href, label) {
  let dialog = block.querySelector('.hero-article-modal');
  if (!dialog) {
    dialog = document.createElement('dialog');
    dialog.className = 'hero-article-modal';
    dialog.setAttribute('aria-label', label);

    const close = document.createElement('button');
    close.type = 'button';
    close.className = 'hero-article-modal-close';
    close.innerHTML = '<span class="hero-article-modal-close-icon" aria-hidden="true">clear</span> close';
    close.addEventListener('click', () => dialog.close());
    dialog.append(close);

    // clicking the dimmed overlay (not the player) closes the modal
    dialog.addEventListener('click', (e) => {
      if (e.target === dialog) dialog.close();
    });
    // stop playback when the modal closes (close button, overlay click or Escape)
    dialog.addEventListener('close', () => {
      dialog.querySelector('.hero-article-player')?.remove();
    });
    block.append(dialog);
  }
  dialog.querySelector('.hero-article-player')?.remove();
  dialog.prepend(createPlayer(href, label));
  dialog.showModal();
}

export default function decorate(block) {
  let list = null;
  let picture = null;
  let videoLink = null;
  let duration = '';

  [...block.querySelectorAll(':scope > div > div')].forEach((cell) => {
    if (!list) list = cell.querySelector('ul, ol');
    if (!picture) picture = cell.querySelector('picture');
    cell.querySelectorAll('a[href]').forEach((a) => {
      if (!videoLink && VIDEO_RE.test(a.href) && !a.closest('ul, ol')) videoLink = a;
    });
    if (!duration) {
      const text = [...cell.querySelectorAll('p')]
        .map((p) => p.textContent.trim())
        .find((t) => DURATION_RE.test(t));
      if (text) duration = text;
    }
  });

  const children = [];

  if (list) {
    const nav = document.createElement('nav');
    nav.className = 'hero-article-breadcrumbs';
    nav.setAttribute('aria-label', 'Breadcrumb');
    const ol = document.createElement('ol');
    [...list.children].forEach((li) => {
      // the current page may be authored as plain text; wrap it so it styles like the links
      const link = li.querySelector('a');
      const span = document.createElement('span');
      span.textContent = (link || li).textContent.trim();
      if (link) {
        link.replaceChildren(span);
        li.replaceChildren(link);
      } else if (span.textContent) {
        li.replaceChildren(span);
      }
      ol.append(li);
    });
    const last = ol.lastElementChild;
    if (last) last.setAttribute('aria-current', 'page');
    nav.append(ol);
    children.push(nav);
  }

  if (picture) {
    const img = picture.querySelector('img');
    const optimized = img
      ? createOptimizedPicture(img.src, img.alt, true, [{ media: '(min-width: 900px)', width: '2000' }, { width: '900' }])
      : picture;
    const optimizedImg = optimized.querySelector('img');
    if (optimizedImg) {
      optimizedImg.setAttribute('loading', 'eager');
      optimizedImg.setAttribute('fetchpriority', 'high');
      if (img?.getAttribute('width')) optimizedImg.setAttribute('width', img.getAttribute('width'));
      if (img?.getAttribute('height')) optimizedImg.setAttribute('height', img.getAttribute('height'));
    }

    const stage = document.createElement('div');
    stage.className = 'hero-article-media';

    const frame = document.createElement('div');
    frame.className = 'hero-article-frame';
    frame.append(optimized);
    stage.append(frame);

    if (videoLink) {
      const { href } = videoLink;
      const label = videoLink.textContent.trim() || 'Play video';
      const play = document.createElement('button');
      play.type = 'button';
      play.className = 'hero-article-play';
      play.setAttribute('aria-label', label);
      play.setAttribute('aria-haspopup', 'dialog');
      play.addEventListener('click', () => openModal(block, href, img?.alt || label));
      stage.append(play);
      if (duration) {
        const time = document.createElement('span');
        time.className = 'hero-article-duration';
        time.textContent = duration;
        stage.append(time);
      }
      block.classList.add('hero-article-video');
    }
    children.push(stage);
  }

  block.replaceChildren(...children);
}
