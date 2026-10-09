# columns-text

Custom **columns** block. Purpose: equal-width text columns (heading, text, optional links), 2-4 across.
Mirrors the www.aig.com `.aig-carousel` teaser carousels: 3-up on desktop, 1-up carousel on mobile
(previous/next arrows and dots appear whenever there are more columns than fit).

## Authoring (Document Authoring)

Model: `standalone`

Single block table. Content: one row with one cell per column (heading, text, optional links).

| columns-text | | |
| --- | --- | --- |
| ### Heading 1 + text | ### Heading 2 + text | ### Heading 3 + text |

### Optional section background image

Add a **first row with a single cell that contains only an image**. It is removed from the block and
used as a full-bleed `cover` background for the whole section (heading and intro text included).
Use a pre-tinted image (e.g. the AIG navy-tinted photos); the section style colour (`dark`) is the
fallback while the image loads.

| columns-text (glance) | | | |
| --- | --- | --- | --- |
| ![background](background.png) | | | |
| ![icon](icon-1.png) **Stat** text | ![icon](icon-2.png) **Stat** text | ... | ... |

## Supported variations

| Variation | Option class | Notes |
| --- | --- | --- |
| Glance | `glance` | White fact cards (icon + centred navy text); 3-up desktop, 2-up tablet, 1-up mobile |
| Narrow | `narrow` | 4-up centred slots (3-up on tablet); also applied automatically inside a section styled `narrow` |

## Universal Editor fields

N/A (Document Authoring project)
