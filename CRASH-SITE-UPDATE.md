# Crash-site and DC-10 update

- Ground impacts now lose horizontal momentum according to breakup severity, followed by stronger surface friction and speed-dependent drag. Grounded fragments retain contact while tumbling; this prevents repeated friction-free hops. Intact belly landings retain more momentum than fragmented wrecks.
- The regression scenarios at 100 m/s settle within 5–9 seconds and less than 350 meters at 30/60/120 Hz. These are bounded test results, not a promise that every airborne breakup lands within that time.
- Fuel-bearing severe crashes have a larger ground-impact ignition, longer fire/smoke and irregular scorched ground. Gentle fuel-free belly landings do not automatically explode.
- Buildings are partitioned into instanced sections. Impact removes nearby sections and emits a bounded pool of falling rubble. Pause freezes damage motion; new flights restore airport geometry. This is localized visual destruction, not a structural engineering simulation; building collision volumes remain coarse.
- DC-10-30 now uses authored FlightGear geometry, classic cockpit artwork, live primary needles and moving attitude horizon. Three original source liveries are available. Many secondary instruments and switches remain decorative.

Validation: full gameplay regressions, all ten aircraft stall/recovery tests, contact/settling checks at three frame rates, building damage/pause/restoration tests, authored wreck geometry tests, DC-10 resource/source validation, and browser visual checks. Physical iPad Safari remains untested.
