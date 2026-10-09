/* eslint-disable */
/* global WebImporter */

// PARSER IMPORTS
import heroFadeParser from './parsers/hero-fade.js';
import columnsQuicklinksParser from './parsers/columns-quicklinks.js';
import columnsTextParser from './parsers/columns-text.js';
import columnsFeaturedParser from './parsers/columns-featured.js';
import cardsIconParser from './parsers/cards-icon.js';
import columnsMediaParser from './parsers/columns-media.js';
import carouselParser from './parsers/carousel.js';
import carouselTimelineParser from './parsers/carousel-timeline.js';
import accordionParser from './parsers/accordion.js';
import tabsParser from './parsers/tabs.js';
import cardsParser from './parsers/cards.js';
import quoteParser from './parsers/quote.js';
import ctaBannerParser from './parsers/cta-banner.js';
import downloadsParser from './parsers/downloads.js';
import embedParser from './parsers/embed.js';
import videoParser from './parsers/video.js';
import cardsRelatedParser from './parsers/cards-related.js';

// TRANSFORMER IMPORTS
import aigCleanupTransformer from './transformers/aig-cleanup.js';
import aigSectionsTransformer from './transformers/aig-sections.js';

// PARSER REGISTRY
const parsers = {
  'hero-fade': heroFadeParser,
  'columns-quicklinks': columnsQuicklinksParser,
  'columns-text': columnsTextParser,
  'columns-featured': columnsFeaturedParser,
  'cards-icon': cardsIconParser,
  'columns-media': columnsMediaParser,
  'carousel': carouselParser,
  'carousel-timeline': carouselTimelineParser,
  'accordion': accordionParser,
  'tabs': tabsParser,
  'cards': cardsParser,
  'quote': quoteParser,
  'cta-banner': ctaBannerParser,
  'downloads': downloadsParser,
  'embed': embedParser,
  'video': videoParser,
  'cards-related': cardsRelatedParser,
};

