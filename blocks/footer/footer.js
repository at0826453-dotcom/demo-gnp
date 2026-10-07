// footer fragment sections, in authored order
const SECTION_NAMES = ['primary', 'secondary', 'badges', 'contact', 'social', 'legal'];

// sections rendered together as one horizontal row (left, center, right)
const ROW_SECTIONS = ['badges', 'contact', 'social'];

/**
 * Fetches the footer fragment. Metadata-independent dual fetch:
 * /content/footer.plain.html (local preview) first, then /footer.plain.html (DA/EDS).
 * @returns {Promise<Document|null>} parsed fragment
 */
async function fetchFooter() {
  let resp = await fetch('/content/footer.plain.html');
  if (!resp.ok) resp = await fetch('/footer.plain.html');
  if (!resp.ok) return null;
  const doc = new DOMParser().parseFromString(await resp.text(), 'text/html');
  // resolve relative image paths against the fragment, not the current page
  doc.querySelectorAll('img[src]').forEach((img) => {
    img.src = new URL(img.getAttribute('src'), resp.url).href;
  });
  return doc;
}

/**
 * loads and decorates the footer
 * @param {Element} block The footer block element
 */
export default async function decorate(block) {
  const fragment = await fetchFooter();
  block.textContent = '';
  if (!fragment) return;

  const canvas = document.createElement('div');
  canvas.className = 'footer-canvas';
  const row = document.createElement('div');
  row.className = 'footer-row';

  [...fragment.body.children].filter((el) => el.tagName === 'DIV').forEach((section, i) => {
    const name = SECTION_NAMES[i] || `section-${i + 1}`;
    section.classList.add(`footer-${name}`);
    if (ROW_SECTIONS.includes(name)) {
      if (!row.parentElement) canvas.append(row);
      row.append(section);
    } else {
      canvas.append(section);
    }
  });

  // social profiles open in a new tab
  canvas.querySelectorAll('.footer-social a[href^="http"]').forEach((a) => {
    a.target = '_blank';
    a.rel = 'noopener noreferrer';
    const img = a.querySelector('img');
    if (img?.alt) a.setAttribute('aria-label', img.alt);
  });

  // image-only links need an accessible name
  canvas.querySelectorAll('a').forEach((a) => {
    const img = a.querySelector('img');
    if (img?.alt && !a.textContent.trim() && !a.hasAttribute('aria-label')) a.setAttribute('aria-label', img.alt);
  });

  block.append(canvas);
}
