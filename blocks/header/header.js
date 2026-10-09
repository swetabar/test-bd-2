/*
 * Header block — AIG-style megamenu header.
 *
 * All copy, links and images come from the nav fragment (content/nav.plain.html).
 * Fragment sections (top-level <div>s), in order:
 *   1. brand     — logo link
 *   2. menu      — nested <ul>: top-level triggers > level-1 > level-2 > level-3 links
 *   3. intros    — one <h2> group per trigger: heading link, copy, feature link (+ image)
 *   4. tools     — search link (label = placeholder, href = results page), utility links, CTA label
 *   5. cta panel — intro line, <h3> tabs (<em> = default tab), <h4> cards with copy + link
 *   6. cta footer — footer link(s) shown under the CTA panel
 *   7. mobile labels — mobile-only UI copy (first paragraph = sub-panel back label)
 * Login cards may carry an <h5> after the <h4>: a mobile-only title variant.
 * This file only builds layout/controls and wires behavior; it never invents copy.
 */

import { normalizeFragment } from '../../scripts/fragment-utils.js';

const isDesktop = window.matchMedia('(width >= 900px)');

/**
 * Fetches the nav fragment. Metadata-independent dual fetch:
 * /content (local preview / aem up) first, then site root (DA/EDS production).
 * @returns {Promise<{doc: Element, base: string}|null>}
 */
async function fetchNavFragment() {
  let resp = await fetch('/content/nav.plain.html');
  if (!resp.ok) resp = await fetch('/nav.plain.html');
  if (!resp.ok) return null;
  const html = await resp.text();
  const doc = document.createElement('div');
  doc.innerHTML = html;
  normalizeFragment(doc);
  return { doc, base: resp.url };
}

/**
 * Resolves relative image paths against the fragment URL so they work on any page.
 * @param {Element} root
 * @param {string} base
 */
function resolveImages(root, base) {
  root.querySelectorAll('img').forEach((img) => {
    const src = img.getAttribute('src');
    if (src && !/^(https?:|data:|\/)/.test(src)) img.src = new URL(src, base).href;
  });
}

const ICON_TOKEN = 'external_link';

/**
 * Removes a trailing icon ligature token ("external_link") from an element's label.
 * The fragment keeps the token verbatim (as authored on the source site) to flag
 * links that leave the site.
 * @param {Element} el
 * @returns {boolean} true when the token was present
 */
function stripIconToken(el) {
  const texts = [];
  const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
  while (walker.nextNode()) texts.push(walker.currentNode);
  const last = texts.reverse().find((n) => n.textContent.trim());
  if (!last || !last.textContent.trimEnd().endsWith(ICON_TOKEN)) return false;
  last.textContent = last.textContent.replace(new RegExp(`\\s*${ICON_TOKEN}\\s*$`), '');
  return true;
}

/**
 * Marks links that leave the site with the external-link icon glyph
 * (custom-icons ligature, same rendering technique as the source site).
 * @param {HTMLAnchorElement} a
 * @param {string} [before] optional whitespace before the icon
 * @param {boolean} [force] token already stripped by the caller
 */
function decorateExternal(a, before = '', force = false) {
  const external = stripIconToken(a) || force;
  if (!external && a.target !== '_blank') return;
  a.target = '_blank';
  a.rel = 'noopener noreferrer';
  if (before) a.append(before);
  const icon = document.createElement('span');
  icon.className = 'icon-external';
  icon.setAttribute('aria-hidden', 'true');
  icon.textContent = ICON_TOKEN;
  a.append(icon);
}

/**
 * Label-only items (href "#") behave as non-navigating group labels.
 * @param {HTMLAnchorElement} a
 * @returns {boolean} true when the link is label-only
 */
function normalizeLabelLink(a) {
  if (a.getAttribute('href') === '#') {
    a.removeAttribute('href');
    a.setAttribute('role', 'button');
    a.tabIndex = 0;
    return true;
  }
  return false;
}

function closeMenuItem(li) {
  if (!li) return;
  li.classList.remove('is-open');
  const trigger = li.querySelector(':scope > a');
  if (trigger) trigger.setAttribute('aria-expanded', 'false');
}

