;GCODE Generator Version 1.5 - Updated Dec 23, 2025
;Important user parameters: printerModel:{{PRINTER_MODEL}} | tipDistance:{{TIP_DISTANCE}}mm | probeHeight:{{TIP_DISTANCE_PROBE}}mm | bedTemp:{{TEMP}}C
{{HEATUP_PLATE}}
G91; turn on relative positioning
G1 Z{{TIP_DISTANCE_SAFE}} F1200; lower bed safely
G90; turn ON absolute positioning
M83; put extruder in relative mode
G28; home toolhead
G29.2 S0; turn off bed leveling compensation
{{PREVENT_RADIANT_HEAT}}

; START MAIN SEQUENCE =========================

{{MEASUREMENT_ROUNDS}}

; FINISH MAIN SEQUENCE =========================

G1 Z{{TIP_DISTANCE_SAFE}} F1200; lower bed to safe distance
G1 X{{CENTER_X}} Y{{CENTER_Y}} F4800; move toolhead to center
M400; pause until Z is at the user-defined distance
M18; turn all stepper motors OFF
{{COOLDOWN_PLATE}}

