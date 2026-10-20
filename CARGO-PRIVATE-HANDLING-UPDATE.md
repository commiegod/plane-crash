# C-130 and Citation X handling update

The C-130 now extends and rotates four flap sections using its original source animations. The Citation X animates four flap sections and its pedestal lever; its simplified cockpit displays show current flap degrees. Both use gradual Up / Takeoff / Landing settings with extension speed limits and support touchdown compression.

The cargo plane has slower roll response, steering and braking than the private jet. Each has separate thrust, flap drag, flap speed, rotation response and tire grip tuning. Sustained steep climbs lose speed and stall; lowering the nose permits recovery. These are game approximations, not certified performance or complete aircraft system simulations.

Validated: loaded takeoffs, assisted landings and repeat takeoffs on both runway ends at 30/60/120 simulation Hz; full-flap go-arounds, flap speed limits, pause and hard impacts. Browser checks confirm all eight flap sections lower symmetrically and the Citation lever travels and returns. Physical iPad testing remains outstanding.

Run node tests/cargo-private-handling.cjs. Flap metadata in assets/c130/flap-controls.json and assets/citationx/flap-controls.json is extracted from original XML in their respective source.zip archives by tools/build-classic-controls.py. Both retain the existing GPL-2.0 licenses and credits. No paid assets added.
