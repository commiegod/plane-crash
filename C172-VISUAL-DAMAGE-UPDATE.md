# Cessna 172 visual damage pilot

The C172 now has deterministic torn edges on detached wings, recessed airfoil-section ribs and exposed spar ends on the retained and detached sides. These details use the authored cut boundary and preserve the original paint/UVs. Repeated breaks remove obsolete fracture structure; a subsequent full crash retains missing-wing geometry. New flights restore the original source geometry and dispose the added details.

Collapsed main gear bends outward based on actual aircraft-space coordinates; nose gear folds backward. Wheels, brakes and struts use the same bounded deformation field. C172 cowling parts remain individually addressable for localized nose-impact dents, layered onto the existing crumple model. These are visual approximations, not engineering-accurate structural simulation. No new fire/smoke triggers, physics thresholds or injury rules were introduced.

Other aircraft retain their existing damage rendering. No new asset downloads or purchases. Existing FlightGear credits and GPL source archive remain in place; source models/textures were not modified.

Checks: C172 structural detail, finite geometry, both-side/repeated cuts, source restoration, paint retention, no regrowth during full crash, localized gear/cowling deformation; existing authored-wreck geometry and wing tests; emergency recovery across 11 aircraft; scrape-contact regression. Browser inspection covered torn wing, collapsed gear and a non-burning nose impact. Physical iPad testing remains unperformed.
