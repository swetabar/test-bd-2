/* eslint-disable */
/* global WebImporter */

/**
 * Transformer: AIG section breaks and Section Metadata.
 *
 * Two modes, selected per template:
 *
 * 1. Explicit mode (default, e.g. landing-page / home):
 *    Uses payload.template.sections[].selector (DOM-verified during page analysis).
 *    Every element matching ANY of a section's selectors starts a section
 *    (deduplicated, document order; an element already claimed by an earlier
 *    section entry is not claimed again).
 *
 * 2. Auto (class-driven) mode - payload.template.sectionMode === 'auto'
 *    (templates listed in AUTO_SECTION_TEMPLATES default to it as well):
 *    For templates whose sections[] cannot enumerate every page (content-page, 139 pages),
 *    a section starts at every top-level content container of <main>
 *    (main > .aem-Grid > .container with content). Section Metadata style is derived
 *    from source background classes (verified on live content pages):
 *      .paleblue / .lightblue                       -> pale-blue
 *      .aiglightgray                                -> light
 *      .aigpalegray                                 -> grey
 *      .coreblue, .hero-banner-with-fade (navy band),
 *      inline background-image + white text (At a Glance) -> dark
 *      .aigwhite                                    -> (no style, white)
 *    plus "centered" when the section's leading heading is centered on the source
 *    (.titlecenter, .title component, or computed text-align: center).
 *    Rules: empty containers never become sections; a heading-only container/element
 *    stays in the same section as the block/content that follows it; plain wrapper
 *    containers (no background) that hold background bands are split into their bands.
 *    Story pages (article-page, .container.article-2023 - not present on other templates):
 *      - an article container that is a sibling of <main> (4 stories render the body
 *        outside <main>) is a top-level content container too;
 *      - leading elements (breadcrumb + hero media) before the article container are
 *        their own hero section;
 *      - the Related Content list (.autopilot:has(> .aig-autopilot)) starts a new section
 *        inside the article container (INNER_SECTION_STARTS).
 *
 * Breaks are inserted in beforeTransform (before parsers replace section elements);
 * Section Metadata is inserted in afterTransform, anchored to marker <hr> elements.
 */
const SECTION_MARKER_ATTR = 'data-excat-section-id';
const SECTION_STYLE_ATTR = 'data-excat-section-style';
const SECTION_FIRST_ATTR = 'data-excat-section-first';
const AUTO_BREAK_ATTR = 'data-excat-auto-break';

// Templates that use the class-driven mode when the import script does not pass sectionMode.
const AUTO_SECTION_TEMPLATES = ['content-page'];

function toList(selectors) {
  return (Array.isArray(selectors) ? selectors : [selectors]).filter(Boolean);
}

// section.selector is an array of candidate selectors - first match (used as post-parse fallback).
function querySection(root, selectors) {
  for (const sel of toList(selectors)) {
    try {
      const el = root.querySelector(sel);
      if (el) return el;
    } catch (e) {
      // invalid selector in this environment - try next candidate
    }
  }
  return null;
}

function docOrder(a, b) {
  if (a === b) return 0;
  // eslint-disable-next-line no-bitwise
  return (a.compareDocumentPosition(b) & 4) ? -1 : 1; // 4 = DOCUMENT_POSITION_FOLLOWING
}

// All elements matching any of the section's selectors, deduplicated, in document order.
function querySectionAll(root, selectors) {
  const found = new Set();
  toList(selectors).forEach((sel) => {
    try {
      root.querySelectorAll(sel).forEach((el) => found.add(el));
    } catch (e) {
      // invalid selector in this environment - skip
    }
  });
  return [...found].sort(docOrder);
}

function getSectionMode(template) {
  if (!template) return 'explicit';
  if (template.sectionMode) return template.sectionMode;
  return AUTO_SECTION_TEMPLATES.includes(template.name) ? 'auto' : 'explicit';
}

/* ------------------------------------------------------------------ */
/* Explicit mode                                                       */
/* ------------------------------------------------------------------ */

function explicitBefore(element, sections) {
  const doc = element.ownerDocument || document;
  // Resolve every section's instances first (before any DOM change), claim each element once.
  const claimed = new Set();
  const resolved = sections.map((section) => {
    const els = querySectionAll(element, section.selector).filter((el) => {
      if (claimed.has(el)) return false;
      claimed.add(el);
      return true;
    });
    return { section, els };
  });

  for (let i = resolved.length - 1; i >= 0; i -= 1) {
    const { section, els } = resolved[i];
    for (let k = els.length - 1; k >= 0; k -= 1) {
      // first section's first instance: no leading break unless a style marker is needed
      if (i === 0 && k === 0 && !section.style) continue;
      const hr = doc.createElement('hr');
      if (section.style) {
        hr.setAttribute(SECTION_MARKER_ATTR, `${section.id}:${k}`);
        if (i === 0 && k === 0) hr.setAttribute(SECTION_FIRST_ATTR, '');
      }
      els[k].before(hr);
    }
  }
}