function closeAllMenus(nav) {
  nav.querySelectorAll('.nav-menu > li.is-open').forEach(closeMenuItem);
}

function openMenuItem(nav, li) {
  nav.querySelectorAll('.nav-menu > li.is-open').forEach((open) => {
    if (open !== li) closeMenuItem(open);
  });
  li.classList.add('is-open');
  li.querySelector(':scope > a').setAttribute('aria-expanded', 'true');
}

/**
 * Builds a cascading link list. Items with children get a flyout column that
 * opens on hover and stays open until a sibling item is hovered.
 * @param {HTMLUListElement} ul source list from the fragment
 * @param {number} level 1-based depth
 * @returns {HTMLUListElement}
 */
function buildLinkList(ul, level) {
  const list = document.createElement('ul');
  list.className = `nav-links nav-links-l${level}`;
  [...ul.children].forEach((srcLi, idx) => {
    const a = srcLi.querySelector(':scope > a');
    if (!a) return;
    const li = document.createElement('li');
    li.className = 'nav-link-item';
    // first entry that repeats the trigger landing page is the mobile-only "Overview"
    if (level === 1 && idx === 0 && a.getAttribute('href') === ul.dataset.parentHref) {
      li.classList.add('nav-link-overview');
    }
    const link = a.cloneNode(true);
    const labelOnly = normalizeLabelLink(link);
    decorateExternal(link);
    li.append(link);
    const sub = srcLi.querySelector(':scope > ul');
    if (sub) {
      li.classList.add('has-children');
      // group labels (no landing page) open their column aligned to the item's bottom
      if (labelOnly) li.classList.add('align-bottom');
      const flyout = document.createElement('div');
      flyout.className = 'nav-flyout';
      flyout.append(buildLinkList(sub, level + 1));
      li.append(flyout);
      // mobile: separate arrow button expands the level in place (split link)
      const toggle = document.createElement('button');
      toggle.type = 'button';
      toggle.className = 'nav-link-toggle';
      toggle.setAttribute('aria-expanded', 'false');
      toggle.setAttribute('aria-label', link.textContent.trim());
      toggle.addEventListener('click', () => {
        const expanded = li.classList.toggle('is-expanded');
        toggle.setAttribute('aria-expanded', expanded ? 'true' : 'false');
      });
      li.append(toggle);
    }
    li.addEventListener('mouseenter', () => {
      if (!isDesktop.matches) return;
      [...list.children].forEach((sib) => {
        if (sib !== li) sib.classList.remove('is-active');
      });
      if (sub) li.classList.add('is-active');
    });
    list.append(li);
  });
  return list;
}

/**
 * Builds the intro column (heading link, copy, feature card) for one trigger.
 * @param {Element[]} nodes fragment nodes belonging to this intro group
 * @returns {HTMLDivElement}
 */
function buildIntro(nodes) {
  const intro = document.createElement('div');
  intro.className = 'nav-submenu-intro';
  let feature = null;
  nodes.forEach((node, i) => {
    if (node.tagName === 'H2') {
      const p = document.createElement('p');
      p.className = 'nav-submenu-title';
      p.append(...node.childNodes);
      intro.append(p);
      return;
    }
    const single = node.children.length === 1 ? node.children[0] : null;
    const sameText = single && node.textContent.trim() === single.textContent.trim();
    const onlyChild = sameText ? single : null;
    if (onlyChild && onlyChild.tagName === 'A' && !onlyChild.querySelector('img')) {
      // feature card: link title, optionally followed by an image paragraph
      const next = nodes[i + 1];
      const img = next && next.querySelector(':scope > img') && !next.textContent.trim()
        ? next.querySelector('img') : null;
      feature = document.createElement('div');
      feature.className = 'nav-submenu-feature';
      const label = onlyChild.cloneNode(true);
      const external = stripIconToken(label);
      const a = onlyChild.cloneNode(false);
      const title = document.createElement('p');
      title.className = 'nav-submenu-feature-title';
      title.append(...label.childNodes);
      a.append(title);
      if (img) {
        a.append(' ');
        img.loading = 'lazy';
        a.append(img);
      }
      decorateExternal(a, ' ', external);
      feature.append(a);
      intro.append(feature);
      return;
    }
    if (onlyChild && onlyChild.tagName === 'IMG') return; // consumed by feature card
    const p = node.cloneNode(true);
    p.querySelectorAll('a').forEach((a) => decorateExternal(a));
    intro.append(p);
  });
  return intro;
}

