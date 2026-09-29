# Authored aircraft update — September 29, 2026

The user requested free assets only. The first replacement is the FlightGear community C172P, including its actual classic cockpit. This creates a reusable glTF-loading path; it does not replace the whole fleet or change the flight-physics engine.

## Supplied references reviewed
- https://github.com/jeanjerome/OpenSkyFlight — textured Rafale glTF and first-person HUD; useful asset-loading reference. The model carries a separate CGTrader license. No model or code copied.
- https://github.com/rlefko/flight-simulator — rendering and systems architecture; no imported aircraft asset library found. No code copied.
- https://github.com/dimartarmizi/web-flight-simulator — F15 GLB with Cesium terrain and HUD. Custom noncommercial license differs from package metadata. No code or assets copied.

The replacement asset is https://github.com/c172p-team/c172p at 84477612bba340ab98004a10f8b28a81c18e6169, GPLv2. Corresponding source and conversion tools are distributed with the model.

## Implementation
- Detailed exterior and analog cockpit with original blue/white paint.
- Animated airspeed, altitude, heading, vertical speed, attitude, RPM and propeller based on game state; other controls and radios remain decorative.
- Static geometry batched by material; 2048-pixel maximum textures compressed as WebP.
- The procedural model remains the load-failure fallback. The imported Cessna mesh now supplies textured crash geometry. Remaining nine aircraft remain procedural.
- Approximately 13 MB of aircraft geometry and textures loaded, plus separately downloadable source. Initial load is larger. Physical iPad Safari performance requires device testing.

## Validation
Automated gameplay regression and cockpit checks pass. Asset validation confirms finite geometry, all 37 texture files, all 11 animation definitions targeting existing nodes, and the corresponding source archive. Browser inspection confirmed the Cessna exterior and cockpit, throttle-driven taxiing, and switching to the A320 cockpit; desktop reporting was approximately 60 FPS. Physical iPad testing has not been performed.
