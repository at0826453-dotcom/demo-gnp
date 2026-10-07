/*
 * Accordion Image Panels
 * Side-by-side image teaser panels; each panel may reveal a detail region.
 * One detail region open at a time. Desktop: details span the full width below
 * the panel row. Mobile: details expand directly under their own teaser.
 *
 * Content model (one row per panel):
 *   cell 1 (teaser): background image, title (heading or title image),
 *                    optional top CTA, subtitle (h3), lead text, primary CTA
 *   cell 2 (detail, optional): intro, group headings, link lists
 *                    (link + description per item), images, footer CTA
 */

import { createOptimizedPicture } from '../../scripts/aem.js';

const OPTION_CLASSES = [];

let blockId = 0;

function optimizePictures(root, eager = false) {
  root.querySelectorAll('picture > img').forEach((img) => {
    const optimized = createOptimizedPicture(img.src, img.alt, eager, [{ width: '750' }]);
    img.closest('picture').replaceWith(optimized);
  });
}

/** Unwraps a picture from its paragraph wrapper (if any) and returns the outer node. */
function pictureNode(picture) {
  const parent = picture.parentElement;
  if (parent && parent.tagName === 'P' && parent.children.length === 1
    && !parent.textContent.trim()) {
    return parent;
  }
  return picture;
}

function buildTeaser(cell) {
  const teaser = document.createElement('div');
  teaser.className = 'accordion-image-panels-teaser';

  // background image = first picture in the cell
  const bgPicture = cell.querySelector('picture');
  if (bgPicture) {
    const bg = document.createElement('div');
    bg.className = 'accordion-image-panels-bg';
    const node = pictureNode(bgPicture);
    bg.append(bgPicture);
    if (node !== bgPicture) node.remove();
    teaser.append(bg);
  }

  const content = document.createElement('div');
  content.className = 'accordion-image-panels-teaser-content';
  const head = document.createElement('div');
  head.className = 'accordion-image-panels-head';
  const box = document.createElement('div');
  box.className = 'accordion-image-panels-box';

  // drop empty headings/paragraphs (e.g. a panel whose title is blank)
  [...cell.children].forEach((n) => {
    if (!n.textContent.trim() && !n.querySelector('picture, img')) n.remove();
  });

  const nodes = [...cell.children];
  // the bottom box starts at the first h3 (subtitle); fallback: after the title
  let splitIdx = nodes.findIndex((n) => n.tagName === 'H3');
  if (splitIdx < 0) {
    const titleIdx = nodes.findIndex((n) => /^H[1-6]$/.test(n.tagName) || n.querySelector('picture'));
    splitIdx = titleIdx >= 0 ? titleIdx + 1 : 0;
  }
  nodes.forEach((n, i) => {
    if (i < splitIdx) {
      if (/^H[1-6]$/.test(n.tagName) || n.querySelector('picture')) {
        n.classList.add('accordion-image-panels-title');
      }
      head.append(n);
    } else {
      box.append(n);
    }
  });

  // the head is always present: it carries the collapsed-state overlay,
  // even for panels without a title
  content.append(head);
  if (box.children.length) content.append(box);
  teaser.append(content);
  return teaser;
}

/**
 * Adds prev/next buttons and pagination dots to a gallery with 2+ images.
 * The track keeps native scroll-snap swiping; controls just scroll it.
 */
