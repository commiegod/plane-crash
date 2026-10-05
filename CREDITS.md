# Flight Simulator asset credits

- Three.js 0.180.0 and HDRLoader: MIT license, included as `assets/THREE-LICENSE.txt`. https://threejs.org/
- Aerial Grass Rock: https://polyhaven.com/a/aerial_grass_rock
- Asphalt 02: https://polyhaven.com/a/asphalt_02
- Kloofendal 48d Partly Cloudy (Pure Sky): https://polyhaven.com/a/kloofendal_48d_partly_cloudy_puresky
- Pine Tree 01 foliage texture atlas: https://polyhaven.com/a/pine_tree_01

The Poly Haven assets are provided under CC0: https://polyhaven.com/license
The game uses the photographic foliage textures in its own instanced tree geometry; it does not include the full scanned pine model.

The original procedural aircraft geometry, airport geometry, particle sprites, UI, and game code were created for this project. Authored aircraft replacements are credited below. Aircraft names identify simplified representations. “Horizon” is a fictional livery used in this game.

## Airline decals (September 15 control update)
Ten representative global airlines: Delta, American, United, Southwest, Emirates, Qatar Airways, British Airways, Lufthansa, Air France and Singapore Airlines. This is a representative selection, not a ranked popularity claim. Logo PNGs are served locally, sourced from https://github.com/imgmongelli/airlines-logos-dataset/tree/master/images (DAL, AAL, UAL, SWA, UAE, QTR, BAW, DLH, AFR, SIA). Airline trademarks belong to their respective owners. No affiliation or endorsement is implied. Paint colors, placement and cropped fin emblems are game adaptations to the available procedural aircraft, not exact fleet-specific replicas. Source images are low-resolution; higher-resolution vector decals remain a visual improvement opportunity.

## September 22 aircraft expansion
The seven new airframes are original procedural geometry. Manufacturer and museum references, model limitations, and the youth UX review are documented in [FLEET-AND-UX-REVIEW.md](./FLEET-AND-UX-REVIEW.md). No aircraft meshes or textures were extracted from Project Flight or Roblox.

## September 29 authored Cessna replacement
The Cessna 172P exterior, classic cockpit and instrument artwork now come from the free FlightGear C172P community aircraft, replacing the original procedural Cessna in normal flight. They are GPLv2, not original project geometry. [Attribution, modifications, license and corresponding source](assets/c172p/NOTICE.md). The remaining procedural aircraft are being replaced incrementally.

GLTFLoader and BufferGeometryUtils are from Three.js r180, covered by the included Three.js MIT license.

## October 5 authored airliner replacements

- Airbus A320-200: [source, modifications and GPLv2 license](assets/a320/NOTICE.md). Original Delta and American paints.
- Boeing 737-800: [source, modifications and GPLv2 license](assets/b737/NOTICE.md). Original Delta, American and United paints.

Both include distinct modeled flight decks with simplified live displays. The current authored fleet is C172P, A320 and 737; other aircraft still use procedural geometry.