function explicitAfter(element, sections) {
  const doc = element.ownerDocument || document;
  for (let i = sections.length - 1; i >= 0; i -= 1) {
    const section = sections[i];
    if (!section.style) continue;

    const markers = [...element.querySelectorAll(`hr[${SECTION_MARKER_ATTR}^="${section.id}:"]`)]
      .filter((m) => m.getAttribute(SECTION_MARKER_ATTR).split(':')[0] === String(section.id));
    // fallback: original element (only meaningful for the first instance)
    const anchors = markers.length ? markers : [querySection(element, section.selector)].filter(Boolean);

    anchors.forEach((anchor) => {
      const metadataBlock = WebImporter.Blocks.createBlock(doc, {
        name: 'Section Metadata',
        cells: { style: section.style },
      });
      anchor.after(metadataBlock);
      if (anchor.tagName === 'HR' && anchor.hasAttribute(SECTION_MARKER_ATTR)) {
        const isFirst = anchor.hasAttribute(SECTION_FIRST_ATTR);
        anchor.removeAttribute(SECTION_MARKER_ATTR);
        anchor.removeAttribute(SECTION_FIRST_ATTR);
        if (isFirst) anchor.remove(); // section 0 never gets a real leading break
      }
    });
  }
}

/* ------------------------------------------------------------------ */
/* Auto (class-driven) mode                                            */
/* ------------------------------------------------------------------ */

const SKIP_TAGS = ['SCRIPT', 'STYLE', 'LINK', 'NOSCRIPT', 'TEMPLATE', 'DIALOG', 'HR'];
const MEDIA_SELECTOR = 'img, picture, video, iframe, embed, object, table, form, .embed, [data-src]';
const POST_PARSE_MEDIA_SELECTOR = 'img, picture, video, iframe, embed, object, table, form';
const HEADING_SELECTOR = 'h1, h2, h3, h4, h5, h6';
// Leading-heading detection ignores headings that belong to blocks/cards/widgets.
const NON_DEFAULT_HEADING_SCOPE = '.accordion, .tabs, .aig-carousel, .aig-carousel-v2, .slick-list, .autopilot, .aig-autopilot, .quick-links, .download, .breadcrumb, .cta-with-image, .aig-video, .videocomponent, .aig-productcard, .aig-bio-block';
const WHITE_TEXT_SELECTOR = '.dttitlewhite, .whiteheading, .whitedescription';
// Newsroom story body container (article-page only; absent on home/landing, content-page and
// accordion-detail pages - verified live on all their URLs).
const ARTICLE_CONTAINER = '.container.article-2023';
// Section breaks inside a unit (auto mode): the story's Related Content list starts its own
// section (cards-related block styling expects its own section). The "Related Content" label
// (h3 inside .aig-autopilot) moves with it; a heading-only element right before it does too.
const INNER_SECTION_STARTS = ['.container.article-2023 .autopilot:has(> .aig-autopilot)'];

function innerGrid(container) {
  return container.querySelector(':scope > .cmp-container > .aem-Grid');
}

function isHidden(el) {
  return el.hasAttribute('hidden')
    || el.classList.contains('aem-GridColumn--default--hide')
    || /display\s*:\s*none/i.test(el.getAttribute('style') || '');
}

function hasContent(el) {
  return Boolean((el.textContent || '').trim()) || Boolean(el.querySelector(MEDIA_SELECTOR));
}

// Only headings (no paragraphs, lists, media, links-only text, etc.)
function isHeadingOnly(el) {
  if (!hasContent(el) || el.querySelector(MEDIA_SELECTOR)) return false;
  const headings = [...el.querySelectorAll(HEADING_SELECTOR)];
  if (!headings.length) return false;
  const total = (el.textContent || '').replace(/\s+/g, '');
  const headingText = headings.map((h) => h.textContent || '').join('').replace(/\s+/g, '');
  return total === headingText;
}

