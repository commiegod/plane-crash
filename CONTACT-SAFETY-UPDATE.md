# Building scrapes and grass taxiing

Building contact now resolves the overlap outward and removes the velocity directed into the wall for contacts up to 16 m/s normal speed. Tangential motion is retained with drag and visible sparks. Faster direct hits still crash. Crash severity uses speed into the wall rather than total flight speed. Airport sections break only for building impacts with sufficient structural severity; nearby fuel fire alone no longer removes building sections.

Moderate terrain slopes no longer trigger a crash based on taxi speed. Very steep terrain stops aircraft moving at 14 m/s or less without occupant harm; faster encounters produce bounded rough-ground damage. Flat grass remains driveable. These are simplified game contact rules, not full mesh collision or structural simulation.

Verified: focused scrape/direct-hit tests at 30/60/120 simulation Hz, level-grass taxi, moderate slopes, slow steep-ground stop, existing aircraft handling and repeated-flight checks, stalls, authored wrecks and deformation. Browser preview verifies continued control and intact airport after a scrape. Physical iPad testing remains outstanding.

727 remains pending. Candidate free source: https://github.com/FGMEMBERS/727-230 (repository identifies GPL-2.0). Conversion, full asset/license inspection, cockpit and wreck integration, and flight testing remain necessary; no 727 is included in this release.
