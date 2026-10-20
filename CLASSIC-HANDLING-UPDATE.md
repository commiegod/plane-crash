# DC-3 and DC-9 handling update

Both aircraft now offer gradual Up / Takeoff / Landing flaps with extension speed limits. Original model hinge geometry drives four DC-3 flap surfaces and two DC-9 flap surfaces plus their fairings. The DC-9 cockpit flap needle and lever follow the setting.

Each aircraft has distinct pitch/roll response, steering grip, braking, thrust, flap drag and movement rate. Touchdown compression is supported while retaining the DC-3 tailwheel stance. Flight performance remains a gameplay approximation, not validated aircraft performance.

Validation: loaded departures, assisted landings and repeat takeoffs on both runway ends at 30/60/120 simulation Hz; full-flap go-around, extension speed limit, pause and hard impact. Existing light-aircraft/airliner handling, ten-aircraft gameplay, repeated-flight, stalls, authored wrecks and deformation checks pass. Browser geometry checks confirm symmetric downward movement of all six flap meshes. Physical iPad testing remains outstanding.

Run node tests/classic-handling.cjs. Animation metadata is extracted reproducibly with tools/build-classic-controls.py from the original XML archived in each aircraft source.zip. DC-3 metadata retains GPL-2.0; DC-9 metadata retains CC BY-NC-SA 4.0. Existing per-aircraft credits and license files apply. No new purchased assets are used.
