/* eslint-disable */
/* global WebImporter */

// PARSER IMPORTS
import formParser from './parsers/form.js';
import heroBannerParser from './parsers/hero-banner.js';
import breadcrumbsParser from './parsers/breadcrumbs.js';
import columnsParser from './parsers/columns.js';
import carouselLeadershipParser from './parsers/carousel-leadership.js';
import columnsQuicklinksParser from './parsers/columns-quicklinks.js';
import columnsTextParser from './parsers/columns-text.js';
import accordionParser from './parsers/accordion.js';
import columnsFeaturedParser from './parsers/columns-featured.js';
import columnsMediaParser from './parsers/columns-media.js';
import videoParser from './parsers/video.js';
import ctaBannerParser from './parsers/cta-banner.js';
import downloadsParser from './parsers/downloads.js';
import cardsRelatedParser from './parsers/cards-related.js';
import tabsParser from './parsers/tabs.js';
import cardsParser from './parsers/cards.js';
import embedParser from './parsers/embed.js';
import tableParser from './parsers/table.js';

// TRANSFORMER IMPORTS
import aigCleanupTransformer from './transformers/aig-cleanup.js';
import aigSectionsTransformer from './transformers/aig-sections.js';

// PARSER REGISTRY
const parsers = {
  'form': formParser,
  'hero-banner': heroBannerParser,
  'breadcrumbs': breadcrumbsParser,
  'columns': columnsParser,
  'carousel-leadership': carouselLeadershipParser,
  'columns-quicklinks': columnsQuicklinksParser,
  'columns-text': columnsTextParser,
  'accordion': accordionParser,
  'columns-featured': columnsFeaturedParser,
  'columns-media': columnsMediaParser,
  'video': videoParser,
  'cta-banner': ctaBannerParser,
  'downloads': downloadsParser,
  'cards-related': cardsRelatedParser,
  'tabs': tabsParser,
  'cards': cardsParser,
  'embed': embedParser,
  'table': tableParser,
};