/**
 * Groups the intro section into one node list per <h2>.
 * @param {Element} section
 * @returns {Element[][]} one array of nodes per heading
 */
function groupIntros(section) {
  const groups = [];
  [...(section ? section.children : [])].forEach((el) => {
    if (el.tagName === 'H2' || !groups.length) groups.push([]);
    groups[groups.length - 1].push(el);
  });
  return groups;
}

/**
 * Builds the main menu with megamenu panels.
 * @param {Element} nav
 * @param {Element} menuSection
 * @param {Element} introSection
 */
function buildMenu(nav, menuSection, introSection) {
  const srcUl = menuSection && menuSection.querySelector('ul');
  const menu = document.createElement('ul');
  menu.className = 'nav-menu';
  if (!srcUl) return menu;
  const intros = groupIntros(introSection);
  const introFor = (href, i) => intros.find((g) => g[0] && g[0].querySelector(`a[href="${href}"]`)) || intros[i];

  [...srcUl.children].forEach((srcLi, i) => {
    const a = srcLi.querySelector(':scope > a');
    if (!a) return;
    const li = document.createElement('li');
    li.className = 'nav-menu-item';
    const trigger = a.cloneNode(true);
    trigger.className = 'nav-menu-link';
    li.append(trigger);

    const sub = srcLi.querySelector(':scope > ul');
    const introNodes = introFor(a.getAttribute('href'), i);
    if (sub || introNodes) {
      trigger.setAttribute('aria-haspopup', 'true');
      trigger.setAttribute('aria-expanded', 'false');
      const panel = document.createElement('div');
      panel.className = 'nav-submenu';
      const container = document.createElement('div');
      container.className = 'nav-submenu-container';
      if (introNodes) container.append(buildIntro(introNodes));
      const links = document.createElement('div');
      links.className = 'nav-submenu-links';
      if (sub) {
        sub.dataset.parentHref = a.getAttribute('href');
        links.append(buildLinkList(sub, 1));
      }
      container.append(links);
      const close = document.createElement('div');
      close.className = 'nav-submenu-close';
      const closeLink = document.createElement('a');
      closeLink.href = '#';
      closeLink.setAttribute('aria-label', 'Close menu');
      closeLink.setAttribute('role', 'button');
      closeLink.textContent = '×';
      closeLink.addEventListener('click', (e) => {
        e.preventDefault();
        closeMenuItem(li);
        trigger.focus();
      });
      close.append(closeLink);
      container.append(close);
      panel.append(container);
      // mobile sub-panel title band repeats the trigger label
      const title = document.createElement('div');
      title.className = 'nav-mobile-title';
      title.setAttribute('aria-hidden', 'true');
      title.textContent = trigger.textContent.trim();
      li.append(panel, title);

      trigger.addEventListener('click', (e) => {
        if (isDesktop.matches) return;
        e.preventDefault();
        if (li.classList.contains('is-open')) {
          closeMenuItem(li);
          nav.classList.remove('sub-open');
        } else {
          openMenuItem(nav, li);
          nav.classList.add('sub-open');
        }
      });

      li.addEventListener('mouseenter', () => {
        if (isDesktop.matches) openMenuItem(nav, li);
      });
      li.addEventListener('mouseleave', () => {
        if (isDesktop.matches) closeMenuItem(li);
      });
      trigger.addEventListener('keydown', (e) => {
        if (!isDesktop.matches) return;
        if (e.key === 'ArrowDown' || e.key === ' ') {
          e.preventDefault();
          if (li.classList.contains('is-open')) closeMenuItem(li);
          else openMenuItem(nav, li);
        }
      });
      li.addEventListener('focusout', (e) => {
        if (isDesktop.matches && !li.contains(e.relatedTarget)) closeMenuItem(li);
      });
    }
    menu.append(li);
  });
  return menu;
}

