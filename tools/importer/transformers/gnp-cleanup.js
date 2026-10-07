/* eslint-disable */
/* global WebImporter */

/**
 * Transformer: GNP (www.gnp.com.mx) site-wide cleanup.
 * All selectors verified in migration-work/cleaned.html.
 */
const TransformHook = { beforeTransform: 'beforeTransform', afterTransform: 'afterTransform' };

export default function transform(hookName, element, payload) {
  if (hookName === TransformHook.beforeTransform) {
    // Third-party overlays / widgets that could interfere with block parsing.
    // Found: <div class="grecaptcha-badge"> (reCAPTCHA badge, body tail)
    // Found: <div class="gnp-search__divSearch" id="gnp_search_id_containerSearch"> (header search overlay)
    WebImporter.DOMUtils.remove(element, [
      '.grecaptcha-badge',
      '#gnp_search_id_containerSearch',
    ]);
  }

  if (hookName === TransformHook.afterTransform) {
    // Global chrome (non-authorable).
    // Found: <div class="gnp-cintillo aem-GridColumn ..."> (empty banner container)
    // Found: <div id="experiencefragment-a8a1334632" class="cmp-experiencefragment cmp-experiencefragment--header"> with <header class="gnp-header">
    // Found: <div id="experiencefragment-b6340639c2" class="cmp-experiencefragment cmp-experiencefragment--footer"> with <footer class="gnp-footer">
    WebImporter.DOMUtils.remove(element, [
      '.gnp-cintillo',
      '.cmp-experiencefragment--header',
      'header.gnp-header',
      '.cmp-experiencefragment--footer',
      'footer.gnp-footer',
    ]);

    // Remove now-empty experiencefragment wrappers.
    // Found: <div class="experiencefragment aem-GridColumn aem-GridColumn--default--12">
    element.querySelectorAll('.experiencefragment').forEach((el) => {
      if (!el.textContent.trim() && !el.querySelector('img, picture')) el.remove();
    });

    // Tracking beacons and analytics pixels.
    // Found: <iframe id="destination_publishing_iframe_gnp_0"> (Adobe ID sync)
    // Found: <iframe src="https://10421547.fls.doubleclick.net/..."> (DoubleClick)
    // Found: <div id="batBeacon562182917870"> (Bing UET)
    // Found: <img class="ywa-10000" src="https://sp.analytics.yahoo.com/..."> (Yahoo analytics)
    // Found: <iframe title="archetype">
    WebImporter.DOMUtils.remove(element, [
      '#destination_publishing_iframe_gnp_0',
      'iframe[src*="doubleclick.net"]',
      '[id^="batBeacon"]',
      'img.ywa-10000',
      'iframe[title="archetype"]',
    ]);

    // Build/version stamp. Found: <div><p>Portal Corporativo Version: 1.4.5</p></div>
    element.querySelectorAll('p').forEach((p) => {
      if (/^Portal Corporativo Version:/i.test(p.textContent.trim())) {
        const parent = p.parentElement;
        p.remove();
        if (parent && parent !== element && !parent.textContent.trim() && !parent.children.length) parent.remove();
      }
    });

    // Safe non-content elements.
    WebImporter.DOMUtils.remove(element, ['iframe', 'link', 'noscript', 'script', 'style', 'textarea']);
  }
}