function decorateGalleryControls(gallery, track) {
  const slides = [...track.children];
  if (slides.length < 2) return;

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  let current = 0;

  const prev = document.createElement('button');
  prev.type = 'button';
  prev.className = 'accordion-image-panels-gallery-prev';
  prev.setAttribute('aria-label', 'Imagen anterior');

  const next = document.createElement('button');
  next.type = 'button';
  next.className = 'accordion-image-panels-gallery-next';
  next.setAttribute('aria-label', 'Imagen siguiente');

  const dotsWrap = document.createElement('div');
  dotsWrap.className = 'accordion-image-panels-gallery-dots';
  const dots = slides.map((slide, i) => {
    const dot = document.createElement('button');
    dot.type = 'button';
    dot.className = 'accordion-image-panels-gallery-dot';
    dot.setAttribute('aria-label', `Ir a imagen ${i + 1}`);
    dotsWrap.append(dot);
    return dot;
  });

  function setActive(index) {
    current = index;
    dots.forEach((dot, i) => {
      dot.classList.toggle('is-active', i === index);
      if (i === index) dot.setAttribute('aria-current', 'true');
      else dot.removeAttribute('aria-current');
    });
    prev.setAttribute('aria-disabled', index === 0 ? 'true' : 'false');
    next.setAttribute('aria-disabled', index === slides.length - 1 ? 'true' : 'false');
  }

  function goTo(index) {
    const target = Math.max(0, Math.min(slides.length - 1, index));
    track.scrollTo({
      left: target * track.clientWidth,
      behavior: reduceMotion.matches ? 'auto' : 'smooth',
    });
    setActive(target);
  }

  function syncFromScroll() {
    const width = track.clientWidth;
    if (!width) return;
    const index = Math.max(0, Math.min(slides.length - 1, Math.round(track.scrollLeft / width)));
    if (index !== current) setActive(index);
  }

  prev.addEventListener('click', () => {
    if (current > 0) goTo(current - 1);
  });
  next.addEventListener('click', () => {
    if (current < slides.length - 1) goTo(current + 1);
  });
  dots.forEach((dot, i) => dot.addEventListener('click', () => goTo(i)));

  let ticking = false;
  track.addEventListener('scroll', () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => {
      ticking = false;
      syncFromScroll();
    });
  }, { passive: true });
  // re-sync when the gallery is shown again (detail reopened) or resized
  if (window.ResizeObserver) {
    new ResizeObserver(() => syncFromScroll()).observe(track);
  }

  gallery.append(prev, next, dotsWrap);
  gallery.classList.add('has-controls');
  setActive(0);
}

function isCtaParagraph(el) {
  if (el.tagName !== 'P' || el.querySelector('picture')) return false;
  const links = el.querySelectorAll('a');
  return links.length === 1 && el.textContent.trim() === links[0].textContent.trim();
}

function wrap(className, nodes) {
  const div = document.createElement('div');
  div.className = className;
  div.append(...nodes);
  return div;
}

/**
 * Detail cell -> [intro] [body: link lists, optionally grouped by h3] [gallery] [footer CTA]
 */
function decorateDetail(cell) {
  // link-list items: link followed by a description in the same item
  cell.querySelectorAll('li').forEach((li) => {
    const link = li.querySelector('a');
    if (!link) return;
    const desc = [...li.childNodes].filter((n) => n !== link && !n.contains(link));
    if (desc.some((n) => n.textContent.trim())) {
      const span = document.createElement('span');
      span.className = 'accordion-image-panels-link-desc';
      span.append(...desc);
      li.append(span);
    }
    li.classList.add('accordion-image-panels-link-item');
  });

  // images in the detail form a gallery (slider)
  const pics = [...cell.querySelectorAll('picture')];
  let gallery = null;
  if (pics.length) {
    const track = wrap('accordion-image-panels-gallery-track', []);
    pics.forEach((pic) => {
      const node = pictureNode(pic);
      track.append(pic);
      if (node !== pic) node.remove();
    });
    track.tabIndex = 0;
    gallery = wrap('accordion-image-panels-gallery', [track]);
    gallery.setAttribute('role', 'group');
    gallery.setAttribute('aria-label', 'Galería');
    decorateGalleryControls(gallery, track);
  }

  // drop empty leftovers
  [...cell.children].forEach((n) => {
    if (!n.textContent.trim() && !n.querySelector('img')) n.remove();
  });

  const nodes = [...cell.children];

  // footer: a trailing call-to-action paragraph
  let footer = null;
  if (nodes.length > 1 && isCtaParagraph(nodes[nodes.length - 1])) {
    footer = wrap('accordion-image-panels-footer', [nodes.pop()]);
  }

  // intro: leading content before the first list or group heading
  let introEnd = nodes.findIndex((n) => n.tagName === 'UL' || n.tagName === 'OL' || n.tagName === 'H3');
  if (introEnd < 0) introEnd = nodes.length;
  const introNodes = nodes.slice(0, introEnd);
  const bodyNodes = nodes.slice(introEnd);

  const parts = [];
  if (introNodes.length) parts.push(wrap('accordion-image-panels-intro', introNodes));

  if (bodyNodes.length) {
    const body = wrap('accordion-image-panels-body', []);
    const hasGroups = bodyNodes.some((n) => n.tagName === 'H3');
    if (hasGroups) {
      let group = null;
      bodyNodes.forEach((n) => {
        if (n.tagName === 'H3' || !group) {
          group = wrap('accordion-image-panels-group', []);
          body.append(group);
        }
        group.append(n);
      });
      cell.classList.add('has-groups');
    } else {
      body.append(...bodyNodes);
    }
    parts.push(body);
  }

  if (gallery) {
    parts.push(gallery);
    cell.classList.add('has-gallery');
  }
  if (footer) parts.push(footer);

  cell.replaceChildren(...parts);
}

