# Cessna 172P aircraft

Model and textures: FlightGear C172P contributors.
Source: https://github.com/c172p-team/c172p
Revision: 84477612bba340ab98004a10f8b28a81c18e6169
License: GNU General Public License version 2; see [COPYING.txt](COPYING.txt).
Contributor acknowledgments are included in the source archive's Thanks file.

This game converts the original AC3D exterior, classic cockpit and selected instruments to glTF. Changes include triangulation, generated vertex normals, resized WebP textures, browser material adaptation, static-mesh batching, and animation bindings to this game's simplified flight state. Original blue and white paint is retained. This is a C172P classic analog cockpit, not a G1000 panel.

[Download corresponding source and conversion scripts](source.zip).
The archive contains the original model, texture and instrument XML files used for this conversion, their license and acknowledgments, and both conversion scripts. To reproduce: arrange the archived Models directory and license files inside work/c172p, put the scripts inside work, create site/assets/c172p, install Python 3 with numpy and Pillow, then run convert-c172p.py followed by prepare-c172p.py.

The primary flight needles and propeller are animated. Radios, switches and most secondary instruments are visual details, not a complete interactive aircraft systems simulation. Existing simplified crash geometry is used after an impact.
