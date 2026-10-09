# embed

Custom **embed** block. Purpose: embedded third-party content (hosted forms, YouTube/Vimeo, external iframes).

## Authoring (Document Authoring)

Model: `standalone`

Single block table. Content: one row: link to the embed URL, optional placeholder image (click-to-load), optional heading/text shown above.

Frame height: generic iframes render at a fixed height (no inner scrolling, as on the source). Known AIG gcs-web.com widgets get their source height automatically (`KNOWN_EMBEDS` in `embed.js`); for any other URL authors can add a cell or paragraph containing only a pixel value (e.g. `1200`). Without either, the HTML default of 150px applies. YouTube/Vimeo links render 16:9.

## Supported variations

No variations.

## Universal Editor fields

N/A (Document Authoring project)
