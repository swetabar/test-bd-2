/*
 * Embed block: embeds third-party content
 * (YouTube, Vimeo, generic iframe pages such as hosted forms)
 * from an authored URL. The iframe is created lazily when the block nears the viewport.
 * Content contract: one row; a link to the embedded URL, optional placeholder picture,
 * optional heading/text shown above the embed.
 */

function embedYoutube(url) {
  const id = url.hostname.includes('youtu.be')
    ? url.pathname.slice(1)
    : url.searchParams.get('v') || url.pathname.split('/').pop();
  return `https://www.youtube.com/embed/${id}?rel=0`;
}

function embedVimeo(url) {
  const id = url.pathname.split('/').filter(Boolean).pop();
  return `https://player.vimeo.com/video/${id}`;
}

/*
 * Known hosted iframes (AIG investor-relations widgets on gcs-web.com).
 * The source page gives each a fixed frame height (scrolling="no"), so the
 * embed reserves exactly that height; titles mirror the source iframes.
 */
const KNOWN_EMBEDS = {
  '/aig-sec-filings-archive': { height: 1200, title: 'Sec Fillings' },
  '/aig-stock-information': { height: 1400, title: 'Stock Information' },
  '/aig-request-print-materials': { height: 3000, title: 'Request Print Materials' },
  '/aig-latest-press-releases': { height: 220, title: 'Latest Press Releases' },
  '/aig-press-release-archive': { height: 150, title: 'Press Release Archive' },
};

function knownEmbed(href) {
  try {
    const url = new URL(href, window.location.href);
    if (!url.hostname.endsWith('gcs-web.com')) return null;
    return KNOWN_EMBEDS[url.pathname.replace(/\/$/, '')] || null;
  } catch {
    return null;
  }
}

/* optional authored cell/paragraph holding only a pixel height, e.g. "1200" or "1200px" */
function authoredHeight(block, link) {
  const candidates = [...block.querySelectorAll('p, div')]
    .filter((el) => !el.contains(link) && !el.querySelector('p, div'));
  const match = candidates.find((el) => /^\d+\s*(px)?$/i.test(el.textContent.trim()));
  if (!match) return null;
  const height = parseInt(match.textContent, 10);
  match.remove();
  return height || null;
}

function buildIframe(href, title) {
  let url;
  try {
    url = new URL(href, window.location.href);
  } catch {
    return null;
  }
  let src = url.href;
  let isVideo = false;
  if (/(youtube\.com|youtu\.be)$/.test(url.hostname.replace(/^www\./, ''))) {
    src = embedYoutube(url);
    isVideo = true;
  } else if (url.hostname.includes('vimeo.com')) {
    src = embedVimeo(url);
    isVideo = true;
  }
  const iframe = document.createElement('iframe');
  iframe.src = src;
  iframe.loading = 'lazy';
  iframe.title = title || 'Embedded content';
  iframe.setAttribute('allow', 'autoplay; fullscreen; picture-in-picture; encrypted-media');
  iframe.setAttribute('allowfullscreen', '');
  return { iframe, isVideo };
}

export default function decorate(block) {
  const link = block.querySelector('a[href]');
  const picture = block.querySelector('picture');
  if (!link) return;
  const href = link.getAttribute('href');
  const known = knownEmbed(href);
  const height = authoredHeight(block, link) || known?.height;

  // authored text other than the link stays above the embed
  const intro = document.createElement('div');
  intro.className = 'embed-intro';
  [...block.querySelectorAll('h1, h2, h3, h4, h5, h6, p')].forEach((el) => {
    if (el.contains(link) || el.contains(picture)) return;
    if (el.textContent.trim()) intro.append(el);
  });

  const frame = document.createElement('div');
  frame.className = 'embed-frame';
  // reserve the frame height up front so the lazily created iframe causes no layout shift
  if (height) frame.style.setProperty('--embed-height', `${height}px`);

  // the iframe is built (not attached) up front so the frame gets its final shape immediately
  const linkTitle = link.getAttribute('title');
  const built = buildIframe(href, known?.title || (linkTitle !== href ? linkTitle : ''));
  if (!built) return;
  frame.classList.toggle('embed-frame-video', built.isVideo);

  const load = () => {
    if (!frame.contains(built.iframe)) frame.replaceChildren(built.iframe);
  };

  if (picture) {
    const placeholder = document.createElement('button');
    placeholder.type = 'button';
    placeholder.className = 'embed-placeholder';
    placeholder.setAttribute('aria-label', link.textContent.trim() || 'Load embedded content');
    placeholder.append(picture);
    placeholder.addEventListener('click', load);
    frame.append(placeholder);
    frame.classList.add('embed-frame-video');
  } else {
    const observer = new IntersectionObserver((entries) => {
      if (entries.some((e) => e.isIntersecting)) {
        observer.disconnect();
        load();
      }
    }, { rootMargin: '200px' });
    observer.observe(block);
  }

  block.replaceChildren(...(intro.childNodes.length ? [intro] : []), frame);
}
