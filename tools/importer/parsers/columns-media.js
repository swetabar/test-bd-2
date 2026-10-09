/* eslint-disable */
/* global WebImporter */
/**
 * Parser for columns-media. Base: columns. Sources: https://www.aig.com/home (landing-page),
 *   https://www.aig.com/home/risk-solutions/business/multinational (content-page)
 * Selectors:
 *   landing-page: .container.aig-video.two-column-grid | .teaserflex.cta-with-image:not(.aig-featured-story)
 *   content-page: main .container.aig-video.two-column-grid
 *                 main .teaserflex.cta-with-image:not(.lightblue):not(.aig-article-card)
 * Output: one 2-cell row per item, cells in visual order:
 *   video / imageleft -> media | text ; imageright -> text | media
 * Video media cell = poster image + link to the video (button[data-src] mp4, else dialog anchor).
 * Content pages: consecutive sibling .cta-with-image teasers in the same grid are merged into ONE
 *   block (one row per teaser). The landing (home) page keeps one block per teaser, as before.
 * Text cell: heading, description paragraphs and lists, CTA links (icon-font text stripped).
 */
function absUrl(href, document) {
  try {
    const base = document.location && document.location.href !== 'about:blank'
      ? document.location.href : 'https://www.aig.com/home';
    return new URL(href, base).href;
  } catch (e) {
    return href;
  }
}

// Landing (home) page: keep the original one-block-per-teaser output there.
function isHomePage(document, ctx) {
  let href = (ctx && ctx.params && ctx.params.originalURL) || (ctx && ctx.url) || '';
  if (!href) {
    // html2md may hand the parser a detached document (no location): use the canonical URL
    const canonical = document.querySelector('link[rel="canonical"][href], meta[property="og:url"][content]');
    href = canonical ? (canonical.getAttribute('href') || canonical.getAttribute('content')) : '';
  }
  if (!href && document.location && document.location.href !== 'about:blank') href = document.location.href;
  try {
    const path = new URL(href).pathname.replace(/\.html$/, '').replace(/\/+$/, '');
    return path === '' || path === '/home';
  } catch (e) {
    return false;
  }
}

function isMergeableTeaser(el) {
  return !!el && el.nodeType === 1 && el.matches('.teaserflex.cta-with-image')
    && !el.matches('.lightblue, .aig-article-card, .aig-featured-story');
}

function linkText(a) {
  // drop icon-font glyph names (e.g. <span class="custom-icons">external_link</span>)
  const clone = a.cloneNode(true);
  clone.querySelectorAll('.custom-icons, .sr-only').forEach((s) => s.remove());
  return clone.textContent.trim();
}

function buildTextCell(content, document) {
  const cell = [];
  if (!content) return cell;
  const title = content.querySelector('.cmp-teaser__title, h1, h2, h3, h4');
  if (title) {
    const level = /^H[1-6]$/.test(title.tagName) ? title.tagName.toLowerCase() : 'h3';
    const heading = document.createElement(level);
    heading.textContent = title.textContent.trim();
    cell.push(heading);
  }
  const desc = content.querySelector('.cmp-teaser__description');
  if (desc) {
    const hasRich = !!desc.querySelector(':scope > ul, :scope > ol, :scope > h2, :scope > h3, :scope > h4, :scope > h5');
    const paras = hasRich
      ? [...desc.querySelectorAll(':scope > p, :scope > ul, :scope > ol, :scope > h2, :scope > h3, :scope > h4, :scope > h5')]
        .filter((el) => el.textContent.trim())
      : [...desc.querySelectorAll('p')].filter((p) => p.textContent.trim());
    if (paras.length) cell.push(...paras);
    else if (desc.textContent.trim()) {
      const p = document.createElement('p');
      p.textContent = desc.textContent.trim();
      cell.push(p);
    }
  }
  let ctas = [...content.querySelectorAll('.cmp-teaser__action-link')];
  if (!ctas.length && title) {
    const titleLink = title.querySelector('a[href]');
    if (titleLink) ctas = [titleLink];
  }
  ctas.forEach((a) => {
    a.textContent = linkText(a);
    const p = document.createElement('p');
    p.append(a);
    cell.push(p);
  });
  return cell;
}

function teaserRow(teaser, document) {
  const mediaCell = [];
  const img = teaser.querySelector('.cmp-teaser__image img, img');
  if (img) mediaCell.push(img);
  const textCell = buildTextCell(teaser.querySelector('.cmp-teaser__content'), document);
  if (!mediaCell.length && !textCell.length) return null;
  // imageright / contentLeft => text first
  const mediaFirst = !(teaser.classList.contains('imageright') || teaser.classList.contains('contentLeft'));
  return mediaFirst ? [mediaCell.length ? mediaCell : '', textCell.length ? textCell : '']
    : [textCell.length ? textCell : '', mediaCell.length ? mediaCell : ''];
}

