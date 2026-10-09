/* eslint-disable */
/* global WebImporter */

// PARSER IMPORTS
import heroFadeParser from './parsers/hero-fade.js';
import cardsTeaserParser from './parsers/cards-teaser.js';
import tabsRiskParser from './parsers/tabs-risk.js';
import columnsMediaParser from './parsers/columns-media.js';
import columnsFeaturedParser from './parsers/columns-featured.js';

// TRANSFORMER IMPORTS
import aigCleanupTransformer from './transformers/aig-cleanup.js';
import aigSectionsTransformer from './transformers/aig-sections.js';

// PARSER REGISTRY
const parsers = {
  'hero-fade': heroFadeParser,
  'cards-teaser': cardsTeaserParser,
  'tabs-risk': tabsRiskParser,
  'columns-media': columnsMediaParser,
  'columns-featured': columnsFeaturedParser,
};

// PAGE TEMPLATE CONFIGURATION - Embedded from page-templates.json
const PAGE_TEMPLATE = {
  "name": "home",
  "description": "AIG home page: fade hero, featured teasers, about text, risk-solution tabs, alternating media/text stories, newsroom featured story, careers fade banner",
  "urls": [
    "https://www.aig.com/home"
  ],
  "blocks": [
    {
      "name": "hero-fade",
      "instances": [
        ".container.hero-banner-with-fade"
      ]
    },
    {
      "name": "cards-teaser",
      "instances": [
        ".hero-banner-2022 .container.paleblue"
      ]
    },
    {
      "name": "tabs-risk",
      "instances": [
        ".container.aig-tabs .tabs.panelcontainer"
      ]
    },
    {
      "name": "columns-media",
      "instances": [
        ".container.aig-video.two-column-grid",
        ".teaserflex.cta-with-image:not(.aig-featured-story)"
      ]
    },
    {
      "name": "columns-featured",
      "instances": [
        ".teaserflex.aig-featured-story"
      ]
    }
  ],
  "sections": [
    {
      "id": "1",
      "name": "Hero - Salford City",
      "selector": [
        ".container.hero-banner-with-fade.nobottomspace",
        "main.responsivegrid > .aem-Grid > .container:nth-child(1)"
      ],
      "style": null,
      "blocks": [
        "hero-fade"
      ],
      "defaultContent": []
    },
    {
      "id": "2",
      "name": "Featured teasers",
      "selector": [
        ".container.hero-banner-2022"
      ],
      "style": "light-blue",
      "blocks": [
        "cards-teaser"
      ],
      "defaultContent": []
    },
    {
      "id": "3",
      "name": "About AIG",
      "selector": [
        "main.responsivegrid > .aem-Grid > .container:has(> .cmp-container > .aem-Grid > .two-thirdwidth)",
        "main.responsivegrid > .aem-Grid > .container:nth-child(3)"
      ],
      "style": "narrow, centered",
      "blocks": [],
      "defaultContent": [
        ".two-thirdwidth .cmp-teaser__title",
        ".two-thirdwidth .cmp-teaser__description"
      ]
    },
    {
      "id": "4",
      "name": "Risk Solutions tabs",
      "selector": [
        "main.responsivegrid > .aem-Grid > .container.paleblue",
        "main.responsivegrid > .aem-Grid > .container:nth-child(4)"
      ],
      "style": "pale-blue, centered",
      "blocks": [
        "tabs-risk"
      ],
      "defaultContent": [
        ".aig-tabs .cmp-teaser__pretitle"
      ]
    },
    {
      "id": "5",
      "name": "AIG Performance & Initiatives",
      "selector": [
        "main.responsivegrid > .aem-Grid > .container:has(> .cmp-container > .aem-Grid > .title)",
        "main.responsivegrid > .aem-Grid > .container:nth-child(5)"
      ],
      "style": "centered",
      "blocks": [
        "columns-media"
      ],
      "defaultContent": [
        ".cmp-title__text"
      ]
    },
    {
      "id": "6",
      "name": "AIG Newsroom",
      "selector": [
        ".container.flexbox-container.addbottom16"
      ],
      "style": "centered",
      "blocks": [
        "columns-featured"
      ],
      "defaultContent": [
        ".addbottom16 .teaserflex.titlecenter .cmp-teaser__title"
      ]
    },
    {
      "id": "7",
      "name": "Careers banner",
      "selector": [
        ".container.hero-banner-with-fade:not(.nobottomspace)",
        "main.responsivegrid > .aem-Grid > .container:nth-child(9)"
      ],
      "style": null,
      "blocks": [
        "hero-fade"
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
