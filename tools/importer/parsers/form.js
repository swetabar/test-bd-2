/* eslint-disable */
/* global WebImporter */
/**
 * Parser for form. Base: form (AEM Forms block, no variants). Templates: content-page,
 * accordion-detail, claim-contact, claim-contact-multi.
 * Sources: https://www.aig.com/home/claims/worldrisk-international-claims/*-report-a-claim-form (6),
 *   .../risk-solutions/individual/premier-client-solutions/contact-us,
 *   .../risk-solutions/business/casualty/safety-concierge-services,
 *   .../risk-solutions/business/accident-and-health/{corporate-risk,special-risk,aig-medical-indemnity-insurance}
 * Selector: #main form.cmp-form:has(textarea):not(dialog *)
 *   (#main, not main: on aig-medical-indemnity-insurance the "Let's Talk" form renders outside
 *   <main> but inside #main. The header search form #dmp-forms-redesign, the footer, the
 *   newsroom newsletter dialog, the why-aig filter and the document-picker drop-downs are
 *   outside #main or have no textarea.)
 *
 * Output: one "Form" block whose single cell is a relative link to the form definition
 *   <a href="<page-slug>-form.json"><page-slug>-form.json</a>, page-slug = last path segment of
 *   the source URL. The JSON is produced separately by excat-form-migration's form-importer.js
 *   and saved next to the page's .plain.html.
 * The whole <form> is replaced, so its controls (Print / Clear Form buttons, reCAPTCHA, hidden
 *   tracker inputs) and in-form labels are dropped; text outside the form (intro, required-field
 *   notes, disclaimers) stays default content.
 * Forms inside a tab panel / accordion item that become their own block (main .tabs.panelcontainer,
 *   main .accordion.panelcontainer) are placed right after that component: a block cannot be
 *   nested inside another block's cell.
 * Forms with fewer than 2 real fields are left untouched.
 */
const FIELD_SELECTOR = 'input:not([type="hidden"]):not([type="submit"]):not([type="button"]):not([type="reset"]):not([type="image"]), select, textarea';
const CONTAINER_BLOCKS = 'main .tabs.panelcontainer, main .accordion.panelcontainer';

function realFieldCount(form) {
  return [...form.querySelectorAll(FIELD_SELECTOR)].filter((f) => {
    if (f.closest('.aigtracker, .recaptcha, .g-recaptcha')) return false;
    const name = f.getAttribute('name') || '';
    return !/tracker-id$|^g-recaptcha-response$/i.test(name);
  }).length;
}

/**
 * Text components authored inside the <form> (AEM .cmp-text without fields) that sit before the
 * first / after the last field are page content, not form chrome: notes and disclaimers such as
 * "Note: This service is only available for users in the U.S." (safety-concierge-services),
 * "* Choose United States New York if no Local Policy" / "Official Government & State reporting
 * forms..." (claim forms) and the privacy notice (aig-medical-indemnity-insurance). They are kept
 * as default content before / after the Form block. Bold-only section labels ("Basic Claim
 * Details", "Insured Data", ...) are form structure and are dropped like the other in-form text.
 */
function surroundingText(form) {
  const fields = [...form.querySelectorAll(FIELD_SELECTOR)]
    .filter((f) => !f.closest('.aigtracker, .recaptcha, .g-recaptcha'));
  const before = [];
  const after = [];
  if (!fields.length) return { before, after };
  const first = fields[0];
  const last = fields[fields.length - 1];
  const clean = (t) => (t || '').replace(/\s+/g, ' ').trim();
  [...form.querySelectorAll('.cmp-text')]
    .filter((c) => !c.querySelector(FIELD_SELECTOR) && !c.closest('.button, .recaptcha'))
    .forEach((c) => {
      const text = clean(c.textContent);
      if (!text) return;
      const bold = clean([...c.querySelectorAll('b, strong')].map((b) => b.textContent).join(' '));
      if (bold === text) return; // section label only
      // eslint-disable-next-line no-bitwise
      if (!(first.compareDocumentPosition(c) & 4)) before.push(c);
      // eslint-disable-next-line no-bitwise
      else if (last.compareDocumentPosition(c) & 4) after.push(c);
    });
  return { before, after };
}

function pageSlug(params, document) {
  let href = (params && params.originalURL) || '';
  if (!href && document.location && document.location.href !== 'about:blank') href = document.location.href;
  let pathname = '';
  try {
    pathname = new URL(href).pathname;
  } catch (e) {
    pathname = href;
  }
  const segments = pathname.replace(/\/+$/, '').replace(/\.html?$/, '').split('/').filter(Boolean);
  return WebImporter.FileUtils.sanitizePath(segments.pop() || 'index').replace(/^\//, '');
}

export default function parse(element, { document, params }) {
  const form = element.matches('form') ? element : element.querySelector('form');
  if (!form) return;
  if (form.closest('header, footer, dialog, .cmp-experiencefragment--header, .cmp-experiencefragment--footer')) return;
  if (realFieldCount(form) < 2) return;

  const file = `${pageSlug(params, document)}-form.json`;
  const link = document.createElement('a');
  link.href = file;
  link.textContent = file;
  const block = WebImporter.Blocks.createBlock(document, { name: 'Form', cells: [[link]] });
  const { before, after } = surroundingText(form);

  // outermost tabs/accordion component that will be converted to its own block
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