// PAGE TEMPLATE CONFIGURATION - Embedded from page-templates.json
const PAGE_TEMPLATE = {
  "name": "landing-section",
  "description": "Section landing page with full-width hero, promotional card/teaser grids, tabbed or media columns and featured content bands",
  "urls": [
    "https://www.aig.com/home/about",
    "https://www.aig.com/home/about/corporate-responsibility",
    "https://www.aig.com/home/about/corporate-responsibility/aig-gives-back",
    "https://www.aig.com/home/about/corporate-responsibility/culture-and-inclusion",
    "https://www.aig.com/home/about/corporate-responsibility/culture-and-inclusion/employee-resource-groups",
    "https://www.aig.com/home/about/corporate-responsibility/sustainability",
    "https://www.aig.com/home/about/history",
    "https://www.aig.com/home/app-and-web-portal",
    "https://www.aig.com/home/careers",
    "https://www.aig.com/home/careers/benefits",
    "https://www.aig.com/home/careers/experienced-professionals",
    "https://www.aig.com/home/careers/life-at-aig",
    "https://www.aig.com/home/careers/purpose-and-values",
    "https://www.aig.com/home/careers/students-and-graduates",
    "https://www.aig.com/home/claims",
    "https://www.aig.com/home/contact",
    "https://www.aig.com/home/investor-relations",
    "https://www.aig.com/home/newsroom",
    "https://www.aig.com/home/risk-solutions",
    "https://www.aig.com/home/risk-solutions/business",
    "https://www.aig.com/home/risk-solutions/business/accident-and-health/aig-travel-protect",
    "https://www.aig.com/home/risk-solutions/individual",
    "https://www.aig.com/home/risk-solutions/individual/travel-guard",
    "https://www.aig.com/home/risk-solutions/why-aig"
  ],
  "sectionMode": "auto",
  "blocks": [
    {
      "name": "hero-fade",
      "instances": [
        "main .container.hero-banner-with-fade"
      ]
    },
    {
      "name": "columns-quicklinks",
      "instances": [
        "main .container.flexbox-container:has(> .cmp-container > .aem-Grid > .quick-links)"
      ]
    },
    {
      "name": "columns-text",
      "instances": [
        "main .container.aig-carousel:not(.aig-photo-panel-container *):not(.aig-timeline *):not(.aig-annual-card-container *):not(:has(.aig-productcard)):not(:has(.aig-article-card))",
        "main .container.aig-carousel:has(.aig-article-card):not(:has(.aig-article-card img, .aig-article-card a[href]))"
      ]
    },
    {
      "name": "columns-featured",
      "instances": [
        "main .teaserflex.cta-with-image.lightblue:not(.stories *)",
        "main .container.hero-banner-video"
      ]
    },
    {
      "name": "cards-icon",
      "instances": [
        "main .container.aig-carousel:has(.aig-productcard)"
      ]
    },
    {
      "name": "columns-media",
      "instances": [
        "main .container.aig-video.two-column-grid",
        "main .teaserflex.cta-with-image:not(.lightblue):not(.aig-article-card)",
        "main .container.flexbox-container.vert-center:has(> .cmp-container > .aem-Grid > .teaserflex.dt50 + .teaserflex.dt50)"
      ]
    },
    {
      "name": "carousel",
      "instances": [
        "main .container.aig-carousel:not(.aig-timeline *):has(.aig-article-card img, .aig-article-card a[href])"
      ]
    },
    {
      "name": "carousel-timeline",
      "instances": [
        "main .container.aig-timeline"
      ]
    },
    {
      "name": "accordion",
      "instances": [
        "main .accordion.panelcontainer:not(.cmp-tabs *)"
      ]
    },
    {
      "name": "tabs",
      "instances": [
        "main .tabs.panelcontainer:not(.accordion *)"
      ]
    },
    {
      "name": "cards",
      "instances": [
        "main .container.flexbox-container:has(> .cmp-container > .aem-Grid > .container.thirdwidth .teaserflex.corebluetext)",
        "main .container.aig-solution-card"
      ]
    },
    {
      "name": "quote",
      "instances": [
        "main .teaserflex.aig-quote"
      ]
    },
    {
      "name": "cta-banner",
      "instances": [
        "main .container.coreblue .container.flexbox-container.vert-center:has(> .cmp-container > .aem-Grid > .quarterwidth)"
      ]
    },
    {
      "name": "downloads",
      "instances": [
        "main .aem-Grid:has(> .download):not(.accordion *):not(.container:has(~ .quick-links) *)",
        "main .aig-annual-card-container .container.aig-carousel"
      ]
    },
    {
      "name": "embed",
      "instances": [
        "main .embed:not(.accordion *)"
      ]
    },
    {
      "name": "video",
      "instances": [
        "main .container.flexbox-container:has(> .cmp-container > .aem-Grid > .container.aig-video.aig-video-vertical)"
      ]
    },
    {
      "name": "cards-related",
      "instances": [
        "#main .aig-autopilot",
        "main .flexcontainer:has(> .flplanscontainer)"
      ]
    }
  ],
  "sections": [
    {
      "id": "1",
      "name": "Hero (fade banner with breadcrumb)",
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
      "id": "2",
      "name": "Intro + Quick Links",
      "selector": [
        "main > .aem-Grid > .container.flexbox-container:has(> .cmp-container > .aem-Grid > .quick-links)",
        "main > .aem-Grid > .container:has(> .cmp-container > .aem-Grid > .container.flexbox-container > .cmp-container > .aem-Grid > .quick-links)"
      ],
      "style": null,
      "blocks": [
        "columns-quicklinks"
      ],
      "defaultContent": []
    },
    {
      "id": "3",
      "name": "Early Careers Programs (pale-blue text columns)",
      "selector": [
        "main > .aem-Grid > .container.paleblue:has(> .cmp-container > .aem-Grid > .container.aig-carousel-3-col)"
      ],
      "style": "pale-blue, centered",
      "blocks": [
        "columns-text"
      ],
      "defaultContent": [
        ".teaserflex.titlecenter .cmp-teaser__title",
        ".teaserflex.titlecenter .cmp-teaser__description"
      ]
    },
    {
      "id": "4",
      "name": "Navy video-story band",
      "selector": [
        "main > .aem-Grid > .container.hero-banner-video"
      ],
      "style": null,
      "blocks": [
        "columns-featured"
      ],
      "defaultContent": []
    },
    {
      "id": "5",
      "name": "Underwriting Program (pale-blue text columns)",
      "selector": [
        "main > .aem-Grid > .container.paleblue:has(> .cmp-container > .aem-Grid > .container.aig-carousel-3-col)"
      ],
      "style": "pale-blue, centered",
      "blocks": [
        "columns-text"
      ],
      "defaultContent": [
        ".teaserflex.titlecenter .cmp-teaser__title",
        ".teaserflex.titlecenter .cmp-teaser__description"
      ]
    },
    {
      "id": "6",
      "name": "Navy video-story band",
      "selector": [
        "main > .aem-Grid > .container.hero-banner-video"
      ],
      "style": null,
      "blocks": [
        "columns-featured"
      ],
      "defaultContent": []
    },
    {
      "id": "7",
      "name": "Icon cards band (Internships / A Career at AIG / Key Highlights)",
      "selector": [
        "main > .aem-Grid > .container:has(> .cmp-container > .aem-Grid > .container.aig-carousel .aig-productcard)"
      ],
      "style": "light, centered",
      "blocks": [
        "cards-icon"
      ],
      "defaultContent": [
        ".teaserflex.titlecenter .cmp-teaser__title",
        ".teaserflex.titlecenter .cmp-teaser__description",
        ".title.whiteheading .cmp-title__text"
      ]
    },
    {
      "id": "8",
      "name": "Navy video-story band",
      "selector": [
        "main > .aem-Grid > .container.hero-banner-video"
      ],
      "style": null,
      "blocks": [
        "columns-featured"
      ],
      "defaultContent": []
    },
    {
      "id": "9",
      "name": "Alternating image/text stories",
      "selector": [
        "main > .aem-Grid > .container.flexbox-container:has(> .cmp-container > .aem-Grid > .teaserflex.titlecenter:only-child)",
        "main > .aem-Grid > .container.flexbox-container:has(> .cmp-container > .teaserflex.cta-with-image, > .cmp-container > .aem-Grid > .teaserflex.cta-with-image)"
      ],
      "style": "centered",
      "blocks": [
        "columns-media",
        "columns-featured"
      ],
      "defaultContent": [
        ".teaserflex.titlecenter .cmp-teaser__title"
      ]
    },
    {
      "id": "10",
      "name": "Light-grey band (steps, video row, story row)",
      "selector": [
        "main > .aem-Grid > .container.aiglightgray"
      ],
      "style": "light",
      "blocks": [
        "columns-text",
        "columns-media"
      ],
      "defaultContent": [
        ".teaserflex.titlecenter .cmp-teaser__title",
        ".teaserflex.dttitlecoreblue .cmp-teaser__description"
      ]
    },
    {
      "id": "11",
      "name": "Card carousel band (job simulations / latest stories / photo gallery)",
      "selector": [
        "main > .aem-Grid > .container.aig-article-card-container:has(.aig-article-card img, .aig-article-card a[href])"
      ],
      "style": "pale-blue, centered",
      "blocks": [
        "carousel"
      ],
      "defaultContent": [
        ".teaserflex.titlecenter .cmp-teaser__title",
        ".teaserflex.titlecenter .cmp-teaser__description",
        ".title .cmp-title__text"
      ]
    },
    {
      "id": "12",
      "name": "FAQ accordion",
      "selector": [
        "main > .aem-Grid > .container:has(.accordion.panelcontainer:not(.cmp-tabs *))"
      ],
      "style": "centered",
      "blocks": [
        "accordion"
      ],
      "defaultContent": [
        ".teaserflex.titlecenter .cmp-teaser__title"
      ]
    },
    {
      "id": "13",
      "name": "Accommodations / EEO disclaimer text",
      "selector": [
        "main > .aem-Grid > .container.flexbox-container:has(> .cmp-container > .aem-Grid > .teaserflex:not(.titlecenter):not(.cta-with-image):only-child)",
        "main > .aem-Grid > .container.flexbox-container:has(> .cmp-container > .aem-Grid > .text:only-child)"
      ],
      "style": null,
      "blocks": [],
      "defaultContent": [
        ".teaserflex .cmp-teaser__description",
        ".text .cmp-text"
      ]
    },
    {
      "id": "14",
      "name": "Related Content",
      "selector": [
        "main > .aem-Grid > .container:has(.aig-autopilot)",
        "#main > .aem-Grid > .container:has(.aig-autopilot)",
        "main > .aem-Grid > .container:has(.flexcontainer > .flplanscontainer)"
      ],
      "style": null,
      "blocks": [
        "cards-related"
      ],
      "defaultContent": [
        ".aig-autopilot > h3"
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
