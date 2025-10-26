;M190 S{{TEMP}}; set heatbed to user defined temp and wait until it is reached
;M400 S180; wait 3 minutes for bed heatsoak

G91; turn on relative positioning
G1 Z{{TIP_DISTANCE_SAFE}} F1200; lower bed safely
G90; turn ON absolute positioning
M83; put extruder in relative mode
G28; home toolhead
G29.2 S0; turn off bed leveling compensation
G1 Z{{TIP_DISTANCE_SAFE}} F1800; lower bed safely

; MOVE TO CENTER BEFORE MAIN SEQUENCE FOR ZEROING INDICATOR =========================
G1 Z{{TIP_DISTANCE_PROBE}} F1200; move toolhead to probe height for zeroing
M400 S10; wait at probe height for 10 seconds
G1 Z{{TIP_DISTANCE_SAFE}} F1800; lower bed safely

; START MAIN SEQUENCE =========================

{{MEASUREMENT_ROUNDS}}

; FINISH MAIN SEQUENCE =========================

G1 Z{{TIP_DISTANCE_SAFE}} F1200; lower bed to safe distance
G1 X{{CENTER_X}} Y{{CENTER_Y}} F4800; move toolhead to center
M400; pause until Z is at the user-defined distance
;M140 S0; cool down heatbed
M18; turn all stepper motors OFF
