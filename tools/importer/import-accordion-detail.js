/* eslint-disable */
/* global WebImporter */

// PARSER IMPORTS
import formParser from './parsers/form.js';
import heroFadeParser from './parsers/hero-fade.js';
import breadcrumbsParser from './parsers/breadcrumbs.js';
import columnsQuicklinksParser from './parsers/columns-quicklinks.js';
import accordionParser from './parsers/accordion.js';
import columnsFeaturedParser from './parsers/columns-featured.js';
import columnsMediaParser from './parsers/columns-media.js';
import columnsTextParser from './parsers/columns-text.js';
import contactCardParser from './parsers/contact-card.js';
import downloadsParser from './parsers/downloads.js';

// TRANSFORMER IMPORTS
import aigCleanupTransformer from './transformers/aig-cleanup.js';
import aigSectionsTransformer from './transformers/aig-sections.js';

// PARSER REGISTRY
const parsers = {
  'form': formParser,
  'hero-fade': heroFadeParser,
  'breadcrumbs': breadcrumbsParser,
  'columns-quicklinks': columnsQuicklinksParser,
  'accordion': accordionParser,
  'columns-featured': columnsFeaturedParser,
  'columns-media': columnsMediaParser,
  'columns-text': columnsTextParser,
  'contact-card': contactCardParser,
  'downloads': downloadsParser,
};

