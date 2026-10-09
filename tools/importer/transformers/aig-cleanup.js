/* eslint-disable */
/* global WebImporter */

/**
 * Transformer: AIG site-wide cleanup.
 * All selectors verified in migration-work/cleaned.html (https://www.aig.com/home).
 */
const TransformHook = { beforeTransform: 'beforeTransform', afterTransform: 'afterTransform' };

function cleanText(text) {
  return (text || '').replace(/\s+/g, ' ').trim();
}

function absoluteUrl(href, doc) {
  try {
    const base = doc.location && doc.location.href !== 'about:blank' ? doc.location.href : 'https://www.aig.com/home';
    return new URL(href, base).href;
  } catch (e) {
    return href;
  }
}

/**
 * Drop-down selectors (AEM form "options" component: <div class="options">
 * <fieldset class="cmp-form-options--drop-down"><label>..</label><select>..</select>, plus the
 * JS-rendered .select-holder / ul.select-picker) carry real content that html2md would collapse
 * into "Label Selected (value)". Verified on live content pages (none on /home):
 *
 * 1. Panel switchers - option values are ids of sibling panels (annual-reports-and-proxy-statements
 *    "Archives" option2025.., political-activities-and-contributions "Lobbying Disclosure Reports"
 *    multiple-optionld2026..): every panel is real (hidden) content. The label becomes an <h2>,
 *    each panel gets an <h3> with its option text, panels are ordered like the drop-down.
 * 2. Document pickers - option values are document URLs (corporate-governance-documents
 *    ".select_action" "View Employee Code of Conduct - Choose your language."): the label
 *    becomes a paragraph followed by a list of links (one per option); the companion
 *    "View ..." button that only opens the selected option is dropped.
 * Any other drop-down (real form fields: state, claim type, ...) is left untouched.
 */
