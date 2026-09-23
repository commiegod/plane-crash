# Fleet and UX update — September 22, 2026

## Aircraft research and implementation

The fleet now contains ten aircraft, retaining the original trainer, DC-10 and 747. Seven new procedural models have separate geometry, engine positions, failure targeting, passenger configurations, handling and breakup parts. Dimensions guide recognizable proportions; flight dynamics and cabin outcomes remain simplified game rules. These are not scanned or manufacturer-certified digital models.

| Addition | Distinguishing features implemented | Research reference |
|---|---|---|
| Cessna 172 Skyhawk | High wing, struts, single two-blade propeller, fixed gear, four total seats, slower handling | [Textron Skyhawk](https://cessna.txtav.com/en/piston/cessna-skyhawk) |
| Douglas DC-3 | Broad low wings, two three-blade propellers, radial-engine nacelles, tailwheel | [Museum of Flight DC-3](https://www.museumofflight.org/exhibits-and-events/aircraft/douglas-dc-3) |
| Airbus A320 | Twin underwing engines, wider fuselage, upright wingtip extensions | [Airbus A320](https://www.aircraft.airbus.com/en/aircraft/a320-family/a320ceo) |
| Boeing 737-800 | Longer narrow fuselage, lower engine nacelles, swept winglets | [Boeing aircraft dimensions](https://www.boeing.com/content/dam/boeing/boeingdotcom/commercial/airports/acaps/737NG_REV_B.pdf) |
| Douglas DC-9-30 | Rear-mounted twin engines and high T-tail | [Delta Flight Museum DC-9 family](https://deltamuseum.org/experiences/exhibits/aircraft-on-view-outside/outside-exhibits/mcdonnell-douglas-dc-9) |
| Gulfstream G650ER | Private-jet proportions, oval windows, rear engines, T-tail, winglets | [Gulfstream specification sheet](https://assets.gulfstream.aero/downloads/22_464552_G650ER_Product_Sheet_PROD_DAM.pdf) |
| Lockheed C-130J Hercules | High wing, four six-blade propellers, broad cargo body, rear ramp outline; crew-only cargo configuration | [Lockheed Martin C-130J](https://lockheedmartin.com/en-us/products/c130.html) |

Cabin configurations are selected game layouts rather than a claim that every operator uses those seat counts. Airline paint choices remain creative adaptations; a selectable airline does not imply that airline operates that airframe. Cargo currently means a cargo airframe and crew-only manifest; loading pallets and cargo missions are not implemented.

## UX review for ages 8–13

This is a design review and browser validation, not a usability study with children. The goal is independence without making the game feel preschool-oriented.

| Problem found | Change |
|---|---|
| Long setup before playing | “Fly now · Runway” after aircraft selection, preserving the full customization path |
| Hard to choose among ten planes | Distinct silhouettes, type labels, short identifying descriptions, Cessna starting recommendation |
| Small and competing controls | Main action buttons at least 50 px high, 54 px on the action rail; secondary controls grouped under More Controls |
| Aviation shorthand hides the next action | Release Brake, Raise/Lower Wheels, Auto Taxi, Change View, Power and Brake labels |
| No clear next step | Contextual instructions for leaving the gate, releasing the brake, adding power and lifting off |
| Reading instructions while aircraft moves | How to Fly pauses the game and resumes only if that guide initiated the pause |
| Color alone communicates selection | Selected text, border and pressed state accompany color |
| Crash report blocks the event | Existing optional View Crash Report behavior retained |

The touch-target baseline follows [W3C enhanced target-size guidance](https://www.w3.org/WAI/WCAG21/Understanding/target-size), which calls for 44 × 44 CSS pixel targets (subject to its exceptions). Our larger primary controls are a design choice, not evidence of age-specific validation.

## Validation and limits

Automated checks cover all seven additions at full selected passenger loads: takeoff, sustained climb, assisted landing and stopping on both runway directions; engine count and single-engine failure behavior; finite geometry and crash breakup; fixed Cessna gear. Existing checks cover all 18 airport gates, grass taxiing, optional report opening, cabin accounting, fuel and fire failures, joystick input and pushback handover.

Actual iPad Safari performance and child usability remain unverified. A useful next playtest is to ask a child to choose a plane, take off, change camera, find help, and restart without coaching; note missed taps, unexplained terms and requests for assistance. Do not infer success from the absence of browser errors.

Browser checks: every new model selected and started without console errors; landscape tablet (1180 × 820), portrait tablet (820 × 1180), and compact portrait (390 × 844) layouts inspected. Visible button bounds exceeded 44 × 44 CSS pixels at the two portrait sizes checked. These are simulated viewport checks, not physical touch-device tests.
