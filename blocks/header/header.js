// media query match that indicates desktop width
const isDesktop = window.matchMedia('(width >= 900px)');

// nav fragment sections, in authored order
const SECTION_NAMES = ['brand', 'sections', 'tools', 'aside'];

/**
 * Fetches the nav fragment. Metadata-independent dual fetch:
 * /content/nav.plain.html (local preview) first, then /nav.plain.html (DA/EDS).
 * @returns {Promise<Document|null>} parsed fragment
 */
async function fetchNav() {
  let resp = await fetch('/content/nav.plain.html');
  if (!resp.ok) resp = await fetch('/nav.plain.html');
  if (!resp.ok) return null;
  const doc = new DOMParser().parseFromString(await resp.text(), 'text/html');
  // resolve relative image paths against the fragment, not the current page
  doc.querySelectorAll('img[src]').forEach((img) => {
    img.src = new URL(img.getAttribute('src'), resp.url).href;
  });
  return doc;
}

/**
 * Replaces a decorative svg <img> with a span masked by the svg,
 * so the icon follows the text color (hover states).
 * @param {HTMLImageElement} img icon image
 */
function toMaskedIcon(img) {
  const icon = document.createElement('span');
  icon.className = 'nav-icon';
  icon.setAttribute('aria-hidden', 'true');
  icon.style.setProperty('--icon-url', `url("${img.src}")`);
  img.replaceWith(icon);
}

/**
 * Opens or closes a dropdown
 * @param {Element} drop the li.nav-drop
 * @param {boolean} expanded whether to open
 */
function setDropExpanded(drop, expanded) {
  drop.classList.toggle('is-open', expanded);
  drop.querySelector(':scope > a').setAttribute('aria-expanded', expanded);
}

function closeAllDrops(nav, except) {
  nav.querySelectorAll('.nav-drop.is-open').forEach((drop) => {
    if (drop !== except) setDropExpanded(drop, false);
  });
}

/**
 * Decorates the sections list: active item, separators, dropdowns
 * @param {Element} section the nav-sections element
 * @param {Element} nav the nav element
 */
function decorateSections(section, nav) {
  const list = section.querySelector(':scope > ul');
  if (!list) return;
  list.classList.add('nav-list');
  const items = [...list.children];

  // active item: link matching the current page, else the authored (bold) default
  const current = items.find((li) => {
    const a = li.querySelector(':scope > a, :scope > strong > a');
    if (!a || a.getAttribute('href').startsWith('#')) return false;
    return new URL(a.href).pathname === window.location.pathname;
  });
  items.forEach((li) => {
    li.classList.add('nav-item');
    const strong = li.querySelector(':scope > strong');
    if (strong) {
      if (!current) li.classList.add('is-active');
      strong.replaceWith(...strong.childNodes);
    }
    li.querySelector(':scope > a')?.classList.add('nav-trigger');
  });
  if (current) current.classList.add('is-active');

  items.filter((li) => li.querySelector(':scope > ul')).forEach((drop, i) => {
    drop.classList.add('nav-drop');
    const trigger = drop.querySelector(':scope > a');
    const panel = drop.querySelector(':scope > ul');
    panel.classList.add('nav-drop-panel');
    panel.id = `nav-drop-${i}`;
    trigger.setAttribute('aria-haspopup', 'true');
    trigger.setAttribute('aria-controls', panel.id);
    trigger.setAttribute('aria-expanded', 'false');
    if (trigger.getAttribute('href') === '#') trigger.setAttribute('role', 'button');
    panel.querySelectorAll('img').forEach((img) => {
      if (!img.alt && img.src.endsWith('.svg')) toMaskedIcon(img);
    });

    trigger.addEventListener('click', (e) => {
      if (trigger.getAttribute('href') === '#') e.preventDefault();
      // on desktop hover already opened it, so a click keeps it open
      const expanded = isDesktop.matches || !drop.classList.contains('is-open');
      closeAllDrops(nav, drop);
      setDropExpanded(drop, expanded);
    });
    drop.addEventListener('mouseenter', () => {
      if (!isDesktop.matches) return;
      closeAllDrops(nav, drop);
      setDropExpanded(drop, true);
    });
    drop.addEventListener('mouseleave', () => {
      if (isDesktop.matches) setDropExpanded(drop, false);
    });
  });
}

/**
 * Builds the expandable search form from the tools section.
 * An image-only link is the search toggle (its href is the search page, its alt the label);
 * an image-only paragraph is the clear-field icon.
 * @param {Element} section the nav-tools element
 * @param {Element} navWrapper element the search bar is attached to
 */