function convertDropdowns(element) {
  const doc = element.ownerDocument;
  element.querySelectorAll('.options').forEach((comp) => {
    const select = comp.querySelector('select.cmp-form-options__field--drop-down');
    if (!select || !comp.parentElement) return;
    const label = cleanText((comp.querySelector('.cmp-form-options__label') || {}).textContent);
    const options = [...select.querySelectorAll('option')]
      .map((o) => ({ value: (o.getAttribute('value') || '').trim(), text: cleanText(o.textContent) }))
      .filter((o) => o.value && o.text);

    // 1. Panel switcher
    const panels = options
      .map((o) => {
        let panel = null;
        try {
          panel = doc.getElementById(o.value);
        } catch (e) {
          panel = null;
        }
        if (!panel || panel.contains(comp)) return null;
        const wrapper = panel.parentElement && panel.parentElement.classList.contains('container') ? panel.parentElement : panel;
        // Placeholder options ("Select Claim Type") point at an empty panel: no heading for those.
        if (!cleanText(wrapper.textContent) && !wrapper.querySelector('img, a[href]')) return null;
        // Panels that already open with the option's title (report-a-claim) need no extra heading.
        const first = wrapper.querySelector('h1, h2, h3, h4, h5, h6');
        const titled = Boolean(first && cleanText(first.textContent).toLowerCase() === o.text.toLowerCase());
        return { text: o.text, wrapper, titled };
      })
      .filter(Boolean);
    if (panels.length && panels.every((p) => p.wrapper.parentElement === comp.parentElement)) {
      const h2 = doc.createElement('h2');
      h2.textContent = label;
      let anchor = h2;
      if (label) comp.replaceWith(h2);
      else {
        anchor = comp;
      }
      panels.forEach(({ text, wrapper, titled }) => {
        wrapper.removeAttribute('style'); // display:none until selected
        if (titled) {
          anchor.after(wrapper);
        } else {
          const h3 = doc.createElement('h3');
          h3.textContent = text;
          anchor.after(h3);
          h3.after(wrapper);
        }
        anchor = wrapper;
      });
      if (!label) comp.remove();
      return;
    }

    // 2. Document picker
    const docs = options.filter((o) => /^(https?:\/\/|\/)\S+\.(pdf|docx?|xlsx?|pptx?)(\?|#|$)/i.test(o.value));
    if (docs.length && docs.length === options.length) {
      const urls = docs.map((o) => absoluteUrl(o.value, doc));
      const scope = comp.closest('.select_action') || comp.parentElement;
      const frag = [];
      if (label) {
        const p = doc.createElement('p');
        p.textContent = label;
        frag.push(p);
      }
      const ul = doc.createElement('ul');
      docs.forEach((o, i) => {
        const li = doc.createElement('li');
        const a = doc.createElement('a');
        a.href = urls[i];
        a.textContent = o.text;
        li.append(a);
        ul.append(li);
      });
      frag.push(ul);
      // Lift out of the <form> wrapper (keeping the visible "View ..." button link after the
      // list) so no form markup is left around plain content.
      const form = comp.closest('form');
      if (form && scope.contains(form)) {
        const buttons = [...form.querySelectorAll('.button')];
        form.replaceWith(...frag, ...buttons);
      } else {
        comp.replaceWith(...frag);
      }
    }
  });
}

export default function transform(hookName, element, payload) {
  if (hookName === TransformHook.beforeTransform) {
    // TrustArc cookie banner: <div id="consent_blackbar"> + sibling empty <div class="overlay">
    // Skip link: <div class="cmp-page__skiptomaincontent">
    // Facebook SDK root: <div id="fb-root">
    WebImporter.DOMUtils.remove(element, [
      '#consent_blackbar',
      '#consent_blackbar + .overlay',
      '.cmp-page__skiptomaincontent',
      '#fb-root',
    ]);

    // Content pages (verified live on 139 content-page URLs; none present on /home):
    // - "Show more" / "Show less" toggles of .aig-toggle-content teasers
    //   (<div class="action-teaser-more|less"><a href="javascript:;">), 21 pages
    // - PDF viewer controls inside .cmp-pdfviewer (#prevPage "Front", #nextPage "Back",
    //   #printPDF "Print"); the a#downloadPDF link is kept, 29 pages
    // - Hidden "Mail To" share popup inside the share widget
    //   (<div class="sharing"><div class="sharethis"><ul>..</ul><div class="email-modal">);
    //   the share links themselves are kept (social-share block)
    WebImporter.DOMUtils.remove(element, [
      '.action-teaser-more',
      '.action-teaser-less',
      '.cmp-pdfviewer > button',
      '.sharethis > .email-modal',
    ]);

    // Newsroom stories (article-page; verified live on 52 story URLs, none of these selectors
    // match on landing-page/home, content-page or accordion-detail URLs except the newsletter
    // dialog on /home/newsroom, which afterTransform's 'dialog' rule already drops):
    // - "Be The First to Know" newsletter popup: experience fragment
    //   <div class="experiencefragment"><div class="cmp-experiencefragment--story-sign-up-form">
    //   wrapping <dialog><div id="page-dialog-newsroom-form"> (38 pages; dialog alone on 1 more)
    // - "Sign up for email updates" button opening that popup
    //   (<div class="button ..."><a href="#page-dialog-newsroom-form">), 3 pages
    WebImporter.DOMUtils.remove(element, [
      '.experiencefragment:has(> .cmp-experiencefragment--story-sign-up-form)',
      'dialog:has(#page-dialog-newsroom-form)',
      '.button:has(> a[href="#page-dialog-newsroom-form"])',
    ]);

    // Hidden duplicate videos on story pages (<div class="videocomponent hide"> inside a
    // <div class="container"><div id="page-dialog-video-play-..."> shell, 3 story pages), plus
    // their now-empty container. Scoped to article pages (.container.article-2023): on home /
    // landing / content pages the same shells are left for afterTransform's page-dialog-video-play
    // rule so their parser input (and output) stays unchanged.
    if (element.querySelector('.container.article-2023')) {
      element.querySelectorAll('.videocomponent.hide').forEach((video) => {
        const container = video.parentElement && video.parentElement.closest('.container');
        video.remove();
        if (container && !(container.textContent || '').trim()
          && !container.querySelector('img, picture, video, iframe, embed, object, table, form')) {
          container.remove();
        }
      });
    }

    // Decorative separator components (<div class="separator ..."><div class="cmp-separator">
    // <hr class="cmp-separator__horizontal-rule">) - their <hr> would become a false
    // section break. 4 content pages; none on /home.
    element.querySelectorAll('.cmp-separator').forEach((sep) => {
      const wrapper = sep.parentElement && sep.parentElement.classList.contains('separator') ? sep.parentElement : sep;
      wrapper.remove();
    });

    // Landing-section filter controls (verified live; no match on home, content-page,
    // accordion-detail, article or claim pages):
    // - /home/risk-solutions/why-aig "Select Solution Type" filter: AEM options component
    //   <div class="options custom-select"> (select[name="why-aig"] + JS .select-holder /
    //   ul.select-picker with a "Search by Keyword" input) inside .why-aig-container; it only
    //   filters the solution cards below.
    // - /home/about/history decade jump control: <div class="options"> with
    //   select[name="AIG Timeline"] ("Select Decade", 2020s..1920s) inside .aig-timeline. Its option
    //   values match the decade carousel ids, so it must go before convertDropdowns.
    WebImporter.DOMUtils.remove(element, [
      '.why-aig-container .options.custom-select',
      '.aig-timeline .options:has(select.cmp-form-options__field--drop-down)',
    ]);

    convertDropdowns(element);

    // Title-only teasers whose only text is a pretitle (e.g. "Risk Solutions" above the tabs)
    // are visual section headings on the source: author them as <h2>.
    element.querySelectorAll('.cmp-teaser__content').forEach((content) => {
      const pretitle = content.querySelector(':scope > .cmp-teaser__pretitle');
      if (!pretitle || content.querySelector('.cmp-teaser__title, .cmp-teaser__description, .cmp-teaser__action-container')) return;
      const h2 = element.ownerDocument.createElement('h2');
      h2.textContent = pretitle.textContent.trim();
      pretitle.replaceWith(h2);
    });
  }

  if (hookName === TransformHook.afterTransform) {
    // Header / footer experience fragments:
    // <div class="experiencefragment"><div class="cmp-experiencefragment cmp-experiencefragment--header|--footer">
    element.querySelectorAll('.cmp-experiencefragment--header, .cmp-experiencefragment--footer').forEach((xf) => {
      const wrapper = xf.closest('.experiencefragment');
      (wrapper || xf).remove();
    });

    // Hidden video dialog containers (#page-dialog-video-play, -eric-andersen, -eric-nbc)
    // and hidden video trigger markers (#video_trigger_hero, _promo-1, _promo-2).
    // Remove their wrapping <div class="container ..."> too, so no empty shells remain.
    element.querySelectorAll('[id^="page-dialog-video-play"], [id^="video_trigger_"]').forEach((el) => {
      const wrapper = el.parentElement && el.parentElement.classList.contains('container') ? el.parentElement : el;
      wrapper.remove();
    });

    // Hidden video player overlays (<div class="video-popup" role="dialog"> with close button
    // span.cls-modal) and remaining hidden <dialog> modals (empty dialog.container.dialog
    // inside .aig-video-vertical). Header/footer dialogs and the back-to-top
    // (span.hide-BackToTop) live inside the XFs removed above.
    WebImporter.DOMUtils.remove(element, [
      '.video-popup',
      'dialog',
    ]);

    // Remaining global chrome / non-authorable leftovers
    WebImporter.DOMUtils.remove(element, [
      'header',
      'footer',
      '#teconsent',
      'link',
      'noscript',
      'iframe',
    ]);

    // Empty spacer containers (no text, no media), e.g. empty
    // <div class="container responsivegrid aiglightgray nobottomspace notopspace"> bands
    // (23 top-level empties on 19 content pages). Deepest first so emptied parents go too.
    [...element.querySelectorAll('.container')].reverse().forEach((c) => {
      if ((c.textContent || '').trim()) return;
      if (c.querySelector('img, picture, video, iframe, embed, object, table, form, hr')) return;
      c.remove();
    });
  }
}
