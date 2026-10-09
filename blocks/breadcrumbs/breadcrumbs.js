/*
 * Breadcrumbs block
 * Content contract: one cell holding the trail as a list (or paragraphs) of links, home first.
 * The last item may be plain text (the current page); if it is a link it is marked as current.
 * If no items are authored, the trail is derived from the current URL path.
 */

function itemsFromPath() {
  const segments = window.location.pathname.split('/').filter(Boolean);
  const items = [{ text: 'Home', href: '/' }];
  let href = '';
  segments.forEach((seg) => {
    href += `/${seg}`;
    items.push({
      text: decodeURIComponent(seg).replace(/[-_]+/g, ' ').replace(/\.html$/, ''),
      href,
    });
  });
  return items;
}

function itemsFromContent(block) {
  const items = [];
  const listItems = block.querySelectorAll('li');
  const sources = listItems.length ? [...listItems] : [...block.querySelectorAll('p, div > div')]
    .filter((el) => !el.querySelector('p, li') && el.textContent.trim());

  sources.forEach((el) => {
    const links = el.querySelectorAll('a');
    if (links.length) {
      links.forEach((a) => {
        const icon = a.querySelector('.icon');
        items.push({
          text: a.textContent.trim(), href: a.getAttribute('href'), icon: icon ? icon.cloneNode(true) : null,
        });
      });
    } else {
      const icon = el.querySelector('.icon');
      items.push({
        text: el.textContent.trim(),
        href: null,
        icon: icon ? icon.cloneNode(true) : null,
      });
    }
  });
  return items;
}

export default function decorate(block) {
  let items = itemsFromContent(block);
  if (!items.length) items = itemsFromPath();

  const nav = document.createElement('nav');
  nav.setAttribute('aria-label', 'Breadcrumb');
  const ol = document.createElement('ol');
  ol.className = 'breadcrumbs-list';

  items.forEach((item, i) => {
    const li = document.createElement('li');
    li.className = 'breadcrumbs-item';
    const isLast = i === items.length - 1;
    let el;
    if (item.href && !isLast) {
      el = document.createElement('a');
      el.href = item.href;
    } else {
      el = document.createElement('span');
    }
    if (item.icon) {
      el.append(item.icon);
      if (item.text) el.setAttribute('aria-label', item.text);
      li.classList.add('breadcrumbs-item-icon');
    } else {
      el.textContent = item.text;
    }
    if (isLast) {
      el.setAttribute('aria-current', 'page');
      li.classList.add('breadcrumbs-item-current');
    }
    li.append(el);
    ol.append(li);
  });

  nav.append(ol);
  block.replaceChildren(nav);
}
