/* eslint-disable */
/* global WebImporter */

// PARSER IMPORTS
import heroArticleParser from './parsers/hero-article.js';
import socialShareParser from './parsers/social-share.js';
import quoteParser from './parsers/quote.js';
import cardsRelatedParser from './parsers/cards-related.js';
import videoParser from './parsers/video.js';

// TRANSFORMER IMPORTS
import aigCleanupTransformer from './transformers/aig-cleanup.js';
import aigSectionsTransformer from './transformers/aig-sections.js';

// PARSER REGISTRY
const parsers = {
  'hero-article': heroArticleParser,
  'social-share': socialShareParser,
  'quote': quoteParser,
  'cards-related': cardsRelatedParser,
  'video': videoParser,
};

// PAGE TEMPLATE CONFIGURATION - Embedded from page-templates.json
const PAGE_TEMPLATE = {
  "name": "article-page",
  "description": "Story/article layout with full-width image, headline, date and share links, long rich-text body and related-content cards; also listing-style pages with tabs and profile cards",
  "urls": [
    "https://www.aig.com/home/investor-relations/aig-investor-day-2025",
    "https://www.aig.com/home/newsroom/stories/2024-aig-womens-open-wins-the-lpga-s-gold-driver-award",
    "https://www.aig.com/home/newsroom/stories/a-week-to-remember-2026-aig-womens-open",
    "https://www.aig.com/home/newsroom/stories/aig-achieves-financial-strength-rating-upgrades-from-s-and-p-global-and-moody-s",
    "https://www.aig.com/home/newsroom/stories/aig-becomes-strategic-investor-and-global-partner-of-the-salford-city-football-club",
    "https://www.aig.com/home/newsroom/stories/aig-brings-women-and-business-leaders-together-through-golf",
    "https://www.aig.com/home/newsroom/stories/aig-colleagues-share-how-they-meet-the-moment--on-and-off-the-golf-course",
    "https://www.aig.com/home/newsroom/stories/aig-deepens-long-term-commitment-to-salford-city",
    "https://www.aig.com/home/newsroom/stories/aig-energy-teams-expand-borregaard-portfolio",
    "https://www.aig.com/home/newsroom/stories/aig-investor-day-2025",
    "https://www.aig.com/home/newsroom/stories/aig-is-honored-as-a-top-early-career-employer",
    "https://www.aig.com/home/newsroom/stories/aig-is-making-it-easier-for-brokers-and-clients-to-do-business-with-us",
    "https://www.aig.com/home/newsroom/stories/aig-is-supporting-the-health-and-well-being-of-customers-through-aig-virtual-care",
    "https://www.aig.com/home/newsroom/stories/aig-leaders-discuss-gen-ai-and-atlanta-innovation-hub",
    "https://www.aig.com/home/newsroom/stories/aig-leaders-tee-up-lessons-from-golf-course",
    "https://www.aig.com/home/newsroom/stories/aig-raises-the-standard-in-women-s-golf",
    "https://www.aig.com/home/newsroom/stories/aig-s-early-career-colleagues-give-back",
    "https://www.aig.com/home/newsroom/stories/aig-suspends-pac-activity",
    "https://www.aig.com/home/newsroom/stories/aig-unprecedented-turnaround",
    "https://www.aig.com/home/newsroom/stories/an-aig-leaders-commitment-to-community-recovery",
    "https://www.aig.com/home/newsroom/stories/building-resilience-in-a-rapidly-changing-landscape",
    "https://www.aig.com/home/newsroom/stories/building-skills-for-the-future",
    "https://www.aig.com/home/newsroom/stories/colleague-spotlight--vanessa-gilmartin",
    "https://www.aig.com/home/newsroom/stories/como-aig-iberia-esta-ayudando-a-las-pequenas-y-medianas-empresas-en-la-gestion-de-sus-riesgos",
    "https://www.aig.com/home/newsroom/stories/data-centers-aig-powering-risk-solutions-in-the-ai-boom",
    "https://www.aig.com/home/newsroom/stories/delivering-for-our-clients-when-they-need-us-most",
    "https://www.aig.com/home/newsroom/stories/empowering-the-leaders-of-tomorrow",
    "https://www.aig.com/home/newsroom/stories/for-the-second-year-in-a-row-aig-womens-open-wins-the-lpgas-gold-driver-award",
    "https://www.aig.com/home/newsroom/stories/forging-connections-for-the-next-generation",
    "https://www.aig.com/home/newsroom/stories/georgia-hall-reflects-on-aig-womens-open-progress",
    "https://www.aig.com/home/newsroom/stories/get-with-the-program",
    "https://www.aig.com/home/newsroom/stories/helping-companies-confidently-manage-cross-border-risks",
    "https://www.aig.com/home/newsroom/stories/helping-small-and-medium-sized-enterprises-realize-their-full-potential",
    "https://www.aig.com/home/newsroom/stories/how-aig-and-talbot-join-forces-to-balance-risk",
    "https://www.aig.com/home/newsroom/stories/how-aig-chairman-and-ceo-peter-zaffino-and-aig-global-ambassador",
    "https://www.aig.com/home/newsroom/stories/how-aig-empowers-multinational-clients-to-stay-ahead-of-the-game",
    "https://www.aig.com/home/newsroom/stories/how-aig-helped-umicore-manage-the-risks-of-growing-its-business",
    "https://www.aig.com/home/newsroom/stories/how-aig-is-an-ally-to-brokers-and-clients",
    "https://www.aig.com/home/newsroom/stories/how-veterans-apply-their-valuable-skills-at-aig",
    "https://www.aig.com/home/newsroom/stories/inspiring-the-next-generation-of-talent",
    "https://www.aig.com/home/newsroom/stories/keys-to-managing-the-risks-of-a-global-business-japanese",
    "https://www.aig.com/home/newsroom/stories/meeting-the-moment",
    "https://www.aig.com/home/newsroom/stories/our-summer-interns-reflect-on-the-programs-many-benefits",
    "https://www.aig.com/home/newsroom/stories/partnering-with-our-clients-and-brokers-to-navigate-evolving-risks-with-confidence",
    "https://www.aig.com/home/newsroom/stories/peter-zaffino-talks-with-nbc-about-lpgas-recognition-of-aig-womens-open",
    "https://www.aig.com/home/newsroom/stories/risks-automakers-face-as-they-reimagine-their-business",
    "https://www.aig.com/home/newsroom/stories/shaping-aig-s-future-leaders",
    "https://www.aig.com/home/newsroom/stories/taking-professional-womens-golf-to-new-heights",
    "https://www.aig.com/home/newsroom/stories/unlocking-tomorrows-opportunities-at-the-aig-client-forum-in-london",
    "https://www.aig.com/home/newsroom/stories/what-allyship-means-to-georgia-hall",
    "https://www.aig.com/home/newsroom/stories/what-it-takes-to-be-a-long-term-insurance-partner",
    "https://www.aig.com/home/newsroom/stories/working-to-resolve-your-claims-more-quickly-and-efficiently"
  ],
  "sectionMode": "auto",
  "blocks": [
    {
      "name": "hero-article",
      "instances": [
        "main > .aem-Grid > .container:has(> .cmp-container > .aem-Grid > .breadcrumb)",
        "main > .aem-Grid > .breadcrumb"
      ]
    },
    {
      "name": "social-share",
      "instances": [
        ".container.article-2023 .sharing"
      ]
    },
    {
      "name": "quote",
      "instances": [
        ".container.article-2023 .teaserflex.cta-with-image",
        ".container.article-2023 .container:has(> .cmp-container > .aem-Grid > .image + .teaserflex)"
      ]
    },
    {
      "name": "cards-related",
      "instances": [
        ".container.article-2023 .aig-autopilot"
      ]
    },
    {
      "name": "video",
      "instances": [
        "main .container.aig-video.aig-video-vertical"
      ]
    }
  ],
  "sections": [
    {
      "id": "1",
      "name": "Article hero (breadcrumb + full-width image / video poster)",
      "selector": [
        "main > .aem-Grid > .container:has(> .cmp-container > .aem-Grid > .breadcrumb)",
        "main > .aem-Grid > .breadcrumb"
      ],
      "style": null,
      "blocks": [
        "hero-article"
      ],
      "defaultContent": []
    },
    {
      "name": "Article body (headline, meta line, share icons, body text, images, pull quotes)",
      "id": "2",
      "selector": [
        ".container.article-2023",
        "main > .aem-Grid > .container:has(.container.aig-video)"
      ],
      "style": null,
      "blocks": [
        "social-share",
        "quote",
        "video"
      ],
      "defaultContent": [
        ".aigarticleheader .article-header h1",
        ".aigarticleheader .article-header h2",
        ".aigarticleheader .story_author_date",
        ".article-2023 .text .cmp-text",
        ".article-2023 .image",
        ".article-2023 .text.paleblue .cmp-text"
      ]
    },
    {
      "id": "3",
      "name": "Related content and disclaimer",
      "selector": [
        ".container.article-2023 .autopilot:has(> .aig-autopilot)"
      ],
      "style": null,
      "blocks": [
        "cards-related"
      ],
      "defaultContent": [
        ".aig-autopilot > h3",
        ".cmp-experiencefragment--article-disclaimer .cmp-text",
        ".article-2023 .autopilot ~ .text .cmp-text"
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
