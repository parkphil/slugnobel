# Map data audit

Regenerate with `python3 data/prepare_map_data.py` after updating `laureates-full.json`.
No geographic visual is published yet. The prepared records preserve the source's
birth-country values and award-affiliation strings, plus parsed locations.

- People: 63
- Birth countries with a code: 63
- Missing or unrecognized birth country: none
- People without an award-affiliation entry: Czesław Miłosz, Kary Mullis

The article map adds an explicit display override for Czesław Miłosz: UC Berkeley,
where he was professor emeritus when awarded in 1980. This brings the Berkeley
map to 24 faculty members and professor emeriti, matching the faculty orbit.
The original Nobel affiliation record remains empty. Source:
[Berkeley's Miłosz obituary](https://newsarchive.berkeley.edu/news/berkeleyan/2004/08/18_milosz.shtml).
- Stanford University or its medical school at time of award: 6 people (Henry Taube, Andrew Z. Fire, Willis Lamb, Carolyn Bertozzi, Robert Laughlin, Steven Chu)
- Affiliation entries without a city-level place: Howard Hughes Medical Institute, USA, LIGO/VIRGO Collaboration

John Martinis has a blank birth country in the source data. The output uses USA,
supported by [Nobel's 2025 physics background](https://www.nobelprize.org/uploads/2025/12/popular-physicsprize2025-4.pdf),
which says he was born in Los Angeles. This override is explicit in the script;
the source file remains untouched.

Affiliation city parsing is a starting point for cartography. The `coordinates`
fields are deliberately null until each place is geocoded and checked. Entries
like Howard Hughes Medical Institute, USA and LIGO/VIRGO Collaboration do not
identify a single city and must remain unresolved. Birth-country geography
answers where laureates were born; affiliation geography answers where they
worked when awarded. These should be distinct map views.