// PAGE TEMPLATE CONFIGURATION - Embedded from page-templates.json
const PAGE_TEMPLATE = {
  "name": "content-page",
  "description": "Interior page with blue title banner, two-column intro with quick-links sidebar, stacked text sections, columns and related-content cards",
  "urls": [
    "https://www.aig.com/home/about/corporate-responsibility/political-activities-and-contributions",
    "https://www.aig.com/home/about/cyber-and-information-security",
    "https://www.aig.com/home/about/cyber-and-information-security/cyber-and-information-security-resources",
    "https://www.aig.com/home/about/cyber-and-information-security/cyber-safety-for-digital-newcomers",
    "https://www.aig.com/home/about/cyber-and-information-security/staying-safe-from-ransomware",
    "https://www.aig.com/home/about/cyber-and-information-security/supercharge-your-passwords",
    "https://www.aig.com/home/about/cyber-and-information-security/vulnerability-disclosure",
    "https://www.aig.com/home/about/disaster-notifications",
    "https://www.aig.com/home/about/leadership-and-governance/chris-schaper",
    "https://www.aig.com/home/about/leadership-and-governance/corporate-governance-documents",
    "https://www.aig.com/home/about/leadership-and-governance/courtney-leimkuhler",
    "https://www.aig.com/home/about/leadership-and-governance/diana-murphy",
    "https://www.aig.com/home/about/leadership-and-governance/ed-dandridge",
    "https://www.aig.com/home/about/leadership-and-governance/eric-andersen",
    "https://www.aig.com/home/about/leadership-and-governance/james-cole-jr",
    "https://www.aig.com/home/about/leadership-and-governance/john-chris-inglis",
    "https://www.aig.com/home/about/leadership-and-governance/john-rice",
    "https://www.aig.com/home/about/leadership-and-governance/jon-hancock",
    "https://www.aig.com/home/about/leadership-and-governance/juan-perez",
    "https://www.aig.com/home/about/leadership-and-governance/keith-walsh",
    "https://www.aig.com/home/about/leadership-and-governance/kelly-lafnitzegger",
    "https://www.aig.com/home/about/leadership-and-governance/linda-mills",
    "https://www.aig.com/home/about/leadership-and-governance/melissa-twiningdavis",
    "https://www.aig.com/home/about/leadership-and-governance/nancy-bewlay",
    "https://www.aig.com/home/about/leadership-and-governance/peter-porrino",
    "https://www.aig.com/home/about/leadership-and-governance/peter-zaffino",
    "https://www.aig.com/home/about/leadership-and-governance/rose-marie-glazer",
    "https://www.aig.com/home/about/leadership-and-governance/roshan-navagamuwa",
    "https://www.aig.com/home/about/leadership-and-governance/scott-hallworth",
    "https://www.aig.com/home/about/leadership-and-governance/thomas-stoddard",
    "https://www.aig.com/home/about/leadership-and-governance/vanessa-wittman",
    "https://www.aig.com/home/about/social-media-guidelines",
    "https://www.aig.com/home/about/supplier-relations",
    "https://www.aig.com/home/about/supplier-relations/supplier-diversity",
    "https://www.aig.com/home/about/supplier-relations/supplier-privacy-notices",
    "https://www.aig.com/home/careers/military-and-veterans",
    "https://www.aig.com/home/claims/catastrophe-preparedness",
    "https://www.aig.com/home/claims/catastrophe-preparedness/earthquakes",
    "https://www.aig.com/home/claims/catastrophe-preparedness/floods",
    "https://www.aig.com/home/claims/catastrophe-preparedness/hurricanes",
    "https://www.aig.com/home/claims/catastrophe-preparedness/wildfires",
    "https://www.aig.com/home/claims/catastrophe-preparedness/winter-storms",
    "https://www.aig.com/home/claims/claims-intelligence-series",
    "https://www.aig.com/home/claims/intellirisk",
    "https://www.aig.com/home/claims/intellirisk/contact-us",
    "https://www.aig.com/home/claims/report-a-claim",
    "https://www.aig.com/home/claims/report-a-claim/property-and-casualty-claim-reporting-guide",
    "https://www.aig.com/home/claims/report-a-claim/scan-and-submit-claims-documentation-electronically",
    "https://www.aig.com/home/claims/why-aig-claims",
    "https://www.aig.com/home/claims/workers-compensation-claims",
    "https://www.aig.com/home/claims/worldrisk-international-claims",
    "https://www.aig.com/home/investor-relations/annual-reports-and-proxy-statements",
    "https://www.aig.com/home/investor-relations/contact-us",
    "https://www.aig.com/home/investor-relations/financial-reporting-and-statutory-statements",
    "https://www.aig.com/home/investor-relations/sec-filings",
    "https://www.aig.com/home/investor-relations/stock-information",
    "https://www.aig.com/home/investor-relations/webcasts-and-presentations",
    "https://www.aig.com/home/newsroom/media-contacts",
    "https://www.aig.com/home/newsroom/news-releases",
    "https://www.aig.com/home/newsroom/stories",
    "https://www.aig.com/home/risk-solutions/business/accident-and-health",
    "https://www.aig.com/home/risk-solutions/business/accident-and-health/aig-medical-indemnity-insurance",
    "https://www.aig.com/home/risk-solutions/business/accident-and-health/corporate-risk",
    "https://www.aig.com/home/risk-solutions/business/accident-and-health/special-risk",
    "https://www.aig.com/home/risk-solutions/business/aig-programs",
    "https://www.aig.com/home/risk-solutions/business/aig-programs/new-program-ideas",
    "https://www.aig.com/home/risk-solutions/business/aig-programs/programs-loss-control-safety-bulletins",
    "https://www.aig.com/home/risk-solutions/business/aig-programs/programs-loss-control-services",
    "https://www.aig.com/home/risk-solutions/business/aig-programs/why-aig-programs",
    "https://www.aig.com/home/risk-solutions/business/casualty",
    "https://www.aig.com/home/risk-solutions/business/casualty/aig-risk-management",
    "https://www.aig.com/home/risk-solutions/business/casualty/defense-base-act",
    "https://www.aig.com/home/risk-solutions/business/casualty/environmental",
    "https://www.aig.com/home/risk-solutions/business/casualty/environmental/pollution-incident-and-environmental-response-program",
    "https://www.aig.com/home/risk-solutions/business/casualty/excess-casualty",
    "https://www.aig.com/home/risk-solutions/business/casualty/foreign-casualty",
    "https://www.aig.com/home/risk-solutions/business/casualty/primary-casualty",
    "https://www.aig.com/home/risk-solutions/business/casualty/specialty-energy-middle-market",
    "https://www.aig.com/home/risk-solutions/business/casualty/truck-insurance-group",
    "https://www.aig.com/home/risk-solutions/business/casualty/worldrisk-foreign-commercial",
    "https://www.aig.com/home/risk-solutions/business/commercial-property",
    "https://www.aig.com/home/risk-solutions/business/commercial-property/builders-risk",
    "https://www.aig.com/home/risk-solutions/business/commercial-property/retail-property",
    "https://www.aig.com/home/risk-solutions/business/cyber",
    "https://www.aig.com/home/risk-solutions/business/cyber/cyber-resiliency",
    "https://www.aig.com/home/risk-solutions/business/cyber/cyber-resiliency1",
    "https://www.aig.com/home/risk-solutions/business/excess-and-surplus-lines",
    "https://www.aig.com/home/risk-solutions/business/excess-and-surplus-lines/lexington-builders-risk",
    "https://www.aig.com/home/risk-solutions/business/excess-and-surplus-lines/lexington-casualty",
    "https://www.aig.com/home/risk-solutions/business/excess-and-surplus-lines/lexington-professional-liability-architects-and-engineers",
    "https://www.aig.com/home/risk-solutions/business/excess-and-surplus-lines/lexington-professional-liability-healthcare",
    "https://www.aig.com/home/risk-solutions/business/excess-and-surplus-lines/lexington-property",
    "https://www.aig.com/home/risk-solutions/business/excess-and-surplus-lines/lexpro",
    "https://www.aig.com/home/risk-solutions/business/excess-and-surplus-lines/western-world",
    "https://www.aig.com/home/risk-solutions/business/fronting-and-captive-services",
    "https://www.aig.com/home/risk-solutions/business/l/driver-safety",
    "https://www.aig.com/home/risk-solutions/business/l/energy-risk-consulting",
    "https://www.aig.com/home/risk-solutions/business/l/producer-compensation",
    "https://www.aig.com/home/risk-solutions/business/l/risk-engineering",
    "https://www.aig.com/home/risk-solutions/business/l/risk-engineering/fire-protection-systems-impairment-management",
    "https://www.aig.com/home/risk-solutions/business/l/risk-engineering/hot-work-management",
    "https://www.aig.com/home/risk-solutions/business/l/risk-engineering/marine-loss-control-engineering",
    "https://www.aig.com/home/risk-solutions/business/l/risk-engineering/risk-management-insights",
    "https://www.aig.com/home/risk-solutions/business/management-and-professional-liability",
    "https://www.aig.com/home/risk-solutions/business/management-and-professional-liability/aig-statement-series",
    "https://www.aig.com/home/risk-solutions/business/management-and-professional-liability/crime-and-financial-institution-bonds",
    "https://www.aig.com/home/risk-solutions/business/management-and-professional-liability/directors-and-officers-liability",
    "https://www.aig.com/home/risk-solutions/business/management-and-professional-liability/employment-practices-liability",
    "https://www.aig.com/home/risk-solutions/business/management-and-professional-liability/fiduciary-liability",
    "https://www.aig.com/home/risk-solutions/business/management-and-professional-liability/financial-institutions",
    "https://www.aig.com/home/risk-solutions/business/management-and-professional-liability/kidnap-ransom-and-extortion",
    "https://www.aig.com/home/risk-solutions/business/management-and-professional-liability/mergers-and-acquisitions",
    "https://www.aig.com/home/risk-solutions/business/management-and-professional-liability/mergers-and-acquisitions/mergers-and-acquisitions-claims-reports",
    "https://www.aig.com/home/risk-solutions/business/management-and-professional-liability/mergers-and-acquisitions/representations-and-warranties",
    "https://www.aig.com/home/risk-solutions/business/management-and-professional-liability/mergers-and-acquisitions/tax-liability",
    "https://www.aig.com/home/risk-solutions/business/management-and-professional-liability/private-and-non-profit-management-liability",
    "https://www.aig.com/home/risk-solutions/business/management-and-professional-liability/professional-liability",
    "https://www.aig.com/home/risk-solutions/business/management-and-professional-liability/public-management-liability",
    "https://www.aig.com/home/risk-solutions/business/multinational",
    "https://www.aig.com/home/risk-solutions/business/specialty-risks/aerospace-and-aviation/airline",
    "https://www.aig.com/home/risk-solutions/business/specialty-risks/aerospace-and-aviation/unmanned-aircraft-systems",
    "https://www.aig.com/home/risk-solutions/business/specialty-risks/aviation",
    "https://www.aig.com/home/risk-solutions/business/specialty-risks/energy",
    "https://www.aig.com/home/risk-solutions/business/specialty-risks/energy/energy-property",
    "https://www.aig.com/home/risk-solutions/business/specialty-risks/marine",
    "https://www.aig.com/home/risk-solutions/business/specialty-risks/marine/inland-marine",
    "https://www.aig.com/home/risk-solutions/business/specialty-risks/marine/marine-liability",
    "https://www.aig.com/home/risk-solutions/business/specialty-risks/marine/ocean-cargo",
    "https://www.aig.com/home/risk-solutions/business/specialty-risks/political-risk",
    "https://www.aig.com/home/risk-solutions/business/specialty-risks/trade-credit",
    "https://www.aig.com/home/risk-solutions/business/specialty-risks/trade-credit/tradenable",
    "https://www.aig.com/home/risk-solutions/business/warranty-and-service-programs",
    "https://www.aig.com/home/risk-solutions/business/warranty-and-service-programs/warranty-management",
    "https://www.aig.com/home/risk-solutions/why-aig/aig-data-center-insurance-solutions",
    "https://www.aig.com/home/risk-solutions/why-aig/producer-notifications",
    "https://www.aig.com/home/risk-solutions/why-aig/product-highlight-sheet-library",
    "https://www.aig.com/home/risk-solutions/why-aig/us-producer-appointment-and-licensing",
    "https://www.aig.com/home/risk-solutions/why-aig/your-aig-team",
    "https://www.aig.com/home/worldwide"
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
      "name": "hero-banner",
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
      "name": "columns",
      "instances": [
        "main .container.aig-bio-block"
      ]
    },
    {
      "name": "carousel-leadership",
      "instances": [
        "main .aig-photo-panel-container .container.aig-carousel"
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
        "main .container.aig-carousel:not(.aig-photo-panel-container *)",
        "main .container.aig-carousel-v2",
        "main .container.aig-column-grid:not(.accordion *):not(:has(.aig-carousel)):has(> .cmp-container > .aem-Grid > .teaserflex + .teaserflex)"
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
        "main .teaserflex.cta-with-image.lightblue",
        "main .container.hero-banner-video"
      ]
    },
    {
      "name": "columns-media",
      "instances": [
        "main .container.aig-video.two-column-grid",
        "main .teaserflex.cta-with-image:not(.lightblue):not(.aig-article-card)"
      ]
    },
    {
      "name": "video",
      "instances": [
        "main .container.aig-video:has(> .cmp-container > .aem-Grid > .aig-video-vertical)",
        "main .container.aig-video:has(> .cmp-container > .aem-Grid > .aig-media)",
        "main .container.aig-video.halfwidth:not(.aig-video-vertical)"
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
        "main .aem-Grid:has(> .download):not(.accordion *):not(.container:has(~ .quick-links) *)"
      ]
    },
    {
      "name": "cards-related",
      "instances": [
        "main .aig-autopilot"
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
        "main .container.tabbed-cards"
      ]
    },
    {
      "name": "embed",
      "instances": [
        "main .embed:not(.accordion *)"
      ]
    },
    {
      "name": "table",
      "instances": [
        "main .text table:not(.accordion *)"
      ]
    }
  ],
  "sections": [
    {
      "id": "1",
      "name": "Page title banner",
      "selector": [
        "main .container.hero-banner-with-fade"
      ],
      "style": null,
      "blocks": [
        "hero-banner"
      ],
      "defaultContent": []
    },
    {
      "id": "2",
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
      "id": "3",
      "name": "The AIG Advantage",
      "selector": [
        "main > .aem-Grid > .container.paleblue:has(.aig-carousel)"
      ],
      "style": "pale-blue, centered",
      "blocks": [
        "columns-text"
      ],
      "defaultContent": [
        ".paleblue .teaserflex.titlecenter .cmp-teaser__title",
        ".paleblue .teaserflex.titlecenter .cmp-teaser__description"
      ]
    },
    {
      "id": "4",
      "name": "Advantage details accordion",
      "selector": [
        "main > .aem-Grid > .container:not(.aiglightgray):not(.paleblue):has(> .cmp-container > .aem-Grid > .container.aigwhite .accordion)"
      ],
      "style": null,
      "blocks": [
        "accordion"
      ],
      "defaultContent": []
    },
    {
      "id": "5",
      "name": "Highlight sheet bar",
      "selector": [
        "main > .aem-Grid > .container.flexbox-container:has(.accordion_pdf_icon)"
      ],
      "style": null,
      "blocks": [
        "accordion"
      ],
      "defaultContent": []
    },
    {
      "id": "6",
      "name": "Latest Podcasts",
      "selector": [
        "main > .aem-Grid > .container.flexbox-container:has(> .cmp-container > .aem-Grid > .cta-with-image.lightblue)"
      ],
      "style": "centered",
      "blocks": [
        "columns-featured"
      ],
      "defaultContent": [
        ".text h2",
        ".text p"
      ]
    },
    {
      "id": "7",
      "name": "Advantages in Action",
      "selector": [
        "main > .aem-Grid > .container.aiglightgray:has(.accordion)"
      ],
      "style": "light, centered",
      "blocks": [
        "accordion"
      ],
      "defaultContent": [
        ".aiglightgray .teaserflex.titlecenter .cmp-teaser__title"
      ]
    },
    {
      "id": "8",
      "name": "Navigating Multinational Risks",
      "selector": [
        "main > .aem-Grid > .container.flexbox-container:has(+ .container.aig-video.two-column-grid)",
        "main > .aem-Grid > .container.aig-video.two-column-grid"
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
      "id": "9",
      "name": "At a Glance",
      "selector": [
        "main > .aem-Grid > .container:has(> .cmp-container > .aem-Grid > .aig-carousel .aig-productcard)",
        "main > .aem-Grid > .container:has(> .cmp-container > .aem-Grid > .aig-carousel .aig-infographic-card)",
        "main > .aem-Grid > .container:has(> .cmp-container > .aem-Grid > .aig-carousel-v2)"
      ],
      "style": "dark, centered",
      "blocks": [
        "columns-text"
      ],
      "defaultContent": [
        ".teaserflex.dttitlewhite .cmp-teaser__title",
        ".teaserflex.dttitlewhite .cmp-teaser__description",
        ".title.whiteheading .cmp-title__text"
      ]
    },
    {
      "id": "10",
      "name": "A Focus on Service",
      "selector": [
        "main > .aem-Grid > .container.flexbox-container:has(> .cmp-container > .aem-Grid > .cta-with-image:not(.lightblue))"
      ],
      "style": "centered",
      "blocks": [
        "columns-media"
      ],
      "defaultContent": [
        ".teaserflex.titlecenter .cmp-teaser__title"
      ]
    },
    {
      "id": "11",
      "name": "Pale-blue text band",
      "selector": [
        "main > .aem-Grid > .container.paleblue:not(.hero-banner-with-fade):not(:has(.aig-carousel, .aig-carousel-v2, .accordion, .tabs))"
      ],
      "style": "pale-blue",
      "blocks": [],
      "defaultContent": [
        ".paleblue .cmp-teaser__title",
        ".paleblue .cmp-teaser__description",
        ".paleblue .cmp-teaser__action-link"
      ]
    },
    {
      "id": "12",
      "name": "Watch videos",
      "selector": [
        "main .aem-Grid > .container.flexbox-container:has(+ .container.aig-video:not(.two-column-grid))",
        "main .container.aig-video:has(> .cmp-container > .aem-Grid > .aig-video-vertical)"
      ],
      "style": "centered",
      "blocks": [
        "video"
      ],
      "defaultContent": [
        ".teaserflex.titlecenter .cmp-teaser__title"
      ]
    },
    {
      "id": "13",
      "name": "CTA band",
      "selector": [
        "main .container.coreblue:has(> .cmp-container > .aem-Grid > .container.flexbox-container.vert-center)"
      ],
      "style": null,
      "blocks": [
        "cta-banner"
      ],
      "defaultContent": []
    },
    {
      "id": "14",
      "name": "Downloadable Materials",
      "selector": [
        "main .container.aig-archive.aigpalegray"
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
      "id": "15",
      "name": "Light-grey text band",
      "selector": [
        "main > .aem-Grid > .container.aiglightgray:not(.aig-archive):not(:has(.accordion, .aig-carousel, .aig-archive))"
      ],
      "style": "light",
      "blocks": [],
      "defaultContent": [
        ".aiglightgray .cmp-teaser__title",
        ".aiglightgray .cmp-teaser__description"
      ]
    },
    {
      "id": "16",
      "name": "Disclaimer",
      "selector": [
        "main > .aem-Grid > .container.flexbox-container:has(> .cmp-container > .aem-Grid > .teaserflex:only-child:not(.cta-with-image)):has(+ .container > .cmp-container > .aem-Grid > .autopilot)"
      ],
      "style": null,
      "blocks": [],
      "defaultContent": [
        ".cmp-teaser__description"
      ]
    },
    {
      "id": "17",
      "name": "Related Content",
      "selector": [
        "main > .aem-Grid > .container:has(> .cmp-container > .aem-Grid > .autopilot)"
      ],
      "style": null,
      "blocks": [
        "cards-related"
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