export default function parse(element, ctx) {
  const { document } = ctx;
  // Already merged into the block of a preceding sibling teaser
  if (element.hasAttribute('data-columns-media-merged')) return;

  // Annual Report shape (landing-section /home/careers, /home/risk-solutions):
  // .container.flexbox-container.vert-center holding two .teaserflex.dt50 - an image-only teaser
  // and a text teaser (heading, description, CTA). One row, cells in source order.
  const dt50 = element.matches('.container')
    ? [...element.querySelectorAll(':scope > .cmp-container > .aem-Grid > .teaserflex.dt50')] : [];
  if (dt50.length >= 2) {
    const row = [];
    dt50.forEach((teaser) => {
      const content = teaser.querySelector('.cmp-teaser__content');
      const hasText = !!(content && content.textContent.trim());
      if (hasText) {
        const textCell = buildTextCell(content, document);
        if (textCell.length) row.push(textCell);
        return;
      }
      const img = teaser.querySelector('.cmp-teaser__image img, img');
      if (img) row.push([img]);
    });
    if (!row.length) {
      element.replaceWith(...element.childNodes);
      return;
    }
    const block = WebImporter.Blocks.createBlock(document, { name: 'columns-media', cells: [row] });
    element.replaceWith(block);
    return;
  }

  const isVideo = element.matches('.aig-video, .two-column-grid') || !!element.querySelector(':scope .videocomponent');

  if (!isVideo) {
    const rows = [];
    const first = teaserRow(element, document);
    if (first) rows.push(first);

    if (!isHomePage(document, ctx)) {
      // Merge the following consecutive sibling teasers into this block
      let next = element.nextElementSibling;
      while (isMergeableTeaser(next)) {
        const row = teaserRow(next, document);
        if (row) rows.push(row);
        const done = next;
        next = next.nextElementSibling;
        done.setAttribute('data-columns-media-merged', 'true');
        done.remove();
      }
    }

    if (!rows.length) {
      element.replaceWith(...element.childNodes);
      return;
    }
    const block = WebImporter.Blocks.createBlock(document, { name: 'columns-media', cells: rows });
    element.replaceWith(block);
    return;
  }

  const mediaCell = [];
  let textCell = [];
  const video = element.querySelector('.videocomponent');
  const poster = (video || element).querySelector('.video_thumbnail img, .video__container img, img');
  if (poster) mediaCell.push(poster);

  // Video source: the play button carries data-src (mp4) on the live page
  const srcEl = (video || element).querySelector('[data-src], video source[src], video[src], iframe[src]');
  let videoHref = srcEl && (srcEl.getAttribute('data-src') || srcEl.getAttribute('src'));
  if (!videoHref) {
    const dialogLink = element.querySelector('a[href^="#page-dialog-video"], a[href*="video"]');
    videoHref = dialogLink && dialogLink.getAttribute('href');
  }
  if (videoHref) {
    const p = document.createElement('p');
    const a = document.createElement('a');
    a.href = videoHref.startsWith('#') ? videoHref : absUrl(videoHref, document);
    a.textContent = 'Play Video';
    p.append(a);
    mediaCell.push(p);
  }
  // Duration label shown on the poster (e.g. 8:00)
  const timeEl = (video || element).querySelector('[data-time]');
  const time = timeEl && timeEl.getAttribute('data-time');
  if (time) {
    const p = document.createElement('p');
    p.textContent = time;
    mediaCell.push(p);
  }

  const teaser = element.querySelector('.teaserflex .cmp-teaser__content, .cmp-teaser__content');
  textCell = buildTextCell(teaser, document);

  if (!mediaCell.length && !textCell.length) {
    element.replaceWith(...element.childNodes);
    return;
  }

  // Video first unless the teaser precedes the video in the source grid
  const teaserEl = element.querySelector('.teaserflex');
  const textFirst = !!(video && teaserEl
    && (teaserEl.compareDocumentPosition(video) & 4) // eslint-disable-line no-bitwise
    && !teaserEl.contains(video));
  const row = textFirst ? [textCell.length ? textCell : '', mediaCell.length ? mediaCell : '']
    : [mediaCell.length ? mediaCell : '', textCell.length ? textCell : ''];

  const block = WebImporter.Blocks.createBlock(document, { name: 'columns-media', cells: [row] });
  element.replaceWith(block);
}