// Background classes on the container itself -> Section Metadata background style.
// Priority follows the rendered source (e.g. ".coreblue.aiglightgray" renders light grey,
// ".aiglightgray.aigwhite" renders white, ".paleblue.aigwhite" renders pale blue).
function backgroundStyle(container) {
  const cls = container.classList;
  if (cls.contains('hero-banner-with-fade')) return 'dark'; // navy page-title banner
  if (cls.contains('paleblue') || cls.contains('lightblue')) return 'pale-blue';
  if (cls.contains('aigwhite')) return '';
  if (cls.contains('aiglightgray')) return 'light';
  if (cls.contains('aigpalegray')) return 'grey';
  if (cls.contains('coreblue')) return 'dark';
  const cc = container.querySelector(':scope > .cmp-container');
  if (cc && /background-image/i.test(cc.getAttribute('style') || '') && container.querySelector(WHITE_TEXT_SELECTOR)) {
    return 'dark'; // "At a Glance" bands: dark photo background with white text
  }
  return '';
}

function isInside(node, els) {
  return els.some((b) => b === node || b.contains(node));
}

function leadingHeading(els) {
  for (const el of els) {
    const candidates = el.matches(HEADING_SELECTOR) ? [el] : [...el.querySelectorAll(HEADING_SELECTOR)];
    const found = candidates.find((h) => !h.closest(NON_DEFAULT_HEADING_SCOPE));
    if (found) return found;
  }
  return null;
}

function isCentered(els) {
  const h = leadingHeading(els);
  if (!h) return false;
  if (h.closest('.titlecenter, .title')) return true;
  try {
    const view = h.ownerDocument.defaultView;
    if (view && view.getComputedStyle) return view.getComputedStyle(h).textAlign === 'center';
  } catch (e) {
    // no layout available
  }
  return false;
}

function canFlatten(container, blockEls) {
  if (backgroundStyle(container)) return false;
  const grid = innerGrid(container);
  if (!grid || isInside(grid, blockEls)) return false;
  const kids = [...grid.children].filter((c) => hasContent(c));
  if (kids.length < 2) return false;
  return kids.some((c) => c.classList.contains('container') && backgroundStyle(c));
}

// Raw units: one per content child; plain wrappers holding background bands are split.
function collectUnits(parent, blockEls, out) {
  return collectUnitsFrom([...parent.children], blockEls, out);
}

function collectUnitsFrom(children, blockEls, out) {
  children.forEach((child) => {
    if (SKIP_TAGS.includes(child.tagName) || isHidden(child) || !hasContent(child)) return;
    const isContainer = child.classList.contains('container');
    if (isContainer && canFlatten(child, blockEls)) {
      collectUnits(innerGrid(child), blockEls, out);
      return;
    }
    out.push({
      els: [child],
      container: isContainer,
      bg: isContainer ? backgroundStyle(child) : '',
      headingOnly: isHeadingOnly(child),
    });
  });
  return out;
}

function buildAutoUnits(element, blockEls) {
  const main = element.matches && element.matches('main') ? element : element.querySelector('main');
  if (!main) return [];
  const grid = main.querySelector(':scope > .aem-Grid') || main;
  const raw = collectUnits(grid, blockEls, []);

  // Story pages whose article body sits OUTSIDE <main> (4 newsroom stories:
  // #main > .aem-Grid > [main (hero only), .container.article-2023]): the sibling article
  // containers are top-level content containers of the page as well.
  const siblings = main.parentElement
    ? [...main.parentElement.children].filter((c) => c !== main && c.matches(ARTICLE_CONTAINER))
    : [];
  if (siblings.length) collectUnitsFrom(siblings, blockEls, raw);

  // 1. Non-container, non-heading elements (e.g. a stray accordion/text) belong to the
  //    preceding unit; leading ones (e.g. breadcrumb) belong to the next unit - except on
  //    story pages, where leading elements (breadcrumb + hero image/video poster) are the
  //    article hero and stay a section of their own before the article body.
  const units = [];
  let lead = [];
  raw.forEach((u) => {
    if (!u.container && !u.headingOnly) {
      if (units.length) units[units.length - 1].els.push(...u.els);
      else lead.push(...u.els);
      return;
    }
    if (lead.length && u.els[0].matches(ARTICLE_CONTAINER)) {
      units.push({ els: lead, container: false, bg: '', headingOnly: false });
      lead = [];
    }
    if (lead.length) {
      u.els = [...lead, ...u.els];
      lead = [];
    }
    units.push(u);
  });
  if (lead.length) units.push({ els: lead, container: false, bg: '', headingOnly: false });

  // 2. Heading-only units stay with the content that follows them (same background).
  for (let i = units.length - 2; i >= 0; i -= 1) {
    const u = units[i];
    const next = units[i + 1];
    if (u.headingOnly && next.bg === u.bg) {
      next.els = [...u.els, ...next.els];
      units.splice(i, 1);
    }
  }

  return units.map((u) => {
    const styles = [];
    if (u.bg) styles.push(u.bg);
    if (isCentered(u.els)) styles.push('centered');
    return { els: u.els, style: styles.join(', ') };
  });
}