/**
 * Builds the expandable search form from the tools search link.
 * @param {Element} nav
 * @param {HTMLAnchorElement} searchLink link whose text is the placeholder, href the results page
 * @returns {{toggle: HTMLDivElement, panel: HTMLDivElement}}
 */
function buildSearch(nav, searchLink) {
  const label = searchLink.textContent.trim();
  const panel = document.createElement('div');
  panel.className = 'nav-search';
  const form = document.createElement('form');
  form.action = searchLink.href;
  form.method = 'get';
  form.setAttribute('role', 'search');
  const input = document.createElement('input');
  input.type = 'text';
  input.name = 'q';
  input.placeholder = label;
  input.setAttribute('aria-label', label);
  input.maxLength = 250;
  input.autocomplete = 'off';
  const submit = document.createElement('button');
  submit.type = 'submit';
  submit.className = 'nav-search-submit';
  submit.setAttribute('aria-label', label);
  form.append(input, submit);
  panel.append(form);

  const toggle = document.createElement('div');
  toggle.className = 'nav-tool nav-tool-search';
  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'nav-search-toggle';
  button.setAttribute('aria-label', label);
  button.setAttribute('aria-expanded', 'false');
  button.innerHTML = '<span class="icon-search" aria-hidden="true">search</span>';
  toggle.append(button);

  const setOpen = (open) => {
    nav.classList.toggle('search-open', open);
    button.setAttribute('aria-expanded', open ? 'true' : 'false');
    if (open) {
      closeAllMenus(nav);
      input.focus();
    }
  };
  button.addEventListener('click', () => {
    // mobile: the search icon goes straight to the search results page (as on source)
    if (!isDesktop.matches) {
      window.location.href = searchLink.href;
      return;
    }
    setOpen(!nav.classList.contains('search-open'));
  });
  input.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      setOpen(false);
      button.focus();
    }
  });
  return { toggle, panel };
}

/**
 * Builds the CTA (login) panel: intro line, tabs (accordion on mobile), card grid, footer bar.
 * Tabs and panes are interleaved so the same DOM renders as tabs (desktop) or accordion (mobile).
 * @param {Element} section cta panel section
 * @param {Element} footer cta footer section
 * @param {string} label CTA label (mobile view heading)
 * @returns {HTMLDivElement}
 */
