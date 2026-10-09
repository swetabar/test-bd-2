# quote

Custom **quote** block. Purpose: testimonial: portrait beside a quotation with attribution.

## Authoring (Document Authoring)

Model: `standalone`

Single block table. Content: rows/cells: optional portrait picture; quotation text; optional attribution (second text cell, or trailing paragraph starting with a dash; bold = name).

## Supported variations

The visual mode is inferred from the content; add the option to the block name (e.g. `Quote (portrait)`) to force one.

| Option | Inferred when | Look |
| --- | --- | --- |
| `feature` | image present, plain section, attribution without `\|` | 55% image beside a left-aligned charcoal quote (article award/feature art) |
| `headshot` | image present and attribution reads `Name \| Role` | 23.5% headshot beside a centred navy quote, attribution in the quote style |
| `portrait` | image present and the section has a background style (`pale-blue`, `light-blue`, `light`, `grey`, `dark`) | 240x288 portrait beside a large navy quote |
| `centered` | no image | large centred navy quote with centred attribution |

## Universal Editor fields

N/A (Document Authoring project)