function templateBlockElements(element, template) {
  const els = [];
  ((template && template.blocks) || []).forEach((b) => {
    toList(b.instances).forEach((sel) => {
      try {
        element.querySelectorAll(sel).forEach((el) => els.push(el));
      } catch (e) {
        // invalid selector in this environment - skip
      }
    });
  });
  return els;
}

function autoBefore(element, template) {
  const doc = element.ownerDocument || document;
  const blockEls = templateBlockElements(element, template);
  const units = buildAutoUnits(element, blockEls);

  // Inner section starts (resolved before any break is inserted).
  const innerStarts = [];
  INNER_SECTION_STARTS.forEach((sel) => {
    try {
      element.querySelectorAll(sel).forEach((el) => {
        let start = el;
        const prev = el.previousElementSibling;
        if (prev && !SKIP_TAGS.includes(prev.tagName) && isHeadingOnly(prev)) start = prev;
        if (start.parentElement && isInside(start.parentElement, blockEls)) return;
        if (units.some((u) => u.els[0] === start)) return; // already a section start
        innerStarts.push(start);
      });
    } catch (e) {
      // invalid selector in this environment - skip
    }
  });
  innerStarts.forEach((start) => {
    const hr = doc.createElement('hr');
    hr.setAttribute(AUTO_BREAK_ATTR, '');
    start.before(hr);
  });

  for (let i = units.length - 1; i >= 0; i -= 1) {
    const { els, style } = units[i];
    const start = els[0];
    if (i === 0 && !style) continue;
    // never put a break inside a block's source element (the parser would drop it)
    if (start.parentElement && isInside(start.parentElement, blockEls)) continue;
    const hr = doc.createElement('hr');
    hr.setAttribute(AUTO_BREAK_ATTR, '');
    if (style) hr.setAttribute(SECTION_STYLE_ATTR, style);
    if (i === 0) hr.setAttribute(SECTION_FIRST_ATTR, '');
    start.before(hr);
  }
}

// Content between a break and the next break (or the end of the element).
function sectionHasContent(element, marker, nextMarker) {
  const doc = element.ownerDocument || document;
  const range = doc.createRange();
  range.setStartAfter(marker);
  if (nextMarker) range.setEndBefore(nextMarker);
  else range.setEnd(element, element.childNodes.length);
  const frag = range.cloneContents();
  // post-parse: only real content counts (an emptied .embed wrapper does not)
  return Boolean((frag.textContent || '').trim()) || Boolean(frag.querySelector(POST_PARSE_MEDIA_SELECTOR));
}

function autoAfter(element) {
  const doc = element.ownerDocument || document;

  // Never leave empty sections: drop breaks whose section lost all content
  // (e.g. a container whose only content was removed by cleanup).
  const breaks = [...element.querySelectorAll(`hr[${AUTO_BREAK_ATTR}]`)];
  breaks.forEach((marker, i) => {
    if (!sectionHasContent(element, marker, breaks[i + 1])) marker.remove();
    else marker.removeAttribute(AUTO_BREAK_ATTR);
  });

  [...element.querySelectorAll(`hr[${SECTION_STYLE_ATTR}]`)].reverse().forEach((marker) => {
    const metadataBlock = WebImporter.Blocks.createBlock(doc, {
      name: 'Section Metadata',
      cells: { style: marker.getAttribute(SECTION_STYLE_ATTR) },
    });
    marker.after(metadataBlock);
    const isFirst = marker.hasAttribute(SECTION_FIRST_ATTR);
    marker.removeAttribute(SECTION_STYLE_ATTR);
    marker.removeAttribute(SECTION_FIRST_ATTR);
    if (isFirst) marker.remove(); // first section never gets a real leading break
  });
}

/* ------------------------------------------------------------------ */

export default function transform(hookName, element, payload) {
  const template = (payload && payload.template) || {};
  const sections = template.sections || [];
  const mode = getSectionMode(template);
  if (mode !== 'auto' && sections.length < 2) return;

  if (hookName === 'beforeTransform') {
    if (mode === 'auto') autoBefore(element, template);
    else explicitBefore(element, sections);
  }

  if (hookName === 'afterTransform') {
    if (mode === 'auto') autoAfter(element);
    else explicitAfter(element, sections);
  }
}
