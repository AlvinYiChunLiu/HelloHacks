# Country picker data

Verified on 2026-09-26.

`countries.json` contains 250 country and territory options: all 249 ISO 3166-1 alpha-2 assignments, plus Kosovo (`XK`). `XK` is a commonly used user-assigned code, not an official ISO 3166-1 assignment. Including territories lets users select their home country or territory without losing ISO code coverage.

The JSON is bundled with the app, so the picker needs no network request or additional package. Entries have the shape `{ "code": "CA", "name": "Canada" }` and are sorted by English display name using `localeCompare` with base sensitivity, so accented names appear in their expected alphabetical positions.

## Sources and display names

- [ISO: ISO 3166 country codes](https://www.iso.org/iso-3166-country-codes.html) describes the standard and identifies ISO as the authority for assigned country codes.
- [UK Government: Use consistent country codes](https://www.gov.uk/government/publications/open-standards-for-government/country-codes) confirms 249 entries in the ISO 3166 list.
- [Unicode CLDR region validity data](https://github.com/unicode-org/cldr/blob/main/common/validity/region.xml) provides the regular region codes. The 257 regular CLDR entries were filtered to the 249 ISO assignments by excluding `AC`, `CP`, `CQ`, `DG`, `EA`, `IC`, `TA`, and `XK`; `XK` was then added as the documented extra.
- English names were generated once with Node.js 24.21.0 `Intl.DisplayNames`, using ICU 78.3 / CLDR 48.0. [Unicode CLDR English territory names](https://github.com/unicode-org/cldr-json/blob/main/cldr-json/cldr-localenames-full/main/en/territories.json) documents the underlying display-name system. Unicode data is covered by the [Unicode License](https://www.unicode.org/license.txt).

For readability, display names expand `&` to `and` and `St.` to `Saint`. The Congo entries are named `Democratic Republic of the Congo` and `Republic of the Congo`. Hong Kong, Macao, Palestine, and Türkiye use those short labels. The stored two-letter code remains the stable identifier.

## Validation

The generated file was checked for exactly 249 ISO entries plus the one extra, 250 unique two-letter codes, 250 unique nonempty names, and alphabetical ordering. Changes to official assignments or preferred display names should be reviewed against the sources above before updating this file.
