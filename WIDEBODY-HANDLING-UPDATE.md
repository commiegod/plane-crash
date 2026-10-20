# DC-10 and Boeing 747 handling update

DC-10 and 747 now have gradual Up / Takeoff / Landing flaps with extension speed limits. Their original source animations drive DC-10 translating and rotating panels and the 747 multi-section trailing-edge flaps. The 747 simplified cockpit display shows selected surface travel as flap degrees. The three-position game control does not reproduce every real detent or leading-edge device.

Each has separate steering grip, braking, pitch/roll response, flap rate, drag and thrust tuning. The 747 responds more slowly than the DC-10. Both support touchdown compression and retain their existing authored cockpits, paint and crash geometry. These are game approximations, not validated aircraft performance.

Validated: loaded departures, assisted landings and repeat takeoffs on both runway ends at 30/60/120 simulation Hz; full-flap go-arounds, overspeed extension interlock, pause, hard impacts, steep-climb stalls and recovery. Browser geometry checks confirm symmetric downward movement of four primary DC-10 panels and the eight main 747 sections (26 material submeshes). Physical iPad testing remains outstanding.

Run node tests/widebody-handling.cjs. Source flap metadata in assets/dc10/flap-controls.json and assets/b747/flap-controls.json retains the existing GPL-2.0 licenses and per-aircraft credits. tools/build-classic-controls.py extracts it from each source.zip archive; the DC-10 XML animation frame is mapped to the imported DC-10-30 mesh frame. No new purchased assets were added.
