/* eslint-disable */
/* global WebImporter */
/**
 * Parser for contact-card. Base: cards (custom). Templates: accordion-detail, claim-contact,
 * claim-contact-multi.
 * Sources: https://www.aig.com/home/claims/report-a-claim/casualty-multinational,
 *   .../workers-compensation-construction-risk, .../casualty-canada (multi-office),
 *   .../casualty-construction-defect (primary + excess offices)
 * Selector: main .container.flexbox-container:has(> .cmp-container > .aem-Grid > .text.aig-claims-card)
 *
 * Output (1 column): one row per .text.aig-claims-card (one bordered card on the source; a
 * multi-office card stays one card). Cell content, in source order:
 *   - centered heading (h2, inner bold dropped)
 *   - paragraphs as authored: bold labels ("Email (New Losses):", "For Excess", office names),
 *     phone / email links kept as tel: / mailto: links, mailing addresses with line breaks.
 *   - icon images (icon_telephone / icon_fax / icon_email) become :phone: / :fax: / :email: icon
 *     tokens placed before the value they label (moved out of the wrapping link/bold).
 *   - fax: links (not a browser protocol) become plain text; tel: hrefs are trimmed
 *     (e.g. "tel:%20800-910-2667" -> "tel:800-910-2667"); other hrefs are made absolute.
 *   - empty / &nbsp; spacer paragraphs and trailing <br>s are dropped.
 */
const ICONS = [
  { re: /telephone|phone/i, name: 'phone' },
  { re: /fax/i, name: 'fax' },
  { re: /e-?mail|envelope/i, name: 'email' },
];
const INLINE = ['A', 'B', 'STRONG', 'EM', 'I', 'U', 'SPAN', 'FONT'];

