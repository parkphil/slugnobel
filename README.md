# Berkeley Nobel scrollytelling scaffold

Opening text → all 63 portraits → real Nobel parking photograph → traced sign → five category frames → exact-year timeline → 23 faculty profiles → closing text. Visual passages now contain editable draft explanation; unfinished reporting remains bracketed.

## Preview

Open `index.html` directly, or run `python3 -m http.server 8000` and visit http://localhost:8000.

## Editing

- `index.html`: article copy and scrolling text boxes. `data-scene` names a layout. `data-highlight` optionally emphasizes a prize category.
- `css/story.css`: article and full-screen scroll layout.
- `css/graphic.css`: circles, portraits, legend, and hover panel.
- `js/layouts.js`: geometry for the 63-person complete portrait gallery, parking bays, exact-year timeline, and faculty profiles.
- `js/graphic.js`: the same 63 SVG people interpolate between layouts.
- `js/scroll.js`: connects passages to scenes; holds each layout while its passage is read.
- `js/tooltip.js`: shared hover, keyboard, and tap details for all 63 people.
- `js/timeline.js`: opens your partner's faculty biographies.
- `data/laureates.js`: shared 63-person data, Nobel IDs, portrait sources, affiliation, and Nobel links.
- `timeline-data.js`: partner's original 23 faculty profiles.
- `photos/`: partner's portrait crops.
- `photos/inspire/`: portraits matched from Berkeley Inspire for all 63, with URLs recorded in `SOURCES.json`.

The faculty layout highlights the 23 records provided in the partner's timeline. The other 40 laureates remain visible as faded points; no records are removed from the shared visual. This is a reporting-team selection and is not an independently verified complete faculty list.

## Sources and references

Data and additional portraits: https://inspire.berkeley.edu/get-inspired/nobels/

Nobel Prize links and motivations are included per person in the dataset. Portrait rights and final credits should be confirmed before publication.

Interaction reference: https://github.com/spiegelgraphics/nobel-laureates (Apache 2.0). We inspected `Laureates.svelte`, `Laureate.svelte`, `HoverLabel.svelte`, `layout.js`, and the chapter configuration. The implementation here is written separately in plain JavaScript and SVG, using persistent identities, layout transitions, selective emphasis, and nearest-circle hover.

Original standalone visual prototypes remain in `parking-demo.html` and `overview.html`.

Bracketed passages, biographies, faculty scope, quote wording, affiliations, and credits remain provisional.

The portrait gallery includes all 63 records; no featured-person subset is used. Portraits are grayscale until hovered. A separate reading area sits above the marks. The circle and decade histogram stages have been removed.

Pacing: each passage occupies 2.3 viewport heights (2.5 on mobile), and the final exploration occupies 3. In `js/scroll.js`, the scene is held for 58% of the distance between text anchors; the transition takes the next 25%. Edit those numbers to adjust reading time.

Parking lines draw in sequence while people wait in the entrance lane, before sorting into bays. The angled white borders straighten into the exact-year timeline. The pavement pattern is generated in SVG; it has no external texture dependency.

## Photograph-to-graphic prototype

The active sequence replaces the illustrated asphalt with the supplied campus sign photograph (`assets/images/nobel-sign.jpg`). `photo` holds the photograph, `trace` draws its visible sign boundary, `frames` fans that boundary into five abstract categories, and `categories` brings back all 63 circles. Reverse scrolling reverses the entire transition. The normalized sign corners and crop are in `js/layouts.js`; drawing and shape interpolation are in `js/graphic.js`. Photo attribution remains a placeholder.

## Current parking treatment

The sign scene uses `assets/images/nobel-sign-landscape.jpg`, contained at its original proportions so all of the sign stays visible. The parking stage samples unpainted asphalt from the user-supplied `parking-reference.png` using an SVG pattern. Six white dividers and a yellow cross-stripe are live SVG strokes; there are no closed boxes. Labels sit above the pavement. Scroll-driven drawing happens during `trace` → `frames`, before the laureates sort in `categories`.

## Continuity between people, photo, and parking

All 63 identities stay visible throughout the photographic stages. The portrait grid compresses into a contact strip beneath the photo, then those same marks move into their category spaces. During the sign-to-parking transition, the traced perimeter divides into six contiguous segments, each of which stretches into a painted divider. There is no restarted line reveal. Reverse scrolling restores the exact same strokes and people.
