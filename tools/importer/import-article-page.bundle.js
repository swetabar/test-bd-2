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

  // tools/importer/import-article-page.js
  var import_article_page_exports = {};
  __export(import_article_page_exports, {
    default: () => import_article_page_default
  });

  // tools/importer/parsers/hero-article.js
  var TIME_RE = /^\d{1,2}:\d{2}(:\d{2})?$/;
  var MEDIA_SEL = ".videocomponent, .image, .articleimage";
  function absUrl(href, document2) {
    if (!href) return href;
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
  function imageSrc(img, width) {
    const src = (img.getAttribute("src") || "").trim();
    const holder = img.closest("[data-cmp-src], [data-asset]");
    const tpl = holder && (holder.getAttribute("data-cmp-src") || "").trim();
    if (tpl) {
      if (!tpl.includes("{.width}")) return tpl;
      const widths = (holder.getAttribute("data-cmp-widths") || "").split(",").map((w2) => parseInt(w2, 10)).filter((w2) => w2 > 0).sort((a, b) => a - b);
      const w = widths.find((x) => x >= width) || widths[widths.length - 1];
      return tpl.replace("{.width}", w ? `.${w}` : "");
    }
    if (src && !/^(data|blob):/i.test(src)) return src;
    return holder && holder.getAttribute("data-asset") || "";
  }
  function buildImage(img, document2, width) {
    const src = imageSrc(img, width);
    if (!src) return null;
    const out = document2.createElement("img");
    out.setAttribute("src", absUrl(src, document2));
    out.setAttribute("alt", clean(img.getAttribute("alt")));
    return out;
  }
  function buildBreadcrumbs(crumb, document2) {
    const list = crumb && crumb.querySelector(".cmp-breadcrumb__list, ol, ul");
    if (!list) return null;
    const items = [...list.querySelectorAll("li")].filter((li, i, arr) => !arr.some((o) => o !== li && o.contains(li)));
    const ul = document2.createElement("ul");
    items.forEach((item, i) => {
      const nameEl = item.querySelector('[itemprop="name"]') || item;
      const text = clean(nameEl.textContent);
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
  function parse(element, { document: document2 }) {
    const crumb = element.matches(".breadcrumb") ? element : element.querySelector(".breadcrumb");
    let media = null;
    let consumed = null;
    if (element.matches(".breadcrumb")) {
      const next = element.nextElementSibling;
      if (next && (next.matches(MEDIA_SEL) || next.querySelector(":scope > .videocomponent, :scope > .cmp-image"))) {
        media = next;
        consumed = next;
      }
    } else {
      media = element.querySelector(".videocomponent:not(.hide)") || element.querySelector(".articleimage, .image");
    }
    let img = null;
    const content = [];
    const ul = buildBreadcrumbs(crumb, document2);
    if (ul) content.push(ul);
    if (media) {
      const video = media.matches(".videocomponent") ? media : media.querySelector(".videocomponent:not(.hide)");
      const scope = video || media;
      const posterImg = [...scope.querySelectorAll(".video_thumbnail img, .cmp-image img, img")].find((i) => !i.closest(".video-popup, dialog"));
      if (posterImg) img = buildImage(posterImg, document2, 1944);
      if (video) {
        const srcEl = video.querySelector("[data-src]");
        const href = srcEl && clean(srcEl.getAttribute("data-src"));
        if (href) {
          const p = document2.createElement("p");
          const a = document2.createElement("a");
          a.href = absUrl(href, document2);
          a.textContent = "Play Video";
          p.append(a);
          content.push(p);
          const con = video.querySelector(".video__container") || video.querySelector("[data-time], [data-duration]");
          const time = con ? clean(con.getAttribute("data-time")) : "";
          const dur = con ? clean(con.getAttribute("data-duration")) : "";
          const duration = TIME_RE.test(time) ? time : TIME_RE.test(dur) ? dur : "";
          if (duration) {
            const d = document2.createElement("p");
            d.textContent = duration;
            content.push(d);
          }
        }
      }
    }
    if (!img && !content.length) {
      element.replaceWith(...element.childNodes);
      return;
    }
    const cells = [];
    if (img) cells.push([img]);
    cells.push([content.length ? content : ""]);
    const block = WebImporter.Blocks.createBlock(document2, { name: "hero-article", cells });
    element.replaceWith(block);
    if (consumed && consumed.parentNode) consumed.remove();
  }

  // tools/importer/parsers/social-share.js
  var LABELS = { facebook: "Facebook", linkedin: "LinkedIn", x: "X", email: "Email" };
  function absUrl2(href, document2) {
    try {
      const base = document2.location && document2.location.href !== "about:blank" ? document2.location.href : "https://www.aig.com/home";
      return new URL(href, base).href;
    } catch (e) {
      return href;
    }
  }
  function networkOf(li) {
    const cls = ` ${(li.getAttribute("class") || "").toLowerCase()} `;
    if (/facebook|\bfb\b/.test(cls)) return "facebook";
    if (/linkedin/.test(cls)) return "linkedin";
    if (/twitter|\sx\s/.test(cls)) return "x";
    if (/e-?mail|\smail\s/.test(cls)) return "email";
    const a = li.querySelector("a[href]");
    const probe = `${a ? a.getAttribute("href") : ""} ${li.textContent || ""}`.toLowerCase();
    if (probe.includes("facebook.com")) return "facebook";
    if (probe.includes("linkedin.com")) return "linkedin";
    if (probe.includes("twitter.com") || probe.includes("x.com/")) return "x";
    if (probe.includes("mailto:") || /\bmail\b/.test(probe)) return "email";
    return null;
  }
  function parse2(element, { document: document2 }) {
    let items = [...element.querySelectorAll(".sharethis > ul > li")];
    if (!items.length) {
      items = [...element.querySelectorAll("li")].filter((li) => !li.closest(".email-modal, .emailbox"));
    }
    const ul = document2.createElement("ul");
    const seen = /* @__PURE__ */ new Set();
    items.forEach((item) => {
      const network = networkOf(item);
      if (!network || seen.has(network)) return;
      seen.add(network);
      const li = document2.createElement("li");
      const link = item.querySelector("a[href]");
      const href = link && (link.getAttribute("href") || "").trim();
      if (network !== "email" && href && /^(https?:)?\/\//i.test(href)) {
        const a = document2.createElement("a");
        a.href = absUrl2(href, document2);
        a.textContent = LABELS[network];
        li.append(a);
      } else {
        li.textContent = LABELS[network];
      }
      ul.append(li);
    });
    if (!ul.children.length) {
      element.replaceWith(...element.childNodes);
      return;
    }
    const block = WebImporter.Blocks.createBlock(document2, { name: "social-share", cells: [[ul]] });
    element.replaceWith(block);
  }

  // tools/importer/parsers/quote.js
  var DOUBLE_BR = /(?:\s*<br\s*\/?>\s*){2,}/i;
  function absUrl3(href, document2) {
    if (!href) return href;
    try {
      const base = document2.location && document2.location.href !== "about:blank" ? document2.location.href : "https://www.aig.com/home";
      return new URL(href, base).href;
    } catch (e) {
      return href;
    }
  }
  function clean2(text) {
    return (text || "").replace(/\u00a0/g, " ").replace(/\s+/g, " ").trim();
  }
  function imageSrc2(img, width) {
    const src = (img.getAttribute("src") || "").trim();
    const holder = img.closest("[data-cmp-src], [data-asset]");
    const tpl = holder && (holder.getAttribute("data-cmp-src") || "").trim();
    if (tpl) {
      if (!tpl.includes("{.width}")) return tpl;
      const widths = (holder.getAttribute("data-cmp-widths") || "").split(",").map((w2) => parseInt(w2, 10)).filter((w2) => w2 > 0).sort((a, b) => a - b);
      const w = widths.find((x) => x >= width) || widths[widths.length - 1];
      return tpl.replace("{.width}", w ? `.${w}` : "");
    }
    if (src && !/^(data|blob):/i.test(src)) return src;
    return holder && holder.getAttribute("data-asset") || "";
  }
  function segments(desc, document2) {
    const out = [];
    const blocks = [...desc.querySelectorAll(":scope > h1, :scope > h2, :scope > h3, :scope > h4, :scope > h5, :scope > h6, :scope > p, :scope > blockquote")];
    if (!blocks.length && clean2(desc.textContent)) blocks.push(desc);
    blocks.forEach((el) => {
      el.innerHTML.split(DOUBLE_BR).forEach((html) => {
        const holder = document2.createElement("div");
        holder.innerHTML = html;
        if (clean2(holder.textContent)) out.push({ holder, tag: el.tagName });
      });
    });
    return out;
  }
  function looksLikeAttribution(seg, isHeadingQuote) {
    const text = clean2(seg.holder.textContent);
    if (text.length > 160) return false;
    if (/^[—–-]/.test(text)) return true;
    if (/\s\|\s?|\|\s/.test(text)) return true;
    if (seg.holder.querySelector("b, strong")) return true;
    return isHeadingQuote && seg.tag === "P";
  }
  function attributionParagraph(seg, document2) {
    const p = document2.createElement("p");
    const bold = seg.holder.querySelector("b, strong");
    if (bold) {
      seg.holder.childNodes.forEach((node) => {
        const text2 = (node.textContent || "").replace(/\u00a0/g, " ");
        if (!text2.trim()) {
          if (text2 && p.childNodes.length) p.append(" ");
          return;
        }
        if (node.nodeType === 1 && /^(B|STRONG)$/.test(node.tagName)) {
          const strong = document2.createElement("strong");
          strong.textContent = clean2(text2);
          if (p.childNodes.length) p.append(" ");
          p.append(strong);
        } else {
          const lead = /^\s/.test(text2) && p.childNodes.length ? " " : "";
          p.append(`${lead}${clean2(text2)}`);
        }
      });
      p.normalize();
      return p;
    }
    const text = clean2(seg.holder.textContent);
    const bar = text.indexOf("|");
    if (bar > 0) {
      const strong = document2.createElement("strong");
      strong.textContent = text.slice(0, bar).trim();
      p.append(strong, ` | ${text.slice(bar + 1).trim()}`);
    } else {
      p.textContent = text;
    }
    return p;
  }
  function parse3(element, { document: document2 }) {
    const teaser = element.matches(".teaserflex, .teaser") ? element : element.querySelector(".teaserflex, .teaser");
    const imgEl = element.querySelector(".cmp-teaser__image img") || element.querySelector(".image .cmp-image img, .image img") || element.querySelector("img");
    const desc = teaser && (teaser.querySelector(".cmp-teaser__description") || teaser.querySelector(".cmp-teaser__content"));
    const segs = desc ? segments(desc, document2) : [];
    if (!segs.length) {
      element.replaceWith(...element.childNodes);
      return;
    }
    const isHeadingQuote = /^H[1-6]$/.test(segs[0].tag);
    let attribution = null;
    if (segs.length > 1 && looksLikeAttribution(segs[segs.length - 1], isHeadingQuote)) {
      attribution = attributionParagraph(segs.pop(), document2);
    }
    const quoteCell = segs.map((seg) => {
      const p = document2.createElement("p");
      p.textContent = clean2(seg.holder.textContent);
      return p;
    });
    let imageCell = "";
    if (imgEl) {
      const src = imageSrc2(imgEl, 768);
      if (src) {
        const img = document2.createElement("img");
        img.setAttribute("src", absUrl3(src, document2));
        img.setAttribute("alt", clean2(imgEl.getAttribute("alt")));
        imageCell = img;
      }
    }
    const cells = [[imageCell, quoteCell, attribution || ""]];
    const block = WebImporter.Blocks.createBlock(document2, { name: "quote", cells });
    element.replaceWith(block);
  }

  // tools/importer/parsers/cards-related.js
  function absUrl4(href, document2) {
    try {
      const base = document2.location && document2.location.href !== "about:blank" ? document2.location.href : "https://www.aig.com/home";
      return new URL(href, base).href;
    } catch (e) {
      return href;
    }
  }
  function parse4(element, { document: document2 }) {
    const label = element.querySelector(":scope > h2, :scope > h3, :scope > h4");
    let items = [...element.querySelectorAll(":scope > ul > li")];
    if (!items.length) items = [...element.querySelectorAll("li")];
    const cells = [];
    items.forEach((li) => {
      const cell = [];
      const links = [...li.querySelectorAll("a[href]")];
      const ctaLink = li.querySelector(".autopilot-cta a[href]") || links[links.length - 1];
      const titleEls = [...li.querySelectorAll(":scope > p, :scope > h2, :scope > h3, :scope > h4, :scope > div:not(.autopilot-cta)")].filter((el) => el.textContent.trim() && !(ctaLink && el.contains(ctaLink)));
      titleEls.forEach((el) => {
        const p = document2.createElement(/^H[1-6]$/.test(el.tagName) ? el.tagName.toLowerCase() : "p");
        p.textContent = el.textContent.replace(/\s+/g, " ").trim();
        cell.push(p);
      });
      if (ctaLink) {
        const a = document2.createElement("a");
        a.href = absUrl4(ctaLink.getAttribute("href"), document2);
        a.textContent = ctaLink.textContent.replace(/\s+/g, " ").trim() || "Learn More";
        const p = document2.createElement("p");
        p.append(a);
        cell.push(p);
      }
      if (cell.length) cells.push([cell]);
    });
    if (!cells.length) {
      element.replaceWith(...element.childNodes);
      return;
    }
    const block = WebImporter.Blocks.createBlock(document2, { name: "cards-related", cells });
    if (label && label.textContent.trim()) {
      const heading = document2.createElement(label.tagName.toLowerCase());
      heading.textContent = label.textContent.trim();
      element.replaceWith(heading, block);
    } else {
      element.replaceWith(block);
    }
  }

  // tools/importer/parsers/video.js
  function absUrl5(href, document2) {
    if (!href) return href;
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
  function fixUrls(el, document2) {
    const all = el.matches && el.matches("a[href], img[src]") ? [el] : [];
    all.push(...el.querySelectorAll("a[href], img[src]"));
    all.forEach((n) => {
      if (n.tagName === "A") n.setAttribute("href", absUrl5(n.getAttribute("href"), document2));
      else n.setAttribute("src", absUrl5(n.getAttribute("src"), document2));
    });
    el.querySelectorAll(".custom-icons").forEach((s) => s.remove());
    return el;
  }
  function captionFrom(teaser, document2) {
    const out = [];
    const content = teaser.querySelector(".cmp-teaser__content") || teaser;
    const title = content.querySelector(".cmp-teaser__title");
    if (title && clean3(title.textContent)) {
      const level = /^H[1-6]$/.test(title.tagName) ? title.tagName.toLowerCase() : "h3";
      const h = document2.createElement(level);
      h.textContent = clean3(title.textContent);
      out.push(h);
    }
    const desc = content.querySelector(".cmp-teaser__description");
    if (desc) {
      const parts = [...desc.querySelectorAll(":scope > p, :scope > h2, :scope > h3, :scope > h4, :scope > ul, :scope > ol")].filter((el) => clean3(el.textContent));
      if (parts.length) parts.forEach((el) => out.push(fixUrls(el, document2)));
      else if (clean3(desc.textContent)) {
        const p = document2.createElement("p");
        p.textContent = clean3(desc.textContent);
        out.push(p);
      }
    }
    content.querySelectorAll(".cmp-teaser__action-link").forEach((a) => {
      const p = document2.createElement("p");
      const link = document2.createElement("a");
      link.href = absUrl5(a.getAttribute("href"), document2);
      const clone = a.cloneNode(true);
      clone.querySelectorAll(".custom-icons").forEach((s) => s.remove());
      link.textContent = clean3(clone.textContent);
      p.append(link);
      out.push(p);
    });
    return out;
  }
  function parse5(element, { document: document2 }) {
    const videos = [...element.querySelectorAll(".videocomponent")].filter((v) => !v.closest('dialog, .video-popup, [id^="page-dialog-video"]'));
    const cells = [];
    videos.forEach((video) => {
      const cell = [];
      const poster = video.querySelector(".video_thumbnail img, .video__container img, img");
      if (poster) cell.push(fixUrls(poster, document2));
      const srcEl = video.querySelector("[data-src], video source[src], video[src], iframe[src]");
      const href = srcEl && (srcEl.getAttribute("data-src") || srcEl.getAttribute("src"));
      if (href) {
        const p = document2.createElement("p");
        const a = document2.createElement("a");
        a.href = absUrl5(href, document2);
        a.textContent = "Play Video";
        p.append(a);
        cell.push(p);
      }
      const timeEl = video.querySelector("[data-time]");
      let time = timeEl && clean3(timeEl.getAttribute("data-time"));
      if (!time) {
        const durEl = video.querySelector("[data-duration]");
        const dur = durEl && clean3(durEl.getAttribute("data-duration"));
        if (dur && /^\d{1,2}:\d{2}(:\d{2})?$/.test(dur)) time = dur;
      }
      if (time) {
        const p = document2.createElement("p");
        p.textContent = time;
        cell.push(p);
      }
      let sib = video.nextElementSibling;
      while (sib && !sib.matches(".videocomponent")) {
        if (sib.matches(".teaser, .teaserflex, .teaser2023, .text")) {
          if (sib.matches(".text")) {
            sib.querySelectorAll(".cmp-text > *").forEach((el) => {
              if (clean3(el.textContent)) cell.push(fixUrls(el, document2));
            });
          } else {
            cell.push(...captionFrom(sib, document2));
          }
        }
        sib = sib.nextElementSibling;
      }
      if (!href && !poster) return;
      cells.push([cell]);
    });
    if (!cells.length) {
      element.replaceWith(...element.childNodes);
      return;
    }
    const block = WebImporter.Blocks.createBlock(document2, { name: "video", cells });
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

  // tools/importer/import-article-page.js
  var parsers = {
    "hero-article": parse,
    "social-share": parse2,
    "quote": parse3,
    "cards-related": parse4,
    "video": parse5
  };
  var PAGE_TEMPLATE = {
    "name": "article-page",
    "description": "Story/article layout with full-width image, headline, date and share links, long rich-text body and related-content cards; also listing-style pages with tabs and profile cards",
    "urls": [
      "https://www.aig.com/home/investor-relations/aig-investor-day-2025",
      "https://www.aig.com/home/newsroom/stories/2024-aig-womens-open-wins-the-lpga-s-gold-driver-award",
      "https://www.aig.com/home/newsroom/stories/a-week-to-remember-2026-aig-womens-open",
      "https://www.aig.com/home/newsroom/stories/aig-achieves-financial-strength-rating-upgrades-from-s-and-p-global-and-moody-s",
      "https://www.aig.com/home/newsroom/stories/aig-becomes-strategic-investor-and-global-partner-of-the-salford-city-football-club",
      "https://www.aig.com/home/newsroom/stories/aig-brings-women-and-business-leaders-together-through-golf",
      "https://www.aig.com/home/newsroom/stories/aig-colleagues-share-how-they-meet-the-moment--on-and-off-the-golf-course",
      "https://www.aig.com/home/newsroom/stories/aig-deepens-long-term-commitment-to-salford-city",
      "https://www.aig.com/home/newsroom/stories/aig-energy-teams-expand-borregaard-portfolio",
      "https://www.aig.com/home/newsroom/stories/aig-investor-day-2025",
      "https://www.aig.com/home/newsroom/stories/aig-is-honored-as-a-top-early-career-employer",
      "https://www.aig.com/home/newsroom/stories/aig-is-making-it-easier-for-brokers-and-clients-to-do-business-with-us",
      "https://www.aig.com/home/newsroom/stories/aig-is-supporting-the-health-and-well-being-of-customers-through-aig-virtual-care",
      "https://www.aig.com/home/newsroom/stories/aig-leaders-discuss-gen-ai-and-atlanta-innovation-hub",
      "https://www.aig.com/home/newsroom/stories/aig-leaders-tee-up-lessons-from-golf-course",
      "https://www.aig.com/home/newsroom/stories/aig-raises-the-standard-in-women-s-golf",
      "https://www.aig.com/home/newsroom/stories/aig-s-early-career-colleagues-give-back",
      "https://www.aig.com/home/newsroom/stories/aig-suspends-pac-activity",
      "https://www.aig.com/home/newsroom/stories/aig-unprecedented-turnaround",
      "https://www.aig.com/home/newsroom/stories/an-aig-leaders-commitment-to-community-recovery",
      "https://www.aig.com/home/newsroom/stories/building-resilience-in-a-rapidly-changing-landscape",
      "https://www.aig.com/home/newsroom/stories/building-skills-for-the-future",
      "https://www.aig.com/home/newsroom/stories/colleague-spotlight--vanessa-gilmartin",
      "https://www.aig.com/home/newsroom/stories/como-aig-iberia-esta-ayudando-a-las-pequenas-y-medianas-empresas-en-la-gestion-de-sus-riesgos",
      "https://www.aig.com/home/newsroom/stories/data-centers-aig-powering-risk-solutions-in-the-ai-boom",
      "https://www.aig.com/home/newsroom/stories/delivering-for-our-clients-when-they-need-us-most",
      "https://www.aig.com/home/newsroom/stories/empowering-the-leaders-of-tomorrow",
      "https://www.aig.com/home/newsroom/stories/for-the-second-year-in-a-row-aig-womens-open-wins-the-lpgas-gold-driver-award",
      "https://www.aig.com/home/newsroom/stories/forging-connections-for-the-next-generation",
      "https://www.aig.com/home/newsroom/stories/georgia-hall-reflects-on-aig-womens-open-progress",
      "https://www.aig.com/home/newsroom/stories/get-with-the-program",
      "https://www.aig.com/home/newsroom/stories/helping-companies-confidently-manage-cross-border-risks",
      "https://www.aig.com/home/newsroom/stories/helping-small-and-medium-sized-enterprises-realize-their-full-potential",
      "https://www.aig.com/home/newsroom/stories/how-aig-and-talbot-join-forces-to-balance-risk",
      "https://www.aig.com/home/newsroom/stories/how-aig-chairman-and-ceo-peter-zaffino-and-aig-global-ambassador",
      "https://www.aig.com/home/newsroom/stories/how-aig-empowers-multinational-clients-to-stay-ahead-of-the-game",
      "https://www.aig.com/home/newsroom/stories/how-aig-helped-umicore-manage-the-risks-of-growing-its-business",
      "https://www.aig.com/home/newsroom/stories/how-aig-is-an-ally-to-brokers-and-clients",
      "https://www.aig.com/home/newsroom/stories/how-veterans-apply-their-valuable-skills-at-aig",
      "https://www.aig.com/home/newsroom/stories/inspiring-the-next-generation-of-talent",
      "https://www.aig.com/home/newsroom/stories/keys-to-managing-the-risks-of-a-global-business-japanese",
      "https://www.aig.com/home/newsroom/stories/meeting-the-moment",
      "https://www.aig.com/home/newsroom/stories/our-summer-interns-reflect-on-the-programs-many-benefits",
      "https://www.aig.com/home/newsroom/stories/partnering-with-our-clients-and-brokers-to-navigate-evolving-risks-with-confidence",
      "https://www.aig.com/home/newsroom/stories/peter-zaffino-talks-with-nbc-about-lpgas-recognition-of-aig-womens-open",
      "https://www.aig.com/home/newsroom/stories/risks-automakers-face-as-they-reimagine-their-business",
      "https://www.aig.com/home/newsroom/stories/shaping-aig-s-future-leaders",
      "https://www.aig.com/home/newsroom/stories/taking-professional-womens-golf-to-new-heights",
      "https://www.aig.com/home/newsroom/stories/unlocking-tomorrows-opportunities-at-the-aig-client-forum-in-london",
      "https://www.aig.com/home/newsroom/stories/what-allyship-means-to-georgia-hall",
      "https://www.aig.com/home/newsroom/stories/what-it-takes-to-be-a-long-term-insurance-partner",
      "https://www.aig.com/home/newsroom/stories/working-to-resolve-your-claims-more-quickly-and-efficiently"
    ],
    "sectionMode": "auto",
    "blocks": [
      {
        "name": "hero-article",
        "instances": [
          "main > .aem-Grid > .container:has(> .cmp-container > .aem-Grid > .breadcrumb)",
          "main > .aem-Grid > .breadcrumb"
        ]
      },
      {
        "name": "social-share",
        "instances": [
          ".container.article-2023 .sharing"
        ]
      },
      {
        "name": "quote",
        "instances": [
          ".container.article-2023 .teaserflex.cta-with-image",
          ".container.article-2023 .container:has(> .cmp-container > .aem-Grid > .image + .teaserflex)"
        ]
      },
      {
        "name": "cards-related",
        "instances": [
          ".container.article-2023 .aig-autopilot"
        ]
      },
      {
        "name": "video",
        "instances": [
          "main .container.aig-video.aig-video-vertical"
        ]
      }
    ],
    "sections": [
      {
        "id": "1",
        "name": "Article hero (breadcrumb + full-width image / video poster)",
        "selector": [
          "main > .aem-Grid > .container:has(> .cmp-container > .aem-Grid > .breadcrumb)",
          "main > .aem-Grid > .breadcrumb"
        ],
        "style": null,
        "blocks": [
          "hero-article"
        ],
        "defaultContent": []
      },
      {
        "name": "Article body (headline, meta line, share icons, body text, images, pull quotes)",
        "id": "2",
        "selector": [
          ".container.article-2023",
          "main > .aem-Grid > .container:has(.container.aig-video)"
        ],
        "style": null,
        "blocks": [
          "social-share",
          "quote",
          "video"
        ],
        "defaultContent": [
          ".aigarticleheader .article-header h1",
          ".aigarticleheader .article-header h2",
          ".aigarticleheader .story_author_date",
          ".article-2023 .text .cmp-text",
          ".article-2023 .image",
          ".article-2023 .text.paleblue .cmp-text"
        ]
      },
      {
        "id": "3",
        "name": "Related content and disclaimer",
        "selector": [
          ".container.article-2023 .autopilot:has(> .aig-autopilot)"
        ],
        "style": null,
        "blocks": [
          "cards-related"
        ],
        "defaultContent": [
          ".aig-autopilot > h3",
          ".cmp-experiencefragment--article-disclaimer .cmp-text",
          ".article-2023 .autopilot ~ .text .cmp-text"
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
  var import_article_page_default = {
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
  return __toCommonJS(import_article_page_exports);
})();