function buildCtaPanel(section, footer, label) {
  const panel = document.createElement('div');
  panel.className = 'nav-login-panel';
  panel.setAttribute('role', 'dialog');
  panel.setAttribute('aria-modal', 'false');
  const mobileHead = document.createElement('div');
  mobileHead.className = 'nav-login-mobile-head';
  const back = document.createElement('button');
  back.type = 'button';
  back.className = 'nav-login-back';
  back.textContent = label;
  mobileHead.append(back);
  const head = document.createElement('div');
  head.className = 'nav-login-head';
  const tabList = document.createElement('div');
  tabList.className = 'nav-login-tabs';

  let pane = null;
  let card = null;
  let defaultTab = 0;
  const tabs = [];
  [...(section ? section.children : [])].forEach((el) => {
    if (el.tagName === 'H3') {
      const idx = tabs.length;
      if (el.querySelector('em')) defaultTab = idx;
      const tab = document.createElement('button');
      tab.type = 'button';
      tab.className = 'nav-login-tab';
      tab.setAttribute('aria-expanded', 'false');
      tab.textContent = el.textContent.trim();
      pane = document.createElement('div');
      pane.className = 'nav-login-pane';
      // pane precedes its tab in the DOM; CSS order renders tab first (tab row / accordion)
      const item = document.createElement('div');
      item.className = 'nav-login-item';
      item.append(pane, tab);
      tabList.append(item);
      tabs.push({ tab, pane });
      card = null;
    } else if (el.tagName === 'H4' && pane) {
      card = document.createElement('div');
      card.className = 'nav-login-card';
      const h = document.createElement('h2');
      h.className = 'nav-login-card-title';
      const t = document.createElement('span');
      t.className = 'nav-login-card-title-text';
      t.textContent = el.textContent.trim();
      h.append(t);
      card.append(h);
      pane.append(card);
    } else if (el.tagName === 'H5' && card) {
      // mobile-only title variant
      const h = card.querySelector('.nav-login-card-title');
      h.classList.add('has-mobile-title');
      const t = document.createElement('span');
      t.className = 'nav-login-card-title-mobile';
      t.textContent = el.textContent.trim();
      h.append(t);
    } else if (card) {
      const p = el.cloneNode(true);
      p.querySelectorAll('a').forEach((a) => decorateExternal(a));
      card.append(p);
    } else if (!pane) {
      const p = el.cloneNode(true);
      p.className = 'nav-login-intro';
      head.append(p);
    }
  });

  const close = document.createElement('button');
  close.type = 'button';
  close.className = 'nav-login-close';
  close.setAttribute('aria-label', 'close');
  head.append(close);

  const select = (i) => {
    tabs.forEach(({ tab, pane: tp }, j) => {
      tab.classList.toggle('is-active', i === j);
      tp.classList.toggle('is-active', i === j);
      tab.setAttribute('aria-selected', i === j ? 'true' : 'false');
    });
  };
  tabs.forEach(({ tab, pane: tp }, i) => tab.addEventListener('click', () => {
    if (isDesktop.matches) {
      select(i);
      return;
    }
    // mobile accordion: multi-expand
    const expanded = tp.classList.toggle('is-expanded');
    tab.classList.toggle('is-expanded', expanded);
    tab.setAttribute('aria-expanded', expanded ? 'true' : 'false');
  }));
  if (tabs.length) select(defaultTab);

  panel.append(mobileHead, head, tabList);
  if (footer && footer.textContent.trim()) {
    const foot = document.createElement('div');
    foot.className = 'nav-login-footer';
    foot.append(...[...footer.children].map((c) => c.cloneNode(true)));
    panel.append(foot);
  }
  return panel;
}

/**
 * Builds the right-hand tools group (search, utility links, CTA + panel).
 * @param {Element} nav
 * @param {Element} toolsSection
 * @param {Element[]} ctaSections [panel, footer]
 * @returns {{tools: HTMLDivElement, searchPanel: HTMLDivElement, overlays: HTMLDivElement[]}}
 */
function buildTools(nav, toolsSection, ctaSections) {
  const overlays = [];
  const tools = document.createElement('div');
  tools.className = 'nav-tools';
  let searchPanel = null;
  const items = toolsSection ? [...toolsSection.querySelectorAll('li')] : [];
  items.forEach((item) => {
    const a = item.querySelector('a');
    if (a && !a.querySelector('img') && !searchPanel) {
      const { toggle, panel } = buildSearch(nav, a);
      tools.append(toggle);
      searchPanel = panel;
    } else if (a) {
      const wrap = document.createElement('div');
      wrap.className = 'nav-tool nav-tool-link';
      const link = a.cloneNode(true);
      decorateExternal(link);
      wrap.append(link);
      tools.append(wrap);
    } else if (item.textContent.trim()) {
      const wrap = document.createElement('div');
      wrap.className = 'nav-tool nav-tool-login';
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'nav-login-toggle';
      button.setAttribute('aria-expanded', 'false');
      button.setAttribute('aria-haspopup', 'dialog');
      const span = document.createElement('span');
      span.textContent = item.textContent.trim();
      button.append(span);
      const panel = buildCtaPanel(ctaSections[0], ctaSections[1], span.textContent);
      wrap.append(button, panel);
      tools.append(wrap);

      const overlay = document.createElement('div');
      overlay.className = 'nav-overlay';
      const setOpen = (open) => {
        nav.classList.toggle('login-open', open);
        button.setAttribute('aria-expanded', open ? 'true' : 'false');
        if (open) closeAllMenus(nav);
      };
      button.addEventListener('click', (e) => {
        e.stopPropagation();
        setOpen(!nav.classList.contains('login-open'));
      });
      panel.querySelectorAll('.nav-login-close, .nav-login-back').forEach((c) => c.addEventListener('click', () => {
        setOpen(false);
        button.focus();
      }));
      overlay.addEventListener('click', () => setOpen(false));
      document.addEventListener('click', (e) => {
        if (nav.classList.contains('login-open') && !panel.contains(e.target) && !button.contains(e.target)) {
          setOpen(false);
        }
      });
      overlays.push(overlay);
    }
  });
  return { tools, searchPanel, overlays };
}

