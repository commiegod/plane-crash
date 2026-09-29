# Aircraft and flight deck update

Change view cycles Chase → Exterior → Cockpit (keyboard C also works). Each aircraft selects its own representative deck profile. Live readings: airspeed in knots, altitude in feet above the game world datum, vertical speed in feet/minute, heading, fuel, and commanded engine power. Engine readings are game power percentages, not a thermodynamic N1/RPM simulation. Failed engines and empty fuel read zero.

The Cessna uses a 172S G1000-style two-display layout. A320 uses sidesticks and six displays; 737-800 and the chosen 747-400 deck use yokes and six displays; Gulfstream and C-130J use four-display layouts; the classic Douglas aircraft use round instruments. These are simplified visual representations, not exact reproductions or clickable avionics. Navigation displays show heading; the existing airport map remains the position display. The generic twin is fictional.

Exterior changes: separate lofted nose profiles for the seven newer types, smoother tail cones, skin-following windows, wing-root fairings, Cessna wing struts, cargo gear sponsons, 737 flattened nacelle bottoms, paired jet main wheels, and tail lettering. Legacy aircraft also receive smoother nose contours. These remain procedural models, not scanned or manufacturer CAD assets.

Reference sources consulted September 28, 2026:
- https://cessna.txtav.com/piston/cessna-skyhawk
- https://www.aircraft.airbus.com/en/newsroom/news/2023-04-american-airlines-signs-significant-a320-fleet-retrofit-agreement
- https://safetyfirst.airbus.com/app/themes/mh_newsdesk/documents/archives/dual-side-stick-inputs.pdf
- https://www.boeing.com/Commercial/737ng/737-next-generation-design-highlights
- https://www.honeywellaerospace.com/us/en/products-and-services/products/cabin-and-cockpit/avionics/integrated-flight-decks/primus-epic-for-gulfstream-planeview
- https://www.lockheedmartin.com/content/dam/lockheed-martin/aero/documents/C-130J/C-130Brochure_NewPurchase_May2020_Web.pdf

Validation: full game simulation regression suite and cockpit/geometry checks. Browser visual validation; physical iPad Safari testing still required.
