/*
 * Social share block: horizontal row of share links for the current page.
 *
 * Content contract (optional):
 * - list items / paragraphs naming networks (facebook, linkedin, x/twitter, email)
 *   -> rendered in that order; an authored link on an item overrides the generated share URL
 * - no content -> facebook, linkedin, email
 */
// artwork from the source site's share icons (natural size, centered in a 28x24 cell)
const ICONS = {
  facebook: '<svg width="11" height="20" viewBox="0 0 11 20" aria-hidden="true" focusable="false"><path fill="#0057b8" d="M3.068 20v-8.667H0v-4h3.068V4.54C3.068 1.497 5.054 0 7.853 0c1.341 0 2.494.097 2.83.14v3.18l-1.942.001c-1.522 0-1.866.701-1.866 1.73v2.282H11l-1.375 4H6.875V20z"/></svg>',
  linkedin: '<svg width="20" height="20" viewBox="0 0 20 20" aria-hidden="true" focusable="false"><path fill="#0057b8" d="M19.167 0H.833C.333 0 0 .333 0 .833v18.334c0 .5.333.833.833.833h18.334c.5 0 .833-.333.833-.833V.833C20 .333 19.667 0 19.167 0M5.917 17.083H3V7.5h3v9.583zm-1.5-10.916c-.917 0-1.75-.75-1.75-1.75 0-.917.75-1.75 1.75-1.75.916 0 1.75.75 1.75 1.75s-.75 1.75-1.75 1.75m12.666 10.916h-3v-4.666c0-1.084 0-2.5-1.5-2.5-1.583 0-1.75 1.166-1.75 2.416v4.75h-3V7.5h2.834v1.333c.416-.75 1.333-1.5 2.833-1.5 3 0 3.583 2 3.583 4.584z"/></svg>',
  x: '<svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path fill="#0057b8" d="M17.8 3h3l-6.6 7.6L22 21h-6.1l-4.8-6.2L5.6 21h-3l7.1-8.1L2.3 3h6.2l4.3 5.7zm-1 16.2h1.7L7.3 4.7H5.5z"/></svg>',
  email: '<svg width="24" height="21" viewBox="0 0 24 21" aria-hidden="true" focusable="false"><g fill="none" stroke="#0057b8" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" transform="translate(1 1)"><path d="M20 18.571H1.429C.64 18.571 0 17.931 0 17.143V1.429C0 .64.64 0 1.429 0H20c.789 0 1.429.64 1.429 1.429v15.714c0 .788-.64 1.428-1.429 1.428z"/><path d="M3 6l7.857 6.429L18.714 6"/></g></svg>',
};

const LABELS = {
  facebook: 'Share on Facebook',
  linkedin: 'Share on LinkedIn',
  x: 'Share on X',
  email: 'Share by email',
};

function networkOf(text) {
  const t = (text || '').toLowerCase();
  if (t.includes('facebook')) return 'facebook';
  if (t.includes('linkedin')) return 'linkedin';
  if (t.includes('twitter') || /\bx\b/.test(t) || t.includes('x.com')) return 'x';
  if (t.includes('mail')) return 'email';
  return null;
}

function shareUrl(network) {
  const url = encodeURIComponent(window.location.href);
  const title = encodeURIComponent(document.title);
  switch (network) {
    case 'facebook': return `https://www.facebook.com/sharer/sharer.php?u=${url}`;
    case 'linkedin': return `https://www.linkedin.com/sharing/share-offsite/?url=${url}`;
    case 'x': return `https://twitter.com/intent/tweet?url=${url}&text=${title}`;
    default: return `mailto:?subject=${title}&body=${url}`;
  }
}

export default function decorate(block) {
  const items = [];
  const seen = new Set();
  const candidates = block.querySelectorAll('li, p, :scope > div > div:not(:has(p, li))');
  candidates.forEach((el) => {
    const link = el.querySelector('a[href]');
    const network = networkOf(`${el.textContent} ${link ? link.href : ''}`);
    if (network && !seen.has(network)) {
      seen.add(network);
      items.push({ network, href: link ? link.href : null });
    }
  });
  if (!items.length) {
    ['facebook', 'linkedin', 'email'].forEach((network) => items.push({ network, href: null }));
  }

  const list = document.createElement('ul');
  list.className = 'social-share-list';
  items.forEach(({ network, href }) => {
    const li = document.createElement('li');
    li.className = `social-share-item social-share-item-${network}`;
    const a = document.createElement('a');
    a.className = `social-share-link social-share-${network}`;
    a.href = href || shareUrl(network);
    a.setAttribute('aria-label', LABELS[network]);
    if (network !== 'email') {
      a.target = '_blank';
      a.rel = 'noopener noreferrer';
    }
    a.innerHTML = ICONS[network];
    li.append(a);
    list.append(li);
  });

  block.replaceChildren(list);
}