/**
 * Loads and decorates the header.
 * @param {Element} block The header block element
 */
export default async function decorate(block) {
  const fragment = await fetchNavFragment();
  block.textContent = '';
  if (!fragment) return;
  const { doc, base } = fragment;
  resolveImages(doc, base);
  const [brandSec, menuSec, introSec, toolsSec, ctaSec, ctaFootSec, mobileSec] = [...doc.children];

  const nav = document.createElement('nav');
  nav.id = 'nav';
  nav.setAttribute('aria-label', 'Header Navigation');
  nav.setAttribute('aria-expanded', 'false');

  const brand = document.createElement('div');
  brand.className = 'nav-brand';
  const brandLink = brandSec && brandSec.querySelector('a');
  if (brandLink) brand.append(brandLink);

  const menu = buildMenu(nav, menuSec, introSec);
  const { tools, searchPanel, overlays } = buildTools(nav, toolsSec, [ctaSec, ctaFootSec]);

  const closeMobileSub = () => {
    closeAllMenus(nav);
    nav.classList.remove('sub-open');
  };
  const closeLogin = () => {
    nav.classList.remove('login-open');
    const loginToggle = nav.querySelector('.nav-login-toggle');
    if (loginToggle) loginToggle.setAttribute('aria-expanded', 'false');
  };

  const hamburger = document.createElement('div');
  hamburger.className = 'nav-hamburger';
  hamburger.innerHTML = '<button type="button" aria-controls="nav" aria-label="Open navigation"><span class="nav-hamburger-icon"></span></button>';
  const hamburgerButton = hamburger.querySelector('button');
  hamburgerButton.addEventListener('click', () => {
    if (isDesktop.matches) return;
    const expanded = nav.getAttribute('aria-expanded') === 'true';
    nav.setAttribute('aria-expanded', expanded ? 'false' : 'true');
    hamburgerButton.setAttribute('aria-label', expanded ? 'Open navigation' : 'Close navigation');
    if (expanded) {
      closeMobileSub();
      closeLogin();
    }
  });

  // mobile sub-panel back button (label from the fragment's mobile section)
  const backLabel = mobileSec && mobileSec.querySelector('p');
  const back = document.createElement('button');
  back.type = 'button';
  back.className = 'nav-back';
  back.textContent = backLabel ? backLabel.textContent.trim() : '';
  back.addEventListener('click', closeMobileSub);

  nav.prepend(brand, menu);
  if (searchPanel) nav.append(searchPanel);
  nav.append(tools, hamburger, back);

  // escape closes any open panel
  window.addEventListener('keydown', (e) => {
    if (e.key !== 'Escape') return;
    closeMobileSub();
    closeLogin();
  });

  // reset state when crossing the desktop breakpoint (resize without reload)
  isDesktop.addEventListener('change', () => {
    closeMobileSub();
    closeLogin();
    nav.classList.remove('search-open');
    nav.setAttribute('aria-expanded', 'false');
    hamburgerButton.setAttribute('aria-label', 'Open navigation');
    nav.querySelectorAll('.is-expanded').forEach((el) => el.classList.remove('is-expanded'));
    nav.querySelectorAll('.nav-link-toggle, .nav-login-tab').forEach((el) => el.setAttribute('aria-expanded', 'false'));
  });

  const navWrapper = document.createElement('div');
  navWrapper.className = 'nav-wrapper';
  navWrapper.append(nav);
  // page overlay sits outside the bar's stacking context so the bar stays on top
  block.append(...overlays, navWrapper);
}
