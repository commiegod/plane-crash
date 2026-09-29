# September 29: consistent Cessna wreckage and aerodynamic stalls

The imported Cessna now retains its actual mesh and UV textures after an impact. Intact slides keep the airframe whole; major damage splits its rear fuselage and wings from the forward cabin; catastrophic impacts distribute textured triangles across the existing fragment bodies. Section boundaries are clipped with interpolated texture coordinates. Restart disposes generated wreck geometry without disposing shared aircraft textures. The existing crash report and survivor calculation remain unchanged.

Stall behavior now uses the angle between the wing and the relative airflow. A steep attitude alone does not trigger a stall if the airflow remains aligned. Steep climbs lose energy; falling airspeed reduces the aircraft's ability to redirect its flight path. Excess angle of attack reduces lift and roll authority, adds drag, and pitches the nose toward the airflow. Lowering the nose and rebuilding speed permits recovery. Warnings give short recovery instructions.

This remains a simplified game flight model, not validated aircraft performance. Airborne thrust is capped separately from ground acceleration to remove sustained near-vertical airliner climbs. Guidance reference: FAA Angle of Attack Awareness, https://www.faa.gov/sites/faa.gov/files/2022-01/Angle%20of%20Attack%20Awareness.pdf .

Validation: automated steep-climb stall and recovery on all ten aircraft; high-speed excessive-angle stall; aligned-flow climb; low-speed departure and recovery; pause/reset; existing gameplay regression; authored mesh preservation and wreck cleanup; browser visual review of intact, sectioned and fragmented Cessna.

The next fleet asset candidate is the GPLv2 A320-family exterior and cockpit: https://github.com/legoboyvdlp/A320-family . Source inspected locally; it has not yet been converted or published. Other fleet replacements remain pending.
