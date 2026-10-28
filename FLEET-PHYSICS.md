# Connected fleet physics

Options → Fleet Physics enables the experimental connected airframe in the main airport for all eleven aircraft. Standard flight remains available. Switching restarts the flight; changing aircraft prepares that aircraft's geometry before departure.

The authored meshes and airline paint remain on the physical sections after damage. The shared layout has a cabin, nose, tail, two inner wings, two wing tips and three landing-gear assemblies. Each profile specifies cuts, operating mass, wing area, thrust and engine attachment locations. Joint strengths and handling are game tuning, not certified aircraft or casualty predictions.

Each wing supplies its own lift. Detached sections lose pilot authority and engine-bearing sections stop contributing thrust to the remaining aircraft. Gear can retract; detached gear stays visible and collidable. The DC-3's tailwheel connection belongs to its tail. Hull slices follow taper and wing sweep to reduce false ground contact. Airport sections and debris use the existing localized building damage system.

This experimental mode uses manual flight and exterior cameras. It does not yet provide individual engine-pylon fracture, animated control surfaces/propellers, or the standard mode's cockpit instruments. The ten-body layout limits mobile physics cost; it is not a model of every internal structural member.

Validation: `node tests/fleet-structure.mjs` loads each actual GLB without browser texture decoding and exercises parking, cruise, wing separation, takeoff and wreckage settling. `FLEET_TEST_IDS=b727,dc9` selects a subset. Existing Cessna, airport, building, and standard-flight suites remain applicable. Physical iPad playtesting is still required.
