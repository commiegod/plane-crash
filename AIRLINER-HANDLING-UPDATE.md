# A320 and 737 handling update

A320 and Boeing 737-800 now have functional Up / Takeoff / Landing flap settings, gradual extension, speed interlocks, live cockpit flap readouts, and trailing-edge flap animation using their archived FlightGear hinge geometry. The 737 uses separate main and aft flap sections; A320 flap sections rotate and extend aft. The simple three-position control does not reproduce every real aircraft detent or leading-edge device.

Each jet has its own pitch/roll response, braking, steering grip, flap movement rate, drag and available thrust tuning. Turning depends on airspeed and bank. Touchdown preserves a slight nose-up attitude and briefly compresses the gear. These remain gameplay approximations, not validated aircraft performance or Airbus flight-control-law simulation.

Validated: fully loaded departures, assisted landings, stops and repeat takeoffs on both runway ends at 30/60/120 Hz; full-flap go-arounds; flap extension speed limit and pause; hard impacts and optional report behavior. Existing ten-aircraft gameplay, repeated-flight, stall/recovery, authored-wreck and deformation regressions pass. Browser geometry checks confirm all four A320 and eight Boeing trailing-edge flap meshes lower symmetrically. Physical iPad testing remains outstanding.

Run: node tests/airliner-handling.cjs and node tests/light-handling.cjs.

Flap animation metadata in airliner-controls.js is adapted under GPL-2.0 from the original XML files in assets/a320/source.zip and assets/b737/source.zip; retain their existing credits and licenses. The Boeing source typo -5.5.88 is corrected to -5.88, matching its adjacent animation. The extraction script is retained in tools/build-airliner-controls.py.
