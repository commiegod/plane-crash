# Crash and aircraft update — September 25, 2026

Impacts now share one gameplay damage profile between visuals and passenger outcomes. Gentle belly landings and gear-collapse slides retain an intact aircraft; stronger impacts separate three major assemblies; catastrophic damage subdivides the airframe into smaller panels and destroys the cabin. The thresholds are game tuning, not validated engineering or injury predictions.

Sliding wreckage uses time-based ground friction, gravity, contact at the underside of each assembly, and damped rotation. Metal contact emits short sparks and dust; sparks stop when sliding stops. Low-severity crashes no longer automatically ignite fuel. Crash reports remain optional and open only when selected. The speed display follows moving wreckage; damaged aircraft no longer show “all systems normal.”

The seven newest aircraft now have smoother tapered noses, curved wing cross-sections, flap/aileron seams, sloped cockpit glazing, door outlines, engine intake lips and exhausts, engine pylons, wheel hubs, and wing navigation lights. The Cessna has a straighter wing, rectangular cabin windows, and a shorter cowling; the DC-3 and Hercules have broader outer wings. These are procedural approximations; exact aircraft-specific geometry, deformation, and high-resolution licensed aircraft assets remain future work.

Validation: existing takeoff, landing, grass taxi, failures, reports and controls regressions; additional tests for all three damage levels, survival accounting, bounded finite debris, rigid assembly motion, pause, and comparable slide distances at 30/60/120 simulation steps per second. Local browser checks cover intact, major and catastrophic crash visuals and optional report opening. Physical iPad Safari has not been tested.
