/* eslint-disable */
/* global WebImporter */
/**
 * Parser for table. Base: table. Template: content-page.
 * Source: https://www.aig.com/home/investor-relations/webcasts-and-presentations
 * Selector: main .text table:not(.accordion *)
 * Output: block rows = source table rows, block cells = source cells (first row = header).
 *   Cell content keeps inline formatting and links (hrefs absolute, icon-font glyph text removed);
 *   empty (&nbsp;) cells become empty cells. Rows are padded to the widest row so the block grid
 *   stays rectangular; colspan cells are expanded with empty cells.
 * The surrounding .text paragraphs/headings are left in place as default content.
 */
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

function cellContent(td, document) {
  const clone = td.cloneNode(true);
  clone.querySelectorAll('.custom-icons, script, style').forEach((n) => n.remove());
  clone.querySelectorAll('a[href]').forEach((a) => a.setAttribute('href', absUrl(a.getAttribute('href'), document)));
  clone.querySelectorAll('img[src]').forEach((i) => i.setAttribute('src', absUrl(i.getAttribute('src'), document)));
  // trailing <br> after inline content adds nothing
  [...clone.querySelectorAll('br')].forEach((br) => { if (!br.nextSibling || (br.nextSibling.nodeType === 3 && !br.nextSibling.textContent.trim() && !br.nextSibling.nextSibling)) br.remove(); });
  const text = clone.textContent.replace(/\u00a0/g, ' ').trim();
  if (!text && !clone.querySelector('img')) return '';
  const nodes = [...clone.childNodes].filter((n) => n.nodeType !== 3 || n.textContent.replace(/\u00a0/g, ' ').trim());
  return nodes.length === 1 ? nodes[0] : nodes;
}

export default function parse(element, { document }) {
  const table = element.matches('table') ? element : element.querySelector('table');
  if (!table) {
    element.replaceWith(...element.childNodes);
    return;
  }

  const rows = [...table.querySelectorAll(':scope > thead > tr, :scope > tbody > tr, :scope > tfoot > tr, :scope > tr')];
  const cells = rows.map((tr) => {
    const row = [];
    [...tr.children].filter((c) => /^T[DH]$/.test(c.tagName)).forEach((td) => {
      row.push(cellContent(td, document));
      const span = parseInt(td.getAttribute('colspan') || '1', 10);
      for (let i = 1; i < span; i += 1) row.push('');
    });
    return row;
  }).filter((row) => row.some((c) => c !== ''));

  if (!cells.length) {
    element.replaceWith(...element.childNodes);
    return;
  }

  const width = Math.max(...cells.map((r) => r.length));
  cells.forEach((r) => { while (r.length < width) r.push(''); });

  const block = WebImporter.Blocks.createBlock(document, { name: 'table', cells });
  element.replaceWith(block);
}
