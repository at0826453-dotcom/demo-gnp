/* eslint-disable */
/* global WebImporter */

/**
 * Parser for accordion-image-panels. Base: accordion.
 * Source: https://www.gnp.com.mx (instance: .gnppersianasaccordion)
 * Generated: 2026-10-07
 *
 * Output: one row per panel, 2 cells.
 *   cell 1 (teaser): background image, title (h2) or title image, optional top
 *                    CTA, subtitle (h3), lead paragraph, primary CTA
 *   cell 2 (detail): intro h2 + p, h3 group headings, ul of product links
 *                    (link followed by tooltip description), slider images,
 *                    in-column/footer CTAs. Empty when the panel has no detail.
 *
 * Validated selectors (source.html):
 *   ul.gnp-c-vertical-tabs > li.gnp-c-vertical-tabs__item   -> panels (5)
 *   .gnp-c-vertical-tabs__actions picture img               -> background image
 *   .gnp-c-vertical-tabs__head h2.gnp-c-vertical-tabs__title -> title
 *   .gnp-c-vertical-tabs__top-element a                     -> optional top CTA
 *   h3.gnp-c-vertical-tabs__subtitle                        -> subtitle
 *   p.gnp-c-vertical-tabs__lead                             -> lead
 *   .gnp-c-vertical-tabs__box a                             -> primary CTA
 *   .gnp-c-vertical-tabs__down-content .gnp-c-box-content   -> detail root
 *     .gnp-c-rich-text > h2/h3/p, ul.gnp-c-list > li (a + .gnp-c-tooltip__bullet),
 *     .gnp-c-slider-img img, .gnp-c-box-content__control a, footer a
 */

const clean = (t) => (t || '').replace(/\s+/g, ' ').trim();

function makeLink(document, a) {
  const link = document.createElement('a');
  link.href = a.getAttribute('href') || '';
  link.textContent = clean(a.textContent);
  return link;
}

function para(document, child) {
  const p = document.createElement('p');
  p.append(child);
  return p;
}

function heading(document, tag, text) {
  const h = document.createElement(tag);
  h.textContent = text;
  return h;
}

function imgFrom(document, source) {
  if (!source) return null;
  let src = source.getAttribute('src') || source.getAttribute('data-src') || '';
  if (!src) {
    const srcset = source.closest('picture')?.querySelector('source[srcset]')?.getAttribute('srcset');
    if (srcset) src = srcset.split(',')[0].trim().split(/\s+/)[0];
  }
  if (!src) return null;
  const img = document.createElement('img');
  img.src = src;
  img.alt = source.getAttribute('alt') || '';
  return img;
}

function buildTeaser(document, panel) {
  const cell = [];
  const actions = panel.querySelector('.gnp-c-vertical-tabs__actions') || panel;

  // Background image
  const bg = imgFrom(document, actions.querySelector('picture.gnp-c-vertical-tabs__picture img, :scope > picture img'));
  if (bg) cell.push(para(document, bg));

  // Title: heading text, or a title image when the heading is empty
  const head = actions.querySelector('.gnp-c-vertical-tabs__head') || actions;
  const titleEl = head.querySelector('h2, h1, .gnp-c-vertical-tabs__title');
  const titleText = clean(titleEl?.textContent);
  if (titleText) {
    cell.push(heading(document, 'h2', titleText));
  } else {
    const titleImg = imgFrom(document, head.querySelector('img'));
    if (titleImg) cell.push(para(document, titleImg));
  }

  // Optional top CTA ("Cotiza tu seguro")
  const topCta = actions.querySelector('.gnp-c-vertical-tabs__top-element a[href]');
  if (topCta && clean(topCta.textContent)) cell.push(para(document, makeLink(document, topCta)));

  // Subtitle, lead, primary CTA
  const subtitle = actions.querySelector('h3.gnp-c-vertical-tabs__subtitle, .gnp-c-vertical-tabs__bottom-element h3');
  if (clean(subtitle?.textContent)) cell.push(heading(document, 'h3', clean(subtitle.textContent)));

  const lead = actions.querySelector('p.gnp-c-vertical-tabs__lead, .gnp-c-vertical-tabs__box p');
  if (clean(lead?.textContent)) {
    const p = document.createElement('p');
    p.textContent = clean(lead.textContent);
    cell.push(p);
  }

  const cta = actions.querySelector('.gnp-c-vertical-tabs__box a[href], .gnp-c-vertical-tabs__bottom-element a[href]');
  if (cta && clean(cta.textContent)) cell.push(para(document, makeLink(document, cta)));

  return cell;
}