// PAGE TEMPLATE CONFIGURATION - Embedded from page-templates.json
const PAGE_TEMPLATE = {
  "name": "accordion-detail",
  "description": "Claims guide / service detail page: breadcrumb, centered page title with intro text, document links and a stacked expandable accordion list; member variants add a fade hero with quick links, featured/video rows and carousels, claims contact cards, contact/locator forms and downloads",
  "urls": [
    "https://www.aig.com/home/about/aig-womens-open",
    "https://www.aig.com/home/claims/report-a-claim/casualty-multinational",
    "https://www.aig.com/home/claims/report-a-claim/lexington-natural-disaster",
    "https://www.aig.com/home/claims/report-a-claim/lexington-programs",
    "https://www.aig.com/home/claims/report-a-claim/workers-compensation-construction-risk",
    "https://www.aig.com/home/claims/workers-compensation-claims/alabama-workers-compensation",
    "https://www.aig.com/home/claims/workers-compensation-claims/alaska-workers-compensation",
    "https://www.aig.com/home/claims/workers-compensation-claims/arizona-workers-compensation",
    "https://www.aig.com/home/claims/workers-compensation-claims/arkansas-workers-compensation",
    "https://www.aig.com/home/claims/workers-compensation-claims/california-workers-compensation",
    "https://www.aig.com/home/claims/workers-compensation-claims/colorado-workers-compensation",
    "https://www.aig.com/home/claims/workers-compensation-claims/connecticut-workers-compensation",
    "https://www.aig.com/home/claims/workers-compensation-claims/delaware-workers-compensation",
    "https://www.aig.com/home/claims/workers-compensation-claims/district-of-columbia-workers-compensation",
    "https://www.aig.com/home/claims/workers-compensation-claims/florida-workers-compensation",
    "https://www.aig.com/home/claims/workers-compensation-claims/georgia-workers-compensation",
    "https://www.aig.com/home/claims/workers-compensation-claims/hawaii-workers-compensation",
    "https://www.aig.com/home/claims/workers-compensation-claims/idaho-workers-compensation",
    "https://www.aig.com/home/claims/workers-compensation-claims/illinois-workers-compensation",
    "https://www.aig.com/home/claims/workers-compensation-claims/indiana-workers-compensation",
    "https://www.aig.com/home/claims/workers-compensation-claims/iowa-workers-compensation",
    "https://www.aig.com/home/claims/workers-compensation-claims/kansas-workers-compensation",
    "https://www.aig.com/home/claims/workers-compensation-claims/kentucky-workers-compensation",
    "https://www.aig.com/home/claims/workers-compensation-claims/louisiana-workers-compensation",
    "https://www.aig.com/home/claims/workers-compensation-claims/maine-workers-compensation",
    "https://www.aig.com/home/claims/workers-compensation-claims/maryland-workers-compensation",
    "https://www.aig.com/home/claims/workers-compensation-claims/massachusetts-workers-compensation",
    "https://www.aig.com/home/claims/workers-compensation-claims/michigan-workers-compensation",
    "https://www.aig.com/home/claims/workers-compensation-claims/minnesota-workers-compensation",
    "https://www.aig.com/home/claims/workers-compensation-claims/mississippi-workers-compensation",
    "https://www.aig.com/home/claims/workers-compensation-claims/missouri-workers-compensation",
    "https://www.aig.com/home/claims/workers-compensation-claims/montana-workers-compensation",
    "https://www.aig.com/home/claims/workers-compensation-claims/nebraska-workers-compensation",
    "https://www.aig.com/home/claims/workers-compensation-claims/nevada-workers-compensation",
    "https://www.aig.com/home/claims/workers-compensation-claims/new-hampshire-workers-compensation",
    "https://www.aig.com/home/claims/workers-compensation-claims/new-jersey-workers-compensation",
    "https://www.aig.com/home/claims/workers-compensation-claims/new-mexico-workers-compensation",
    "https://www.aig.com/home/claims/workers-compensation-claims/new-york-workers-compensation",
    "https://www.aig.com/home/claims/workers-compensation-claims/north-carolina-workers-compensation",
    "https://www.aig.com/home/claims/workers-compensation-claims/north-dakota-workers-compensation",
    "https://www.aig.com/home/claims/workers-compensation-claims/ohio-workers-compensation",
    "https://www.aig.com/home/claims/workers-compensation-claims/oklahoma-workers-compensation",
    "https://www.aig.com/home/claims/workers-compensation-claims/oregon-workers-compensation",
    "https://www.aig.com/home/claims/workers-compensation-claims/pennsylvania-workers-compensation",
    "https://www.aig.com/home/claims/workers-compensation-claims/rhode-island-workers-compensation",
    "https://www.aig.com/home/claims/workers-compensation-claims/south-carolina-workers-compensation",
    "https://www.aig.com/home/claims/workers-compensation-claims/south-dakota-workers-compensation",
    "https://www.aig.com/home/claims/workers-compensation-claims/tennessee-workers-compensation",
    "https://www.aig.com/home/claims/workers-compensation-claims/texas-workers-compensation",
    "https://www.aig.com/home/claims/workers-compensation-claims/utah-workers-compensation",
    "https://www.aig.com/home/claims/workers-compensation-claims/vermont-workers-compensation",
    "https://www.aig.com/home/claims/workers-compensation-claims/virginia-workers-compensation",
    "https://www.aig.com/home/claims/workers-compensation-claims/washington-workers-compensation",
    "https://www.aig.com/home/claims/workers-compensation-claims/west-virginia-workers-compensation",
    "https://www.aig.com/home/claims/workers-compensation-claims/wisconsin-workers-compensation",
    "https://www.aig.com/home/claims/workers-compensation-claims/wyoming-workers-compensation",
    "https://www.aig.com/home/risk-solutions/business/casualty/environmental/environmental-response-services",
    "https://www.aig.com/home/risk-solutions/business/casualty/environmental/pollution-incident-and-environmental-response-program/pier-specialist-search",
    "https://www.aig.com/home/risk-solutions/business/casualty/safety-concierge-services",
    "https://www.aig.com/home/risk-solutions/business/cyber/affirmative-cyber",
    "https://www.aig.com/home/risk-solutions/business/cyber/cybermatics",
    "https://www.aig.com/home/risk-solutions/business/l/accident-and-health-licensing-and-appointment-requirements",
    "https://www.aig.com/home/risk-solutions/business/l/commercial-direct-bill-services",
    "https://www.aig.com/home/risk-solutions/business/l/helpful-resources",
    "https://www.aig.com/home/risk-solutions/business/l/surplus-lines-direct-bill-services",
    "https://www.aig.com/home/risk-solutions/individual/premier-client-solutions/make-a-payment"
  ],
  "sectionMode": "auto",
  "blocks": [
    {
      "name": "form",
      "instances": [
        "#main form.cmp-form:has(textarea):not(dialog *)"
      ]
    },
    {
      "name": "hero-fade",
      "instances": [
        "main .container.hero-banner-with-fade"
      ]
    },
    {
      "name": "breadcrumbs",
      "instances": [
        "main > .aem-Grid > .breadcrumb"
      ]
    },
    {
      "name": "columns-quicklinks",
      "instances": [
        "main .container.flexbox-container:has(> .cmp-container > .aem-Grid > .quick-links)"
      ]
    },
    {
      "name": "accordion",
      "instances": [
        "main .accordion.panelcontainer:not(.cmp-tabs *)"
      ]
    },
    {
      "name": "columns-featured",
      "instances": [
        "main .teaserflex.cta-with-image.lightblue"
      ]
    },
    {
      "name": "columns-media",
      "instances": [
        "main .container.aig-video.two-column-grid:has(.videocomponent)"
      ]
    },
    {
      "name": "columns-text",
      "instances": [
        "main .container.aig-carousel"
      ]
    },
    {
      "name": "contact-card",
      "instances": [
        "main .container.flexbox-container:has(> .cmp-container > .aem-Grid > .text.aig-claims-card)"
      ]
    },
    {
      "name": "downloads",
      "instances": [
        "main .aem-Grid:has(> .download):not(.accordion *):not(.container:has(~ .quick-links) *)"
      ]
    }
  ],
  "sections": [
    {
      "id": "1",
      "name": "Breadcrumb trail",
      "selector": [
        "main > .aem-Grid > .breadcrumb"
      ],
      "style": null,
      "blocks": [
        "breadcrumbs"
      ],
      "defaultContent": []
    },
    {
      "id": "2",
      "name": "Claims guide body (title, intro, document links, accordion)",
      "selector": [
        "main > .aem-Grid > .container.flexbox-container:has(.accordion.panelcontainer)"
      ],
      "style": null,
      "blocks": [
        "accordion"
      ],
      "defaultContent": [
        ".title .cmp-title__text",
        ".teaser.coreblueheading .cmp-teaser__description",
        ".text.doc_downloads",
        ".text:not(.doc_downloads)",
        ".teaserflex .cmp-teaser__description"
      ]
    },
    {
      "id": "3",
      "name": "Fade hero",
      "selector": [
        "main > .aem-Grid > .container.hero-banner-with-fade"
      ],
      "style": "dark",
      "blocks": [
        "hero-fade"
      ],
      "defaultContent": []
    },
    {
      "id": "4",
      "name": "Intro with quick-links sidebar",
      "selector": [
        "main > .aem-Grid > .container.flexbox-container:has(> .cmp-container > .aem-Grid > .quick-links)"
      ],
      "style": null,
      "blocks": [
        "columns-quicklinks"
      ],
      "defaultContent": []
    },
    {
      "id": "5",
      "name": "Featured image/text rows",
      "selector": [
        "main > .aem-Grid > .container.flexbox-container:has(> .cmp-container > .aem-Grid > .cta-with-image.lightblue)"
      ],
      "style": null,
      "blocks": [
        "columns-featured"
      ],
      "defaultContent": []
    },
    {
      "id": "6",
      "name": "Video/text rows",
      "selector": [
        "main > .aem-Grid > .container.aig-video.two-column-grid"
      ],
      "style": null,
      "blocks": [
        "columns-media"
      ],
      "defaultContent": []
    },
    {
      "id": "7",
      "name": "Timeline / article-card carousel",
      "selector": [
        "main > .aem-Grid > .container:has(.container.aig-carousel.aig-carousel-3-col)"
      ],
      "style": "centered",
      "blocks": [
        "columns-text"
      ],
      "defaultContent": [
        ".teaserflex.titlecenter .cmp-teaser__title"
      ]
    },
    {
      "id": "8",
      "name": "At a Glance carousel band",
      "selector": [
        "main > .aem-Grid > .container:has(> .cmp-container > .aem-Grid > .container.aig-carousel:not(.aig-carousel-3-col))"
      ],
      "style": "dark, centered",
      "blocks": [
        "columns-text"
      ],
      "defaultContent": [
        ".title.whiteheading .cmp-title__text"
      ]
    },
    {
      "id": "9",
      "name": "Claims contact card band",
      "selector": [
        "main > .aem-Grid > .container.aiglightgray:has(.aig-claims-card)"
      ],
      "style": "light",
      "blocks": [
        "contact-card"
      ],
      "defaultContent": []
    },
    {
      "id": "10",
      "name": "Light-grey band (locator form / text)",
      "selector": [
        "main > .aem-Grid > .container.aiglightgray:not(:has(.aig-claims-card))"
      ],
      "style": "light",
      "blocks": [],
      "defaultContent": [
        ".title .cmp-title__text",
        ".teaserflex .cmp-teaser__title",
        ".teaserflex .cmp-teaser__description",
        ".text .cmp-text"
      ]
    },
    {
      "id": "11",
      "name": "Contact form",
      "selector": [
        "main > .aem-Grid > .container.flexbox-container:has(form.cmp-form)"
      ],
      "style": null,
      "blocks": [],
      "defaultContent": []
    },
    {
      "id": "12",
      "name": "Downloadable materials",
      "selector": [
        "main > .aem-Grid > .container.aig-archive.aigpalegray"
      ],
      "style": "grey",
      "blocks": [
        "downloads"
      ],
      "defaultContent": [
        ".aig-archive .teaserflex .cmp-teaser__title"
      ]
    },
    {
      "id": "13",
      "name": "Text / centered CTA band",
      "selector": [
        "main > .aem-Grid > .container.flexbox-container:not(:has(.accordion, .quick-links, .cta-with-image, form, .aig-claims-card, .aig-carousel))"
      ],
      "style": null,
      "blocks": [],
      "defaultContent": [
        ".teaserflex .cmp-teaser__title",
        ".teaserflex .cmp-teaser__description",
        ".center_cta .cmp-teaser__action-link",
        ".button .cmp-button"
      ]
    }
  ]
};