function absUrl(href, document) {
  if (!href) return href;
  if (/^(mailto:|tel:|javascript:|#)/i.test(href)) return href;
  try {
    const base = document.location && document.location.href !== 'about:blank'
      ? document.location.href : 'https://www.aig.com/home';
    return new URL(href, base).href;
  } catch (e) {
    return href;
  }
}

function clean(text) {
  return (text || '').replace(/[\s\u00a0]+/g, ' ').trim();
}

function iconName(img) {
  const key = `${img.getAttribute('src') || ''} ${img.getAttribute('alt') || ''}`;
  const hit = ICONS.find((i) => i.re.test(key));
  return hit ? hit.name : null;
}

// text (ignoring icon images) that precedes `node` inside `container`
function textBefore(container, node, document) {
  const range = document.createRange();
  range.setStart(container, 0);
  range.setEndBefore(node);
  return clean(range.cloneContents().textContent);
}

function unwrap(el) {
  el.replaceWith(...el.childNodes);
}

// does anything (text or a <br>) precede `node` inside `container`?
function hasContentBefore(container, node, document) {
  if (textBefore(container, node, document)) return true;
  const range = document.createRange();
  range.setStart(container, 0);
  range.setEndBefore(node);
  return Boolean(range.cloneContents().querySelector('br'));
}

function textNodes(root, document) {
  const walker = document.createTreeWalker(root, 4 /* NodeFilter.SHOW_TEXT */);
  const out = [];
  while (walker.nextNode()) out.push(walker.currentNode);
  return out;
}

// split a paragraph at runs of 2+ <br> (blank lines inside one <p> on the source)
function splitAtBlankLines(p, document) {
  const kids = [...p.childNodes];
  const groups = [[]];
  for (let i = 0; i < kids.length; i += 1) {
    const n = kids[i];
    if (n.nodeName === 'BR') {
      let j = i + 1;
      while (j < kids.length && kids[j].nodeType === 3 && !clean(kids[j].textContent)) j += 1;
      if (j < kids.length && kids[j].nodeName === 'BR') {
        while (j < kids.length && (kids[j].nodeName === 'BR' || (kids[j].nodeType === 3 && !clean(kids[j].textContent)))) j += 1;
        groups.push([]);
        i = j - 1;
        continue;
      }
    }
    groups[groups.length - 1].push(n);
  }
  if (groups.length < 2) return [p];
  return groups.filter((g) => g.some((n) => clean(n.textContent) || (n.querySelector && n.querySelector('img'))))
    .map((g) => {
      const np = document.createElement('p');
      np.append(...g);
      return np;
    });
}

// a line holding a contact value: an icon token or a tel: / mailto: link
function isContactLine(nodes) {
  return nodes.some((n) => /:(phone|fax|email):/.test(n.textContent || '')
    || (n.nodeType === 1 && (n.matches('a[href^="tel:"], a[href^="mailto:"]')
      || n.querySelector('a[href^="tel:"], a[href^="mailto:"]'))));
}

// The block lays contact lines out as one flex row, so <br>-separated lines inside a
// paragraph that holds a contact value ("Property: :email: a@x<br>Auto: :email: b@x",
// ":email: a@x<br>AIG<br>PO Box ..") would collapse side by side. Give every contact line
// its own paragraph; runs of other lines (labels, mailing addresses) stay together with
// their <br>s. Paragraphs without a contact value are left untouched.
function splitContactLines(p, document) {
  if (!p.querySelector(':scope > br')) return [p];
  const lines = [[]];
  [...p.childNodes].forEach((n) => {
    if (n.nodeName === 'BR') lines.push([]);
    else lines[lines.length - 1].push(n);
  });
  if (!lines.some(isContactLine)) return [p];
  const out = [];
  let run = null;
  lines.forEach((line) => {
    if (!line.some((n) => clean(n.textContent) || (n.querySelector && n.querySelector('img')))) return;
    if (isContactLine(line)) {
      run = null;
      const np = document.createElement('p');
      np.append(...line);
      out.push(np);
      return;
    }
    if (run) run.append(document.createElement('br'));
    else {
      run = document.createElement('p');
      out.push(run);
    }
    run.append(...line);
  });
  return out;
}

function cleanCard(body, document) {
  const card = body.cloneNode(true);
  card.querySelectorAll('script, style, .custom-icons, .sr-only').forEach((n) => n.remove());

  // &nbsp; runs used as spacing -> single regular spaces
  textNodes(card, document).forEach((t) => {
    t.textContent = t.textContent.replace(/\u00a0/g, ' ').replace(/ {2,}/g, ' ');
  });

  // icon images -> :name: tokens, lifted out of the inline wrappers they open
  card.querySelectorAll('img').forEach((img) => {
    const name = iconName(img);
    if (!name) {
      img.setAttribute('src', absUrl(img.getAttribute('src'), document));
      return;
    }
    let anchor = img;
    while (anchor.parentElement && INLINE.includes(anchor.parentElement.tagName)
      && !hasContentBefore(anchor.parentElement, img, document)) {
      anchor = anchor.parentElement;
    }
    const prev = anchor.previousSibling;
    const needsSpace = prev && prev.nodeName !== 'BR' && !/ $/.test(prev.textContent || '');
    anchor.before(document.createTextNode(`${needsSpace ? ' ' : ''}:${name}: `));
    img.remove();
  });

  // links: fax: -> text, tel: trimmed, everything else absolute
  card.querySelectorAll('a').forEach((a) => {
    const href = (a.getAttribute('href') || '').trim();
    if (!href || /^fax:/i.test(href) || /^javascript:/i.test(href)) {
      unwrap(a);
      return;
    }
    let value = href;
    if (/^tel:/i.test(href)) {
      value = `tel:${decodeURIComponent(href.slice(4)).replace(/[\s\u00a0]+/g, '')}`;
    } else if (/^mailto:/i.test(href)) {
      value = `mailto:${href.slice(7).trim()}`;
    } else {
      value = absUrl(href, document);
    }
    [...a.attributes].forEach((attr) => a.removeAttribute(attr.name));
    a.setAttribute('href', value);
  });

  // inline wrappers without real text (e.g. <b>&nbsp;</b>, <b> </b>) add nothing
  [...card.querySelectorAll('b, strong, em, i, u, span, font')].reverse().forEach((el) => {
    if (!clean(el.textContent.replace(/:(phone|fax|email):/g, '')) && !el.querySelector('img, a')) {
      unwrap(el);
    }
  });
  card.querySelectorAll('[style]').forEach((el) => el.removeAttribute('style'));

  // line breaks closing an inline wrapper ("<b>For Claims Documentation:<br></b><a>..")
  // belong after it: the label sits on its own line on the source (deepest first)
  [...card.querySelectorAll(INLINE.join(',').toLowerCase())].reverse().forEach((el) => {
    const isBlank = (n) => n && ((n.nodeType === 3 && !clean(n.textContent)) || n.nodeName === 'BR');
    if (!clean(el.textContent) || !isBlank(el.lastChild)) return;
    const brs = [];
    while (isBlank(el.lastChild)) {
      if (el.lastChild.nodeName === 'BR') brs.unshift(el.lastChild);
      el.lastChild.remove();
    }
    el.after(...brs);
  });

  // edge spaces inside bold/links ("<b>800-910-2667&nbsp;</b>") are lost by markdown
  // emphasis - move them outside the wrapper (deepest first)
  [...card.querySelectorAll('a, b, strong, em, i, u')].reverse().forEach((el) => {
    const last = el.lastChild;
    if (last && last.nodeType === 3 && /\s$/.test(last.textContent) && clean(el.textContent)) {
      last.textContent = last.textContent.replace(/\s+$/, '');
      el.after(document.createTextNode(' '));
    }
    const first = el.firstChild;
    if (first && first.nodeType === 3 && /^\s/.test(first.textContent) && clean(el.textContent)) {
      first.textContent = first.textContent.replace(/^\s+/, '');
      el.before(document.createTextNode(' '));
    }
  });

  // headings: plain text (source wraps the title in <b>)
  const parts = [];
  [...card.children].forEach((child) => {
    if (/^H[1-6]$/.test(child.tagName)) {
      const h = document.createElement(child.tagName.toLowerCase());
      h.textContent = clean(child.textContent);
      if (h.textContent) parts.push(h);
      return;
    }
    // trailing / leading <br>s and blank paragraphs
    const trimEdges = (el) => {
      const isBlank = (n) => n && ((n.nodeType === 3 && !clean(n.textContent)) || n.nodeName === 'BR');
      while (isBlank(el.lastChild)) el.lastChild.remove();
      while (isBlank(el.firstChild)) el.firstChild.remove();
      // a bold wrapper can end with <br> too: <b>..<br></b>
      [...el.querySelectorAll('b, strong')].forEach((b) => {
        while (isBlank(b.lastChild)) b.lastChild.remove();
      });
    };
    const pieces = child.tagName === 'P' ? splitAtBlankLines(child, document) : [child];
    pieces.forEach((piece) => {
      trimEdges(piece);
      if (!clean(piece.textContent) && !piece.querySelector('img')) return;
      (piece.tagName === 'P' ? splitContactLines(piece, document) : [piece]).forEach((p) => {
        trimEdges(p);
        if (clean(p.textContent) || p.querySelector('img')) parts.push(p);
      });
    });
  });

  // text directly inside the body (no <p> wrapper) -> its own paragraph
  if (!parts.length && clean(card.textContent)) {
    const p = document.createElement('p');
    p.textContent = clean(card.textContent);
    parts.push(p);
  }
  return parts;
}

export default function parse(element, { document }) {
  const cards = [...element.querySelectorAll('.text.aig-claims-card')]
    .filter((el, i, arr) => !arr.some((o) => o !== el && o.contains(el)));
  if (!cards.length && element.matches('.aig-claims-card')) cards.push(element);

  const cells = cards
    .map((card) => cleanCard(card.querySelector('.cmp-text') || card, document))
    .filter((parts) => parts.length)
    .map((parts) => [parts]);

  if (!cells.length) {
    element.replaceWith(...element.childNodes);
    return;
  }

  const block = WebImporter.Blocks.createBlock(document, { name: 'contact-card', cells });
  element.replaceWith(block);
}
