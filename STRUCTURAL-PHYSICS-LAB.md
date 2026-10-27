# Experimental Cessna structural physics lab

Entry: `/experimental/structure.html`, also linked from the main game's Options drawer. This is an isolated prototype, not a replacement for the normal simulator. The main flight, crash-report, airport, and fleet behavior remain unchanged.

The existing FlightGear C172P glTF and textures are split at runtime into ten physical bodies: cabin, nose, tail, inner wings, tips, and three gear assemblies. Nine lock constraints transmit linear and angular loads. Solver reaction loads can break connections; losing a root also removes control authority from descendants while their physical connections remain intact. Collision filtering follows connected components, enabling collisions after separation. Failure resolves the most overloaded joint first, then recomputes the load path on the next fixed step rather than cascading stale solver forces.

Each wing section receives lift and drag in its own orientation. Elevator/yaw control authority depends on the attached tail; aileron effects depend on each wing still being connected. Detached parts retain velocity, lift/drag, gravity, and collision response. This is a deliberately simplified game model, not engineering-validated C172 structural strength or flight dynamics. Strength percentages show normalized solver load, not measured aircraft data. The cabin mass center is distinct from its geometric center.

Physics: pinned cannon-es 0.20.0 (MIT), vendored from the npm package CDN. License at assets/cannon-es-LICENSE.txt. Its GS solver clamps friction equation impulses, so friction budgets are scaled to the fixed 1/120-second step. 35 solver iterations; at most 12 steps per frame; long gaps are dropped rather than replayed. Hidden tabs pause. Model textures and original credits/source archives are reused without modification.

Tests: free flight, runway takeoff, localized wing strike against a fixed block, hard landing, gear-collapse skid. The last scenario deliberately begins with detached gear to isolate skid behavior; hard landing tests load-driven gear failure. The obstacle is not a destructible building. No passengers/reports, cockpit view, deformable terrain, terrain hills, or full-airport integration in this lab. Collision shapes are boxes with small support spheres for protrusions, not per-triangle bodies; seams use simple recessed closures, not detailed exposed structure. Gear bodies detach rather than bend on hinges. These are explicit prototype boundaries.

Automated tests use the actual glTF geometry (textures omitted only in Node): finite partitions, ordinary-flight integrity, stationary ground stability, takeoff, impact-driven tip separation while major structures survive, a tip impulse transmitted to the cabin, gear failure, continuing skid momentum, settling, above-ground collision bounds, deterministic 30/60/120 Hz stepping, control response after tip loss, reset restoration. Run `node tests/structural-lab.mjs`.

Physical iPad performance and handling remain an acceptance gate before any fleet migration. The lab is small and flat; its performance cannot establish full-airport performance.

## Full-airport Cessna option (2026-10-26)

Options → Cessna Physics switches between standard and experimental physics and restarts the Cessna flight. The selection lasts for the current page session; other aircraft retain standard physics.

`airport-structure.js` installs the visible terrain's 60 m triangular heightfield and fixed collision boxes for the terminal, piers, jet bridges, tower and hangars. The Cessna uses one continuous connected-body simulation while flying, taxiing, landing and breaking apart. It retains the existing joystick, throttle, flaps, brake, stop-pushback, pause, restart and optional report controls. Cabin impact speed determines the simplified report severity; wing separation by itself does not kill occupants.

Experimental limitations: manual flight only; exterior cameras; fixed buildings rather than destructible structures; coarse aircraft collision shapes; simplified aerodynamic coefficients and occupant outcomes. Aircraft mass is currently the prototype's fixed mass, not passenger/fuel-dependent. Physical iPad validation is still required. No fleet migration is enabled by this option.

Checks: `node tests/structural-lab.mjs`, `node tests/airport-structure.mjs`, `node tests/airport-game.cjs`, and the existing standard-aircraft regression suite.
