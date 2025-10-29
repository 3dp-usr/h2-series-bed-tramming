const form = document.getElementById("gcodeForm");
const customTempInput = document.getElementById("customTemp");
const uniformTimeInput = document.getElementById("uniformTime");
const customTimeContainer = document.getElementById("customTimeContainer");
const tipDistanceInput = document.getElementById("tipDistance");
const probeHeight = document.getElementById("probeHeight");
const timeModeRadios = document.querySelectorAll('input[name="timeMode"]');
const measureCountRadios = document.querySelectorAll('input[name="measureCount"]');
const printerRadios = document.querySelectorAll('input[name="printer"]');
const outputButton = document.getElementById("outputButton");
const downloadButton = document.getElementById("downloadButton");
const gcodeOutput = document.getElementById("gcodeOutput");

// Enable/disable custom temperature input
document.querySelectorAll('input[name="tempMode"]').forEach(radio => {
  radio.addEventListener("change", () => {
    customTempInput.disabled = (radio.value !== "custom");
    checkFormValidity();
  });
});

// Integer/decimal input enforcement
function enforceNumberInput(input, allowDecimal = false) {
  input.addEventListener('keydown', (e) => {
    if (!allowDecimal && (e.key === '.' || e.key === 'e' || e.key === '+' || e.key === '-')) {
      e.preventDefault();
    }
  });

  input.addEventListener('input', () => {
    let val = input.value;
    let start = input.selectionStart;
    let end = input.selectionEnd;

    if (allowDecimal) val = val.replace(/[^\d.]/g, '');
    else val = val.replace(/\D/g, '');

    if (allowDecimal) {
      const parts = val.split('.');
      if (parts.length > 2) val = parts[0] + '.' + parts[1];
    }

    if (!allowDecimal || !val.startsWith('0.')) val = val.replace(/^0+/, '');
    if (val === '') val = allowDecimal ? '0' : '0';

    if (val !== input.value) {
      input.value = val;
      input.setSelectionRange(Math.min(start, val.length), Math.min(end, val.length));
    }

    checkFormValidity();
  });
}

// Apply enforcement
enforceNumberInput(uniformTimeInput);
enforceNumberInput(customTempInput);
enforceNumberInput(tipDistanceInput, true);
enforceNumberInput(probeHeight, true);

// Warning container helper
function getWarningContainer(fieldset) {
  let warning = fieldset.querySelector('.warning');
  if (!warning) {
    warning = document.createElement('div');
    warning.className = 'warning';
    warning.style.color = 'red';
    warning.style.fontSize = '0.9em';
    warning.style.marginTop = '5px';
    fieldset.appendChild(warning);
  }
  return warning;
}

// Validate number input
function validateNumberInput(input, min, max) {
  const val = parseFloat(input.value);
  return !isNaN(val) && val >= min && val <= max;
}

// Create per-round time inputs
function updateCustomTimeInputs() {
  const selectedTimeMode = document.querySelector('input[name="timeMode"]:checked').value;
  const measureCount = parseInt(document.querySelector('input[name="measureCount"]:checked').value, 10);

  customTimeContainer.innerHTML = '';

  if (selectedTimeMode === 'custom') {
    for (let i = 1; i <= measureCount; i++) {
      const input = document.createElement('input');
      input.type = 'number';
      input.min = 1;
      input.step = 1;
      input.style.width = '50px';
      input.dataset.round = i;

      let defaultTime = i === 1 ? 60 : i === 2 ? 45 : 30;
      input.value = defaultTime;
      enforceNumberInput(input);

      input.addEventListener('input', () => {
        let val = parseInt(input.value, 10);
        input.dataset.invalid = (!isNaN(val) && (val < 5 || val > 999)) ? "true" : "";
        checkFormValidity();
      });

      const label = document.createElement('label');
      label.textContent = ` Round ${i}: `;
      label.appendChild(input);
      customTimeContainer.appendChild(label);
      customTimeContainer.appendChild(document.createElement('br'));
    }
  }
}

// Listeners
timeModeRadios.forEach(radio => {
  radio.addEventListener('change', () => {
    if (radio.value === 'uniform') {
      uniformTimeInput.disabled = false;
      customTimeContainer.innerHTML = '';
    } else {
      uniformTimeInput.disabled = true;
      updateCustomTimeInputs();
    }
    checkFormValidity();
  });
});

