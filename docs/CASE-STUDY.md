# From CSS clock to Tempo

## Problem

The original clock used a fixed-size raster face, duplicated pages for themes and a timer without an explicit delay. It demonstrated an effect but offered little interaction or explanation of design decisions.

## Design and implementation

The redesign pairs an analog dial with typography and a clear control hierarchy. A warm paper palette and deep green dial give the interface a recognizable identity. On mobile the dial, settings and world clocks form one reading order. The face and hands scale together, built from CSS and generated ticks instead of a bitmap.

The main engineering decisions are separating pure time calculations from DOM updates, using Intl for timezone/DST handling, and aligning discrete updates to the next system-clock second. Smooth motion is optional and disabled by reduced-motion preferences. Storage is optional; malformed values are validated rather than injected into the page.

## Evidence

- Unit tests cover angle calculations, midnight, fractional offsets and a DST transition.
- Browser tests cover actual controls and persistence, with no horizontal overflow in the tested desktop/mobile viewports.
- Desktop and mobile screenshots in this folder's sibling screenshots directory document the shipped interface.

This project demonstrates responsive CSS, DOM composition, state persistence, accessible controls, browser APIs and testable JavaScript. These are implementation claims, not invented user research or measured business outcomes.

## Tradeoffs and next steps

Time accuracy depends on the device. Available zones and naming follow browser timezone data. Native dropdowns favor keyboard/platform behavior over a custom searchable widget. Physical-device and screen-reader checks, searchable zone names and localization would be useful next steps.
