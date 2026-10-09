/*
 * Contact card block: bordered contact information card(s), centered heading followed by
 * label/value rows (phone, fax, email, website, mailing addresses) with optional inline icons.
 * Content contract: one row per card; all cells of a row are merged into one card body
 * (heading, then paragraphs; labels as bold text, :phone: / :fax: / :email: icons inline).
 */
import { decorateIcons } from '../../scripts/aem.js';

const ICON_TOKEN = /:([a-z][a-z0-9-]*):/g;
const PHONE_NUMBER = /\+?\(?\d[\d\s().-]{6,}\d/g;

function textNodes(root, filter = () => true) {
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  const nodes = [];
  while (walker.nextNode()) {
    if (filter(walker.currentNode)) nodes.push(walker.currentNode);
  }
  return nodes;
}

/**
 * Replaces matches of a regex inside a text node with elements built by `build`.
 */
function replaceInText(node, regex, build) {
  const text = node.textContent;
  regex.lastIndex = 0;
  if (!regex.test(text)) return;
  regex.lastIndex = 0;
  const frag = document.createDocumentFragment();
  let last = 0;
  text.replace(regex, (match, ...args) => {
    const offset = args[args.length - 2];
    const el = build(match, args);
    if (!el) return match;
    if (offset > last) frag.append(text.slice(last, offset));
    frag.append(el);
    last = offset + match.length;
    return match;
  });
  if (last === 0) return;
  if (last < text.length) frag.append(text.slice(last));
  node.replaceWith(frag);
}

/** Converts literal :icon: tokens (left when the pipeline did not decorate them) into spans. */
function convertIconTokens(card) {
  textNodes(card).forEach((node) => replaceInText(node, ICON_TOKEN, (match, [name]) => {
    const span = document.createElement('span');
    span.className = `icon icon-${name}`;
    return span;
  }));
  decorateIcons(card);
  card.querySelectorAll('.icon img').forEach((img) => {
    img.width = 32;
    img.height = 32;
  });
}

/** Reverts decorateButtons(): contact links are inline text links, never buttons. */
function undoButtons(card) {
  card.querySelectorAll('a.button').forEach((a) => {
    const { classList } = a;
    let wrapped = a;
    if (classList.contains('accent')) {
      const em = document.createElement('em');
      a.replaceWith(em);
      em.append(a);
      wrapped = em;
    }
    if (classList.contains('primary') || classList.contains('accent')) {
      const strong = document.createElement('strong');
      wrapped.replaceWith(strong);
      strong.append(wrapped);
    }
    a.removeAttribute('class');
  });
  card.querySelectorAll('.button-wrapper').forEach((p) => p.classList.remove('button-wrapper'));
}

export default function decorate(block) {
  const list = document.createElement('div');
  list.className = 'contact-card-list';

  [...block.children].forEach((row) => {
    if (!row.textContent.trim() && !row.querySelector('picture, .icon')) return;
    const card = document.createElement('div');
    card.className = 'contact-card-item';
    [...row.children].forEach((cell) => card.append(...cell.childNodes));

    undoButtons(card);
    convertIconTokens(card);

    // icons sit flush against the value that follows them
    card.querySelectorAll('.icon').forEach((icon) => {
      const next = icon.nextSibling;
      if (next && next.nodeType === Node.TEXT_NODE) {
        next.textContent = next.textContent.replace(/^\s+/, '');
      }
    });

    const heading = card.querySelector('h1, h2, h3, h4, h5, h6');
    if (heading) heading.classList.add('contact-card-title');

    card.querySelectorAll('p').forEach((p) => {
      if (p.querySelector('a[href^="tel:"], a[href^="mailto:"], .icon')) {
        p.classList.add('contact-card-line');
      }
      // a paragraph made only of a <strong> label is a field label
      const strong = p.querySelector(':scope > strong');
      if (strong && p.textContent.trim() === strong.textContent.trim() && !strong.querySelector('a')) {
        p.classList.add('contact-card-label');
      }
    });

    // un-linked numbers (fax, secondary phones) in contact lines share the link styling
    card.querySelectorAll('.contact-card-line').forEach((p) => {
      textNodes(p, (n) => !n.parentElement.closest('a')).forEach((node) => {
        replaceInText(node, PHONE_NUMBER, (match) => {
          if (match.replace(/\D/g, '').length < 7) return null;
          const span = document.createElement('span');
          span.className = 'contact-card-number';
          span.textContent = match;
          return span;
        });
      });
    });

    card.querySelectorAll('a[href^="tel:"]').forEach((a) => a.classList.add('contact-card-phone'));
    card.querySelectorAll('a[href^="mailto:"]').forEach((a) => a.classList.add('contact-card-email'));

    list.append(card);
  });

  block.replaceChildren(list);
}