function closeItem(item) {
  item.classList.remove('is-open');
  const toggle = item.querySelector('.accordion-image-panels-toggle');
  const detail = item.querySelector('.accordion-image-panels-detail');
  if (toggle) toggle.setAttribute('aria-expanded', 'false');
  if (detail) detail.hidden = true;
}

function openItem(block, item) {
  block.querySelectorAll('.accordion-image-panels-item.is-open').forEach((other) => {
    if (other !== item) closeItem(other);
  });
  item.classList.add('is-open');
  item.querySelector('.accordion-image-panels-toggle').setAttribute('aria-expanded', 'true');
  item.querySelector('.accordion-image-panels-detail').hidden = false;
}

function toggleItem(block, item) {
  if (item.classList.contains('is-open')) closeItem(item);
  else openItem(block, item);
}

export default function decorate(block) {
  blockId += 1;
  // eslint-disable-next-line no-unused-vars
  const active = [...block.classList].filter((c) => OPTION_CLASSES.includes(c));

  const rows = [...block.children].filter((row) => row.children.length);
  const list = document.createElement('div');
  list.className = 'accordion-image-panels-list';

  rows.forEach((row, idx) => {
    const [teaserCell, detailCell] = [...row.children];
    const item = document.createElement('div');
    item.className = 'accordion-image-panels-item';

    const teaser = buildTeaser(teaserCell || document.createElement('div'));
    item.append(teaser);

    const hasDetail = detailCell && (detailCell.textContent.trim() || detailCell.querySelector('picture, img'));
    if (hasDetail) {
      const detailId = `accordion-image-panels-${blockId}-detail-${idx}`;
      detailCell.className = 'accordion-image-panels-detail';
      detailCell.id = detailId;
      detailCell.hidden = true;
      detailCell.setAttribute('role', 'region');

      decorateDetail(detailCell);

      const toggle = document.createElement('button');
      toggle.type = 'button';
      toggle.className = 'accordion-image-panels-toggle';
      toggle.setAttribute('aria-expanded', 'false');
      toggle.setAttribute('aria-controls', detailId);
      const title = teaser.querySelector('.accordion-image-panels-title');
      toggle.setAttribute('aria-label', title && title.textContent.trim()
        ? `Ver información: ${title.textContent.trim()}`
        : 'Ver información');
      teaser.append(toggle);
      const labelId = `${detailId}-label`;
      toggle.id = labelId;
      detailCell.setAttribute('aria-labelledby', labelId);

      toggle.addEventListener('click', () => toggleItem(block, item));
      // clicking the teaser (outside links/buttons) also toggles
      teaser.addEventListener('click', (e) => {
        if (e.target.closest('a, button')) return;
        toggleItem(block, item);
      });
      detailCell.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
          closeItem(item);
          toggle.focus();
        }
      });

      item.classList.add('has-detail');
      item.append(detailCell);
    }

    list.append(item);
  });

  block.style.setProperty('--panel-count', rows.length || 1);
  optimizePictures(list, false);
  block.replaceChildren(list);
}
