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

  // tools/importer/parsers/accordion-image-panels.js
  var clean = (t) => (t || "").replace(/\s+/g, " ").trim();
  function makeLink(document, a) {
    const link = document.createElement("a");
    link.href = a.getAttribute("href") || "";
    link.textContent = clean(a.textContent);
    return link;
  }
  function para(document, child) {
    const p = document.createElement("p");
    p.append(child);
    return p;
  }
  function heading(document, tag, text) {
    const h = document.createElement(tag);
    h.textContent = text;
    return h;
  }
  function imgFrom(document, source) {
    var _a, _b;
    if (!source) return null;
    let src = source.getAttribute("src") || source.getAttribute("data-src") || "";
    if (!src) {
      const srcset = (_b = (_a = source.closest("picture")) == null ? void 0 : _a.querySelector("source[srcset]")) == null ? void 0 : _b.getAttribute("srcset");
      if (srcset) src = srcset.split(",")[0].trim().split(/\s+/)[0];
    }
    if (!src) return null;
    const img = document.createElement("img");
    img.src = src;
    img.alt = source.getAttribute("alt") || "";
    return img;
  }
  function buildTeaser(document, panel) {
    const cell = [];
    const actions = panel.querySelector(".gnp-c-vertical-tabs__actions") || panel;
    const bg = imgFrom(document, actions.querySelector("picture.gnp-c-vertical-tabs__picture img, :scope > picture img"));
    if (bg) cell.push(para(document, bg));
    const head = actions.querySelector(".gnp-c-vertical-tabs__head") || actions;
    const titleEl = head.querySelector("h2, h1, .gnp-c-vertical-tabs__title");
    const titleText = clean(titleEl == null ? void 0 : titleEl.textContent);
    if (titleText) {
      cell.push(heading(document, "h2", titleText));
    } else {
      const titleImg = imgFrom(document, head.querySelector("img"));
      if (titleImg) cell.push(para(document, titleImg));
    }
    const topCta = actions.querySelector(".gnp-c-vertical-tabs__top-element a[href]");
    if (topCta && clean(topCta.textContent)) cell.push(para(document, makeLink(document, topCta)));
    const subtitle = actions.querySelector("h3.gnp-c-vertical-tabs__subtitle, .gnp-c-vertical-tabs__bottom-element h3");
    if (clean(subtitle == null ? void 0 : subtitle.textContent)) cell.push(heading(document, "h3", clean(subtitle.textContent)));
    const lead = actions.querySelector("p.gnp-c-vertical-tabs__lead, .gnp-c-vertical-tabs__box p");
    if (clean(lead == null ? void 0 : lead.textContent)) {
      const p = document.createElement("p");
      p.textContent = clean(lead.textContent);
      cell.push(p);
    }
    const cta = actions.querySelector(".gnp-c-vertical-tabs__box a[href], .gnp-c-vertical-tabs__bottom-element a[href]");
    if (cta && clean(cta.textContent)) cell.push(para(document, makeLink(document, cta)));
    return cell;
  }
  function buildList(document, ul) {
    const list = document.createElement("ul");
    ul.querySelectorAll(":scope > li").forEach((li) => {
      var _a;
      const a = li.querySelector("a[href]");
      if (!a) return;
      const item = document.createElement("li");
      item.append(makeLink(document, a));
      const desc = clean((_a = li.querySelector(".gnp-c-tooltip__bullet")) == null ? void 0 : _a.textContent);
      if (desc) item.append(document.createTextNode(` ${desc}`));
      list.append(item);
    });
    return list.children.length ? list : null;
  }
  function buildDetail(document, panel) {
    const cell = [];
    const root = panel.querySelector(".gnp-c-vertical-tabs__down-content .gnp-c-box-content") || panel.querySelector(".gnp-c-vertical-tabs__down-content");
    if (!root) return cell;
    const nodes = root.querySelectorAll(
      ".gnp-c-rich-text > h2, .gnp-c-rich-text > h3, .gnp-c-rich-text > h4, .gnp-c-rich-text > p, ul.gnp-c-list, .gnp-c-slider-img, .gnp-c-box-content__control, footer"
    );
    nodes.forEach((node) => {
      const tag = node.tagName.toLowerCase();
      if (/^h[2-4]$/.test(tag)) {
        const text = clean(node.textContent);
        if (text) cell.push(heading(document, tag, text));
      } else if (tag === "p") {
        const text = clean(node.textContent);
        if (text) {
          const p = document.createElement("p");
          p.textContent = text;
          cell.push(p);
        }
      } else if (tag === "ul") {
        const list = buildList(document, node);
        if (list) cell.push(list);
      } else if (node.classList.contains("gnp-c-slider-img")) {
        node.querySelectorAll("figure:not(.swiper-slide-duplicate) img, .swiper-slide:not(.swiper-slide-duplicate) img").forEach((img) => {
          const out = imgFrom(document, img);
          if (out && !cell.some((c) => {
            var _a;
            return (_a = c.querySelector) == null ? void 0 : _a.call(c, `img[src="${out.getAttribute("src")}"]`);
          })) cell.push(para(document, out));
        });
      } else {
        node.querySelectorAll("a[href]").forEach((a) => {
          if (clean(a.textContent)) cell.push(para(document, makeLink(document, a)));
        });
      }
    });
    return cell;
  }
  function parse(element, { document }) {
    let panels = [...element.querySelectorAll("ul.gnp-c-vertical-tabs > li.gnp-c-vertical-tabs__item")];
    if (!panels.length) panels = [...element.querySelectorAll(".gnp-c-vertical-tabs__item")];
    panels = panels.filter((p) => !p.classList.contains("swiper-slide-duplicate"));
    if (!panels.length) {
      element.replaceWith(...element.childNodes);
      return;
    }
    const cells = [];
    panels.forEach((panel) => {
      const teaser = buildTeaser(document, panel);
      const detail = buildDetail(document, panel);
      if (!teaser.length && !detail.length) return;
      cells.push([teaser, detail.length ? detail : ""]);
    });
    const block = WebImporter.Blocks.createBlock(document, { name: "accordion-image-panels", cells });
    element.replaceWith(block);
  }

  // tools/importer/parsers/carousel-news-ticker.js
  function parse2(element, { document }) {
    const label = element.querySelector("a.gnp-news__title, .gnp-news__content > a:not(.gnp-news__link)");
    let slides = [...element.querySelectorAll("a.gnp-news__link")];
    if (!slides.length) {
      slides = [...element.querySelectorAll(".swiper-wrapper a, .gnp-news__wrapper a")];
    }
    const originals = slides.filter((a) => !a.classList.contains("swiper-slide-duplicate"));
    const ordered = [...originals, ...slides.filter((a) => a.classList.contains("swiper-slide-duplicate"))];
    const seen = /* @__PURE__ */ new Set();
    const headlines = [];
    ordered.forEach((a) => {
      const key = `${a.getAttribute("href") || ""}|${a.textContent.trim()}`;
      if (!a.textContent.trim() || seen.has(key)) return;
      seen.add(key);
      headlines.push(a);
    });
    headlines.sort((a, b) => {
      const pos = a.compareDocumentPosition(b);
      return pos & 4 ? -1 : pos & 2 ? 1 : 0;
    });
    if (!label && !headlines.length) {
      element.replaceWith(...element.childNodes);
      return;
    }
    const cells = [];
    if (label) {
      const labelLink = document.createElement("a");
      labelLink.href = label.getAttribute("href") || "/noticias";
      labelLink.textContent = label.textContent.trim();
      cells.push([labelLink]);
    }
    headlines.forEach((a) => {
      const link = document.createElement("a");
      link.href = a.getAttribute("href");
      link.textContent = a.textContent.trim();
      cells.push([link]);
    });
    const block = WebImporter.Blocks.createBlock(document, { name: "carousel-news-ticker", cells });
    element.replaceWith(block);
  }

  // tools/importer/transformers/gnp-cleanup.js
  var TransformHook = { beforeTransform: "beforeTransform", afterTransform: "afterTransform" };
  function transform(hookName, element, payload) {
    if (hookName === TransformHook.beforeTransform) {
      WebImporter.DOMUtils.remove(element, [
        ".grecaptcha-badge",
        "#gnp_search_id_containerSearch"
      ]);
    }
    if (hookName === TransformHook.afterTransform) {
      WebImporter.DOMUtils.remove(element, [
        ".gnp-cintillo",
        ".cmp-experiencefragment--header",
        "header.gnp-header",
        ".cmp-experiencefragment--footer",
        "footer.gnp-footer"
      ]);
      element.querySelectorAll(".experiencefragment").forEach((el) => {
        if (!el.textContent.trim() && !el.querySelector("img, picture")) el.remove();
      });
      WebImporter.DOMUtils.remove(element, [
        "#destination_publishing_iframe_gnp_0",
        'iframe[src*="doubleclick.net"]',
        '[id^="batBeacon"]',
        "img.ywa-10000",
        'iframe[title="archetype"]'
      ]);
      element.querySelectorAll("p").forEach((p) => {
        if (/^Portal Corporativo Version:/i.test(p.textContent.trim())) {
          const parent = p.parentElement;
          p.remove();
          if (parent && parent !== element && !parent.textContent.trim() && !parent.children.length) parent.remove();
        }
      });
      WebImporter.DOMUtils.remove(element, ["iframe", "link", "noscript", "script", "style", "textarea"]);
    }
  }

  // tools/importer/import-home.js
  var parsers = {
    "accordion-image-panels": parse,
    "carousel-news-ticker": parse2
  };
  var PAGE_TEMPLATE = {
    name: "home",
    description: "GNP homepage: product-category image panels (accordion) and rotating news ticker",
    urls: [
      "https://www.gnp.com.mx"
    ],
    blocks: [
      {
        name: "accordion-image-panels",
        instances: [".gnppersianasaccordion"]
      },
      {
        name: "carousel-news-ticker",
        instances: [".gnpnoticias"]
      }
    ],
    sections: [
      {
        id: "rc2",
        name: "main-content",
        selector: [".responsivegrid.aem-GridColumn--default--10.aem-GridColumn--offset--default--1"],
        style: null,
        blocks: ["accordion-image-panels", "carousel-news-ticker"],
        defaultContent: []
      }
    ]
  };
  var transformers = [
    transform
  ];
  function executeTransformers(hookName, element, payload) {
    const enhancedPayload = __spreadProps(__spreadValues({}, payload), {
      template: PAGE_TEMPLATE
    });
    transformers.forEach((transformerFn) => {
      try {
        transformerFn.call(null, hookName, element, enhancedPayload);
      } catch (e) {
        console.error(`Transformer failed at ${hookName}:`, e);
      }
    });
  }
  function findBlocksOnPage(document, template) {
    const pageBlocks = [];
    template.blocks.forEach((blockDef) => {
      blockDef.instances.forEach((selector) => {
        const elements = document.querySelectorAll(selector);
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
      const { document, url, params } = payload;
      const main = document.body;
      executeTransformers("beforeTransform", main, payload);
      const pageBlocks = findBlocksOnPage(document, PAGE_TEMPLATE);
      pageBlocks.forEach((block) => {
        if (!block.element.parentNode) return;
        const parser = parsers[block.name];
        if (parser) {
          try {
            parser(block.element, { document, url, params });
          } catch (e) {
            console.error(`Failed to parse ${block.name} (${block.selector}):`, e);
          }
        } else {
          console.warn(`No parser found for block: ${block.name}`);
        }
      });
      executeTransformers("afterTransform", main, payload);
      const hr = document.createElement("hr");
      main.appendChild(hr);
      WebImporter.rules.createMetadata(main, document);
      WebImporter.rules.transformBackgroundImages(main, document);
      WebImporter.rules.adjustImageUrls(main, url, params.originalURL);
      const rawPath = new URL(params.originalURL).pathname.replace(/\/$/, "").replace(/\.html?$/, "");
      const path = WebImporter.FileUtils.sanitizePath(rawPath === "" ? "/index" : rawPath);
      return [{
        element: main,
        path,
        report: {
          title: document.title,
          template: PAGE_TEMPLATE.name,
          blocks: pageBlocks.map((b) => b.name)
        }
      }];
    }
  };
  return __toCommonJS(import_home_exports);
})();