measureCountRadios.forEach(radio => {
  radio.addEventListener('change', () => {
    if (document.querySelector('input[name="timeMode"]:checked').value === 'custom') {
      updateCustomTimeInputs();
    }
    checkFormValidity();
  });
});

printerRadios.forEach(radio => {
  radio.addEventListener('change', checkFormValidity);
});

// Validate entire form
function checkFormValidity() {
  let valid = true;

  // Printer model
  const printerSelected = !!document.querySelector('input[name="printer"]:checked');
  const printerFieldset = document.querySelector('input[name="printer"]').closest('fieldset');
  const printerWarning = getWarningContainer(printerFieldset);
  if (!printerSelected) {
    valid = false;
    printerWarning.textContent = "Please select a printer model.";
  } else printerWarning.textContent = '';

  // Temperature
  const tempFieldset = customTempInput.closest('fieldset');
  const tempWarning = getWarningContainer(tempFieldset);
  if (!customTempInput.disabled && !validateNumberInput(customTempInput, 0, 120)) {
    valid = false;
    tempWarning.textContent = "Bed Temperature must be between 0°C and 120°C.";
  } else tempWarning.textContent = '';

  // Time
  const timeFieldset = customTimeContainer.closest('fieldset') || uniformTimeInput.closest('fieldset');
  const timeWarning = getWarningContainer(timeFieldset);
  const timeMode = document.querySelector('input[name="timeMode"]:checked').value;
  if (timeMode === 'uniform') {
    if (!validateNumberInput(uniformTimeInput, 1, 999)) {
      valid = false;
      timeWarning.textContent = "Time must be between 1 and 999 seconds.";
    } else timeWarning.textContent = '';
  } else {
    const inputs = customTimeContainer.querySelectorAll('input[type="number"]');
    let customInvalid = false;
    inputs.forEach((input) => {
      if (!validateNumberInput(input, 1, 999)) customInvalid = true;
    });
    if (customInvalid) {
      valid = false;
      timeWarning.textContent = "All times must be between 1 and 999 seconds.";
    } else timeWarning.textContent = '';
  }

  // Tip distance
  const tipFieldset = tipDistanceInput.closest('fieldset');
  const tipWarning = getWarningContainer(tipFieldset);
  if (!validateNumberInput(tipDistanceInput, 10, 100)) {
    valid = false;
    tipWarning.textContent = "Tip distance must be between 10 and 100 mm.";
  } else tipWarning.textContent = '';

  // Probe height
  const probeFieldset = probeHeight.closest('fieldset');
  const probeWarning = getWarningContainer(probeFieldset);
  if (!validateNumberInput(probeHeight, 3, 50)) {
    valid = false;
    probeWarning.textContent = "Probe height must be between 3 and 50 mm.";
  } else probeWarning.textContent = '';

  // Disable buttons if invalid
  outputButton.disabled = !valid;
  downloadButton.disabled = !valid;
}

checkFormValidity();

