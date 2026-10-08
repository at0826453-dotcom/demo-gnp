/*
 * Carousel News Ticker
 * Single-line rotating headline ticker with a label link and prev/pause/next controls.
 *
 * Content model:
 *   row 1: label link (e.g. "Noticias GNP" -> /noticias) — only treated as the
 *          label when the block has more than one row
 *   row 2..n: one headline (link or text) per row, single cell
 */

const OPTION_CLASSES = [];
const INTERVAL = 5000;

let tickerId = 0;

function cellContent(row) {
  const cell = row.querySelector(':scope > div') || row;
  const wrapper = document.createElement('div');
  // unwrap a lone paragraph so the slide is a single inline line
  const only = cell.children.length === 1 ? cell.firstElementChild : null;
  const source = only && only.tagName === 'P' ? only : cell;
  wrapper.append(...source.childNodes);
  return wrapper;
}

export default function decorate(block) {
  tickerId += 1;
  // eslint-disable-next-line no-unused-vars
  const active = [...block.classList].filter((c) => OPTION_CLASSES.includes(c));

  const rows = [...block.children].filter((row) => row.textContent.trim());
  if (!rows.length) return;

  const hasLabel = rows.length > 1;
  const labelRow = hasLabel ? rows[0] : null;
  const headlineRows = hasLabel ? rows.slice(1) : rows;
  const id = `carousel-news-ticker-${tickerId}`;

  block.setAttribute('role', 'region');
  block.setAttribute('aria-roledescription', 'carousel');

  const fragment = document.createDocumentFragment();

  if (labelRow) {
    const label = cellContent(labelRow);
    label.className = 'carousel-news-ticker-label';
    label.querySelectorAll('a').forEach((a) => a.classList.remove('button'));
    const labelText = label.textContent.trim();
    if (labelText) block.setAttribute('aria-label', labelText);
    fragment.append(label);
  }

  const viewport = document.createElement('div');
  viewport.className = 'carousel-news-ticker-viewport';
  // slides are role=group, which list items may not carry, so use plain divs
  const slides = document.createElement('div');
  slides.className = 'carousel-news-ticker-slides';
  slides.id = `${id}-slides`;
  slides.setAttribute('aria-live', 'off');

  headlineRows.forEach((row, idx) => {
    const slide = document.createElement('div');
    slide.className = 'carousel-news-ticker-slide';
    slide.setAttribute('role', 'group');
    slide.setAttribute('aria-roledescription', 'slide');
    slide.setAttribute('aria-label', `${idx + 1} / ${headlineRows.length}`);
    const content = cellContent(row);
    content.querySelectorAll('a').forEach((a) => a.classList.remove('button'));
    slide.append(...content.childNodes);
    slides.append(slide);
  });
  viewport.append(slides);
  fragment.append(viewport);

  const slideEls = [...slides.children];
  let current = 0;
  let timer = null;
  let userPaused = false;

  const show = (index) => {
    current = (index + slideEls.length) % slideEls.length;
    slideEls.forEach((slide, i) => {
      const isActive = i === current;
      slide.classList.toggle('is-active', isActive);
      slide.setAttribute('aria-hidden', String(!isActive));
      slide.querySelectorAll('a, button').forEach((el) => {
        if (isActive) el.removeAttribute('tabindex');
        else el.setAttribute('tabindex', '-1');
      });
    });
  };

  show(0);

  if (slideEls.length > 1) {
    const controls = document.createElement('div');
    controls.className = 'carousel-news-ticker-controls';
    controls.innerHTML = `
      <button type="button" class="carousel-news-ticker-prev" aria-controls="${id}-slides" aria-label="Noticia anterior"></button>
      <button type="button" class="carousel-news-ticker-pause" aria-controls="${id}-slides" aria-label="Pausar"></button>
      <button type="button" class="carousel-news-ticker-next" aria-controls="${id}-slides" aria-label="Siguiente noticia"></button>
    `;
    fragment.append(controls);

    const pauseBtn = controls.querySelector('.carousel-news-ticker-pause');
    const stop = () => {
      clearInterval(timer);
      timer = null;
    };
    const start = () => {
      stop();
      if (userPaused) return;
      timer = setInterval(() => show(current + 1), INTERVAL);
    };
    const setPaused = (paused) => {
      userPaused = paused;
      block.classList.toggle('is-paused', paused);
      pauseBtn.setAttribute('aria-label', paused ? 'Reanudar' : 'Pausar');
      pauseBtn.setAttribute('aria-pressed', String(paused));
      // announce changes only when the user drives the ticker
      slides.setAttribute('aria-live', paused ? 'polite' : 'off');
      if (paused) stop();
      else start();
    };

    controls.querySelector('.carousel-news-ticker-prev').addEventListener('click', () => {
      show(current - 1);
      start();
    });
    controls.querySelector('.carousel-news-ticker-next').addEventListener('click', () => {
      show(current + 1);
      start();
    });
    pauseBtn.addEventListener('click', () => setPaused(!userPaused));

    // pause while hovered or focused, resume afterwards
    block.addEventListener('mouseenter', stop);
    block.addEventListener('mouseleave', start);
    block.addEventListener('focusin', stop);
    block.addEventListener('focusout', (e) => {
      if (!block.contains(e.relatedTarget)) start();
    });

    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    setPaused(reduceMotion);
  }

  block.replaceChildren(fragment);
}
