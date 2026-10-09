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

  // tools/importer/import-accordion-detail.js
  var import_accordion_detail_exports = {};
  __export(import_accordion_detail_exports, {
    default: () => import_accordion_detail_default
  });

  // tools/importer/parsers/form.js
  var FIELD_SELECTOR = 'input:not([type="hidden"]):not([type="submit"]):not([type="button"]):not([type="reset"]):not([type="image"]), select, textarea';
  var CONTAINER_BLOCKS = "main .tabs.panelcontainer, main .accordion.panelcontainer";
  function realFieldCount(form) {
    return [...form.querySelectorAll(FIELD_SELECTOR)].filter((f) => {
      if (f.closest(".aigtracker, .recaptcha, .g-recaptcha")) return false;
      const name = f.getAttribute("name") || "";
      return !/tracker-id$|^g-recaptcha-response$/i.test(name);
    }).length;
  }
  function surroundingText(form) {
    const fields = [...form.querySelectorAll(FIELD_SELECTOR)].filter((f) => !f.closest(".aigtracker, .recaptcha, .g-recaptcha"));
    const before = [];
    const after = [];
    if (!fields.length) return { before, after };
    const first = fields[0];
    const last = fields[fields.length - 1];
    const clean6 = (t) => (t || "").replace(/\s+/g, " ").trim();
    [...form.querySelectorAll(".cmp-text")].filter((c) => !c.querySelector(FIELD_SELECTOR) && !c.closest(".button, .recaptcha")).forEach((c) => {
      const text = clean6(c.textContent);
      if (!text) return;
      const bold = clean6([...c.querySelectorAll("b, strong")].map((b) => b.textContent).join(" "));
      if (bold === text) return;
      if (!(first.compareDocumentPosition(c) & 4)) before.push(c);
      else if (last.compareDocumentPosition(c) & 4) after.push(c);
    });
    return { before, after };
  }
  function pageSlug(params, document2) {
    let href = params && params.originalURL || "";
    if (!href && document2.location && document2.location.href !== "about:blank") href = document2.location.href;
    let pathname = "";
    try {
      pathname = new URL(href).pathname;
    } catch (e) {
      pathname = href;
    }
    const segments = pathname.replace(/\/+$/, "").replace(/\.html?$/, "").split("/").filter(Boolean);
    return WebImporter.FileUtils.sanitizePath(segments.pop() || "index").replace(/^\//, "");
  }
  function parse(element, { document: document2, params }) {
    const form = element.matches("form") ? element : element.querySelector("form");
    if (!form) return;
    if (form.closest("header, footer, dialog, .cmp-experiencefragment--header, .cmp-experiencefragment--footer")) return;
    if (realFieldCount(form) < 2) return;
    const file = `${pageSlug(params, document2)}-form.json`;
    const link = document2.createElement("a");
    link.href = file;
    link.textContent = file;
    const block = WebImporter.Blocks.createBlock(document2, { name: "Form", cells: [[link]] });
    const { before, after } = surroundingText(form);
    let host = null;
    let el = form.parentElement;
    while (el) {
      if (el.matches && el.matches(CONTAINER_BLOCKS)) host = el;
      el = el.parentElement;
    }
    if (host) {
      host.after(...before, block, ...after);
      form.remove();
    } else {
      element.replaceWith(...before, block, ...after);
    }
  }

  // tools/importer/parsers/hero-fade.js
  function titleHeading(element, document2) {
    const title = [...element.querySelectorAll(".title .cmp-title__text, .title h1, .title h2")].find((h) => !h.closest(".breadcrumb"));
    if (!title || !title.textContent.trim()) return null;
    const level = /^H[1-6]$/.test(title.tagName) ? title.tagName.toLowerCase() : "h1";
    const heading = document2.createElement(level);
    heading.textContent = title.textContent.trim();
    return heading;
  }
  function descriptionParas(desc, document2) {
    const paras = [...desc.querySelectorAll("p")];
    if (!paras.length) {
      if (!desc.textContent.trim()) return [];
      const p = document2.createElement("p");
      p.textContent = desc.textContent.trim();
      return [p];
    }
    return paras.map((p) => {
      const isBlank = (n) => n && (n.nodeType === 3 && !n.textContent.trim() || n.nodeName === "BR");
      while (isBlank(p.firstChild)) p.firstChild.remove();
      while (isBlank(p.lastChild)) p.lastChild.remove();
      p.removeAttribute("style");
      return p;
    }).filter((p) => p.textContent.trim() || p.querySelector("img"));
  }
  function teaserContent(element, bgImage, document2) {
    const out = [];
    element.querySelectorAll(".cmp-teaser").forEach((teaser) => {
      if (teaser.closest(".breadcrumb")) return;
      const img = teaser.querySelector(".cmp-teaser__image img, .cmp-image img");
      if (img && img !== bgImage) out.push(img);
      const content = teaser.querySelector(".cmp-teaser__content");
      if (!content) return;
      const title = content.querySelector(".cmp-teaser__title");
      if (title && title.textContent.trim()) {
        const h = document2.createElement("h2");
        h.textContent = title.textContent.trim();
        out.push(h);
      }
      const desc = content.querySelector(".cmp-teaser__description");
      if (desc) out.push(...descriptionParas(desc, document2));
      content.querySelectorAll(".cmp-teaser__action-link").forEach((a) => {
        const p = document2.createElement("p");
        p.append(a);
        out.push(p);
      });
    });
    return out;
  }
  function absUrl(href, document2) {
    try {
      const base = document2.location && document2.location.href !== "about:blank" ? document2.location.href : "https://www.aig.com/home";
      return new URL(href, base).href;
    } catch (e) {
      return href;
    }
  }
  function breadcrumbList(element, document2) {
    const bc = element.querySelector(".breadcrumb");
    if (!bc) return null;
    bc.remove();
    const list = bc.querySelector(".cmp-breadcrumb__list, ol, ul");
    const items = list ? [...list.querySelectorAll("li")].filter((li, i, arr) => !arr.some((o) => o !== li && o.contains(li))) : [];
    const ul = document2.createElement("ul");
    items.forEach((item, i) => {
      const text = item.textContent.replace(/\s+/g, " ").trim();
      if (!text) return;
      const li = document2.createElement("li");
      const link = item.querySelector("a[href]");
      const href = link && link.getAttribute("href");
      const isCurrent = item.classList.contains("cmp-breadcrumb__item--active") || i === items.length - 1;
      if (link && href && href !== "#" && !isCurrent) {
        const a = document2.createElement("a");
        a.href = absUrl(href, document2);
        a.textContent = text;
        li.append(a);
      } else {
        li.textContent = text;
      }
      ul.append(li);
    });
    return ul.children.length ? ul : null;
  }
  function parse2(element, { document: document2 }) {
    const crumbs = breadcrumbList(element, document2);
    const bgImage = element.querySelector(".teaserflex .cmp-teaser__image img, .cmp-image img, img");
    const textTeaser = element.querySelector(".halfwidth .cmp-teaser__content") || [...element.querySelectorAll(".cmp-teaser__content")].find((c) => c.querySelector(".cmp-teaser__title, h1, h2, h3"));
    const contentCell = [];
    if (crumbs) contentCell.push(crumbs);
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
        a.querySelectorAll(".custom-icons").forEach((s) => s.remove());
        const p = document2.createElement("p");
        p.append(a);
        contentCell.push(p);
      });
    } else {
      const heading = titleHeading(element, document2);
      if (heading) contentCell.push(heading);
      contentCell.push(...teaserContent(element, bgImage, document2));
    }
    if (!bgImage && contentCell.length <= (crumbs ? 1 : 0)) {
      element.replaceWith(...element.childNodes);
      return;
    }
    const cells = [];
    if (bgImage) cells.push([bgImage]);
    cells.push([contentCell]);
    const block = WebImporter.Blocks.createBlock(document2, { name: "hero-fade", cells });
    element.replaceWith(block);
  }

  // tools/importer/parsers/breadcrumbs.js
  function absUrl2(href, document2) {
    try {
      const base = document2.location && document2.location.href !== "about:blank" ? document2.location.href : "https://www.aig.com/home";
      return new URL(href, base).href;
    } catch (e) {
      return href;
    }
  }
  function parse3(element, { document: document2 }) {
    const list = element.querySelector(".cmp-breadcrumb__list, ol, ul");
    const items = list ? [...list.querySelectorAll("li")].filter((li, i, arr) => !arr.some((o) => o !== li && o.contains(li))) : [];
    const ul = document2.createElement("ul");
    items.forEach((item, i) => {
      const text = item.textContent.replace(/\s+/g, " ").trim();
      if (!text) return;
      const li = document2.createElement("li");
      const link = item.querySelector("a[href]");
      const href = link && link.getAttribute("href");
      const isCurrent = item.classList.contains("cmp-breadcrumb__item--active") || i === items.length - 1;
      if (link && href && href !== "#" && !isCurrent) {
        const a = document2.createElement("a");
        a.href = absUrl2(href, document2);
        a.textContent = text;
        li.append(a);
      } else {
        li.textContent = text;
      }
      ul.append(li);
    });
    if (!ul.children.length) {
      element.replaceWith(...element.childNodes);
      return;
    }
    const block = WebImporter.Blocks.createBlock(document2, { name: "breadcrumbs", cells: [[ul]] });
    element.replaceWith(block);
  }

  // tools/importer/parsers/columns-quicklinks.js
  function absUrl3(href, document2) {
    if (!href) return href;
    if (/^(mailto:|tel:|javascript:|#)/i.test(href)) return href;
    try {
      const base = document2.location && document2.location.href !== "about:blank" ? document2.location.href : "https://www.aig.com/home";
      return new URL(href, base).href;
    } catch (e) {
      return href;
    }
  }
  function clean(text) {
    return (text || "").replace(/\s+/g, " ").trim();
  }
  function fixUrls(el, document2) {
    const all = el.matches && el.matches("a[href], img[src]") ? [el] : [];
    all.push(...el.querySelectorAll("a[href], img[src]"));
    all.forEach((n) => {
      if (n.tagName === "A") n.setAttribute("href", absUrl3(n.getAttribute("href"), document2));
      else n.setAttribute("src", absUrl3(n.getAttribute("src"), document2));
    });
    return el;
  }
  function linkPara(href, text, document2) {
    const p = document2.createElement("p");
    const a = document2.createElement("a");
    a.href = absUrl3(href, document2);
    a.textContent = clean(text) || href;
    p.append(a);
    return p;
  }
  function headingFrom(el, fallbackLevel, document2) {
    const level = /^H[1-6]$/.test(el.tagName) ? el.tagName.toLowerCase() : fallbackLevel;
    const h = document2.createElement(level);
    const link = el.querySelector("a[href]");
    if (link && clean(link.textContent) === clean(el.textContent)) {
      const a = document2.createElement("a");
      a.href = absUrl3(link.getAttribute("href"), document2);
      a.textContent = clean(el.textContent);
      h.append(a);
    } else {
      h.textContent = clean(el.textContent);
    }
    return h;
  }
  function teaserContent2(teaser, out, document2) {
    const img = teaser.querySelector(".cmp-teaser__image img");
    if (img) out.push(fixUrls(img, document2));
    const content = teaser.querySelector(".cmp-teaser__content") || teaser;
    const pre = content.querySelector(".cmp-teaser__pretitle");
    const title = content.querySelector(".cmp-teaser__title");
    const desc = content.querySelector(":scope > .cmp-teaser__description") || content.querySelector(".cmp-teaser__description");
    if (pre && clean(pre.textContent)) {
      if (!title && !desc) out.push(headingFrom(pre, "h2", document2));
      else {
        const p = document2.createElement("p");
        p.textContent = clean(pre.textContent);
        out.push(p);
      }
    }
    if (title && clean(title.textContent)) out.push(headingFrom(title, "h2", document2));
    if (desc) collect(desc, out, document2);
    content.querySelectorAll(".cmp-teaser__action-link").forEach((a) => {
      out.push(linkPara(a.getAttribute("href"), a.textContent, document2));
    });
  }
  function downloadContent(dl, out, document2) {
    const action = dl.querySelector("a.cmp-download__action");
    const titleLink = dl.querySelector(".cmp-download__title a[href], .cmp-download__title-link");
    const label = clean((dl.querySelector(".cmp-download__action-text") || {}).textContent) || clean((dl.querySelector(".cmp-download__property--filename .cmp-download__property-content") || {}).textContent);
    if (label) {
      const p = document2.createElement("p");
      p.textContent = label;
      out.push(p);
    }
    const href = titleLink && titleLink.getAttribute("href") || action && action.getAttribute("href");
    if (href) out.push(linkPara(href, titleLink ? titleLink.textContent : "Download PDF", document2));
  }
  function videoContent(video, out, document2) {
    const poster = video.querySelector(".video_thumbnail img, img");
    if (poster) out.push(fixUrls(poster, document2));
    const srcEl = video.querySelector("[data-src], video source[src], video[src], iframe[src]");
    const href = srcEl && (srcEl.getAttribute("data-src") || srcEl.getAttribute("src"));
    if (href) out.push(linkPara(href, "Play Video", document2));
    const timeEl = video.querySelector("[data-time]");
    if (timeEl && timeEl.getAttribute("data-time")) {
      const p = document2.createElement("p");
      p.textContent = timeEl.getAttribute("data-time");
      out.push(p);
    }
  }
  var SKIP = "script, style, noscript, dialog, button, .video-popup, .action-teaser-more, .action-teaser-less, .cmp-download__properties, meta, link";
  var BLOCKISH = "p, ul, ol, h1, h2, h3, h4, h5, h6, table, blockquote, pre";
  function collect(node, out, document2) {
    [...node.childNodes].forEach((child) => {
      if (child.nodeType === 3) {
        if (clean(child.textContent)) {
          const p = document2.createElement("p");
          p.textContent = clean(child.textContent);
          out.push(p);
        }
        return;
      }
      if (child.nodeType !== 1) return;
      if (child.matches(".videocomponent")) {
        videoContent(child, out, document2);
        return;
      }
      if (child.matches(SKIP)) return;
      if (child.matches(".cmp-teaser")) {
        teaserContent2(child, out, document2);
        return;
      }
      if (child.matches(".cmp-download")) {
        downloadContent(child, out, document2);
        return;
      }
      if (child.matches(".cmp-title")) {
        const h = child.querySelector("h1, h2, h3, h4, h5, h6");
        if (h) out.push(headingFrom(h, "h2", document2));
        return;
      }
      if (child.matches("h1, h2, h3, h4, h5, h6, p") && child.querySelector("table, ul, ol, div, p")) {
        collect(child, out, document2);
        return;
      }
      if (child.matches(BLOCKISH)) {
        const toggle = child.querySelector('a[href="#less-content"], a[href="#more-content"]');
        if (toggle && clean(toggle.textContent) === clean(child.textContent)) return;
        if (clean(child.textContent) || child.querySelector("img")) out.push(fixUrls(child, document2));
        return;
      }
      if (child.matches("img")) {
        out.push(fixUrls(child, document2));
        return;
      }
      if (child.matches("picture")) {
        const img = child.querySelector("img");
        if (img) out.push(fixUrls(img, document2));
        return;
      }
      if (child.matches("a[href]") && !child.querySelector("div, p, h1, h2, h3, h4, img")) {
        if (clean(child.textContent)) out.push(linkPara(child.getAttribute("href"), child.textContent, document2));
        return;
      }
      collect(child, out, document2);
    });
  }
  function buildLinksCell(panel, document2) {
    const out = [];
    const titleEl = panel.querySelector(".cmp-title__text, .cmp-title h1, .cmp-title h2, .cmp-title h3, h2, h3");
    if (titleEl && clean(titleEl.textContent)) out.push(headingFrom(titleEl, "h2", document2));
    const items = [...panel.querySelectorAll(".cmp-list__item, .cmp-list > li")].filter((li, i, arr) => arr.indexOf(li) === i);
    if (items.length) {
      const ul = document2.createElement("ul");
      items.forEach((item) => {
        const link = item.querySelector("a[href]");
        const text = clean((item.querySelector(".cmp-list__item-title") || item).textContent);
        if (!text) return;
        const li = document2.createElement("li");
        if (link) {
          const a = document2.createElement("a");
          a.href = absUrl3(link.getAttribute("href"), document2);
          a.textContent = text;
          li.append(a);
        } else {
          li.textContent = text;
        }
        ul.append(li);
      });
      if (ul.children.length) out.push(ul);
    } else {
      const rest = [];
      collect(panel, rest, document2);
      rest.filter((el) => !(titleEl && clean(el.textContent) === clean(titleEl.textContent))).forEach((el) => out.push(el));
    }
    return out;
  }
  function parse4(element, { document: document2 }) {
    const grid = element.querySelector(":scope > .cmp-container > .aem-Grid") || element;
    const panel = grid.querySelector(":scope > .quick-links") || element.querySelector(".quick-links");
    const intro = [];
    [...grid.children].forEach((child) => {
      if (child === panel) return;
      collect(child.matches(".teaserflex, .teaser, .teaser2023") ? child : child, intro, document2);
    });
    const links = panel ? buildLinksCell(panel, document2) : [];
    if (!intro.length && !links.length) {
      element.replaceWith(...element.childNodes);
      return;
    }
    const featured = !!grid.querySelector(":scope > .stories");
    const cells = [[intro.length ? intro : "", links.length ? links : ""]];
    const block = WebImporter.Blocks.createBlock(document2, {
      name: "columns-quicklinks",
      variants: featured ? ["featured"] : [],
      cells
    });
    element.replaceWith(block);
  }

  // tools/importer/parsers/accordion.js
  function absUrl4(href, document2) {
    if (!href) return href;
    if (/^(mailto:|tel:|javascript:|#)/i.test(href)) return href;
    try {
      const base = document2.location && document2.location.href !== "about:blank" ? document2.location.href : "https://www.aig.com/home";
      return new URL(href, base).href;
    } catch (e) {
      return href;
    }
  }
  function clean2(text) {
    return (text || "").replace(/\s+/g, " ").trim();
  }
  function fixUrls2(el, document2) {
    const all = el.matches && el.matches("a[href], img[src]") ? [el] : [];
    all.push(...el.querySelectorAll("a[href], img[src]"));
    all.forEach((n) => {
      if (n.tagName === "A") n.setAttribute("href", absUrl4(n.getAttribute("href"), document2));
      else n.setAttribute("src", absUrl4(n.getAttribute("src"), document2));
    });
    return el;
  }
  function linkPara2(href, text, document2) {
    const p = document2.createElement("p");
    const a = document2.createElement("a");
    a.href = absUrl4(href, document2);
    a.textContent = clean2(text) || href;
    p.append(a);
    return p;
  }
  function headingFrom2(el, fallbackLevel, document2) {
    const level = /^H[1-6]$/.test(el.tagName) ? el.tagName.toLowerCase() : fallbackLevel;
    const h = document2.createElement(level);
    const link = el.querySelector("a[href]");
    if (link && clean2(link.textContent) === clean2(el.textContent)) {
      const a = document2.createElement("a");
      a.href = absUrl4(link.getAttribute("href"), document2);
      a.textContent = clean2(el.textContent);
      h.append(a);
    } else {
      h.textContent = clean2(el.textContent);
    }
    return h;
  }
  function teaserContent3(teaser, out, document2) {
    const img = teaser.querySelector(".cmp-teaser__image img");
    if (img) out.push(fixUrls2(img, document2));
    const content = teaser.querySelector(".cmp-teaser__content") || teaser;
    const pre = content.querySelector(".cmp-teaser__pretitle");
    const title = content.querySelector(".cmp-teaser__title");
    const desc = content.querySelector(".cmp-teaser__description");
    if (pre && clean2(pre.textContent)) {
      if (!title && !desc) out.push(headingFrom2(pre, "h2", document2));
      else {
        const p = document2.createElement("p");
        p.textContent = clean2(pre.textContent);
        out.push(p);
      }
    }
    if (title && clean2(title.textContent)) out.push(headingFrom2(title, "h3", document2));
    if (desc) collect2(desc, out, document2);
    content.querySelectorAll(".cmp-teaser__action-link").forEach((a) => {
      out.push(linkPara2(a.getAttribute("href"), a.textContent, document2));
    });
  }
  function downloadContent2(dl, out, document2) {
    const action = dl.querySelector("a.cmp-download__action");
    const titleLink = dl.querySelector(".cmp-download__title a[href], .cmp-download__title-link");
    const label = clean2((dl.querySelector(".cmp-download__action-text") || {}).textContent) || clean2((dl.querySelector(".cmp-download__property--filename .cmp-download__property-content") || {}).textContent);
    if (label) {
      const p = document2.createElement("p");
      p.textContent = label;
      out.push(p);
    }
    const href = titleLink && titleLink.getAttribute("href") || action && action.getAttribute("href");
    if (href) out.push(linkPara2(href, titleLink ? titleLink.textContent : "Download PDF", document2));
  }
  function pdfContent(viewer, out, document2) {
    const dl = viewer.querySelector('a#downloadPDF, a[download], a[href$=".pdf"]');
    const href = viewer.getAttribute("data-cmp-document-path") || dl && dl.getAttribute("href") || viewer.querySelector("iframe[src]") && viewer.querySelector("iframe[src]").getAttribute("src");
    if (!href) return;
    const name = viewer.getAttribute("data-cmp-document-file-name") || "";
    out.push(linkPara2(href, dl && clean2(dl.textContent) ? `${clean2(dl.textContent)} ${name}`.trim() : name || "View PDF", document2));
  }
  var SKIP2 = "script, style, noscript, dialog, button, .video-popup, .action-teaser-more, .action-teaser-less, .cmp-download__properties, meta, link";
  var BLOCKISH2 = "p, ul, ol, h1, h2, h3, h4, h5, h6, table, blockquote, pre";
  function collect2(node, out, document2) {
    [...node.childNodes].forEach((child) => {
      if (child.nodeType === 3) {
        if (clean2(child.textContent)) {
          const p = document2.createElement("p");
          p.textContent = clean2(child.textContent);
          out.push(p);
        }
        return;
      }
      if (child.nodeType !== 1 || child.matches(SKIP2)) return;
      if (child.matches(".cmp-teaser")) {
        teaserContent3(child, out, document2);
        return;
      }
      if (child.matches(".cmp-download")) {
        downloadContent2(child, out, document2);
        return;
      }
      if (child.matches(".cmp-pdfviewer")) {
        pdfContent(child, out, document2);
        return;
      }
      if (child.matches(".cmp-accordion__header")) {
        out.push(headingFrom2(child, "h3", document2));
        return;
      }
      if (child.matches(".cmp-title")) {
        const h = child.querySelector("h1, h2, h3, h4, h5, h6");
        if (h) out.push(headingFrom2(h, "h3", document2));
        return;
      }
      if (child.matches("h1, h2, h3, h4, h5, h6, p") && child.querySelector("table, ul, ol, div, p")) {
        collect2(child, out, document2);
        return;
      }
      if (child.matches(BLOCKISH2)) {
        if (clean2(child.textContent) || child.querySelector("img")) out.push(fixUrls2(child, document2));
        return;
      }
      if (child.matches("img")) {
        out.push(fixUrls2(child, document2));
        return;
      }
      if (child.matches("picture")) {
        const img = child.querySelector("img");
        if (img) out.push(fixUrls2(img, document2));
        return;
      }
      if (child.matches("iframe[src]")) {
        out.push(linkPara2(child.getAttribute("src"), child.getAttribute("title") || child.getAttribute("src"), document2));
        return;
      }
      if (child.matches("a[href]") && !child.querySelector("div, p, h1, h2, h3, h4, img")) {
        if (clean2(child.textContent)) out.push(linkPara2(child.getAttribute("href"), child.textContent, document2));
        return;
      }
      if (child.matches("span, strong, em, b, i") && !child.querySelector("div, p")) {
        if (clean2(child.textContent)) {
          const p = document2.createElement("p");
          p.append(fixUrls2(child, document2));
          out.push(p);
        }
        return;
      }
      collect2(child, out, document2);
    });
  }
  function isIcon(img) {
    return !clean2(img.getAttribute("alt")) && /\/icons?\/|icon[_-]/i.test(img.getAttribute("src") || "");
  }
  function contactCards(panel, out, document2) {
    const cards = [...panel.querySelectorAll(".aig-contact-card")].filter((c, i, arr) => !arr.some((o) => o !== c && o.contains(c)));
    cards.forEach((card) => {
      const nodes = [];
      collect2(card, nodes, document2);
      const seen = /* @__PURE__ */ new Set();
      const lines = [];
      nodes.forEach((n) => {
        if (n.matches("img") && isIcon(n)) return;
        n.querySelectorAll("img").forEach((img) => {
          if (isIcon(img)) img.remove();
        });
        const walker = document2.createTreeWalker(n, 4);
        while (walker.nextNode()) walker.currentNode.textContent = walker.currentNode.textContent.replace(/\u00a0/g, " ");
        if (!clean2(n.textContent) && !n.querySelector("img") && !n.matches("img")) return;
        const sole = n.querySelector("a[href]");
        const key = sole && clean2(sole.textContent) === clean2(n.textContent) ? `link:${sole.getAttribute("href")}` : null;
        if (key && seen.has(key)) return;
        if (key) seen.add(key);
        lines.push(n);
      });
      if (!lines.length) return;
      const [first, ...rest] = lines;
      const h3 = document2.createElement("h3");
      const link = first.matches("a[href]") ? first : first.querySelector("a[href]");
      if (link && clean2(link.textContent) === clean2(first.textContent)) {
        const a = document2.createElement("a");
        a.href = absUrl4(link.getAttribute("href"), document2);
        a.textContent = clean2(link.textContent);
        h3.append(a);
      } else {
        h3.textContent = clean2(first.textContent);
      }
      out.push(h3, ...rest);
    });
  }
  var CARDS_OPTION_PATHS = [/^\/home\/contact\/?$/];
  function pagePath(url, params, document2) {
    const raw = params && params.originalURL || url || (document2.location && document2.location.href !== "about:blank" ? document2.location.href : "");
    try {
      return new URL(raw).pathname.replace(/\.html?$/, "");
    } catch (e) {
      return "";
    }
  }
  function parse5(element, { document: document2, url, params }) {
    const items = [...element.querySelectorAll(".cmp-accordion__item")].filter((item) => item.closest(".accordion.panelcontainer") === element || item.closest(".cmp-accordion") === element.querySelector(".cmp-accordion"));
    const isHighlight = items.length === 1 && !!element.querySelector(
      ".cmp-accordion__title.accordion_pdf_icon, .accordion_pdf_icon, .pdfviewer, .cmp-pdfviewer, .pdf-icon"
    );
    const isCards = !isHighlight && !!element.querySelector(".cmp-accordion__panel .aig-contact-card") && CARDS_OPTION_PATHS.some((re) => re.test(pagePath(url, params, document2)));
    const cells = [];
    items.forEach((item) => {
      const titleEl = item.querySelector(":scope > .cmp-accordion__header .cmp-accordion__title") || item.querySelector(":scope > .cmp-accordion__header") || item.querySelector(".cmp-accordion__title");
      const label = clean2(titleEl && titleEl.textContent);
      const panel = item.querySelector(":scope > .cmp-accordion__panel") || item.querySelector(".cmp-accordion__panel");
      const body = [];
      if (panel && isCards && panel.querySelector(".aig-contact-card")) contactCards(panel, body, document2);
      else if (panel) collect2(panel, body, document2);
      if (!label && !body.length) return;
      cells.push([label, body.length ? body : ""]);
    });
    if (!cells.length) {
      element.replaceWith(...element.childNodes);
      return;
    }
    const block = WebImporter.Blocks.createBlock(document2, {
      name: isHighlight ? "Accordion (highlight)" : isCards ? "Accordion (cards)" : "Accordion",
      cells
    });
    element.replaceWith(block);
  }

  // tools/importer/parsers/columns-featured.js
  function linkText(a) {
    const clone = a.cloneNode(true);
    clone.querySelectorAll(".custom-icons, .sr-only").forEach((s) => s.remove());
    return clone.textContent.trim();
  }
  function parse6(element, { document: document2 }) {
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
      a.textContent = linkText(a);
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

  // tools/importer/parsers/columns-media.js
  function absUrl5(href, document2) {
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
  function linkText2(a) {
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
      a.textContent = linkText2(a);
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
  function parse7(element, ctx) {
    const { document: document2 } = ctx;
    if (element.hasAttribute("data-columns-media-merged")) return;
    const dt50 = element.matches(".container") ? [...element.querySelectorAll(":scope > .cmp-container > .aem-Grid > .teaserflex.dt50")] : [];
    if (dt50.length >= 2) {
      const row2 = [];
      dt50.forEach((teaser2) => {
        const content = teaser2.querySelector(".cmp-teaser__content");
        const hasText = !!(content && content.textContent.trim());
        if (hasText) {
          const textCell2 = buildTextCell(content, document2);
          if (textCell2.length) row2.push(textCell2);
          return;
        }
        const img = teaser2.querySelector(".cmp-teaser__image img, img");
        if (img) row2.push([img]);
      });
      if (!row2.length) {
        element.replaceWith(...element.childNodes);
        return;
      }
      const block2 = WebImporter.Blocks.createBlock(document2, { name: "columns-media", cells: [row2] });
      element.replaceWith(block2);
      return;
    }
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
      a.href = videoHref.startsWith("#") ? videoHref : absUrl5(videoHref, document2);
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

  // tools/importer/parsers/columns-text.js
  function isFadeHeroPage(document2) {
    if (document2.querySelector(".container.hero-banner-with-fade")) return true;
    return [...document2.querySelectorAll("table tr:first-child > th, table tr:first-child > td")].some((c) => /^hero[\s-]?fade\b/i.test(c.textContent.trim()));
  }
  function cssUrl(style) {
    const m = (style || "").match(/background-image\s*:\s*url\(\s*(['"]?)(.*?)\1\s*\)/i);
    if (!m) return null;
    return m[2].replace(/\\([0-9a-fA-F]{1,6})\s?/g, (_, hex) => String.fromCodePoint(parseInt(hex, 16))).replace(/\\(.)/g, "$1").trim() || null;
  }
  function glanceBand(element) {
    const band = element.parentElement && element.parentElement.closest(".container");
    if (!band) return null;
    const cmp = band.querySelector(":scope > .cmp-container");
    const src = cmp && cssUrl(cmp.getAttribute("style"));
    if (!src) return null;
    const grid = cmp.querySelector(":scope > .aem-Grid") || cmp;
    if (!grid.querySelector(":scope > .title.whiteheading")) return null;
    return { src };
  }
  function absUrl6(href, document2) {
    if (!href) return href;
    if (/^(mailto:|tel:|javascript:|#)/i.test(href)) return href;
    try {
      const base = document2.location && document2.location.href !== "about:blank" ? document2.location.href : "https://www.aig.com/home";
      return new URL(href, base).href;
    } catch (e) {
      return href;
    }
  }
  function clean3(text) {
    return (text || "").replace(/\s+/g, " ").trim();
  }
  function fixUrls3(el, document2) {
    const all = el.matches && el.matches("a[href], img[src]") ? [el] : [];
    all.push(...el.querySelectorAll("a[href], img[src]"));
    all.forEach((n) => {
      if (n.tagName === "A") n.setAttribute("href", absUrl6(n.getAttribute("href"), document2));
      else n.setAttribute("src", absUrl6(n.getAttribute("src"), document2));
    });
    return el;
  }
  function headingFrom3(el, fallbackLevel, document2) {
    const level = /^H[1-6]$/.test(el.tagName) ? el.tagName.toLowerCase() : fallbackLevel;
    const h = document2.createElement(level);
    const link = el.querySelector("a[href]");
    if (link && clean3(link.textContent) === clean3(el.textContent)) {
      const a = document2.createElement("a");
      a.href = absUrl6(link.getAttribute("href"), document2);
      a.textContent = clean3(el.textContent);
      h.append(a);
    } else {
      h.textContent = clean3(el.textContent);
    }
    return h;
  }
  function itemContent(item, document2) {
    const out = [];
    const img = item.querySelector(".cmp-teaser__image img, .cmp-image img");
    if (img) out.push(fixUrls3(img, document2));
    const content = item.querySelector(".cmp-teaser__content") || item;
    const pre = content.querySelector(".cmp-teaser__pretitle");
    if (pre && clean3(pre.textContent)) {
      const p = document2.createElement("p");
      p.textContent = clean3(pre.textContent);
      out.push(p);
    }
    const title = content.querySelector(".cmp-teaser__title");
    if (title && clean3(title.textContent)) out.push(headingFrom3(title, "h3", document2));
    const desc = content.querySelector(".cmp-teaser__description");
    if (desc) {
      const parts = [...desc.querySelectorAll(":scope > p, :scope > ul, :scope > ol, :scope > h2, :scope > h3, :scope > h4, :scope > h5, :scope > table")].filter((el) => clean3(el.textContent) || el.querySelector("img"));
      if (parts.length) parts.forEach((el) => out.push(fixUrls3(el, document2)));
      else if (clean3(desc.textContent)) {
        const p = document2.createElement("p");
        p.textContent = clean3(desc.textContent);
        out.push(p);
      }
    }
    content.querySelectorAll(".cmp-teaser__action-link").forEach((a) => {
      const p = document2.createElement("p");
      const link = document2.createElement("a");
      link.href = absUrl6(a.getAttribute("href"), document2);
      link.textContent = clean3(a.textContent);
      p.append(link);
      out.push(p);
    });
    if (!out.length && clean3(item.textContent)) {
      const p = document2.createElement("p");
      p.textContent = clean3(item.textContent);
      out.push(p);
    }
    return out;
  }
  function parse8(element, { document: document2 }) {
    let items = [...element.querySelectorAll(".teaserflex, .aig-infographic-card")].filter((el) => !el.closest(".slick-cloned")).filter((el, i, arr) => !arr.some((o) => o !== el && o.contains(el)));
    if (!items.length) {
      items = [...element.querySelectorAll(".slick-slide:not(.slick-cloned)")];
    }
    const fadeHeroPage = isFadeHeroPage(document2);
    const band = fadeHeroPage ? glanceBand(element) : null;
    const isGlance = element.classList.contains("aig-carousel-v2") || items.some((el) => el.matches(".aig-productcard, .aig-infographic-card")) || !!band;
    const isNarrow = fadeHeroPage && !isGlance && element.matches(".aig-carousel:not(.aig-carousel-3-col)") && items.length >= 4 && !items.some((el) => el.querySelector("img"));
    const leading = [...element.querySelectorAll(".title .cmp-title__text, .title h1, .title h2, .title h3")].filter((h) => !h.closest(".slick-cloned") && !items.some((it) => it.contains(h))).filter((h, i, arr) => arr.findIndex((o) => o.closest(".title") === h.closest(".title")) === i).map((h) => headingFrom3(h, "h2", document2));
    if (fadeHeroPage) items.forEach((item) => item.querySelectorAll(".custom-icons").forEach((s) => s.remove()));
    const row = items.map((item) => itemContent(item, document2)).filter((c) => c.length);
    if (!row.length) {
      element.replaceWith(...element.childNodes);
      return;
    }
    const cells = [];
    if (band) {
      const bg = document2.createElement("img");
      bg.setAttribute("src", absUrl6(band.src, document2));
      bg.setAttribute("alt", "");
      cells.push([bg]);
    }
    cells.push(row);
    let name = "Columns Text";
    if (isGlance) name = "Columns Text (glance)";
    else if (isNarrow) name = "Columns Text (narrow)";
    const block = WebImporter.Blocks.createBlock(document2, { name, cells });
    element.replaceWith(...leading, block);
  }

  // tools/importer/parsers/contact-card.js
  var ICONS = [
    { re: /telephone|phone/i, name: "phone" },
    { re: /fax/i, name: "fax" },
    { re: /e-?mail|envelope/i, name: "email" }
  ];
  var INLINE = ["A", "B", "STRONG", "EM", "I", "U", "SPAN", "FONT"];
  function absUrl7(href, document2) {
    if (!href) return href;
    if (/^(mailto:|tel:|javascript:|#)/i.test(href)) return href;
    try {
      const base = document2.location && document2.location.href !== "about:blank" ? document2.location.href : "https://www.aig.com/home";
      return new URL(href, base).href;
    } catch (e) {
      return href;
    }
  }
  function clean4(text) {
    return (text || "").replace(/[\s\u00a0]+/g, " ").trim();
  }
  function iconName(img) {
    const key = `${img.getAttribute("src") || ""} ${img.getAttribute("alt") || ""}`;
    const hit = ICONS.find((i) => i.re.test(key));
    return hit ? hit.name : null;
  }
  function textBefore(container, node, document2) {
    const range = document2.createRange();
    range.setStart(container, 0);
    range.setEndBefore(node);
    return clean4(range.cloneContents().textContent);
  }
  function unwrap(el) {
    el.replaceWith(...el.childNodes);
  }
  function hasContentBefore(container, node, document2) {
    if (textBefore(container, node, document2)) return true;
    const range = document2.createRange();
    range.setStart(container, 0);
    range.setEndBefore(node);
    return Boolean(range.cloneContents().querySelector("br"));
  }
  function textNodes(root, document2) {
    const walker = document2.createTreeWalker(
      root,
      4
      /* NodeFilter.SHOW_TEXT */
    );
    const out = [];
    while (walker.nextNode()) out.push(walker.currentNode);
    return out;
  }
  function splitAtBlankLines(p, document2) {
    const kids = [...p.childNodes];
    const groups = [[]];
    for (let i = 0; i < kids.length; i += 1) {
      const n = kids[i];
      if (n.nodeName === "BR") {
        let j = i + 1;
        while (j < kids.length && kids[j].nodeType === 3 && !clean4(kids[j].textContent)) j += 1;
        if (j < kids.length && kids[j].nodeName === "BR") {
          while (j < kids.length && (kids[j].nodeName === "BR" || kids[j].nodeType === 3 && !clean4(kids[j].textContent))) j += 1;
          groups.push([]);
          i = j - 1;
          continue;
        }
      }
      groups[groups.length - 1].push(n);
    }
    if (groups.length < 2) return [p];
    return groups.filter((g) => g.some((n) => clean4(n.textContent) || n.querySelector && n.querySelector("img"))).map((g) => {
      const np = document2.createElement("p");
      np.append(...g);
      return np;
    });
  }
  function isContactLine(nodes) {
    return nodes.some((n) => /:(phone|fax|email):/.test(n.textContent || "") || n.nodeType === 1 && (n.matches('a[href^="tel:"], a[href^="mailto:"]') || n.querySelector('a[href^="tel:"], a[href^="mailto:"]')));
  }
  function splitContactLines(p, document2) {
    if (!p.querySelector(":scope > br")) return [p];
    const lines = [[]];
    [...p.childNodes].forEach((n) => {
      if (n.nodeName === "BR") lines.push([]);
      else lines[lines.length - 1].push(n);
    });
    if (!lines.some(isContactLine)) return [p];
    const out = [];
    let run = null;
    lines.forEach((line) => {
      if (!line.some((n) => clean4(n.textContent) || n.querySelector && n.querySelector("img"))) return;
      if (isContactLine(line)) {
        run = null;
        const np = document2.createElement("p");
        np.append(...line);
        out.push(np);
        return;
      }
      if (run) run.append(document2.createElement("br"));
      else {
        run = document2.createElement("p");
        out.push(run);
      }
      run.append(...line);
    });
    return out;
  }
  function cleanCard(body, document2) {
    const card = body.cloneNode(true);
    card.querySelectorAll("script, style, .custom-icons, .sr-only").forEach((n) => n.remove());
    textNodes(card, document2).forEach((t) => {
      t.textContent = t.textContent.replace(/\u00a0/g, " ").replace(/ {2,}/g, " ");
    });
    card.querySelectorAll("img").forEach((img) => {
      const name = iconName(img);
      if (!name) {
        img.setAttribute("src", absUrl7(img.getAttribute("src"), document2));
        return;
      }
      let anchor = img;
      while (anchor.parentElement && INLINE.includes(anchor.parentElement.tagName) && !hasContentBefore(anchor.parentElement, img, document2)) {
        anchor = anchor.parentElement;
      }
      const prev = anchor.previousSibling;
      const needsSpace = prev && prev.nodeName !== "BR" && !/ $/.test(prev.textContent || "");
      anchor.before(document2.createTextNode(`${needsSpace ? " " : ""}:${name}: `));
      img.remove();
    });
    card.querySelectorAll("a").forEach((a) => {
      const href = (a.getAttribute("href") || "").trim();
      if (!href || /^fax:/i.test(href) || /^javascript:/i.test(href)) {
        unwrap(a);
        return;
      }
      let value = href;
      if (/^tel:/i.test(href)) {
        value = `tel:${decodeURIComponent(href.slice(4)).replace(/[\s\u00a0]+/g, "")}`;
      } else if (/^mailto:/i.test(href)) {
        value = `mailto:${href.slice(7).trim()}`;
      } else {
        value = absUrl7(href, document2);
      }
      [...a.attributes].forEach((attr) => a.removeAttribute(attr.name));
      a.setAttribute("href", value);
    });
    [...card.querySelectorAll("b, strong, em, i, u, span, font")].reverse().forEach((el) => {
      if (!clean4(el.textContent.replace(/:(phone|fax|email):/g, "")) && !el.querySelector("img, a")) {
        unwrap(el);
      }
    });
    card.querySelectorAll("[style]").forEach((el) => el.removeAttribute("style"));
    [...card.querySelectorAll(INLINE.join(",").toLowerCase())].reverse().forEach((el) => {
      const isBlank = (n) => n && (n.nodeType === 3 && !clean4(n.textContent) || n.nodeName === "BR");
      if (!clean4(el.textContent) || !isBlank(el.lastChild)) return;
      const brs = [];
      while (isBlank(el.lastChild)) {
        if (el.lastChild.nodeName === "BR") brs.unshift(el.lastChild);
        el.lastChild.remove();
      }
      el.after(...brs);
    });
    [...card.querySelectorAll("a, b, strong, em, i, u")].reverse().forEach((el) => {
      const last = el.lastChild;
      if (last && last.nodeType === 3 && /\s$/.test(last.textContent) && clean4(el.textContent)) {
        last.textContent = last.textContent.replace(/\s+$/, "");
        el.after(document2.createTextNode(" "));
      }
      const first = el.firstChild;
      if (first && first.nodeType === 3 && /^\s/.test(first.textContent) && clean4(el.textContent)) {
        first.textContent = first.textContent.replace(/^\s+/, "");
        el.before(document2.createTextNode(" "));
      }
    });
    const parts = [];
    [...card.children].forEach((child) => {
      if (/^H[1-6]$/.test(child.tagName)) {
        const h = document2.createElement(child.tagName.toLowerCase());
        h.textContent = clean4(child.textContent);
        if (h.textContent) parts.push(h);
        return;
      }
      const trimEdges = (el) => {
        const isBlank = (n) => n && (n.nodeType === 3 && !clean4(n.textContent) || n.nodeName === "BR");
        while (isBlank(el.lastChild)) el.lastChild.remove();
        while (isBlank(el.firstChild)) el.firstChild.remove();
        [...el.querySelectorAll("b, strong")].forEach((b) => {
          while (isBlank(b.lastChild)) b.lastChild.remove();
        });
      };
      const pieces = child.tagName === "P" ? splitAtBlankLines(child, document2) : [child];
      pieces.forEach((piece) => {
        trimEdges(piece);
        if (!clean4(piece.textContent) && !piece.querySelector("img")) return;
        (piece.tagName === "P" ? splitContactLines(piece, document2) : [piece]).forEach((p) => {
          trimEdges(p);
          if (clean4(p.textContent) || p.querySelector("img")) parts.push(p);
        });
      });
    });
    if (!parts.length && clean4(card.textContent)) {
      const p = document2.createElement("p");
      p.textContent = clean4(card.textContent);
      parts.push(p);
    }
    return parts;
  }
  function parse9(element, { document: document2 }) {
    const cards = [...element.querySelectorAll(".text.aig-claims-card")].filter((el, i, arr) => !arr.some((o) => o !== el && o.contains(el)));
    if (!cards.length && element.matches(".aig-claims-card")) cards.push(element);
    const cells = cards.map((card) => cleanCard(card.querySelector(".cmp-text") || card, document2)).filter((parts) => parts.length).map((parts) => [parts]);
    if (!cells.length) {
      element.replaceWith(...element.childNodes);
      return;
    }
    const block = WebImporter.Blocks.createBlock(document2, { name: "contact-card", cells });
    element.replaceWith(block);
  }

  // tools/importer/parsers/downloads.js
  function absUrl8(href, document2) {
    if (!href) return href;
    if (/^(mailto:|tel:|javascript:|#)/i.test(href)) return href;
    try {
      const base = document2.location && document2.location.href !== "about:blank" ? document2.location.href : "https://www.aig.com/home";
      return new URL(href, base).href;
    } catch (e) {
      return href;
    }
  }
  function clean5(text) {
    return (text || "").replace(/\s+/g, " ").trim();
  }
  function fixUrls4(el, document2) {
    const all = el.matches && el.matches("a[href], img[src]") ? [el] : [];
    all.push(...el.querySelectorAll("a[href], img[src]"));
    all.forEach((n) => {
      if (n.tagName === "A") n.setAttribute("href", absUrl8(n.getAttribute("href"), document2));
      else n.setAttribute("src", absUrl8(n.getAttribute("src"), document2));
    });
    return el;
  }
  function headingFrom4(el, fallbackLevel, document2) {
    const level = /^H[1-6]$/.test(el.tagName) ? el.tagName.toLowerCase() : fallbackLevel;
    const h = document2.createElement(level);
    h.textContent = clean5(el.textContent);
    return h;
  }
  function defaultContent(node, document2) {
    const out = [];
    node.querySelectorAll(".cmp-teaser__title, .cmp-title__text, .cmp-text > *, .cmp-teaser__description > *").forEach((el) => {
      if (!clean5(el.textContent)) return;
      if (el.matches(".cmp-teaser__title, .cmp-title__text")) out.push(headingFrom4(el, "h2", document2));
      else out.push(fixUrls4(el, document2));
    });
    node.querySelectorAll(".cmp-teaser__action-link").forEach((a) => {
      const p = document2.createElement("p");
      const link = document2.createElement("a");
      link.href = absUrl8(a.getAttribute("href"), document2);
      link.textContent = clean5(a.textContent);
      p.append(link);
      out.push(p);
    });
    if (!out.length && clean5(node.textContent)) {
      const p = document2.createElement("p");
      p.textContent = clean5(node.textContent);
      out.push(p);
    }
    return out;
  }
  function descriptionNodes(dl, document2) {
    const desc = dl.querySelector(".cmp-download__description");
    if (!desc || !clean5(desc.textContent)) return [];
    const out = [];
    [...desc.children].forEach((child) => {
      if (!clean5(child.textContent)) return;
      if (/^H[1-6]$/.test(child.tagName)) {
        const p = document2.createElement("p");
        const strong = document2.createElement("strong");
        strong.textContent = clean5(child.textContent);
        p.append(strong);
        out.push(p);
      } else {
        out.push(fixUrls4(child, document2));
      }
    });
    if (!out.length) {
      const p = document2.createElement("p");
      p.textContent = clean5(desc.textContent);
      out.push(p);
    }
    return out;
  }
  function downloadRow(dl, document2) {
    const action = dl.querySelector("a.cmp-download__action");
    const titleLink = dl.querySelector(".cmp-download__title-link, .cmp-download__title a[href]");
    const actionText = clean5((dl.querySelector(".cmp-download__action-text") || {}).textContent);
    const description = descriptionNodes(dl, document2);
    let label;
    let linkText3 = clean5(titleLink && titleLink.textContent);
    if (description.length) {
      const cell = document2.createElement("div");
      cell.append(...description);
      label = cell;
      linkText3 = linkText3 || actionText;
    } else {
      label = actionText || clean5((dl.querySelector(".cmp-download__property--filename .cmp-download__property-content") || {}).textContent);
    }
    const href = titleLink && titleLink.getAttribute("href") || action && action.getAttribute("href");
    if (!label && !href) return null;
    let linkCell = "";
    if (href) {
      const p = document2.createElement("p");
      const a = document2.createElement("a");
      a.href = absUrl8(href, document2);
      a.textContent = linkText3 || "Download PDF";
      p.append(a);
      linkCell = p;
    }
    return [label || "", linkCell];
  }
  function downloadOnlyGrid(container) {
    if (!container || !container.classList || !container.classList.contains("container")) return null;
    const grid = container.querySelector(":scope > .cmp-container > .aem-Grid");
    if (!grid) return null;
    const kids = [...grid.children].filter((c) => clean5(c.textContent) || c.querySelector("a[href]"));
    return kids.length && kids.every((c) => c.matches(".download")) ? grid : null;
  }
  var MERGED_ATTR = "data-excat-downloads-merged";
  function siblingDownloadGrids(element) {
    const container = element.parentElement && element.parentElement.parentElement;
    if (!container || downloadOnlyGrid(container) !== element) return [element];
    const parent = container.parentElement;
    if (!parent) return [element];
    const siblings = [...parent.children].filter((c) => clean5(c.textContent) || c.querySelector("a[href], img"));
    const grids = siblings.map((c) => downloadOnlyGrid(c));
    if (siblings.length < 2 || grids.some((g) => !g)) return [element];
    return grids;
  }
  function parse10(element, { document: document2 }) {
    if (element.hasAttribute(MERGED_ATTR)) return;
    const grids = siblingDownloadGrids(element);
    if (grids.length > 1) {
      grids.slice(1).forEach((g) => {
        g.setAttribute(MERGED_ATTR, "");
        element.append(...g.children);
        const c = g.parentElement && g.parentElement.parentElement;
        if (c) c.remove();
      });
    }
    const children = [...element.children];
    if (!children.some((c) => c.matches(".download"))) {
      const nested = [...element.querySelectorAll(".download")].filter((d) => !d.closest(".slick-cloned") && !d.parentElement.closest(".download"));
      const rows2 = nested.map((d) => downloadRow(d.querySelector(".cmp-download") || d, document2)).filter(Boolean);
      if (rows2.length) {
        const grid = nested.some((d) => d.matches(".aig-annual-card, .halfwidth"));
        const block2 = WebImporter.Blocks.createBlock(document2, { name: grid ? "Downloads (grid)" : "Downloads", cells: rows2 });
        element.replaceWith(block2);
        return;
      }
    }
    const downloads = children.filter((c) => c.matches(".download"));
    if (!downloads.length) {
      element.replaceWith(...element.childNodes);
      return;
    }
    const isGrid = downloads.some((d) => d.classList.contains("halfwidth"));
    const name = isGrid ? "Downloads (grid)" : "Downloads";
    const output = [];
    let rows = [];
    const flush = () => {
      if (rows.length) {
        output.push(WebImporter.Blocks.createBlock(document2, { name, cells: rows }));
        rows = [];
      }
    };
    children.forEach((child) => {
      if (child.matches(".download")) {
        const dl = child.querySelector(".cmp-download") || child;
        const row = downloadRow(dl, document2);
        if (row) rows.push(row);
      } else {
        const content = defaultContent(child, document2);
        if (content.length) {
          flush();
          output.push(...content);
        }
      }
    });
    flush();
    const block = output.find((n) => n.tagName === "TABLE") || null;
    if (!block) {
      element.replaceWith(...element.childNodes);
      return;
    }
    element.replaceWith(...output);
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
      WebImporter.DOMUtils.remove(element, [
        ".experiencefragment:has(> .cmp-experiencefragment--story-sign-up-form)",
        "dialog:has(#page-dialog-newsroom-form)",
        '.button:has(> a[href="#page-dialog-newsroom-form"])'
      ]);
      if (element.querySelector(".container.article-2023")) {
        element.querySelectorAll(".videocomponent.hide").forEach((video) => {
          const container = video.parentElement && video.parentElement.closest(".container");
          video.remove();
          if (container && !(container.textContent || "").trim() && !container.querySelector("img, picture, video, iframe, embed, object, table, form")) {
            container.remove();
          }
        });
      }
      element.querySelectorAll(".cmp-separator").forEach((sep) => {
        const wrapper = sep.parentElement && sep.parentElement.classList.contains("separator") ? sep.parentElement : sep;
        wrapper.remove();
      });
      WebImporter.DOMUtils.remove(element, [
        ".why-aig-container .options.custom-select",
        ".aig-timeline .options:has(select.cmp-form-options__field--drop-down)"
      ]);
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
  var ARTICLE_CONTAINER = ".container.article-2023";
  var INNER_SECTION_STARTS = [".container.article-2023 .autopilot:has(> .aig-autopilot)"];
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
    return collectUnitsFrom([...parent.children], blockEls, out);
  }
  function collectUnitsFrom(children, blockEls, out) {
    children.forEach((child) => {
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
    const siblings = main.parentElement ? [...main.parentElement.children].filter((c) => c !== main && c.matches(ARTICLE_CONTAINER)) : [];
    if (siblings.length) collectUnitsFrom(siblings, blockEls, raw);
    const units = [];
    let lead = [];
    raw.forEach((u) => {
      if (!u.container && !u.headingOnly) {
        if (units.length) units[units.length - 1].els.push(...u.els);
        else lead.push(...u.els);
        return;
      }
      if (lead.length && u.els[0].matches(ARTICLE_CONTAINER)) {
        units.push({ els: lead, container: false, bg: "", headingOnly: false });
        lead = [];
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
    const innerStarts = [];
    INNER_SECTION_STARTS.forEach((sel) => {
      try {
        element.querySelectorAll(sel).forEach((el) => {
          let start = el;
          const prev = el.previousElementSibling;
          if (prev && !SKIP_TAGS.includes(prev.tagName) && isHeadingOnly(prev)) start = prev;
          if (start.parentElement && isInside(start.parentElement, blockEls)) return;
          if (units.some((u) => u.els[0] === start)) return;
          innerStarts.push(start);
        });
      } catch (e) {
      }
    });
    innerStarts.forEach((start) => {
      const hr = doc.createElement("hr");
      hr.setAttribute(AUTO_BREAK_ATTR, "");
      start.before(hr);
    });
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

  // tools/importer/import-accordion-detail.js
  var parsers = {
    "form": parse,
    "hero-fade": parse2,
    "breadcrumbs": parse3,
    "columns-quicklinks": parse4,
    "accordion": parse5,
    "columns-featured": parse6,
    "columns-media": parse7,
    "columns-text": parse8,
    "contact-card": parse9,
    "downloads": parse10
  };
  var PAGE_TEMPLATE = {
    "name": "accordion-detail",
    "description": "Claims guide / service detail page: breadcrumb, centered page title with intro text, document links and a stacked expandable accordion list; member variants add a fade hero with quick links, featured/video rows and carousels, claims contact cards, contact/locator forms and downloads",
    "urls": [
      "https://www.aig.com/home/about/aig-womens-open",
      "https://www.aig.com/home/claims/report-a-claim/casualty-multinational",
      "https://www.aig.com/home/claims/report-a-claim/lexington-natural-disaster",
      "https://www.aig.com/home/claims/report-a-claim/lexington-programs",
      "https://www.aig.com/home/claims/report-a-claim/workers-compensation-construction-risk",
      "https://www.aig.com/home/claims/workers-compensation-claims/alabama-workers-compensation",
      "https://www.aig.com/home/claims/workers-compensation-claims/alaska-workers-compensation",
      "https://www.aig.com/home/claims/workers-compensation-claims/arizona-workers-compensation",
      "https://www.aig.com/home/claims/workers-compensation-claims/arkansas-workers-compensation",
      "https://www.aig.com/home/claims/workers-compensation-claims/california-workers-compensation",
      "https://www.aig.com/home/claims/workers-compensation-claims/colorado-workers-compensation",
      "https://www.aig.com/home/claims/workers-compensation-claims/connecticut-workers-compensation",
      "https://www.aig.com/home/claims/workers-compensation-claims/delaware-workers-compensation",
      "https://www.aig.com/home/claims/workers-compensation-claims/district-of-columbia-workers-compensation",
      "https://www.aig.com/home/claims/workers-compensation-claims/florida-workers-compensation",
      "https://www.aig.com/home/claims/workers-compensation-claims/georgia-workers-compensation",
      "https://www.aig.com/home/claims/workers-compensation-claims/hawaii-workers-compensation",
      "https://www.aig.com/home/claims/workers-compensation-claims/idaho-workers-compensation",
      "https://www.aig.com/home/claims/workers-compensation-claims/illinois-workers-compensation",
      "https://www.aig.com/home/claims/workers-compensation-claims/indiana-workers-compensation",
      "https://www.aig.com/home/claims/workers-compensation-claims/iowa-workers-compensation",
      "https://www.aig.com/home/claims/workers-compensation-claims/kansas-workers-compensation",
      "https://www.aig.com/home/claims/workers-compensation-claims/kentucky-workers-compensation",
      "https://www.aig.com/home/claims/workers-compensation-claims/louisiana-workers-compensation",
      "https://www.aig.com/home/claims/workers-compensation-claims/maine-workers-compensation",
      "https://www.aig.com/home/claims/workers-compensation-claims/maryland-workers-compensation",
      "https://www.aig.com/home/claims/workers-compensation-claims/massachusetts-workers-compensation",
      "https://www.aig.com/home/claims/workers-compensation-claims/michigan-workers-compensation",
      "https://www.aig.com/home/claims/workers-compensation-claims/minnesota-workers-compensation",
      "https://www.aig.com/home/claims/workers-compensation-claims/mississippi-workers-compensation",
      "https://www.aig.com/home/claims/workers-compensation-claims/missouri-workers-compensation",
      "https://www.aig.com/home/claims/workers-compensation-claims/montana-workers-compensation",
      "https://www.aig.com/home/claims/workers-compensation-claims/nebraska-workers-compensation",
      "https://www.aig.com/home/claims/workers-compensation-claims/nevada-workers-compensation",
      "https://www.aig.com/home/claims/workers-compensation-claims/new-hampshire-workers-compensation",
      "https://www.aig.com/home/claims/workers-compensation-claims/new-jersey-workers-compensation",
      "https://www.aig.com/home/claims/workers-compensation-claims/new-mexico-workers-compensation",
      "https://www.aig.com/home/claims/workers-compensation-claims/new-york-workers-compensation",
      "https://www.aig.com/home/claims/workers-compensation-claims/north-carolina-workers-compensation",
      "https://www.aig.com/home/claims/workers-compensation-claims/north-dakota-workers-compensation",
      "https://www.aig.com/home/claims/workers-compensation-claims/ohio-workers-compensation",
      "https://www.aig.com/home/claims/workers-compensation-claims/oklahoma-workers-compensation",
      "https://www.aig.com/home/claims/workers-compensation-claims/oregon-workers-compensation",
      "https://www.aig.com/home/claims/workers-compensation-claims/pennsylvania-workers-compensation",
      "https://www.aig.com/home/claims/workers-compensation-claims/rhode-island-workers-compensation",
      "https://www.aig.com/home/claims/workers-compensation-claims/south-carolina-workers-compensation",
      "https://www.aig.com/home/claims/workers-compensation-claims/south-dakota-workers-compensation",
      "https://www.aig.com/home/claims/workers-compensation-claims/tennessee-workers-compensation",
      "https://www.aig.com/home/claims/workers-compensation-claims/texas-workers-compensation",
      "https://www.aig.com/home/claims/workers-compensation-claims/utah-workers-compensation",
      "https://www.aig.com/home/claims/workers-compensation-claims/vermont-workers-compensation",
      "https://www.aig.com/home/claims/workers-compensation-claims/virginia-workers-compensation",
      "https://www.aig.com/home/claims/workers-compensation-claims/washington-workers-compensation",
      "https://www.aig.com/home/claims/workers-compensation-claims/west-virginia-workers-compensation",
      "https://www.aig.com/home/claims/workers-compensation-claims/wisconsin-workers-compensation",
      "https://www.aig.com/home/claims/workers-compensation-claims/wyoming-workers-compensation",
      "https://www.aig.com/home/risk-solutions/business/casualty/environmental/environmental-response-services",
      "https://www.aig.com/home/risk-solutions/business/casualty/environmental/pollution-incident-and-environmental-response-program/pier-specialist-search",
      "https://www.aig.com/home/risk-solutions/business/casualty/safety-concierge-services",
      "https://www.aig.com/home/risk-solutions/business/cyber/affirmative-cyber",
      "https://www.aig.com/home/risk-solutions/business/cyber/cybermatics",
      "https://www.aig.com/home/risk-solutions/business/l/accident-and-health-licensing-and-appointment-requirements",
      "https://www.aig.com/home/risk-solutions/business/l/commercial-direct-bill-services",
      "https://www.aig.com/home/risk-solutions/business/l/helpful-resources",
      "https://www.aig.com/home/risk-solutions/business/l/surplus-lines-direct-bill-services",
      "https://www.aig.com/home/risk-solutions/individual/premier-client-solutions/make-a-payment"
    ],
    "sectionMode": "auto",
    "blocks": [
      {
        "name": "form",
        "instances": [
          "#main form.cmp-form:has(textarea):not(dialog *)"
        ]
      },
      {
        "name": "hero-fade",
        "instances": [
          "main .container.hero-banner-with-fade"
        ]
      },
      {
        "name": "breadcrumbs",
        "instances": [
          "main > .aem-Grid > .breadcrumb"
        ]
      },
      {
        "name": "columns-quicklinks",
        "instances": [
          "main .container.flexbox-container:has(> .cmp-container > .aem-Grid > .quick-links)"
        ]
      },
      {
        "name": "accordion",
        "instances": [
          "main .accordion.panelcontainer:not(.cmp-tabs *)"
        ]
      },
      {
        "name": "columns-featured",
        "instances": [
          "main .teaserflex.cta-with-image.lightblue"
        ]
      },
      {
        "name": "columns-media",
        "instances": [
          "main .container.aig-video.two-column-grid:has(.videocomponent)"
        ]
      },
      {
        "name": "columns-text",
        "instances": [
          "main .container.aig-carousel"
        ]
      },
      {
        "name": "contact-card",
        "instances": [
          "main .container.flexbox-container:has(> .cmp-container > .aem-Grid > .text.aig-claims-card)"
        ]
      },
      {
        "name": "downloads",
        "instances": [
          "main .aem-Grid:has(> .download):not(.accordion *):not(.container:has(~ .quick-links) *)"
        ]
      }
    ],
    "sections": [
      {
        "id": "1",
        "name": "Breadcrumb trail",
        "selector": [
          "main > .aem-Grid > .breadcrumb"
        ],
        "style": null,
        "blocks": [
          "breadcrumbs"
        ],
        "defaultContent": []
      },
      {
        "id": "2",
        "name": "Claims guide body (title, intro, document links, accordion)",
        "selector": [
          "main > .aem-Grid > .container.flexbox-container:has(.accordion.panelcontainer)"
        ],
        "style": null,
        "blocks": [
          "accordion"
        ],
        "defaultContent": [
          ".title .cmp-title__text",
          ".teaser.coreblueheading .cmp-teaser__description",
          ".text.doc_downloads",
          ".text:not(.doc_downloads)",
          ".teaserflex .cmp-teaser__description"
        ]
      },
      {
        "id": "3",
        "name": "Fade hero",
        "selector": [
          "main > .aem-Grid > .container.hero-banner-with-fade"
        ],
        "style": "dark",
        "blocks": [
          "hero-fade"
        ],
        "defaultContent": []
      },
      {
        "id": "4",
        "name": "Intro with quick-links sidebar",
        "selector": [
          "main > .aem-Grid > .container.flexbox-container:has(> .cmp-container > .aem-Grid > .quick-links)"
        ],
        "style": null,
        "blocks": [
          "columns-quicklinks"
        ],
        "defaultContent": []
      },
      {
        "id": "5",
        "name": "Featured image/text rows",
        "selector": [
          "main > .aem-Grid > .container.flexbox-container:has(> .cmp-container > .aem-Grid > .cta-with-image.lightblue)"
        ],
        "style": null,
        "blocks": [
          "columns-featured"
        ],
        "defaultContent": []
      },
      {
        "id": "6",
        "name": "Video/text rows",
        "selector": [
          "main > .aem-Grid > .container.aig-video.two-column-grid"
        ],
        "style": null,
        "blocks": [
          "columns-media"
        ],
        "defaultContent": []
      },
      {
        "id": "7",
        "name": "Timeline / article-card carousel",
        "selector": [
          "main > .aem-Grid > .container:has(.container.aig-carousel.aig-carousel-3-col)"
        ],
        "style": "centered",
        "blocks": [
          "columns-text"
        ],
        "defaultContent": [
          ".teaserflex.titlecenter .cmp-teaser__title"
        ]
      },
      {
        "id": "8",
        "name": "At a Glance carousel band",
        "selector": [
          "main > .aem-Grid > .container:has(> .cmp-container > .aem-Grid > .container.aig-carousel:not(.aig-carousel-3-col))"
        ],
        "style": "dark, centered",
        "blocks": [
          "columns-text"
        ],
        "defaultContent": [
          ".title.whiteheading .cmp-title__text"
        ]
      },
      {
        "id": "9",
        "name": "Claims contact card band",
        "selector": [
          "main > .aem-Grid > .container.aiglightgray:has(.aig-claims-card)"
        ],
        "style": "light",
        "blocks": [
          "contact-card"
        ],
        "defaultContent": []
      },
      {
        "id": "10",
        "name": "Light-grey band (locator form / text)",
        "selector": [
          "main > .aem-Grid > .container.aiglightgray:not(:has(.aig-claims-card))"
        ],
        "style": "light",
        "blocks": [],
        "defaultContent": [
          ".title .cmp-title__text",
          ".teaserflex .cmp-teaser__title",
          ".teaserflex .cmp-teaser__description",
          ".text .cmp-text"
        ]
      },
      {
        "id": "11",
        "name": "Contact form",
        "selector": [
          "main > .aem-Grid > .container.flexbox-container:has(form.cmp-form)"
        ],
        "style": null,
        "blocks": [],
        "defaultContent": []
      },
      {
        "id": "12",
        "name": "Downloadable materials",
        "selector": [
          "main > .aem-Grid > .container.aig-archive.aigpalegray"
        ],
        "style": "grey",
        "blocks": [
          "downloads"
        ],
        "defaultContent": [
          ".aig-archive .teaserflex .cmp-teaser__title"
        ]
      },
      {
        "id": "13",
        "name": "Text / centered CTA band",
        "selector": [
          "main > .aem-Grid > .container.flexbox-container:not(:has(.accordion, .quick-links, .cta-with-image, form, .aig-claims-card, .aig-carousel))"
        ],
        "style": null,
        "blocks": [],
        "defaultContent": [
          ".teaserflex .cmp-teaser__title",
          ".teaserflex .cmp-teaser__description",
          ".center_cta .cmp-teaser__action-link",
          ".button .cmp-button"
        ]
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
  var import_accordion_detail_default = {
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
  return __toCommonJS(import_accordion_detail_exports);
})();
