/* eslint-disable */
/* global WebImporter */

/**
 * Parser for carousel-news-ticker. Base: carousel.
 * Source: https://www.gnp.com.mx (instance: .gnpnoticias)
 * Generated: 2026-10-07
 *
 * Output (single column):
 *   row 1: label link ("Noticias GNP" -> /noticias)
 *   row 2..n: one headline link per row
 *
 * Validated selectors (source.html):
 *   a.gnp-news__title                         -> label link
 *   .gnp-news__wrapper a.gnp-news__link       -> headline slides (Swiper adds
 *                                                loop duplicates, deduped by href+text)
 *   ul.gnp-news__controller                   -> prev/pause/next controls (dropped)
 */
export default function parse(element, { document }) {
  const label = element.querySelector('a.gnp-news__title, .gnp-news__content > a:not(.gnp-news__link)');

  let slides = [...element.querySelectorAll('a.gnp-news__link')];
  if (!slides.length) {
    // Fallback: any link inside the slide wrapper
    slides = [...element.querySelectorAll('.swiper-wrapper a, .gnp-news__wrapper a')];
  }

  // Swiper loop mode clones slides (swiper-slide-duplicate); keep the first
  // occurrence of each headline in document order of the non-duplicate slides.
  const originals = slides.filter((a) => !a.classList.contains('swiper-slide-duplicate'));
  const ordered = [...originals, ...slides.filter((a) => a.classList.contains('swiper-slide-duplicate'))];
  const seen = new Set();
  const headlines = [];
  ordered.forEach((a) => {
    const key = `${a.getAttribute('href') || ''}|${a.textContent.trim()}`;
    if (!a.textContent.trim() || seen.has(key)) return;
    seen.add(key);
    headlines.push(a);
  });
  // Restore document order of the source slides (non-duplicates first is only for picking)
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
    const labelLink = document.createElement('a');
    labelLink.href = label.getAttribute('href') || '/noticias';
    labelLink.textContent = label.textContent.trim();
    cells.push([labelLink]);
  }
  headlines.forEach((a) => {
    const link = document.createElement('a');
    link.href = a.getAttribute('href');
    link.textContent = a.textContent.trim();
    cells.push([link]);
  });

  const block = WebImporter.Blocks.createBlock(document, { name: 'carousel-news-ticker', cells });
  element.replaceWith(block);
}
