# Graduated terrain contact

Brief shallow wing contact now produces a scrape instead of immediately detaching the wing. Contact is classified using velocity into the terrain normal, penetration depth, and time-integrated wear. Hard/deep strikes still break wings; sustained grinding accumulates damage. Small contact also nudges bank away from the surface, while steering remains available.

Underwing nacelle contacts use the same classifier. Light contact remains recoverable; hard or sustained contact disables the affected engine without forcing a whole-aircraft crash. Existing gear-collapse and belly-slide outcomes remain in place. This does not add new bent-gear meshes or exposed internal wing structure.

Pavement emits sparks; grass emits brown dust. Live scrape emission is time-gated and uses existing mobile particle limits. Terrain scrapes cannot scuff airport buildings. Pausing freezes effects and damage accumulation. Starting another flight clears wing wear.

Validation: shallow vs normal-speed impact, wear timing at 30/60/120 Hz, wing contact across 11 aircraft, engine-only failure without immediate fatalities, fleet landing and grass taxi regression, crash settling, building contacts/damage, and browser visual check of sparks with an intact C172 wing. Collision envelopes remain approximations of aircraft geometry; physical iPad testing remains unperformed.
