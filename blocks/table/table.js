/*
 * Table block: data table (e.g. credit ratings grid) rendered from the block's rows.
 *
 * Content contract:
 * - each block row -> table row; each cell -> table cell
 * - first row -> header row (<th scope="col">)
 * - a row whose first cell is bold/strong-only -> that cell becomes a row header (<th scope="row">)
 * - rows with fewer cells than the widest row get their last cell spanned to fill the gap
 */
function isStrongOnly(cell) {
  const strong = cell.querySelector('strong, b');
  return strong && strong.textContent.trim() === cell.textContent.trim();
}

/*
 * Links leaving the site (other host, or a document/media file) open in a new tab and
 * get the external-link glyph, as on the source table.
 */
function isExternal(a) {
  try {
    const url = new URL(a.href, window.location.href);
    if (!/^https?:$/.test(url.protocol)) return false;
    return url.host !== window.location.host || /\.(pdf|mp3|mp4|xlsx?|docx?|pptx?)$/i.test(url.pathname);
  } catch {
    return false;
  }
}

function decorateLinks(block) {
  // table links are plain inline links: undo the global standalone-link button decoration
  block.querySelectorAll('p.button-wrapper').forEach((p) => p.replaceWith(...p.childNodes));
  block.querySelectorAll('a.button').forEach((a) => {
    a.classList.remove('button', 'link', 'primary', 'secondary', 'accent');
    if (!a.classList.length) a.removeAttribute('class');
  });
  block.querySelectorAll('a[href]').forEach((a) => {
    if (!isExternal(a)) return;
    a.classList.add('table-external');
    a.target = '_blank';
    a.rel = 'noopener noreferrer';
    // glyph via the custom-icons ligature font, as on the source
    const icon = document.createElement('span');
    icon.className = 'table-icon-external';
    icon.setAttribute('aria-hidden', 'true');
    icon.textContent = 'external_link';
    a.append(icon);
  });
}

export default function decorate(block) {
  const rows = [...block.children].filter((row) => row.children.length);
  if (!rows.length) return;

  const width = Math.max(...rows.map((row) => row.children.length));
  const table = document.createElement('table');
  const thead = document.createElement('thead');
  const tbody = document.createElement('tbody');

  rows.forEach((row, rowIndex) => {
    const tr = document.createElement('tr');
    const cells = [...row.children];
    cells.forEach((cell, cellIndex) => {
      let tag = 'td';
      if (rowIndex === 0) tag = 'th';
      else if (cellIndex === 0 && isStrongOnly(cell)) tag = 'th';
      const el = document.createElement(tag);
      if (tag === 'th') el.scope = rowIndex === 0 ? 'col' : 'row';
      if (cellIndex === cells.length - 1 && cells.length < width) {
        el.colSpan = width - cells.length + 1;
      }
      el.append(...cell.childNodes);
      tr.append(el);
    });
    (rowIndex === 0 ? thead : tbody).append(tr);
  });

  table.append(thead, tbody);
  decorateLinks(table);

  const scroller = document.createElement('div');
  scroller.className = 'table-scroll';
  scroller.tabIndex = 0;
  scroller.setAttribute('role', 'region');
  scroller.setAttribute('aria-label', 'Scrollable table');
  scroller.append(table);
  block.replaceChildren(scroller);
}
