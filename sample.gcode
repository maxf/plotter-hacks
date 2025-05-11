; preamble
G21 ; use millimeters
G90 ; All distances and positions are Absolute values from the current origin.
G17 ; Draw Arcs in the XY plane, default.
G94 ; Units/min mode at the current F rate.

F 1000 ; Set Feed rate in mm/min

G0 X0 Y0 Z0
G1 X10 Y0 Z5
G1 X20 Y0 Z5
G1 X30 Y0 Z0
G0 X0 Y0 Z0