// Generate GCODE
async function generateGcode() {
  const printer = document.querySelector('input[name="printer"]:checked').value;
  const tempMode = document.querySelector('input[name="tempMode"]:checked').value;
  const measureCount = parseInt(document.querySelector('input[name="measureCount"]:checked').value, 10);
  const tipDistance = parseFloat(tipDistanceInput.value);
  const probeValue = parseFloat(probeHeight.value);
  const tipDistance_safe = tipDistance + 3.5;
  const tipDistance_probe = probeValue;
  const temp = tempMode === 'custom' ? parseInt(customTempInput.value, 10) : 0;

  // Determine 4-point coordinates based on printer
  let points;
  const yOffset_H2D = 18;  // offset H2D Y-axis points to account for indicator distance from original GCODE points. Not exact but close enough
  const xOffset_H2D = 12.5;  // offset H2D X-axis points to account for indicator distance from original GCODE points
  const yOffset_H2S = 18;  // H2S
  if (printer === 'H2D') {
    points = [
      { X: 70 - xOffset_H2D, Y: 50 + yOffset_H2D },   // Front Left
      { X: 280 - xOffset_H2D, Y: 50 + yOffset_H2D },  // Front Right
      { X: 285 - xOffset_H2D, Y: 300 + yOffset_H2D }, // Back Right
      { X: 90 - xOffset_H2D, Y: 300 + yOffset_H2D }   // Back Left
    ];
  } else if (printer === 'H2S') {
    points = [
      { X: 70, Y: 50 + yOffset_H2S },
      { X: 280, Y: 50 + yOffset_H2S },
      { X: 270, Y: 300 + yOffset_H2S },
      { X: 70, Y: 300 + yOffset_H2S }
    ];
  }

  // Center coordinates for each printer
const printerCenters = {
  H2D: { X: 175 + 11, Y: 160 - 10 }, // move X-axis and Y-axis closer to the front instead of centered
  H2S: { X: 170, Y: 160 - 10 }
};

const center = printerCenters[printer];

  // Determine measure times
  let measureTimes = [];
  if (document.querySelector('input[name="timeMode"]:checked').value === 'uniform') {
    measureTimes = Array(measureCount).fill(parseInt(uniformTimeInput.value, 10));
  } else {
    const inputs = customTimeContainer.querySelectorAll('input[type="number"]');
    inputs.forEach(input => measureTimes.push(parseInt(input.value, 10)));
  }

  let template = await fetch("h2_series_template.gcode").then(r => r.text());

  template = template.replaceAll("{{PRINTER_MODEL}}", printer);
  template = template.replaceAll("{{TIP_DISTANCE}}", tipDistance);
  template = template.replaceAll("{{TEMP}}", temp);
  template = template.replaceAll("{{TIP_DISTANCE_SAFE}}", tipDistance_safe);
  template = template.replaceAll("{{TIP_DISTANCE_PROBE}}", tipDistance_probe);
  template = template.replaceAll("{{CENTER_X}}", center.X);
  template = template.replaceAll("{{CENTER_Y}}", center.Y);

  // Build measurement rounds
  let rounds = "";
  const pointNames = ["Front Left", "Front Right", "Back Right", "Back Left"];
  for (let i = 1; i <= measureCount; i++) {
    rounds += `; begin measurement round ${i} ========================\n`;
    for (let p = 0; p < points.length; p++) {
      rounds += `G1 Z${tipDistance_safe} F1200\n`;
      rounds += `G1 F4800\n`;
      rounds += `G1 X${points[p].X} Y${points[p].Y} Z${tipDistance_safe}; ${pointNames[p]}\n`;
      rounds += `G1 Z${tipDistance_probe}\n`;
      if (i === 1 && p === 0) {
        rounds += `M400 S5; wait additional 5 seconds at probe height for zeroing indicator\n`;
      }
      if (p === 3) {
        rounds += `M400 S${measureTimes[i - 1]}\n`;
      } else{
          rounds += `M400 S${measureTimes[i - 1]}\n\n`;
      }
      
    }
    rounds += `; end measurement round ${i} ========================\n\n`;
  }

  // Build code for temperature settings
  let heatup = "";
  let preventRadiantHeat = "";
  let cooldown = "";
  if (tempMode === "custom") {
        heatup += `\nM190 S${temp}; set heatbed to user defined temperature\n`;
        preventRadiantHeat += `G1 Z160 F1800; move bed down to keep radiant heat away from printed part and indicator\n`;
        preventRadiantHeat += `M400 S180; wait 3 minutes for bed heatsoak`;
        cooldown += `M140 S0; cool down heatbed\n`;
      } else {
          preventRadiantHeat += `G1 Z${tipDistance_safe} F1800; lower bed safely`;
      }
  
  // Insert code into template
  template = template.replace(/{{HEATUP_PLATE}}/, heatup);
  template = template.replace(/{{PREVENT_RADIANT_HEAT}}/, preventRadiantHeat);
  template = template.replace(/{{MEASUREMENT_ROUNDS}}/, rounds.trim());
  template = template.replace(/^\s*{{COOLDOWN_PLATE}}\s*\r?\n?/m, cooldown);
  return { gcode: template, printer, measureCount, temp, tipDistance };
}

// Output GCODE
outputButton.addEventListener('click', async () => {
  const result = await generateGcode();
  gcodeOutput.value = result.gcode;
});

// Download GCODE
downloadButton.addEventListener('click', async () => {
  const result = await generateGcode();
  const blob = new Blob([result.gcode], { type: "text/plain" });
  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  const roundLabel = result.measureCount === 1 ? 'round' : 'rounds';
  const tempLabel = document.querySelector('input[name="tempMode"]:checked').value === 'ambient' ? 'ambient' : result.temp + 'C';
  a.download = `${result.printer}_tram_${result.measureCount}-${roundLabel}_${tempLabel}_tip-${result.tipDistance}mm.gcode`;
  a.click();
  URL.revokeObjectURL(url);
});
