# Adding aircraft

`aircraft-catalog.js` is the fleet registry. Each definition provides:

- A stable ID and display name.
- A geometry profile (`twin`, `dc10`, or `b747` currently).
- Ground clearance, simplified thrust/lift values, pitch/bank rates, and fuel burn.
- A list of individually addressable engines, their display names, positions, and thrust side.

The aircraft picker and Failure Lab engine selector are generated from this registry. `failures.js` supports any positive engine count: engine failure, asymmetric thrust, fire, depletion, repair, and control/gear faults do not require plane-specific conditionals.

A new variant using an existing geometry profile can be added through the registry. A distinct airframe requires a new geometry factory in `game.js` and a corresponding visual profile in `graphics.js`; unsupported profiles fail explicitly rather than rendering a different aircraft silently. The visual root for each breakable section must correspond to the physics section at the same array index. Engine fan positions should match catalog engine positions, and the breakable section center must match its visual assembly.

For future imported aircraft, use licensed meshes with named breakable groups (fuselage, wings, tail surfaces, individual engines) and retain the same section mapping. An asset importer is not yet implemented.

Keep flight values labeled as game approximations unless validated against authoritative aircraft data. Add checks for engine indexing, safe landing, controlled engine-out flight, gear clearance, breakup, and reset for each new model. Visually verify from exterior, chase, and nose views before adding it to the public picker.
