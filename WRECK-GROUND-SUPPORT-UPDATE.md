# Wreckage ground support correction

Two mismatches allowed visible debris to sink: simplified collision proxies did not match the authored/deformed meshes, and smooth analytic terrain heights did not match the displayed 60 m triangle mesh. Detached wing fragments also used a fixed 0.3 m clearance regardless of shape or rotation.

Wreckage now samples the displayed terrain triangles. Authored wreck meshes provide surface support samples to their physics bodies; detached wings do the same. Support is evaluated across each assembly's footprint and rechecked after rotation/settling. The first rendered frame is corrected before drawing, including resting pieces, and fixed resting poses are cached. Physics retains the existing sliding, braking and settling behavior. This change does not add deformable craters or a new bounce model.

Validation: exact terrain triangle interpolation; authored mesh samples; flat/sloped ground and rolled wreckage; actual rendered test vertices remain above terrain; stable resting poses; detached-wing support on first draw. Existing crash settling, scrape, wing geometry/contact, C172 damage, and all 11 aircraft emergency-recovery tests pass. Browser inspection of a settled C172 hillside wreck. Physical iPad testing remains unperformed. Contact geometry is still an approximation and rigid groups can span several connected parts.
