# Authored airliner update — October 5, 2026

The A320 and Boeing 737-800 now use GPLv2 FlightGear community geometry and cockpit artwork. Source archives, licenses and modifications are linked from CREDITS.md. C172P remains the third authored aircraft; other fleet entries remain procedural.

- Source liveries: Delta/American for A320; Delta/American/United for 737.
- Distinct modeled flight decks with live simplified attitude, speed, altitude, heading, engine and fuel displays. Switches and many ancillary instruments remain decorative.
- Aircraft load on selection, and launch waits for the selected model. Geometry is indexed and static surfaces merged by material; textures are WebP.
- Gear visibility follows the existing gear control, including struts. Retraction is not yet mechanically animated.
- Crashes retain the authored textured surfaces for intact, sectioned and fragmented outcomes.

Validation: all gameplay regressions and all ten aircraft stall/recovery checks passed; authored wreck triangle/UV/normal preservation tests passed; both asset archives and glTF references validated. Browser visual checks covered both flight decks, 737 main gear and A320 in-game runway placement and crash rendering. No browser warnings/errors in checked views. Physical iPad Safari testing remains outstanding.

Next source queued: DC-10, downloaded but not converted or released.
