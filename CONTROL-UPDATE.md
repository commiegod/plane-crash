# Airline and tablet control update

- Ten selectable airline logos, fuselage wordmarks, fin emblems and paint palettes.
- Stop Pushback immediately hands control over at the current location with zero throttle and parking brake released.
- Vertical 0–100% throttle slider; moving it cancels taxi or landing assistance.
- Separate 2/3/4 engine power percentages, with fire/off states. These display the simplified simulation's commanded power, not turbine N1 measurements.
- 360-degree compass and toggleable airport map with aircraft direction, location, distance and off-map indication. This is navigation within the fictional airport, not device GPS.
- Rounded translucent action buttons and tablet layouts.

Validation: simulation checks pass for all aircraft and both runway directions, all 18 gate routes, safe/unsafe landing, cabin accounting, failures, mid-pushback position preservation, throttle takeover and pause, engine-out percentages and heading wrap. Browser checks cover airline cards, pushback cancellation, throttle slider, navigation and landscape/portrait tablet layouts; no browser errors observed. Physical iPad Safari remains untested.