function buildList(document, ul) {
  const list = document.createElement('ul');
  ul.querySelectorAll(':scope > li').forEach((li) => {
    const a = li.querySelector('a[href]');
    if (!a) return;
    const item = document.createElement('li');
    item.append(makeLink(document, a));
    const desc = clean(li.querySelector('.gnp-c-tooltip__bullet')?.textContent);
    if (desc) item.append(document.createTextNode(` ${desc}`));
    list.append(item);
  });
  return list.children.length ? list : null;
}

function buildDetail(document, panel) {
  const cell = [];
  const root = panel.querySelector('.gnp-c-vertical-tabs__down-content .gnp-c-box-content')
    || panel.querySelector('.gnp-c-vertical-tabs__down-content');
  if (!root) return cell;

  // Walk the detail region in document order, emitting only content nodes.
  const nodes = root.querySelectorAll(
    '.gnp-c-rich-text > h2, .gnp-c-rich-text > h3, .gnp-c-rich-text > h4, .gnp-c-rich-text > p, '
    + 'ul.gnp-c-list, .gnp-c-slider-img, .gnp-c-box-content__control, footer',
  );
  nodes.forEach((node) => {
    const tag = node.tagName.toLowerCase();
    if (/^h[2-4]$/.test(tag)) {
      const text = clean(node.textContent);
      if (text) cell.push(heading(document, tag, text));
    } else if (tag === 'p') {
      const text = clean(node.textContent);
      if (text) {
        const p = document.createElement('p');
        p.textContent = text;
        cell.push(p);
      }
    } else if (tag === 'ul') {
      const list = buildList(document, node);
      if (list) cell.push(list);
    } else if (node.classList.contains('gnp-c-slider-img')) {
      // Slider images; skip Swiper loop duplicates
      node.querySelectorAll('figure:not(.swiper-slide-duplicate) img, .swiper-slide:not(.swiper-slide-duplicate) img').forEach((img) => {
        const out = imgFrom(document, img);
        if (out && !cell.some((c) => c.querySelector?.(`img[src="${out.getAttribute('src')}"]`))) cell.push(para(document, out));
      });
    } else {
      // Control / footer CTAs
      node.querySelectorAll('a[href]').forEach((a) => {
        if (clean(a.textContent)) cell.push(para(document, makeLink(document, a)));
      });
    }
  });
  return cell;
}

export default function parse(element, { document }) {
  let panels = [...element.querySelectorAll('ul.gnp-c-vertical-tabs > li.gnp-c-vertical-tabs__item')];
  if (!panels.length) panels = [...element.querySelectorAll('.gnp-c-vertical-tabs__item')];
  // Ignore Swiper loop clones if present
  panels = panels.filter((p) => !p.classList.contains('swiper-slide-duplicate'));

  if (!panels.length) {
    element.replaceWith(...element.childNodes);
    return;
  }

  const cells = [];
  panels.forEach((panel) => {
    const teaser = buildTeaser(document, panel);
    const detail = buildDetail(document, panel);
    if (!teaser.length && !detail.length) return;
    cells.push([teaser, detail.length ? detail : '']);
  });

  const block = WebImporter.Blocks.createBlock(document, { name: 'accordion-image-panels', cells });
  element.replaceWith(block);
}
