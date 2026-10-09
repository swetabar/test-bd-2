/* eslint-disable */
/* global WebImporter */

// PARSER IMPORTS
import formParser from './parsers/form.js';
import breadcrumbsParser from './parsers/breadcrumbs.js';
import contactCardParser from './parsers/contact-card.js';

// TRANSFORMER IMPORTS
import aigCleanupTransformer from './transformers/aig-cleanup.js';
import aigSectionsTransformer from './transformers/aig-sections.js';

// PARSER REGISTRY
const parsers = {
  'form': formParser,
  'breadcrumbs': breadcrumbsParser,
  'contact-card': contactCardParser,
};

// PAGE TEMPLATE CONFIGURATION - Embedded from page-templates.json
const PAGE_TEMPLATE = {
  "name": "claim-contact",
  "description": "Centered page title over a gray band containing a single short contact card (phone, fax, email, mailing address)",
  "urls": [
    "https://www.aig.com/home/claims/report-a-claim/casualty-cat-excess",
    "https://www.aig.com/home/claims/report-a-claim/casualty-defense-base-act",
    "https://www.aig.com/home/claims/report-a-claim/casualty-environmental-pollution-toxic-tort",
    "https://www.aig.com/home/claims/report-a-claim/casualty-excess",
    "https://www.aig.com/home/claims/report-a-claim/casualty-excess-liability-catastrophic",
    "https://www.aig.com/home/claims/report-a-claim/casualty-healthcare-liability",
    "https://www.aig.com/home/claims/report-a-claim/casualty-toxic-tort-environmental-casualty-mass-tort",
    "https://www.aig.com/home/claims/report-a-claim/casualty-truck-insurance-group",
    "https://www.aig.com/home/claims/report-a-claim/financial-lines-bermuda",
    "https://www.aig.com/home/claims/report-a-claim/financial-lines-canada",
    "https://www.aig.com/home/claims/report-a-claim/financial-lines-executive-liability",
    "https://www.aig.com/home/claims/report-a-claim/global-risk-solutions",
    "https://www.aig.com/home/claims/report-a-claim/lexington-inland-marine",
    "https://www.aig.com/home/claims/report-a-claim/lexington-non-property-architects-and-engineers",
    "https://www.aig.com/home/claims/report-a-claim/lexington-non-property-employment-practices-and-management-liability",
    "https://www.aig.com/home/claims/report-a-claim/lexington-non-property-excess-general-liability",
    "https://www.aig.com/home/claims/report-a-claim/lexington-non-property-healthcare-liability",
    "https://www.aig.com/home/claims/report-a-claim/lexington-non-property-homeowner-catastrophe",
    "https://www.aig.com/home/claims/report-a-claim/lexington-non-property-homeowner-lexelite-preferred-concierge",
    "https://www.aig.com/home/claims/report-a-claim/lexington-non-property-homeowner-non-catastrophe",
    "https://www.aig.com/home/claims/report-a-claim/lexington-non-property-primary-general-liability",
    "https://www.aig.com/home/claims/report-a-claim/lexington-non-property-speciality-professional-liability",
    "https://www.aig.com/home/claims/report-a-claim/personal-lines-accident-and-health",
    "https://www.aig.com/home/claims/report-a-claim/personal-lines-accident-and-health-canada",
    "https://www.aig.com/home/claims/report-a-claim/personal-lines-accident-and-health-jockey-program",
    "https://www.aig.com/home/claims/report-a-claim/personal-lines-accident-and-health-submissions",
    "https://www.aig.com/home/claims/report-a-claim/personal-lines-private-client-group",
    "https://www.aig.com/home/claims/report-a-claim/personal-lines-travel-guard",
    "https://www.aig.com/home/claims/report-a-claim/property-commercial",
    "https://www.aig.com/home/claims/report-a-claim/property-commercial-non-catastrophe-and-catastrophe-london",
    "https://www.aig.com/home/claims/report-a-claim/specialty-energy",
    "https://www.aig.com/home/claims/report-a-claim/specialty-marine",
    "https://www.aig.com/home/claims/report-a-claim/specialty-political-risk",
    "https://www.aig.com/home/claims/report-a-claim/specialty-surety",
    "https://www.aig.com/home/claims/report-a-claim/specialty-trade-credit",
    "https://www.aig.com/home/claims/report-a-claim/workers-compensation-excess"
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
      "name": "breadcrumbs",
      "instances": [
        "main > .aem-Grid > .breadcrumb"
      ]
    },
    {
      "name": "contact-card",
      "instances": [
        "main .container.flexbox-container:has(> .cmp-container > .aem-Grid > .text.aig-claims-card)"
      ]
    }
  ],
  "sections": [
    {
      "id": "1",
      "name": "Title",
      "selector": [
        "main > .aem-Grid > .breadcrumb"
      ],
      "style": null,
      "blocks": [
        "breadcrumbs"
      ],
      "defaultContent": [
        "main > .aem-Grid > .title"
      ]
    },
    {
      "id": "2",
      "name": "Contact band",
      "selector": [
        "main > .aem-Grid > .container.aiglightgray:has(.aig-claims-card)"
      ],
      "style": "light",
      "blocks": [
        "contact-card"
      ],
      "defaultContent": []
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
