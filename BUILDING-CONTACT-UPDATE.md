# Building contact — October 21, 2026

Survivable wall scrapes now add bounded chips and local scuffing without removing structural sections. Larger building impacts use the calculated wall-contact point and impact severity to bound the damaged area, rather than using total aircraft speed to expand it. Damage persists through the flight and restores on a new flight. Pause freezes rubble.

Validated: building-damage tests cover scrape preservation, nearby versus distant scuffs, reset, pause, settling, impact location, severity scaling, tangential-speed independence, and debris limits. Contact-safety and crash-settling tests pass. Local browser review confirmed the aircraft survives a glancing touch and a direct hit damages a limited part of the terminal. Collision shapes remain approximations; this does not implement individually detachable aircraft wingtips. Physical iPad testing remains outstanding.
