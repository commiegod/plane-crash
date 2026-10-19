# Cessna and Seneca handling update

Cessna 172P and Piper Seneca II now have a Flaps button (keyboard F): Up, Takeoff, Landing. Flaps move gradually and animate on the actual aircraft; the Cessna cockpit flap indicator follows them. Extension is blocked above each aircraft's game speed limit; retraction remains available. Flaps add drag, reduce the lift reference speed and lower the takeoff speed. Landing practice starts configured with landing flaps. These are tuned gameplay responses, not certified performance data.

Pitch and roll input build smoothly, with reduced authority at low airspeed. Banked turning responds to speed. Each aircraft has distinct ground steering, braking and control response settings; steering at speed is constrained by tire grip. Pushback retains its existing controls.

Safe touchdowns retain a slight nose-up attitude which settles progressively, with brief visual landing-gear compression. Wheels remain at ground level during compression. Existing gear-collapse/crash thresholds and optional crash reports remain in place. Landing, taxiing and repeat takeoffs are preserved.

Validation: node tests/light-handling.cjs covers gradual deployment, pause, extension limits, steering limits, stationary steering, suspension settling, hard landings, repeated takeoff at 30/60/120 Hz and full-flap go-arounds. The full gameplay, ten-aircraft repeated-flight, stall/recovery and authored-wreck suites pass. Browser checks verify actual flap geometry/hinges and the in-game button. Physical iPad testing remains outstanding.
