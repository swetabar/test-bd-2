/* eslint-disable */
var CustomImportScript = (() => {
  var __defProp = Object.defineProperty;
  var __defProps = Object.defineProperties;
  var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
  var __getOwnPropDescs = Object.getOwnPropertyDescriptors;
  var __getOwnPropNames = Object.getOwnPropertyNames;
  var __getOwnPropSymbols = Object.getOwnPropertySymbols;
  var __hasOwnProp = Object.prototype.hasOwnProperty;
  var __propIsEnum = Object.prototype.propertyIsEnumerable;
  var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
  var __spreadValues = (a, b) => {
    for (var prop in b || (b = {}))
      if (__hasOwnProp.call(b, prop))
        __defNormalProp(a, prop, b[prop]);
    if (__getOwnPropSymbols)
      for (var prop of __getOwnPropSymbols(b)) {
        if (__propIsEnum.call(b, prop))
          __defNormalProp(a, prop, b[prop]);
      }
    return a;
  };
  var __spreadProps = (a, b) => __defProps(a, __getOwnPropDescs(b));
  var __export = (target, all) => {
    for (var name in all)
      __defProp(target, name, { get: all[name], enumerable: true });
  };
  var __copyProps = (to, from, except, desc) => {
    if (from && typeof from === "object" || typeof from === "function") {
      for (let key of __getOwnPropNames(from))
        if (!__hasOwnProp.call(to, key) && key !== except)
          __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
    }
    return to;
  };
  var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

  // tools/importer/import-home.js
  var import_home_exports = {};
  __export(import_home_exports, {
    default: () => import_home_default
  });

  // tools/importer/parsers/hero-fade.js
  function parse(element, { document: document2 }) {
    const bgImage = element.querySelector(".teaserflex .cmp-teaser__image img, .cmp-image img, img");
    const textTeaser = element.querySelector(".halfwidth .cmp-teaser__content") || [...element.querySelectorAll(".cmp-teaser__content")].find((c) => c.querySelector(".cmp-teaser__title, h1, h2, h3"));
    const contentCell = [];
    if (textTeaser) {
      const title = textTeaser.querySelector(".cmp-teaser__title, h1, h2, h3");
      if (title) {
        const level = /^H[1-6]$/.test(title.tagName) ? title.tagName.toLowerCase() : "h2";
        const heading = document2.createElement(level);
        heading.textContent = title.textContent.trim();
        contentCell.push(heading);
      }
      const desc = textTeaser.querySelector(".cmp-teaser__description");
      if (desc) {
        const paras = [...desc.querySelectorAll("p")];
        if (paras.length) {
          contentCell.push(...paras);
        } else if (desc.textContent.trim()) {
          const p = document2.createElement("p");
          p.textContent = desc.textContent.trim();
          contentCell.push(p);
        }
      }
      const ctas = [...textTeaser.querySelectorAll(".cmp-teaser__action-link")];
      ctas.forEach((a) => {
        const p = document2.createElement("p");
        p.append(a);
        contentCell.push(p);
      });
    }
    if (!bgImage && !contentCell.length) {
      element.replaceWith(...element.childNodes);
      return;
    }
    const cells = [];
    if (bgImage) cells.push([bgImage]);
    cells.push([contentCell]);
    const block = WebImporter.Blocks.createBlock(document2, { name: "hero-fade", cells });
    element.replaceWith(block);
  }

  // tools/importer/parsers/cards-teaser.js
  function parse2(element, { document: document2 }) {
    let teasers = [...element.querySelectorAll(".teaserflex .cmp-teaser")];
    if (!teasers.length) teasers = [...element.querySelectorAll(".cmp-teaser")];
    const cells = [];
    teasers.forEach((teaser) => {
      const img = teaser.querySelector(".cmp-teaser__image img, img");
      const content = teaser.querySelector(".cmp-teaser__content") || teaser;
      const textCell = [];
      const title = content.querySelector(".cmp-teaser__title, h2, h3");
      if (title) {
        const level = /^H[1-6]$/.test(title.tagName) ? title.tagName.toLowerCase() : "h2";
        const heading = document2.createElement(level);
        heading.textContent = title.textContent.trim();
        textCell.push(heading);
      }
      const desc = content.querySelector(".cmp-teaser__description");
      if (desc) {
        const paras = [...desc.querySelectorAll("p")];
        if (paras.length) textCell.push(...paras);
        else if (desc.textContent.trim()) {
          const p = document2.createElement("p");
          p.textContent = desc.textContent.trim();
          textCell.push(p);
        }
      }
      let ctas = [...content.querySelectorAll(".cmp-teaser__action-link")];
      if (!ctas.length) {
        const titleLink = title && title.querySelector("a[href]");
        if (titleLink) ctas = [titleLink];
      }
      ctas.forEach((a) => {
        const p = document2.createElement("p");
        p.append(a);
        textCell.push(p);
      });
      if (!img && !textCell.length) return;
      cells.push([img || "", textCell]);
    });
    if (!cells.length) {
      element.replaceWith(...element.childNodes);
      return;
    }
    const block = WebImporter.Blocks.createBlock(document2, { name: "cards-teaser", cells });
    element.replaceWith(block);
  }

  // tools/importer/parsers/tabs-risk.js
  function toAbsolute(src, document2) {
    if (!src) return src;
    try {
      return new URL(src, document2.location && document2.location.href !== "about:blank" ? document2.location.href : "https://www.aig.com/").href;
    } catch (e) {
      return src;
    }
  }
  function buildPanelContent(panel, document2) {
    const content = [];
    const teasers = [...panel.querySelectorAll(".cmp-teaser")];
    teasers.forEach((teaser) => {
      const img = teaser.querySelector(".cmp-teaser__image img");
      if (img) {
        const src = img.getAttribute("src");
        if (src && /^(https?:)?\/\//.test(src)) img.setAttribute("src", toAbsolute(src, document2));
        content.push(img);
      }
      const title = teaser.querySelector(".cmp-teaser__title");
      if (title) {
        const level = /^H[1-6]$/.test(title.tagName) ? title.tagName.toLowerCase() : "h3";
        const heading = document2.createElement(level);
        const titleLink = title.querySelector("a[href]");
        if (titleLink) {
          const a = document2.createElement("a");
          a.href = titleLink.getAttribute("href");
          a.textContent = title.textContent.trim();
          heading.append(a);
        } else {
          heading.textContent = title.textContent.trim();
        }
        content.push(heading);
      }
      const desc = teaser.querySelector(".cmp-teaser__description");
      if (desc) {
        const paras = [...desc.querySelectorAll("p")];
        if (paras.length) content.push(...paras);
        else if (desc.textContent.trim()) {
          const p = document2.createElement("p");
          p.textContent = desc.textContent.trim();
          content.push(p);
        }
      }
      teaser.querySelectorAll(".cmp-teaser__action-link").forEach((a) => {
        a.textContent = a.textContent.trim();
        const p = document2.createElement("p");
        p.append(a);
        content.push(p);
      });
    });
    if (!content.length) {
      const inner = panel.querySelector(".cmp-layout-container--fixed, .responsivegrid") || panel;
      content.push(...[...inner.children]);
    }
    return content;
  }
  function parse3(element, { document: document2 }) {
    const tabEls = [...element.querySelectorAll('.cmp-tabs__tablist .cmp-tabs__tab, [role="tab"]')];
    const panelEls = [...element.querySelectorAll('.cmp-tabs__tabpanel, [role="tabpanel"]')].filter((p, i, arr) => arr.indexOf(p) === i);
    const cells = [];
    tabEls.forEach((tab, i) => {
      let panel = null;
      if (tab.id && tab.id.endsWith("-tab")) {
        const panelId = `${tab.id}panel`;
        panel = panelEls.find((p) => p.id === panelId) || null;
      }
      if (!panel && tab.getAttribute("aria-controls")) {
        panel = panelEls.find((p) => p.id === tab.getAttribute("aria-controls")) || null;
      }
      if (!panel) panel = panelEls[i] || null;
      const label = tab.textContent.trim();
      if (!label && !panel) return;
      const isActive = tab.classList.contains("cmp-tabs__tab--active") || tab.getAttribute("aria-selected") === "true";
      let labelCell = label;
      if (isActive && label) {
        labelCell = document2.createElement("strong");
        labelCell.textContent = label;
      }
      cells.push([labelCell, panel ? buildPanelContent(panel, document2) : ""]);
    });
    if (!cells.length) {
      element.replaceWith(...element.childNodes);
      return;
    }
    const block = WebImporter.Blocks.createBlock(document2, { name: "tabs-risk", cells });
    element.replaceWith(block);
  }

  // tools/importer/parsers/columns-media.js
  function absUrl(href, document2) {
    try {
      const base = document2.location && document2.location.href !== "about:blank" ? document2.location.href : "https://www.aig.com/home";
      return new URL(href, base).href;
    } catch (e) {
      return href;
    }
  }
  function isHomePage(document2, ctx) {
    let href = ctx && ctx.params && ctx.params.originalURL || ctx && ctx.url || "";
    if (!href) {
      const canonical = document2.querySelector('link[rel="canonical"][href], meta[property="og:url"][content]');
      href = canonical ? canonical.getAttribute("href") || canonical.getAttribute("content") : "";
    }
    if (!href && document2.location && document2.location.href !== "about:blank") href = document2.location.href;
    try {
      const path = new URL(href).pathname.replace(/\.html$/, "").replace(/\/+$/, "");
      return path === "" || path === "/home";
    } catch (e) {
      return false;
    }
  }
  function isMergeableTeaser(el) {
    return !!el && el.nodeType === 1 && el.matches(".teaserflex.cta-with-image") && !el.matches(".lightblue, .aig-article-card, .aig-featured-story");
  }
  function linkText(a) {
    const clone = a.cloneNode(true);
    clone.querySelectorAll(".custom-icons, .sr-only").forEach((s) => s.remove());
    return clone.textContent.trim();
  }
  function buildTextCell(content, document2) {
    const cell = [];
    if (!content) return cell;
    const title = content.querySelector(".cmp-teaser__title, h1, h2, h3, h4");
    if (title) {
      const level = /^H[1-6]$/.test(title.tagName) ? title.tagName.toLowerCase() : "h3";
      const heading = document2.createElement(level);
      heading.textContent = title.textContent.trim();
      cell.push(heading);
    }
    const desc = content.querySelector(".cmp-teaser__description");
    if (desc) {
      const hasRich = !!desc.querySelector(":scope > ul, :scope > ol, :scope > h2, :scope > h3, :scope > h4, :scope > h5");
      const paras = hasRich ? [...desc.querySelectorAll(":scope > p, :scope > ul, :scope > ol, :scope > h2, :scope > h3, :scope > h4, :scope > h5")].filter((el) => el.textContent.trim()) : [...desc.querySelectorAll("p")].filter((p) => p.textContent.trim());
      if (paras.length) cell.push(...paras);
      else if (desc.textContent.trim()) {
        const p = document2.createElement("p");
        p.textContent = desc.textContent.trim();
        cell.push(p);
      }
    }
    let ctas = [...content.querySelectorAll(".cmp-teaser__action-link")];
    if (!ctas.length && title) {
      const titleLink = title.querySelector("a[href]");
      if (titleLink) ctas = [titleLink];
    }
    ctas.forEach((a) => {
      a.textContent = linkText(a);
      const p = document2.createElement("p");
      p.append(a);
      cell.push(p);
    });
    return cell;
  }
  function teaserRow(teaser, document2) {
    const mediaCell = [];
    const img = teaser.querySelector(".cmp-teaser__image img, img");
    if (img) mediaCell.push(img);
    const textCell = buildTextCell(teaser.querySelector(".cmp-teaser__content"), document2);
    if (!mediaCell.length && !textCell.length) return null;
    const mediaFirst = !(teaser.classList.contains("imageright") || teaser.classList.contains("contentLeft"));
    return mediaFirst ? [mediaCell.length ? mediaCell : "", textCell.length ? textCell : ""] : [textCell.length ? textCell : "", mediaCell.length ? mediaCell : ""];
  }
  function parse4(element, ctx) {
    const { document: document2 } = ctx;
    if (element.hasAttribute("data-columns-media-merged")) return;
    const isVideo = element.matches(".aig-video, .two-column-grid") || !!element.querySelector(":scope .videocomponent");
    if (!isVideo) {
      const rows = [];
      const first = teaserRow(element, document2);
      if (first) rows.push(first);
      if (!isHomePage(document2, ctx)) {
        let next = element.nextElementSibling;
        while (isMergeableTeaser(next)) {
          const row2 = teaserRow(next, document2);
          if (row2) rows.push(row2);
          const done = next;
          next = next.nextElementSibling;
          done.setAttribute("data-columns-media-merged", "true");
          done.remove();
        }
      }
      if (!rows.length) {
        element.replaceWith(...element.childNodes);
        return;
      }
      const block2 = WebImporter.Blocks.createBlock(document2, { name: "columns-media", cells: rows });
      element.replaceWith(block2);
      return;
    }
    const mediaCell = [];
    let textCell = [];
    const video = element.querySelector(".videocomponent");
    const poster = (video || element).querySelector(".video_thumbnail img, .video__container img, img");
    if (poster) mediaCell.push(poster);
    const srcEl = (video || element).querySelector("[data-src], video source[src], video[src], iframe[src]");
    let videoHref = srcEl && (srcEl.getAttribute("data-src") || srcEl.getAttribute("src"));
    if (!videoHref) {
      const dialogLink = element.querySelector('a[href^="#page-dialog-video"], a[href*="video"]');
      videoHref = dialogLink && dialogLink.getAttribute("href");
    }
    if (videoHref) {
      const p = document2.createElement("p");
      const a = document2.createElement("a");
      a.href = videoHref.startsWith("#") ? videoHref : absUrl(videoHref, document2);
      a.textContent = "Play Video";
      p.append(a);
      mediaCell.push(p);
    }
    const timeEl = (video || element).querySelector("[data-time]");
    const time = timeEl && timeEl.getAttribute("data-time");
    if (time) {
      const p = document2.createElement("p");
      p.textContent = time;
      mediaCell.push(p);
    }
    const teaser = element.querySelector(".teaserflex .cmp-teaser__content, .cmp-teaser__content");
    textCell = buildTextCell(teaser, document2);
    if (!mediaCell.length && !textCell.length) {
      element.replaceWith(...element.childNodes);
      return;
    }
    const teaserEl = element.querySelector(".teaserflex");
    const textFirst = !!(video && teaserEl && teaserEl.compareDocumentPosition(video) & 4 && !teaserEl.contains(video));
    const row = textFirst ? [textCell.length ? textCell : "", mediaCell.length ? mediaCell : ""] : [mediaCell.length ? mediaCell : "", textCell.length ? textCell : ""];
    const block = WebImporter.Blocks.createBlock(document2, { name: "columns-media", cells: [row] });
    element.replaceWith(block);
  }

  // tools/importer/parsers/columns-featured.js
  function linkText2(a) {
    const clone = a.cloneNode(true);
    clone.querySelectorAll(".custom-icons, .sr-only").forEach((s) => s.remove());
    return clone.textContent.trim();
  }
  function parse5(element, { document: document2 }) {
    const isDark = element.matches(".hero-banner-video");
    const teaserRoot = isDark ? element.querySelector('.teaserflex:not([id^="page-dialog-video"] *)') || element : element;
    const img = teaserRoot.querySelector(".cmp-teaser__image img") || teaserRoot.querySelector('img:not([id^="page-dialog-video"] img):not(.videocomponent img)') || (!isDark ? element.querySelector("img") : null);
    const content = teaserRoot.querySelector(".cmp-teaser__content") || teaserRoot;
    const textCell = [];
    const pre = content.querySelector(".cmp-teaser__pretitle");
    if (pre && pre.textContent.trim()) {
      const p = document2.createElement("p");
      p.textContent = pre.textContent.trim();
      textCell.push(p);
    }
    const title = content.querySelector(".cmp-teaser__title, h2, h3, h4");
    if (title) {
      const level = /^H[1-6]$/.test(title.tagName) ? title.tagName.toLowerCase() : "h3";
      const heading = document2.createElement(level);
      heading.textContent = title.textContent.trim();
      textCell.push(heading);
    }
    const desc = content.querySelector(".cmp-teaser__description");
    if (desc) {
      const hasRich = !!desc.querySelector(":scope > ul, :scope > ol, :scope > h2, :scope > h3, :scope > h4, :scope > h5");
      const paras = hasRich ? [...desc.querySelectorAll(":scope > p, :scope > ul, :scope > ol, :scope > h2, :scope > h3, :scope > h4, :scope > h5")].filter((el) => el.textContent.trim()) : [...desc.querySelectorAll("p")].filter((p) => p.textContent.trim());
      if (paras.length) textCell.push(...paras);
      else if (desc.textContent.trim()) {
        const p = document2.createElement("p");
        p.textContent = desc.textContent.trim();
        textCell.push(p);
      }
    }
    let ctas = [...content.querySelectorAll(".cmp-teaser__action-link")];
    if (!ctas.length && title) {
      const titleLink = title.querySelector("a[href]");
      if (titleLink) ctas = [titleLink];
    }
    ctas.forEach((a) => {
      a.textContent = linkText2(a);
      const p = document2.createElement("p");
      p.append(a);
      textCell.push(p);
    });
    if (!img && !textCell.length) {
      element.replaceWith(...element.childNodes);
      return;
    }
    const orderEl = teaserRoot.matches(".teaserflex") ? teaserRoot : element;
    const imageFirst = orderEl.classList.contains("imageleft") || orderEl.classList.contains("contentRight");
    const text = textCell.length ? textCell : "";
    const media = img || "";
    const cells = [imageFirst ? [media, text] : [text, media]];
    const block = WebImporter.Blocks.createBlock(document2, {
      name: isDark ? "Columns Featured (dark)" : "columns-featured",
      cells
    });
    element.replaceWith(block);
  }

  // tools/importer/transformers/aig-cleanup.js
  var TransformHook = { beforeTransform: "beforeTransform", afterTransform: "afterTransform" };
  function cleanText(text) {
    return (text || "").replace(/\s+/g, " ").trim();
  }
  function absoluteUrl(href, doc) {
    try {
      const base = doc.location && doc.location.href !== "about:blank" ? doc.location.href : "https://www.aig.com/home";
      return new URL(href, base).href;
    } catch (e) {
      return href;
    }
  }
  function convertDropdowns(element) {
    const doc = element.ownerDocument;
    element.querySelectorAll(".options").forEach((comp) => {
      const select = comp.querySelector("select.cmp-form-options__field--drop-down");
      if (!select || !comp.parentElement) return;
      const label = cleanText((comp.querySelector(".cmp-form-options__label") || {}).textContent);
      const options = [...select.querySelectorAll("option")].map((o) => ({ value: (o.getAttribute("value") || "").trim(), text: cleanText(o.textContent) })).filter((o) => o.value && o.text);
      const panels = options.map((o) => {
        let panel = null;
        try {
          panel = doc.getElementById(o.value);
        } catch (e) {
          panel = null;
        }
        if (!panel || panel.contains(comp)) return null;
        const wrapper = panel.parentElement && panel.parentElement.classList.contains("container") ? panel.parentElement : panel;
        if (!cleanText(wrapper.textContent) && !wrapper.querySelector("img, a[href]")) return null;
        const first = wrapper.querySelector("h1, h2, h3, h4, h5, h6");
        const titled = Boolean(first && cleanText(first.textContent).toLowerCase() === o.text.toLowerCase());
        return { text: o.text, wrapper, titled };
      }).filter(Boolean);
      if (panels.length && panels.every((p) => p.wrapper.parentElement === comp.parentElement)) {
        const h2 = doc.createElement("h2");
        h2.textContent = label;
        let anchor = h2;
        if (label) comp.replaceWith(h2);
        else {
          anchor = comp;
        }
        panels.forEach(({ text, wrapper, titled }) => {
          wrapper.removeAttribute("style");
          if (titled) {
            anchor.after(wrapper);
          } else {
            const h3 = doc.createElement("h3");
            h3.textContent = text;
            anchor.after(h3);
            h3.after(wrapper);
          }
          anchor = wrapper;
        });
        if (!label) comp.remove();
        return;
      }
      const docs = options.filter((o) => /^(https?:\/\/|\/)\S+\.(pdf|docx?|xlsx?|pptx?)(\?|#|$)/i.test(o.value));
      if (docs.length && docs.length === options.length) {
        const urls = docs.map((o) => absoluteUrl(o.value, doc));
        const scope = comp.closest(".select_action") || comp.parentElement;
        const frag = [];
        if (label) {
          const p = doc.createElement("p");
          p.textContent = label;
          frag.push(p);
        }
        const ul = doc.createElement("ul");
        docs.forEach((o, i) => {
          const li = doc.createElement("li");
          const a = doc.createElement("a");
          a.href = urls[i];
          a.textContent = o.text;
          li.append(a);
          ul.append(li);
        });
        frag.push(ul);
        const form = comp.closest("form");
        if (form && scope.contains(form)) {
          const buttons = [...form.querySelectorAll(".button")];
          form.replaceWith(...frag, ...buttons);
        } else {
          comp.replaceWith(...frag);
        }
      }
    });
  }
  function transform(hookName, element, payload) {
    if (hookName === TransformHook.beforeTransform) {
      WebImporter.DOMUtils.remove(element, [
        "#consent_blackbar",
        "#consent_blackbar + .overlay",
        ".cmp-page__skiptomaincontent",
        "#fb-root"
      ]);
      WebImporter.DOMUtils.remove(element, [
        ".action-teaser-more",
        ".action-teaser-less",
        ".cmp-pdfviewer > button",
        ".sharethis > .email-modal"
      ]);
      element.querySelectorAll(".cmp-separator").forEach((sep) => {
        const wrapper = sep.parentElement && sep.parentElement.classList.contains("separator") ? sep.parentElement : sep;
        wrapper.remove();
      });
      convertDropdowns(element);
      element.querySelectorAll(".cmp-teaser__content").forEach((content) => {
        const pretitle = content.querySelector(":scope > .cmp-teaser__pretitle");
        if (!pretitle || content.querySelector(".cmp-teaser__title, .cmp-teaser__description, .cmp-teaser__action-container")) return;
        const h2 = element.ownerDocument.createElement("h2");
        h2.textContent = pretitle.textContent.trim();
        pretitle.replaceWith(h2);
      });
    }
    if (hookName === TransformHook.afterTransform) {
      element.querySelectorAll(".cmp-experiencefragment--header, .cmp-experiencefragment--footer").forEach((xf) => {
        const wrapper = xf.closest(".experiencefragment");
        (wrapper || xf).remove();
      });
      element.querySelectorAll('[id^="page-dialog-video-play"], [id^="video_trigger_"]').forEach((el) => {
        const wrapper = el.parentElement && el.parentElement.classList.contains("container") ? el.parentElement : el;
        wrapper.remove();
      });
      WebImporter.DOMUtils.remove(element, [
        ".video-popup",
        "dialog"
      ]);
      WebImporter.DOMUtils.remove(element, [
        "header",
        "footer",
        "#teconsent",
        "link",
        "noscript",
        "iframe"
      ]);
      [...element.querySelectorAll(".container")].reverse().forEach((c) => {
        if ((c.textContent || "").trim()) return;
        if (c.querySelector("img, picture, video, iframe, embed, object, table, form, hr")) return;
        c.remove();
      });
    }
  }

  // tools/importer/transformers/aig-sections.js
  var SECTION_MARKER_ATTR = "data-excat-section-id";
  var SECTION_STYLE_ATTR = "data-excat-section-style";
  var SECTION_FIRST_ATTR = "data-excat-section-first";
  var AUTO_BREAK_ATTR = "data-excat-auto-break";
  var AUTO_SECTION_TEMPLATES = ["content-page"];
  function toList(selectors) {
    return (Array.isArray(selectors) ? selectors : [selectors]).filter(Boolean);
  }
  function querySection(root, selectors) {
    for (const sel of toList(selectors)) {
      try {
        const el = root.querySelector(sel);
        if (el) return el;
      } catch (e) {
      }
    }
    return null;
  }
  function docOrder(a, b) {
    if (a === b) return 0;
    return a.compareDocumentPosition(b) & 4 ? -1 : 1;
  }
  function querySectionAll(root, selectors) {
    const found = /* @__PURE__ */ new Set();
    toList(selectors).forEach((sel) => {
      try {
        root.querySelectorAll(sel).forEach((el) => found.add(el));
      } catch (e) {
      }
    });
    return [...found].sort(docOrder);
  }
  function getSectionMode(template) {
    if (!template) return "explicit";
    if (template.sectionMode) return template.sectionMode;
    return AUTO_SECTION_TEMPLATES.includes(template.name) ? "auto" : "explicit";
  }
  function explicitBefore(element, sections) {
    const doc = element.ownerDocument || document;
    const claimed = /* @__PURE__ */ new Set();
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
        if (i === 0 && k === 0 && !section.style) continue;
        const hr = doc.createElement("hr");
        if (section.style) {
          hr.setAttribute(SECTION_MARKER_ATTR, `${section.id}:${k}`);
          if (i === 0 && k === 0) hr.setAttribute(SECTION_FIRST_ATTR, "");
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
      const markers = [...element.querySelectorAll(`hr[${SECTION_MARKER_ATTR}^="${section.id}:"]`)].filter((m) => m.getAttribute(SECTION_MARKER_ATTR).split(":")[0] === String(section.id));
      const anchors = markers.length ? markers : [querySection(element, section.selector)].filter(Boolean);
      anchors.forEach((anchor) => {
        const metadataBlock = WebImporter.Blocks.createBlock(doc, {
          name: "Section Metadata",
          cells: { style: section.style }
        });
        anchor.after(metadataBlock);
        if (anchor.tagName === "HR" && anchor.hasAttribute(SECTION_MARKER_ATTR)) {
          const isFirst = anchor.hasAttribute(SECTION_FIRST_ATTR);
          anchor.removeAttribute(SECTION_MARKER_ATTR);
          anchor.removeAttribute(SECTION_FIRST_ATTR);
          if (isFirst) anchor.remove();
        }
      });
    }
  }
  var SKIP_TAGS = ["SCRIPT", "STYLE", "LINK", "NOSCRIPT", "TEMPLATE", "DIALOG", "HR"];
  var MEDIA_SELECTOR = "img, picture, video, iframe, embed, object, table, form, .embed, [data-src]";
  var POST_PARSE_MEDIA_SELECTOR = "img, picture, video, iframe, embed, object, table, form";
  var HEADING_SELECTOR = "h1, h2, h3, h4, h5, h6";
  var NON_DEFAULT_HEADING_SCOPE = ".accordion, .tabs, .aig-carousel, .aig-carousel-v2, .slick-list, .autopilot, .aig-autopilot, .quick-links, .download, .breadcrumb, .cta-with-image, .aig-video, .videocomponent, .aig-productcard, .aig-bio-block";
  var WHITE_TEXT_SELECTOR = ".dttitlewhite, .whiteheading, .whitedescription";
  function innerGrid(container) {
    return container.querySelector(":scope > .cmp-container > .aem-Grid");
  }
  function isHidden(el) {
    return el.hasAttribute("hidden") || el.classList.contains("aem-GridColumn--default--hide") || /display\s*:\s*none/i.test(el.getAttribute("style") || "");
  }
  function hasContent(el) {
    return Boolean((el.textContent || "").trim()) || Boolean(el.querySelector(MEDIA_SELECTOR));
  }
  function isHeadingOnly(el) {
    if (!hasContent(el) || el.querySelector(MEDIA_SELECTOR)) return false;
    const headings = [...el.querySelectorAll(HEADING_SELECTOR)];
    if (!headings.length) return false;
    const total = (el.textContent || "").replace(/\s+/g, "");
    const headingText = headings.map((h) => h.textContent || "").join("").replace(/\s+/g, "");
    return total === headingText;
  }
  function backgroundStyle(container) {
    const cls = container.classList;
    if (cls.contains("hero-banner-with-fade")) return "dark";
    if (cls.contains("paleblue") || cls.contains("lightblue")) return "pale-blue";
    if (cls.contains("aigwhite")) return "";
    if (cls.contains("aiglightgray")) return "light";
    if (cls.contains("aigpalegray")) return "grey";
    if (cls.contains("coreblue")) return "dark";
    const cc = container.querySelector(":scope > .cmp-container");
    if (cc && /background-image/i.test(cc.getAttribute("style") || "") && container.querySelector(WHITE_TEXT_SELECTOR)) {
      return "dark";
    }
    return "";
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
    if (h.closest(".titlecenter, .title")) return true;
    try {
      const view = h.ownerDocument.defaultView;
      if (view && view.getComputedStyle) return view.getComputedStyle(h).textAlign === "center";
    } catch (e) {
    }
    return false;
  }
  function canFlatten(container, blockEls) {
    if (backgroundStyle(container)) return false;
    const grid = innerGrid(container);
    if (!grid || isInside(grid, blockEls)) return false;
    const kids = [...grid.children].filter((c) => hasContent(c));
    if (kids.length < 2) return false;
    return kids.some((c) => c.classList.contains("container") && backgroundStyle(c));
  }
  function collectUnits(parent, blockEls, out) {
    [...parent.children].forEach((child) => {
      if (SKIP_TAGS.includes(child.tagName) || isHidden(child) || !hasContent(child)) return;
      const isContainer = child.classList.contains("container");
      if (isContainer && canFlatten(child, blockEls)) {
        collectUnits(innerGrid(child), blockEls, out);
        return;
      }
      out.push({
        els: [child],
        container: isContainer,
        bg: isContainer ? backgroundStyle(child) : "",
        headingOnly: isHeadingOnly(child)
      });
    });
    return out;
  }
  function buildAutoUnits(element, blockEls) {
    const main = element.matches && element.matches("main") ? element : element.querySelector("main");
    if (!main) return [];
    const grid = main.querySelector(":scope > .aem-Grid") || main;
    const raw = collectUnits(grid, blockEls, []);
    const units = [];
    let lead = [];
    raw.forEach((u) => {
      if (!u.container && !u.headingOnly) {
        if (units.length) units[units.length - 1].els.push(...u.els);
        else lead.push(...u.els);
        return;
      }
      if (lead.length) {
        u.els = [...lead, ...u.els];
        lead = [];
      }
      units.push(u);
    });
    if (lead.length) units.push({ els: lead, container: false, bg: "", headingOnly: false });
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
      if (isCentered(u.els)) styles.push("centered");
      return { els: u.els, style: styles.join(", ") };
    });
  }
  function templateBlockElements(element, template) {
    const els = [];
    (template && template.blocks || []).forEach((b) => {
      toList(b.instances).forEach((sel) => {
        try {
          element.querySelectorAll(sel).forEach((el) => els.push(el));
        } catch (e) {
        }
      });
    });
    return els;
  }
  function autoBefore(element, template) {
    const doc = element.ownerDocument || document;
    const blockEls = templateBlockElements(element, template);
    const units = buildAutoUnits(element, blockEls);
    for (let i = units.length - 1; i >= 0; i -= 1) {
      const { els, style } = units[i];
      const start = els[0];
      if (i === 0 && !style) continue;
      if (start.parentElement && isInside(start.parentElement, blockEls)) continue;
      const hr = doc.createElement("hr");
      hr.setAttribute(AUTO_BREAK_ATTR, "");
      if (style) hr.setAttribute(SECTION_STYLE_ATTR, style);
      if (i === 0) hr.setAttribute(SECTION_FIRST_ATTR, "");
      start.before(hr);
    }
  }
  function sectionHasContent(element, marker, nextMarker) {
    const doc = element.ownerDocument || document;
    const range = doc.createRange();
    range.setStartAfter(marker);
    if (nextMarker) range.setEndBefore(nextMarker);
    else range.setEnd(element, element.childNodes.length);
    const frag = range.cloneContents();
    return Boolean((frag.textContent || "").trim()) || Boolean(frag.querySelector(POST_PARSE_MEDIA_SELECTOR));
  }
  function autoAfter(element) {
    const doc = element.ownerDocument || document;
    const breaks = [...element.querySelectorAll(`hr[${AUTO_BREAK_ATTR}]`)];
    breaks.forEach((marker, i) => {
      if (!sectionHasContent(element, marker, breaks[i + 1])) marker.remove();
      else marker.removeAttribute(AUTO_BREAK_ATTR);
    });
    [...element.querySelectorAll(`hr[${SECTION_STYLE_ATTR}]`)].reverse().forEach((marker) => {
      const metadataBlock = WebImporter.Blocks.createBlock(doc, {
        name: "Section Metadata",
        cells: { style: marker.getAttribute(SECTION_STYLE_ATTR) }
      });
      marker.after(metadataBlock);
      const isFirst = marker.hasAttribute(SECTION_FIRST_ATTR);
      marker.removeAttribute(SECTION_STYLE_ATTR);
      marker.removeAttribute(SECTION_FIRST_ATTR);
      if (isFirst) marker.remove();
    });
  }
  function transform2(hookName, element, payload) {
    const template = payload && payload.template || {};
    const sections = template.sections || [];
    const mode = getSectionMode(template);
    if (mode !== "auto" && sections.length < 2) return;
    if (hookName === "beforeTransform") {
      if (mode === "auto") autoBefore(element, template);
      else explicitBefore(element, sections);
    }
    if (hookName === "afterTransform") {
      if (mode === "auto") autoAfter(element);
      else explicitAfter(element, sections);
    }
  }

  // tools/importer/import-home.js
  var parsers = {
    "hero-fade": parse,
    "cards-teaser": parse2,
    "tabs-risk": parse3,
    "columns-media": parse4,
    "columns-featured": parse5
  };
  var PAGE_TEMPLATE = {
    "name": "home",
    "description": "AIG home page: fade hero, featured teasers, about text, risk-solution tabs, alternating media/text stories, newsroom featured story, careers fade banner",
    "urls": [
      "https://www.aig.com/home"
    ],
    "blocks": [
      {
        "name": "hero-fade",
        "instances": [
          ".container.hero-banner-with-fade"
        ]
      },
      {
        "name": "cards-teaser",
        "instances": [
          ".hero-banner-2022 .container.paleblue"
        ]
      },
      {
        "name": "tabs-risk",
        "instances": [
          ".container.aig-tabs .tabs.panelcontainer"
        ]
      },
      {
        "name": "columns-media",
        "instances": [
          ".container.aig-video.two-column-grid",
          ".teaserflex.cta-with-image:not(.aig-featured-story)"
        ]
      },
      {
        "name": "columns-featured",
        "instances": [
          ".teaserflex.aig-featured-story"
        ]
      }
    ],
    "sections": [
      {
        "id": "1",
        "name": "Hero - Salford City",
        "selector": [
          ".container.hero-banner-with-fade.nobottomspace",
          "main.responsivegrid > .aem-Grid > .container:nth-child(1)"
        ],
        "style": null,
        "blocks": [
          "hero-fade"
        ],
        "defaultContent": []
      },
      {
        "id": "2",
        "name": "Featured teasers",
        "selector": [
          ".container.hero-banner-2022"
        ],
        "style": "light-blue",
        "blocks": [
          "cards-teaser"
        ],
        "defaultContent": []
      },
      {
        "id": "3",
        "name": "About AIG",
        "selector": [
          "main.responsivegrid > .aem-Grid > .container:has(> .cmp-container > .aem-Grid > .two-thirdwidth)",
          "main.responsivegrid > .aem-Grid > .container:nth-child(3)"
        ],
        "style": "narrow, centered",
        "blocks": [],
        "defaultContent": [
          ".two-thirdwidth .cmp-teaser__title",
          ".two-thirdwidth .cmp-teaser__description"
        ]
      },
      {
        "id": "4",
        "name": "Risk Solutions tabs",
        "selector": [
          "main.responsivegrid > .aem-Grid > .container.paleblue",
          "main.responsivegrid > .aem-Grid > .container:nth-child(4)"
        ],
        "style": "pale-blue, centered",
        "blocks": [
          "tabs-risk"
        ],
        "defaultContent": [
          ".aig-tabs .cmp-teaser__pretitle"
        ]
      },
      {
        "id": "5",
        "name": "AIG Performance & Initiatives",
        "selector": [
          "main.responsivegrid > .aem-Grid > .container:has(> .cmp-container > .aem-Grid > .title)",
          "main.responsivegrid > .aem-Grid > .container:nth-child(5)"
        ],
        "style": "centered",
        "blocks": [
          "columns-media"
        ],
        "defaultContent": [
          ".cmp-title__text"
        ]
      },
      {
        "id": "6",
        "name": "AIG Newsroom",
        "selector": [
          ".container.flexbox-container.addbottom16"
        ],
        "style": "centered",
        "blocks": [
          "columns-featured"
        ],
        "defaultContent": [
          ".addbottom16 .teaserflex.titlecenter .cmp-teaser__title"
        ]
      },
      {
        "id": "7",
        "name": "Careers banner",
        "selector": [
          ".container.hero-banner-with-fade:not(.nobottomspace)",
          "main.responsivegrid > .aem-Grid > .container:nth-child(9)"
        ],
        "style": null,
        "blocks": [
          "hero-fade"
        ],
        "defaultContent": []
      }
    ]
  };
  var transformers = [
    transform,
    ...PAGE_TEMPLATE.sections && PAGE_TEMPLATE.sections.length > 1 ? [transform2] : []
  ];
  function executeTransformers(hookName, element, payload) {
    const enhancedPayload = __spreadProps(__spreadValues({}, payload), { template: PAGE_TEMPLATE });
    transformers.forEach((transformerFn) => {
      try {
        transformerFn.call(null, hookName, element, enhancedPayload);
      } catch (e) {
        console.error(`Transformer failed at ${hookName}:`, e);
      }
    });
  }
  function findBlocksOnPage(document2, template) {
    const pageBlocks = [];
    template.blocks.forEach((blockDef) => {
      blockDef.instances.forEach((selector) => {
        const elements = document2.querySelectorAll(selector);
        if (elements.length === 0) {
          console.warn(`Block "${blockDef.name}" selector not found: ${selector}`);
        }
        elements.forEach((element) => {
          pageBlocks.push({
            name: blockDef.name,
            selector,
            element,
            section: blockDef.section || null
          });
        });
      });
    });
    console.log(`Found ${pageBlocks.length} block instances on page`);
    return pageBlocks;
  }
  var import_home_default = {
    transform: (payload) => {
      const { document: document2, url, params } = payload;
      const main = document2.body;
      executeTransformers("beforeTransform", main, payload);
      const pageBlocks = findBlocksOnPage(document2, PAGE_TEMPLATE);
      pageBlocks.forEach((block) => {
        if (!block.element.parentNode) return;
        const parser = parsers[block.name];
        if (parser) {
          try {
            parser(block.element, { document: document2, url, params });
          } catch (e) {
            console.error(`Failed to parse ${block.name} (${block.selector}):`, e);
          }
        } else {
          console.warn(`No parser found for block: ${block.name}`);
        }
      });
      executeTransformers("afterTransform", main, payload);
      const hr = document2.createElement("hr");
      main.appendChild(hr);
      WebImporter.rules.createMetadata(main, document2);
      WebImporter.rules.transformBackgroundImages(main, document2);
      WebImporter.rules.adjustImageUrls(main, url, params.originalURL);
      const rawPath = new URL(params.originalURL).pathname.replace(/\/$/, "").replace(/\.html?$/, "");
      const path = WebImporter.FileUtils.sanitizePath(rawPath === "" ? "/index" : rawPath);
      return [{
        element: main,
        path,
        report: {
          title: document2.title,
          template: PAGE_TEMPLATE.name,
          blocks: pageBlocks.map((b) => b.name)
        }
      }];
    }
  };
  return __toCommonJS(import_home_exports);
})();
