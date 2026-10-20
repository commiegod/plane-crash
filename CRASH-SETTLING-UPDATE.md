# Impact and wreckage settling refinement

Downward impact speed and obstacle speed now contribute nonlinearly to structural damage. Shallow belly landings retain the airframe; increasing impact produces major sections and fragmentation. Existing fictional occupant outcomes use the resulting severity and breakup mode.

Ground drag is stronger and integrated analytically for consistent stopping distances at 30/60/120 simulation Hz. Grass slows wreckage more than pavement. Elevated building impacts no longer mark every piece as grounded immediately: pieces fall until contact. Minor intact impacts produce less ground smoke; the flash follows the contact site. Fire remains dependent on fuel and damage, rather than every contact creating an explosion.

The report remains optional and does not obscure the crash. Tests cover impact tiers, stopping distance and time, elevated collisions, report behavior, passenger totals and pause. Existing fleet flight and authored-wreck/deformation regressions also pass. Browser previews cover intact belly landing and fragmented crash presentation. Physical iPad testing remains outstanding. This remains a tuned game simulation, not engineering crashworthiness or injury prediction.

Run node tests/crash-settling.cjs.