// TRANSFORMER REGISTRY - cleanup first, then section breaks/metadata
const transformers = [
  aigCleanupTransformer,
  ...(PAGE_TEMPLATE.sections && PAGE_TEMPLATE.sections.length > 1 ? [aigSectionsTransformer] : []),
];

/**
 * Execute all page transformers for a specific hook
 * @param {string} hookName - 'beforeTransform' or 'afterTransform'
 * @param {Element} element - The DOM element to transform
 * @param {Object} payload - { document, url, html, params }
 */
function executeTransformers(hookName, element, payload) {
  const enhancedPayload = { ...payload, template: PAGE_TEMPLATE };
  transformers.forEach((transformerFn) => {
    try {
      transformerFn.call(null, hookName, element, enhancedPayload);
    } catch (e) {
      console.error(`Transformer failed at ${hookName}:`, e);
    }
  });
}

/**
 * Find all blocks on the page based on the embedded template configuration
 * @param {Document} document - The DOM document
 * @param {Object} template - The embedded PAGE_TEMPLATE object
 * @returns {Array} Block instances found on the page
 */
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
          section: blockDef.section || null,
        });
      });
    });
  });
  console.log(`Found ${pageBlocks.length} block instances on page`);
  return pageBlocks;
}

export default {
  transform: (payload) => {
    const { document, url, params } = payload;
    const main = document.body;

    // 1. Initial cleanup + section break markers
    executeTransformers('beforeTransform', main, payload);

    // 2. Find blocks on page
    const pageBlocks = findBlocksOnPage(document, PAGE_TEMPLATE);

    // 3. Parse each block (skip elements already replaced by an earlier parser)
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

    // 4. Final cleanup + section metadata
    executeTransformers('afterTransform', main, payload);

    // 5. WebImporter built-in rules
    const hr = document.createElement('hr');
    main.appendChild(hr);
    WebImporter.rules.createMetadata(main, document);
    WebImporter.rules.transformBackgroundImages(main, document);
    WebImporter.rules.adjustImageUrls(main, url, params.originalURL);

    // 6. Sanitized path (root URL maps to /index)
    const rawPath = new URL(params.originalURL).pathname
      .replace(/\/$/, '')
      .replace(/\.html?$/, '');
    const path = WebImporter.FileUtils.sanitizePath(rawPath === '' ? '/index' : rawPath);

    return [{
      element: main,
      path,
      report: {
        title: document.title,
        template: PAGE_TEMPLATE.name,
        blocks: pageBlocks.map((b) => b.name),
      },
    }];
  },
};
