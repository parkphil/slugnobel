# Berkeley Nobel parking visualization

An experimental scroll-driven graphic about Berkeley-affiliated Nobel laureates. The sequence moves from an overview into five category parking bays, a circle, and a chart by Nobel decade.

## Preview

Open `index.html` in a browser. No dependencies or build step are required.

Alternatively, run `python3 -m http.server 8000` in this folder and visit http://localhost:8000.

## Files

- `index.html`: graphic markup
- `parking-graphic.css`: layout, colors, and Avenir font stack
- `parking-animation.js`: embedded laureate data and scroll transitions

## Data and scope

The prototype uses 63 records from the supplied Berkeley Nobel research dataset (`slug_ nobel - berkeley_nobels_from_inspire.csv`), spanning 1934–2025. The parking bays represent prize categories, not actual parking assignments or a count of campus spaces. Affiliation definitions and source records should be checked before publication.

Scroll inside the graphic to advance or reverse the sequence. Laureate names are available through native browser tooltips.
