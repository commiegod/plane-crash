# Airline and tablet control update

- Ten selectable airline logos, fuselage wordmarks, fin emblems and paint palettes.
- Stop Pushback immediately hands control over at the current location with zero throttle and parking brake released.
- Vertical 0–100% throttle slider; moving it cancels taxi or landing assistance.
- Separate 2/3/4 engine power percentages, with fire/off states. These display the simplified simulation's commanded power, not turbine N1 measurements.
- 360-degree compass and toggleable airport map with aircraft direction, location, distance and off-map indication. This is navigation within the fictional airport, not device GPS.
- Rounded translucent action buttons and tablet layouts.

Validation: simulation checks pass for all aircraft and both runway directions, all 18 gate routes, safe/unsafe landing, cabin accounting, failures, mid-pushback position preservation, throttle takeover and pause, engine-out percentages and heading wrap. Browser checks cover airline cards, pushback cancellation, throttle slider, navigation and landscape/portrait tablet layouts; no browser errors observed. Physical iPad Safari remains untested.

## September 18 pacing update

Crash results finalize immediately at ground impact, without an evacuation countdown. Airborne breakup reports finalize on the first fuselage ground contact. Fire and exit effects are resolved instantly using the existing abstract outcome rules. Pushback covers the same 70 m in 7 seconds, supports proportional joystick or keyboard steering and braking, and retains Stop Pushback. Automatic completion still sets the parking brake. Tests cover immediate and stable reports, airborne contact, pushback duration, steering and braking, plus all 18 gate routes.

## September 18 report and grass correction

Crash results finalize at impact but no longer open automatically. A highlighted View Crash Report button appears at the top of the action rail; the player can open, dismiss and reopen the report while debris continues moving. Level grass supports taxiing with increased rolling resistance. Runway overruns and gentle gear-down grass touchdowns enter manual taxi rather than automatically crashing. Terrain gradients sampled across a 6 m footprint reject slopes above 0.32 or terrain-following vertical speed above 5 m/s; these are game thresholds, not certified aircraft limits. Buildings and hard landings still cause crashes. Regression tests cover all aircraft on grass, overruns, steep terrain, and report opening only on player input.
