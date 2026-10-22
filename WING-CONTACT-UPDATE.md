# Wing contact and shallow impact update

Shallow ground impacts preserve more forward velocity than steep impacts. Existing surface-dependent drag still brings wreckage to rest; the crash report remains optional.

Wing span/chord probes sweep the previous physics step against terrain independently of fuselage touchdown. Outer strikes detach a tip or larger section, reduce lift and roll authority, and introduce asymmetric roll. Inner wing-root strikes cause a crash. Low-speed contact stops ground movement instead of exploding. Detached wing sections use clipped authored geometry with original materials, UVs and normals, remain separate during subsequent crashes, and reset on a new flight. Missing outboard engines cannot be restored through systems repair.

This is a gameplay damage model, not a structural/aerodynamic engineering simulation. Terrain probes approximate the wing envelope; wing-root impacts remain a full-crash transition. Building contacts retain the existing separate scrape/collision behavior.

Validation: both sides of all 11 aircraft; retained roll input; rising hillside contact; shallow wreck travel; piece settling; pause/new-flight restoration; geometry surface-area and cut bounds, normals/UVs and transforms. Existing fleet grass/landing, building damage/contact, crash settling and Boeing 727 handling regressions pass. Browser visual check of the detailed C172's missing tip and detached geometry. Physical iPad testing not performed.
