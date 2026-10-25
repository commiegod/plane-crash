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

## DC-10-30 authored replacement
The DC-10 now uses the free FlightGear community model, with its classic cockpit and original American, Air France and Lufthansa paint. [License, source, credits and modifications](assets/dc10/NOTICE.md). The authored fleet now includes C172P, A320, 737-800 and DC-10-30. Other airframes remain procedural.

## October 15 Boeing 747-400 replacement

- Boeing 747-400: [source, modifications and GPLv2 license](assets/b747/NOTICE.md), with original KLM paint and a modeled cockpit with simplified live displays.

## October 17 Douglas DC-3 replacement

- Douglas DC-3: [source, modifications and GPLv2 license](assets/dc3/NOTICE.md), with Air France paint, classic cockpit, live analog flight/RPM instruments and independently animated propellers. The same authored model is retained in wreckage.

## October 18 Douglas DC-9-32 replacement

DC-9-32 exterior and flight deck by Lester Boffo and Joshua Davidson, adapted from FlightGear community assets. [Source, modifications and CC BY-NC-SA 4.0 terms](assets/dc9/NOTICE.md). This aircraft has a noncommercial share-alike license, unlike the earlier GPL fleet assets.

## October 18 Citation X private-jet replacement

Cessna Citation X exterior, cabin and flight deck by Syd Adams and FlightGear community contributors. [Source, adaptations and GPLv2 terms](assets/citationx/NOTICE.md). This replaces the procedural Gulfstream selection and is labeled Citation X to match the actual model.

## October 19 C-130 Hercules replacement

Classic C-130 exterior and analog cockpit by Emmanuel Baranger, Didier Fabert and FlightGear community contributors. Four independent propellers and live flight/RPM instruments. [Source, modifications and GPLv2 terms](assets/c130/NOTICE.md).

## October 19 Piper Seneca II replacement

Piper PA-34 Seneca II by Torsten Dreyer and FlightGear community contributors, with shared FlightGear analog instruments. Original D-GEAR paint, modeled cockpit, counter-rotating propellers and matching wreckage. [Source, adaptations and GPL terms](assets/seneca/NOTICE.md). All ten aircraft selections now use authored models.

## October 20 Boeing 727 addition

- Boeing 727-230: [source, modifications and GPLv2 license](assets/b727/NOTICE.md), with original Lufthansa paint, modeled analog cockpit, and three engines.

## Experimental structural physics lab

The optional Cessna Physics Lab uses **cannon-es 0.20.0**, by the cannon.js and cannon-es contributors, under the [MIT license](assets/cannon-es-LICENSE.txt). [Upstream source](https://github.com/pmndrs/cannon-es). The lab reuses the credited FlightGear C172P aircraft and textures; its runtime mesh partitioning does not change the original asset archive.