function decorateSearch(section, navWrapper) {
  const toggleLink = [...section.querySelectorAll('a')].find((a) => a.querySelector('img') && !a.textContent.trim());
  if (!toggleLink) return;
  const toggleImg = toggleLink.querySelector('img');
  const label = toggleImg.alt || 'Search';
  const clearPara = [...section.querySelectorAll(':scope > p')].find((p) => p.querySelector('img') && !p.querySelector('a') && !p.textContent.trim());
  const clearImg = clearPara?.querySelector('img');

  const toggle = document.createElement('button');
  toggle.type = 'button';
  toggle.className = 'nav-search-toggle';
  toggle.setAttribute('aria-label', label);
  toggle.setAttribute('aria-expanded', 'false');
  toggle.setAttribute('aria-controls', 'nav-search');
  toggleImg.alt = '';
  toggle.append(toggleImg);
  toggleLink.closest('p').replaceWith(toggle);

  const form = document.createElement('form');
  form.className = 'nav-search';
  form.id = 'nav-search';
  form.setAttribute('role', 'search');
  form.action = toggleLink.href;
  form.method = 'get';
  form.hidden = true;

  const input = document.createElement('input');
  input.type = 'search';
  input.name = 'q';
  input.placeholder = label;
  input.setAttribute('aria-label', label);
  input.autocomplete = 'off';

  const clear = document.createElement('button');
  clear.type = 'button';
  clear.className = 'nav-search-clear';
  clear.setAttribute('aria-label', clearImg?.alt || 'Clear');
  if (clearImg) {
    clearImg.alt = '';
    clear.append(clearImg);
    clearPara.remove();
  }
  clear.hidden = true;

  const submit = document.createElement('button');
  submit.type = 'submit';
  submit.className = 'nav-search-submit';
  submit.textContent = label;

  form.append(input, clear, submit);
  navWrapper.append(form);

  const setOpen = (open) => {
    form.hidden = !open;
    toggle.setAttribute('aria-expanded', open);
    toggle.classList.toggle('is-active', open);
    if (open) input.focus();
  };
  toggle.addEventListener('click', () => setOpen(form.hidden));
  input.addEventListener('input', () => { clear.hidden = !input.value; });
  clear.addEventListener('click', () => {
    input.value = '';
    clear.hidden = true;
    input.focus();
  });
  form.addEventListener('submit', (e) => {
    if (!input.value.trim()) e.preventDefault();
  });
  navWrapper.closeSearch = () => setOpen(false);
}

/**
 * Turns bold links in the tools section into call-to-action buttons
 * @param {Element} section the nav-tools element
 */
function decorateCtas(section) {
  section.querySelectorAll('strong > a, b > a').forEach((a) => {
    a.classList.add('nav-cta');
    const wrapper = a.parentElement;
    wrapper.replaceWith(a);
  });
}

/**
 * loads and decorates the header, mainly the nav
 * @param {Element} block The header block element
 */
export default async function decorate(block) {
  const fragment = await fetchNav();
  block.textContent = '';
  if (!fragment) return;

  const nav = document.createElement('nav');
  nav.id = 'nav';
  nav.setAttribute('aria-label', 'Principal');
  [...fragment.body.children].filter((el) => el.tagName === 'DIV').forEach((section, i) => {
    section.classList.add(`nav-${SECTION_NAMES[i] || `section-${i + 1}`}`);
    nav.append(section);
  });

  const navWrapper = document.createElement('div');
  navWrapper.className = 'nav-wrapper';
  navWrapper.append(nav);

  const sections = nav.querySelector('.nav-sections');
  if (sections) decorateSections(sections, nav);
  const tools = nav.querySelector('.nav-tools');
  if (tools) {
    decorateSearch(tools, navWrapper);
    decorateCtas(tools);
  }

  // close dropdowns / search on Escape and outside click
  document.addEventListener('keydown', (e) => {
    if (e.code !== 'Escape') return;
    closeAllDrops(nav);
    navWrapper.closeSearch?.();
  });
  document.addEventListener('click', (e) => {
    if (!nav.contains(e.target)) closeAllDrops(nav);
  });

  // reset open states when crossing the desktop breakpoint
  isDesktop.addEventListener('change', () => {
    closeAllDrops(nav);
    navWrapper.closeSearch?.();
  });

  block.append(navWrapper);
}
