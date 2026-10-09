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

  // tools/importer/import-claim-contact.js
  var import_claim_contact_exports = {};
  __export(import_claim_contact_exports, {
    default: () => import_claim_contact_default
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
    const clean2 = (t) => (t || "").replace(/\s+/g, " ").trim();
    [...form.querySelectorAll(".cmp-text")].filter((c) => !c.querySelector(FIELD_SELECTOR) && !c.closest(".button, .recaptcha")).forEach((c) => {
      const text = clean2(c.textContent);
      if (!text) return;
      const bold = clean2([...c.querySelectorAll("b, strong")].map((b) => b.textContent).join(" "));
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

  // tools/importer/parsers/breadcrumbs.js
  function absUrl(href, document2) {
    try {
      const base = document2.location && document2.location.href !== "about:blank" ? document2.location.href : "https://www.aig.com/home";
      return new URL(href, base).href;
    } catch (e) {
      return href;
    }
  }
  function parse2(element, { document: document2 }) {
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
        a.href = absUrl(href, document2);
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

  // tools/importer/parsers/contact-card.js
  var ICONS = [
    { re: /telephone|phone/i, name: "phone" },
    { re: /fax/i, name: "fax" },
    { re: /e-?mail|envelope/i, name: "email" }
  ];
  var INLINE = ["A", "B", "STRONG", "EM", "I", "U", "SPAN", "FONT"];
  function absUrl2(href, document2) {
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
    return clean(range.cloneContents().textContent);
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
        while (j < kids.length && kids[j].nodeType === 3 && !clean(kids[j].textContent)) j += 1;
        if (j < kids.length && kids[j].nodeName === "BR") {
          while (j < kids.length && (kids[j].nodeName === "BR" || kids[j].nodeType === 3 && !clean(kids[j].textContent))) j += 1;
          groups.push([]);
          i = j - 1;
          continue;
        }
      }
      groups[groups.length - 1].push(n);
    }
    if (groups.length < 2) return [p];
    return groups.filter((g) => g.some((n) => clean(n.textContent) || n.querySelector && n.querySelector("img"))).map((g) => {
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
      if (!line.some((n) => clean(n.textContent) || n.querySelector && n.querySelector("img"))) return;
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
        img.setAttribute("src", absUrl2(img.getAttribute("src"), document2));
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
        value = absUrl2(href, document2);
      }
      [...a.attributes].forEach((attr) => a.removeAttribute(attr.name));
      a.setAttribute("href", value);
    });
    [...card.querySelectorAll("b, strong, em, i, u, span, font")].reverse().forEach((el) => {
      if (!clean(el.textContent.replace(/:(phone|fax|email):/g, "")) && !el.querySelector("img, a")) {
        unwrap(el);
      }
    });
    card.querySelectorAll("[style]").forEach((el) => el.removeAttribute("style"));
    [...card.querySelectorAll(INLINE.join(",").toLowerCase())].reverse().forEach((el) => {
      const isBlank = (n) => n && (n.nodeType === 3 && !clean(n.textContent) || n.nodeName === "BR");
      if (!clean(el.textContent) || !isBlank(el.lastChild)) return;
      const brs = [];
      while (isBlank(el.lastChild)) {
        if (el.lastChild.nodeName === "BR") brs.unshift(el.lastChild);
        el.lastChild.remove();
      }
      el.after(...brs);
    });
    [...card.querySelectorAll("a, b, strong, em, i, u")].reverse().forEach((el) => {
      const last = el.lastChild;
      if (last && last.nodeType === 3 && /\s$/.test(last.textContent) && clean(el.textContent)) {
        last.textContent = last.textContent.replace(/\s+$/, "");
        el.after(document2.createTextNode(" "));
      }
      const first = el.firstChild;
      if (first && first.nodeType === 3 && /^\s/.test(first.textContent) && clean(el.textContent)) {
        first.textContent = first.textContent.replace(/^\s+/, "");
        el.before(document2.createTextNode(" "));
      }
    });
    const parts = [];
    [...card.children].forEach((child) => {
      if (/^H[1-6]$/.test(child.tagName)) {
        const h = document2.createElement(child.tagName.toLowerCase());
        h.textContent = clean(child.textContent);
        if (h.textContent) parts.push(h);
        return;
      }
      const trimEdges = (el) => {
        const isBlank = (n) => n && (n.nodeType === 3 && !clean(n.textContent) || n.nodeName === "BR");
        while (isBlank(el.lastChild)) el.lastChild.remove();
        while (isBlank(el.firstChild)) el.firstChild.remove();
        [...el.querySelectorAll("b, strong")].forEach((b) => {
          while (isBlank(b.lastChild)) b.lastChild.remove();
        });
      };
      const pieces = child.tagName === "P" ? splitAtBlankLines(child, document2) : [child];
      pieces.forEach((piece) => {
        trimEdges(piece);
        if (!clean(piece.textContent) && !piece.querySelector("img")) return;
        (piece.tagName === "P" ? splitContactLines(piece, document2) : [piece]).forEach((p) => {
          trimEdges(p);
          if (clean(p.textContent) || p.querySelector("img")) parts.push(p);
        });
      });
    });
    if (!parts.length && clean(card.textContent)) {
      const p = document2.createElement("p");
      p.textContent = clean(card.textContent);
      parts.push(p);
    }
    return parts;
  }
  function parse3(element, { document: document2 }) {
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

  // tools/importer/import-claim-contact.js
  var parsers = {
    "form": parse,
    "breadcrumbs": parse2,
    "contact-card": parse3
  };
  var PAGE_TEMPLATE = {
    "name": "claim-contact",
    "description": "Centered page title over a gray band containing a single short contact card (phone, fax, email, mailing address)",
    "urls": [
      "https://www.aig.com/home/claims/report-a-claim/casualty-cat-excess",
      "https://www.aig.com/home/claims/report-a-claim/casualty-defense-base-act",
      "https://www.aig.com/home/claims/report-a-claim/casualty-environmental-pollution-toxic-tort",
      "https://www.aig.com/home/claims/report-a-claim/casualty-excess",
      "https://www.aig.com/home/claims/report-a-claim/casualty-excess-liability-catastrophic",
      "https://www.aig.com/home/claims/report-a-claim/casualty-healthcare-liability",
      "https://www.aig.com/home/claims/report-a-claim/casualty-toxic-tort-environmental-casualty-mass-tort",
      "https://www.aig.com/home/claims/report-a-claim/casualty-truck-insurance-group",
      "https://www.aig.com/home/claims/report-a-claim/financial-lines-bermuda",
      "https://www.aig.com/home/claims/report-a-claim/financial-lines-canada",
      "https://www.aig.com/home/claims/report-a-claim/financial-lines-executive-liability",
      "https://www.aig.com/home/claims/report-a-claim/global-risk-solutions",
      "https://www.aig.com/home/claims/report-a-claim/lexington-inland-marine",
      "https://www.aig.com/home/claims/report-a-claim/lexington-non-property-architects-and-engineers",
      "https://www.aig.com/home/claims/report-a-claim/lexington-non-property-employment-practices-and-management-liability",
      "https://www.aig.com/home/claims/report-a-claim/lexington-non-property-excess-general-liability",
      "https://www.aig.com/home/claims/report-a-claim/lexington-non-property-healthcare-liability",
      "https://www.aig.com/home/claims/report-a-claim/lexington-non-property-homeowner-catastrophe",
      "https://www.aig.com/home/claims/report-a-claim/lexington-non-property-homeowner-lexelite-preferred-concierge",
      "https://www.aig.com/home/claims/report-a-claim/lexington-non-property-homeowner-non-catastrophe",
      "https://www.aig.com/home/claims/report-a-claim/lexington-non-property-primary-general-liability",
      "https://www.aig.com/home/claims/report-a-claim/lexington-non-property-speciality-professional-liability",
      "https://www.aig.com/home/claims/report-a-claim/personal-lines-accident-and-health",
      "https://www.aig.com/home/claims/report-a-claim/personal-lines-accident-and-health-canada",
      "https://www.aig.com/home/claims/report-a-claim/personal-lines-accident-and-health-jockey-program",
      "https://www.aig.com/home/claims/report-a-claim/personal-lines-accident-and-health-submissions",
      "https://www.aig.com/home/claims/report-a-claim/personal-lines-private-client-group",
      "https://www.aig.com/home/claims/report-a-claim/personal-lines-travel-guard",
      "https://www.aig.com/home/claims/report-a-claim/property-commercial",
      "https://www.aig.com/home/claims/report-a-claim/property-commercial-non-catastrophe-and-catastrophe-london",
      "https://www.aig.com/home/claims/report-a-claim/specialty-energy",
      "https://www.aig.com/home/claims/report-a-claim/specialty-marine",
      "https://www.aig.com/home/claims/report-a-claim/specialty-political-risk",
      "https://www.aig.com/home/claims/report-a-claim/specialty-surety",
      "https://www.aig.com/home/claims/report-a-claim/specialty-trade-credit",
      "https://www.aig.com/home/claims/report-a-claim/workers-compensation-excess"
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
        "name": "breadcrumbs",
        "instances": [
          "main > .aem-Grid > .breadcrumb"
        ]
      },
      {
        "name": "contact-card",
        "instances": [
          "main .container.flexbox-container:has(> .cmp-container > .aem-Grid > .text.aig-claims-card)"
        ]
      }
    ],
    "sections": [
      {
        "id": "1",
        "name": "Title",
        "selector": [
          "main > .aem-Grid > .breadcrumb"
        ],
        "style": null,
        "blocks": [
          "breadcrumbs"
        ],
        "defaultContent": [
          "main > .aem-Grid > .title"
        ]
      },
      {
        "id": "2",
        "name": "Contact band",
        "selector": [
          "main > .aem-Grid > .container.aiglightgray:has(.aig-claims-card)"
        ],
        "style": "light",
        "blocks": [
          "contact-card"
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
  var import_claim_contact_default = {
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
  return __toCommonJS(import_claim_contact_exports);
})();
