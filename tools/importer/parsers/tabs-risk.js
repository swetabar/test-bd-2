/* eslint-disable */
/* global WebImporter */
/**
 * Parser for tabs-risk. Base: tabs. Source: https://www.aig.com/home
 * Selector: .container.aig-tabs .tabs.panelcontainer
 * Output: one row per tab: label (.cmp-tabs__tab) | panel content
 *   (banner image, intro paragraph, CTA, then H3 sub-items with description + links).
 * Tabs are paired with panels via the "-tab" / "-tabpanel" id convention, falling back to index.
 */
function toAbsolute(src, document) {
  if (!src) return src;
  try {
    return new URL(src, document.location && document.location.href !== 'about:blank'
      ? document.location.href : 'https://www.aig.com/').href;
  } catch (e) {
    return src;
  }
}

function buildPanelContent(panel, document) {
  const content = [];
  const teasers = [...panel.querySelectorAll('.cmp-teaser')];
  teasers.forEach((teaser) => {
    const img = teaser.querySelector('.cmp-teaser__image img');
    if (img) {
      // keep remote images (e.g. aig.com renditions) as absolute URLs
      const src = img.getAttribute('src');
      if (src && /^(https?:)?\/\//.test(src)) img.setAttribute('src', toAbsolute(src, document));
      content.push(img);
    }

    const title = teaser.querySelector('.cmp-teaser__title');
    if (title) {
      const level = /^H[1-6]$/.test(title.tagName) ? title.tagName.toLowerCase() : 'h3';
      const heading = document.createElement(level);
      // keep the title link (sub-item titles link on the source)
      const titleLink = title.querySelector('a[href]');
      if (titleLink) {
        const a = document.createElement('a');
        a.href = titleLink.getAttribute('href');
        a.textContent = title.textContent.trim();
        heading.append(a);
      } else {
        heading.textContent = title.textContent.trim();
      }
      content.push(heading);
    }

    const desc = teaser.querySelector('.cmp-teaser__description');
    if (desc) {
      const paras = [...desc.querySelectorAll('p')];
      if (paras.length) content.push(...paras);
      else if (desc.textContent.trim()) {
        const p = document.createElement('p');
        p.textContent = desc.textContent.trim();
        content.push(p);
      }
    }

    teaser.querySelectorAll('.cmp-teaser__action-link').forEach((a) => {
      a.textContent = a.textContent.trim();
      const p = document.createElement('p');
      p.append(a);
      content.push(p);
    });
  });

  // Fallback for panels without teaser markup
  if (!content.length) {
    const inner = panel.querySelector('.cmp-layout-container--fixed, .responsivegrid') || panel;
    content.push(...[...inner.children]);
  }
  return content;
}

export default function parse(element, { document }) {
  const tabEls = [...element.querySelectorAll('.cmp-tabs__tablist .cmp-tabs__tab, [role="tab"]')];
  const panelEls = [...element.querySelectorAll('.cmp-tabs__tabpanel, [role="tabpanel"]')]
    .filter((p, i, arr) => arr.indexOf(p) === i);

  const cells = [];
  tabEls.forEach((tab, i) => {
    let panel = null;
    if (tab.id && tab.id.endsWith('-tab')) {
      const panelId = `${tab.id}panel`;
      panel = panelEls.find((p) => p.id === panelId) || null;
    }
    if (!panel && tab.getAttribute('aria-controls')) {
      panel = panelEls.find((p) => p.id === tab.getAttribute('aria-controls')) || null;
    }
    if (!panel) panel = panelEls[i] || null;

    const label = tab.textContent.trim();
    if (!label && !panel) return;
    // The source's default-open tab is authored as a bold label (block opens it on load)
    const isActive = tab.classList.contains('cmp-tabs__tab--active') || tab.getAttribute('aria-selected') === 'true';
    let labelCell = label;
    if (isActive && label) {
      labelCell = document.createElement('strong');
      labelCell.textContent = label;
    }
    cells.push([labelCell, panel ? buildPanelContent(panel, document) : '']);
  });

  if (!cells.length) {
    element.replaceWith(...element.childNodes);
    return;
  }

  const block = WebImporter.Blocks.createBlock(document, { name: 'tabs-risk', cells });
  element.replaceWith(block);
}
