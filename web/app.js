/*

 * SATCOM two-axis antenna pointing simulator.

 * Educational model only: parameters are illustrative, not hardware-validated.

 *

 * Units:

 *   Position: degrees

 *   Velocity: degrees/second

 *   Acceleration: degrees/second^2

 *   Time: seconds

 *

 * Controller:

 *   u = Kp * e + Ki * integral(e dt) - Kd * filtered(measured velocity)

 *

 * Plant:

 *   acceleration = clamp(Kv * (speedCommand - velocity)

 *                       - damping * velocity + disturbance,

 *                       -maximumAcceleration, maximumAcceleration)

 */



"use strict";



const $ = (id) => document.getElementById(id);

const clamp = (value, low, high) => Math.max(low, Math.min(high, value));

const wrap360 = (value) => ((value % 360) + 360) % 360;

const shortestAngleError = (target, measured) =>

  ((target - measured + 540) % 360) - 180;

const fmt = (value, digits = 1) =>

  Number.isFinite(value) ? value.toFixed(digits) : "N/A";



const ui = {

  azTarget: $("azimuth-slider"),

  elTarget: $("elevation-slider"),

  pause: $("pause-button"),

  reset: $("reset-button"),

  clear: $("clear-history-button"),

  posCanvas: $("position-chart"),

  errCanvas: $("error-chart"),

  targetAz: $("azimuth-target-value"),

  targetEl: $("elevation-target-value"),



  az: {

    kp: $("azimuth-kp-slider"),

    ki: $("azimuth-ki-slider"),

    kd: $("azimuth-kd-slider"),

    maxSpeed: $("azimuth-max-speed-slider"),

    maxAccel: $("azimuth-max-acceleration-slider"),

    damping: $("azimuth-damping-slider"),

    wind: $("azimuth-wind-slider"),

    delay: $("azimuth-delay-slider"),

    noise: $("azimuth-noise-slider"),

    bias: $("azimuth-bias-slider"),



    values: {

      kp: $("azimuth-kp-value"),

      ki: $("azimuth-ki-value"),

      kd: $("azimuth-kd-value"),

      maxSpeed: $("azimuth-max-speed-value"),

      maxAccel: $("azimuth-max-acceleration-value"),

      damping: $("azimuth-damping-value"),

      wind: $("azimuth-wind-value"),

      delay: $("azimuth-delay-value"),

      noise: $("azimuth-noise-value"),

      bias: $("azimuth-bias-value"),

    },



    telemetry: {

      target: $("telemetry-target"),

      actual: $("telemetry-actual"),

      measured: $("telemetry-measured"),

      error: $("telemetry-error"),

      velocity: $("telemetry-velocity"),

      command: $("telemetry-speed"),

    },

  },



  el: {

    kp: $("elevation-kp-slider"),

    ki: $("elevation-ki-slider"),

    kd: $("elevation-kd-slider"),

    maxSpeed: $("elevation-max-speed-slider"),

    maxAccel: $("elevation-max-acceleration-slider"),

    damping: $("elevation-damping-slider"),

    wind: $("elevation-wind-slider"),

    delay: $("elevation-delay-slider"),

    noise: $("elevation-noise-slider"),

    bias: $("elevation-bias-slider"),



    values: {

      kp: $("elevation-kp-value"),

      ki: $("elevation-ki-value"),

      kd: $("elevation-kd-value"),

      maxSpeed: $("elevation-max-speed-value"),

      maxAccel: $("elevation-max-acceleration-value"),

      damping: $("elevation-damping-value"),

      wind: $("elevation-wind-value"),

      delay: $("elevation-delay-value"),

      noise: $("elevation-noise-value"),

      bias: $("elevation-bias-value"),

    },



    telemetry: {

      target: $("elevation-telemetry-target"),

      actual: $("elevation-telemetry-actual"),

      measured: $("elevation-telemetry-measured"),

      error: $("elevation-telemetry-error"),

      velocity: $("elevation-telemetry-velocity"),

      command: $("elevation-telemetry-speed"),

    },

  },

};



function makeAxis(name, position, kp, ki, kd, maxSpeed, maxAccel) {

  return {

    name,

    position,

    velocity: 0,
    // Normalised motor/drive state. Values are illustrative, not hardware data.
    motorEffort: 0,
    inertia: name === "az" ? 2.2 : 2.8,
    motorTimeConstant: 0.16,
    coulombFriction: name === "az" ? 0.12 : 0.16,

    kp,

    ki,

    kd,

    maxSpeed,

    maxAccel,



    damping: 0,

    wind: 0,



    delayMs: 0,

    noise: 0,

    bias: 0,



    integral: 0,

    previousMeasurement: null,

    filteredMeasuredVelocity: 0,



    command: 0,

    lastMeasured: position,

    lastError: 0,



    feedback: [],

    previousTarget: name === "az" ? 72 : 38,

    stepStartTime: 0,

    stepStartPosition: position,

    stepTarget: name === "az" ? 72 : 38,

  };

}



const model = {

  time: 0,

  running: true,

  lastFrame: null,

  lastSample: -Infinity,



  targetAz: 72,

  targetEl: 38,



  az: makeAxis("az", 0, 1.5, 0.05, 0.8, 20, 35),

  el: makeAxis("el", 0, 1.5, 0.05, 0.8, 15, 25),



  samples: [],

  sampleEvery: 0.04,

  historySeconds: 20,



  performanceWindowSeconds: 20,

  settledTolerancePercent: 0.02,

  settledMinimumDegrees: 0.2,

};



/* Read current slider values without resetting controller state. */

function readControls() {

  model.targetAz = Number(ui.azTarget.value);

  model.targetEl = Number(ui.elTarget.value);



  for (const name of ["az", "el"]) {

    const axis = model[name];

    const controls = ui[name];



    axis.kp = Number(controls.kp.value);

    axis.ki = Number(controls.ki.value);

    axis.kd = Number(controls.kd.value);



    axis.maxSpeed = Number(controls.maxSpeed.value);

    axis.maxAccel = Number(controls.maxAccel.value);



    axis.damping = Number(controls.damping.value);

    axis.wind = Number(controls.wind.value);



    axis.delayMs = Number(controls.delay.value);

    axis.noise = Number(controls.noise.value);

    axis.bias = Number(controls.bias.value);



    const values = controls.values;



    values.kp.textContent = fmt(axis.kp, 2);

    values.ki.textContent = fmt(axis.ki, 2);

    values.kd.textContent = fmt(axis.kd, 2);



    values.maxSpeed.textContent = `${fmt(axis.maxSpeed, 1)}°/s`;

    values.maxAccel.textContent = `${fmt(axis.maxAccel, 1)}°/s²`;



    values.damping.textContent = fmt(axis.damping, 2);

    values.wind.textContent = `${fmt(axis.wind, 2)}°/s²`;



    values.delay.textContent = `${Math.round(axis.delayMs)} ms`;

    values.noise.textContent = `${fmt(axis.noise, 2)}°`;

    values.bias.textContent = `${fmt(axis.bias, 2)}°`;

  }



  ui.targetAz.textContent = model.targetAz;

  ui.targetEl.textContent = model.targetEl;

}



function targetFor(axis) {

  return axis.name === "az" ? model.targetAz : model.targetEl;

}



function errorFor(axis, measuredPosition) {

  return axis.name === "az"

    ? shortestAngleError(model.targetAz, measuredPosition)

    : model.targetEl - measuredPosition;

}



/*

 * Linear interpolation between feedback samples provides a deterministic

 * time delay, rather than selecting a stale sample by frame index.

 */

function delayedPosition(axis) {

  if (axis.feedback.length === 0) {

    return axis.position;

  }



  const requestedTime = model.time - axis.delayMs / 1000;

  const first = axis.feedback[0];

  const last = axis.feedback[axis.feedback.length - 1];



  if (requestedTime <= first.time) {

    return first.position;

  }



  if (requestedTime >= last.time) {

    return last.position;

  }



  for (let i = axis.feedback.length - 1; i > 0; i -= 1) {

    const newer = axis.feedback[i];

    const older = axis.feedback[i - 1];



    if (older.time <= requestedTime && requestedTime <= newer.time) {

      const duration = newer.time - older.time;



      if (duration <= 0) {

        return newer.position;

      }



      const fraction = (requestedTime - older.time) / duration;

      const delta =

        axis.name === "az"

          ? shortestAngleError(newer.position, older.position)

          : newer.position - older.position;



      const interpolated = older.position + fraction * delta;



      return axis.name === "az"

        ? wrap360(interpolated)

        : clamp(interpolated, 0, 90);

    }

  }



  return last.position;

}



/*

 * Sensor values are sampled once per simulation step and then reused for

 * telemetry and controller calculations. Noise therefore represents

 * measurement noise, not display-refresh noise.

 */

function measurePosition(axis) {

  const delayed = delayedPosition(axis);

  const noisy = delayed + axis.bias + (Math.random() * 2 - 1) * axis.noise;



  return axis.name === "az"

    ? wrap360(noisy)

    : clamp(noisy, 0, 90);

}



function recordFeedback(axis) {

  axis.feedback.push({

    time: model.time,

    position: axis.position,

  });



  const keepAfter =

    model.time - Math.max(2.5, axis.delayMs / 1000 + 0.5);



  while (

    axis.feedback.length > 2 &&

    axis.feedback[1].time < keepAfter

  ) {

    axis.feedback.shift();

  }

}



/*

 * PID output is a requested angular speed in degrees/second.

 * Derivative action uses filtered measured encoder velocity (derivative on

 * measurement), avoiding derivative kick from target changes.

 * Conditional integration stops accumulating the integral while output is

 * saturated in the direction that would worsen saturation.

 */

function pidStep(axis, error, measurement, dt) {
  // Estimate measured angular velocity using the shortest azimuth difference.
  let measuredVelocity = 0;
  if (axis.previousMeasurement !== null && dt > 0) {
    const delta = axis.name === "az"
      ? shortestAngleError(measurement, axis.previousMeasurement)
      : measurement - axis.previousMeasurement;
    measuredVelocity = delta / dt;
  }
  axis.previousMeasurement = measurement;

  // Time-constant-based first-order low-pass filter; independent of frame rate.
  const derivativeFilterTimeConstant = 0.08;
  const alpha = dt / (derivativeFilterTimeConstant + dt);
  axis.filteredMeasuredVelocity += alpha *
    (measuredVelocity - axis.filteredMeasuredVelocity);

  // This controller now requests normalised angular acceleration/drive effort,
  // not an ideal motor speed. D acts on measurement to avoid derivative kick.
  const pTerm = axis.kp * error;
  const dTerm = -axis.kd * axis.filteredMeasuredVelocity;
  const candidateIntegral = clamp(axis.integral + error * dt, -100, 100);
  const candidateEffort = pTerm + axis.ki * candidateIntegral + dTerm;
  const saturated = Math.abs(candidateEffort) > axis.maxAccel;
  const pushesFurtherIntoSaturation = saturated &&
    Math.sign(error) === Math.sign(candidateEffort);

  if (!pushesFurtherIntoSaturation) axis.integral = candidateIntegral;

  const requestedEffort = pTerm + axis.ki * axis.integral + dTerm;
  axis.command = clamp(requestedEffort, -axis.maxAccel, axis.maxAccel);
}

/*

 * Illustrative speed-servo actuator model:

 * acceleration = Kservo(command - velocity) - B*velocity + disturbance.

 *

 * The combined acceleration, including disturbance, is limited. The speed

 * limit is enforced by preventing further acceleration in the direction of

 * the limit; a final numeric clamp protects against floating-point overshoot.

 */

function actuatorStep(axis, dt) {
  // First-order motor/drive lag followed by rotational inertia, viscous and
  // Coulomb friction, external disturbance, and hard speed/travel limits.
  const motorAlpha = dt / (axis.motorTimeConstant + dt);
  axis.motorEffort += motorAlpha * (axis.command - axis.motorEffort);

  const friction = axis.coulombFriction * Math.tanh(axis.velocity / 0.08);
  const requestedAcceleration =
    (axis.motorEffort - axis.damping * axis.velocity - friction) / axis.inertia
    + axis.wind;

  let acceleration = clamp(requestedAcceleration, -axis.maxAccel, axis.maxAccel);
  if (Math.abs(axis.velocity) >= axis.maxSpeed &&
      Math.sign(acceleration) === Math.sign(axis.velocity)) {
    acceleration = 0;
  }

  axis.velocity = clamp(axis.velocity + acceleration * dt,
    -axis.maxSpeed, axis.maxSpeed);
  const nextPosition = axis.position + axis.velocity * dt;

  if (axis.name === "az") {
    axis.position = wrap360(nextPosition);
    return;
  }

  if (nextPosition >= 90) {
    axis.position = 90;
    axis.velocity = Math.min(0, axis.velocity);
    axis.integral = Math.min(0, axis.integral);
  } else if (nextPosition <= 0) {
    axis.position = 0;
    axis.velocity = Math.max(0, axis.velocity);
    axis.integral = Math.max(0, axis.integral);
  } else {
    axis.position = nextPosition;
  }
}

function updateAxis(axis, dt) {

  recordFeedback(axis);



  const measurement = measurePosition(axis);

  const error = errorFor(axis, measurement);



  axis.lastMeasured = measurement;

  axis.lastError = error;



  pidStep(axis, error, measurement, dt);

  actuatorStep(axis, dt);



  return {

    measured: measurement,

    error,

    command: axis.command,

  };

}



function recordSample(azimuth, elevation) {

  model.samples.push({

    time: model.time,



    targetAz: model.targetAz,

    actualAz: model.az.position,

    measuredAz: azimuth.measured,

    azError: azimuth.error,



    targetEl: model.targetEl,

    actualEl: model.el.position,

    measuredEl: elevation.measured,

    elError: elevation.error,

  });



  model.lastSample = model.time;



  while (

    model.samples.length > 0 &&

    model.samples[0].time < model.time - model.historySeconds

  ) {

    model.samples.shift();

  }

}



function updateSimulation(elapsedSeconds) {
  // Accumulate browser elapsed time but advance the model only in fixed 20 ms
  // steps. A catch-up cap prevents a suspended tab from simulating minutes at once.
  model.accumulator += clamp(elapsedSeconds, 0, 0.1);
  const maximumCatchUpSteps = 10;
  let steps = 0;
  while (model.accumulator >= model.fixedStepSeconds && steps < maximumCatchUpSteps) {
    const dt = model.fixedStepSeconds;
    model.time += dt;
    const azimuth = updateAxis(model.az, dt);
    const elevation = updateAxis(model.el, dt);
    if (model.time - model.lastSample >= model.sampleEvery) {
      recordSample(azimuth, elevation);
    }
    model.accumulator -= dt;
    steps += 1;
  }
  if (steps === maximumCatchUpSteps) model.accumulator = 0;
}

function rotateSvg(id, degrees, cx, cy) {

  const element = $(id);



  if (element) {

    element.setAttribute(

      "transform",

      `rotate(${degrees} ${cx} ${cy})`

    );

  }

}



function updateTelemetry(axis, target, error) {

  const telemetry = ui[axis.name].telemetry;



  telemetry.target.textContent = `${fmt(target)}°`;

  telemetry.actual.textContent = `${fmt(axis.position)}°`;

  telemetry.measured.textContent = `${fmt(axis.lastMeasured)}°`;

  telemetry.error.textContent = `${fmt(error)}°`;

  telemetry.velocity.textContent = `${fmt(axis.velocity)}°/s`;

  telemetry.command.textContent = `${fmt(axis.command)}°/s²`;

}



function ensureMetricsPanel() {

  if ($("performance-metrics")) {

    return;

  }



  const panel = document.createElement("section");

  panel.className = "chart-card";

  panel.id = "performance-metrics";



  panel.innerHTML = `

    <div class="chart-header">

      <h3>RESPONSE QUALITY METRICS</h3>

      <span class="eyebrow">RECENT WINDOW</span>

    </div>

    <div class="metrics-grid">

      <div class="metric">

        <span>Azimuth rise time (10–90%)</span>

        <strong id="metric-az-rise">N/A</strong>

      </div>

      <div class="metric">

        <span>Elevation rise time (10–90%)</span>

        <strong id="metric-el-rise">N/A</strong>

      </div>

      <div class="metric">

        <span>Azimuth peak / overshoot</span>

        <strong id="metric-az-peak">N/A</strong>

      </div>

      <div class="metric">

        <span>Elevation peak / overshoot</span>

        <strong id="metric-el-peak">N/A</strong>

      </div>

      <div class="metric">

        <span>Azimuth settling (±2% or 0.2°)</span>

        <strong id="metric-az-settle">Tracking</strong>

      </div>

      <div class="metric">

        <span>Elevation settling (±2% or 0.2°)</span>

        <strong id="metric-el-settle">Tracking</strong>

      </div>

      <div class="metric">

        <span>Azimuth steady-state error</span>

        <strong id="metric-az-steady">N/A</strong>

      </div>

      <div class="metric">

        <span>Elevation steady-state error</span>

        <strong id="metric-el-steady">N/A</strong>

      </div>

      <div class="metric">

        <span>Azimuth RMS / max error</span>

        <strong id="metric-az-rms">N/A</strong>

      </div>

      <div class="metric">

        <span>Elevation RMS / max error</span>

        <strong id="metric-el-rms">N/A</strong>

      </div>

    </div>

    <p class="metrics-note">

      Metrics use true antenna position and recorded samples in the current

      graph window. Overshoot percentage is omitted for zero or very small moves.

    </p>

  `;



  const responseGrid = document.querySelector(".response-grid");



  if (responseGrid) {

    responseGrid.insertAdjacentElement("afterend", panel);

  }

}



/*

 * Metrics use recorded true-position samples in the current window.

 * A move is treated as a step when its target changes in recorded history.

 * Settling uses ±max(2% of move size, 0.2°); it remains "Not settled" until

 * all later samples remain in-band.

 */

function calculateMetrics(axisName) {

  const isAzimuth = axisName === "az";

  const errorKey = isAzimuth ? "azTrueError" : "elTrueError";

  const actualKey = isAzimuth ? "actualAz" : "actualEl";

  const targetKey = isAzimuth ? "targetAz" : "targetEl";



  const windowStart = Math.max(

    0,

    model.time - model.performanceWindowSeconds

  );



  const samples = model.samples.filter(

    (sample) => sample.time >= windowStart

  );



  if (samples.length < 2) {

    return {

      rise: "Collecting…",

      peak: "Collecting…",

      settling: "Collecting…",

      steady: "Collecting…",

      rmsMax: "Collecting…",

    };

  }



  const target = samples[samples.length - 1][targetKey];

  const firstActual = samples[0][actualKey];



  const moveSize = isAzimuth

    ? shortestAngleError(target, firstActual)

    : target - firstActual;



  const tolerance = Math.max(

    0.2,

    Math.abs(moveSize) * 0.02

  );



  const recentErrors = samples.map((sample) => sample[errorKey]);

  const rms = Math.sqrt(

    recentErrors.reduce((sum, error) => sum + error * error, 0) /

      recentErrors.length

  );

  const maxError = Math.max(...recentErrors.map(Math.abs));



  const actualFromStart = (sample) =>

    isAzimuth

      ? firstActual +

        shortestAngleError(sample[actualKey], firstActual)

      : sample[actualKey];



  let peakPosition = actualFromStart(samples[0]);

  let peakTime = samples[0].time;



  for (const sample of samples) {

    const position = actualFromStart(sample);



    if (

      (moveSize >= 0 && position > peakPosition) ||

      (moveSize < 0 && position < peakPosition)

    ) {

      peakPosition = position;

      peakTime = sample.time;

    }

  }



  const overshoot = Math.max(

    0,

    moveSize >= 0

      ? peakPosition - target

      : target - peakPosition

  );



  let riseTime = "N/A";



  if (Math.abs(moveSize) >= 0.2) {

    const startThreshold = firstActual + 0.1 * moveSize;

    const endThreshold = firstActual + 0.9 * moveSize;

    let startCrossing = null;

    let endCrossing = null;



    for (const sample of samples) {

      const position = actualFromStart(sample);

      const reachedStart =

        moveSize >= 0

          ? position >= startThreshold

          : position <= startThreshold;

      const reachedEnd =

        moveSize >= 0

          ? position >= endThreshold

          : position <= endThreshold;



      if (startCrossing === null && reachedStart) {

        startCrossing = sample.time;

      }



      if (startCrossing !== null && reachedEnd) {

        endCrossing = sample.time;

        break;

      }

    }



    if (startCrossing !== null && endCrossing !== null) {

      riseTime = `${fmt(endCrossing - startCrossing, 2)} s`;

    }

  }



  let settling = "Not settled";



  for (let i = 0; i < samples.length; i += 1) {

    const remainsInBand = samples

      .slice(i)

      .every((sample) => Math.abs(sample[errorKey]) <= tolerance);



    if (remainsInBand) {

      settling = `${fmt(samples[i].time - samples[0].time, 2)} s`;

      break;

    }

  }



  const steadyCount = Math.min(10, recentErrors.length);

  const steadyErrors = recentErrors.slice(-steadyCount);

  const steadyStateError =

    steadyErrors.reduce((sum, error) => sum + error, 0) /

    steadyErrors.length;



  const overshootPercent =

    Math.abs(moveSize) >= 0.2

      ? `${fmt((overshoot / Math.abs(moveSize)) * 100, 1)}%`

      : "N/A";



  return {

    rise: riseTime,

    peak: `${fmt(peakTime - samples[0].time, 2)} s / ${fmt(overshoot, 2)}° (${overshootPercent})`,

    settling,

    steady: `${fmt(steadyStateError, 2)}°`,

    rmsMax: `${fmt(rms, 2)}° / ${fmt(maxError, 2)}°`,

  };

}



function updateMetrics() {

  ensureMetricsPanel();



  for (const axisName of ["az", "el"]) {

    const metrics = calculateMetrics(axisName);

    const prefix = axisName === "az" ? "metric-az-" : "metric-el-";



    $(`${prefix}rise`).textContent = metrics.rise;

    $(`${prefix}peak`).textContent = metrics.peak;

    $(`${prefix}settle`).textContent = metrics.settling;

    $(`${prefix}steady`).textContent = metrics.steady;

    $(`${prefix}rms`).textContent = metrics.rmsMax;



    $(`${prefix}settle`).className =

      metrics.settling === "Not settled" ? "status-warning" : "";

  }

}



function updateVisuals() {

  rotateSvg("target-arrow-group", model.targetAz - 90, 200, 200);

  rotateSvg("actual-arrow-group", model.az.position - 90, 200, 200);



  rotateSvg("elevation-target-group", -model.targetEl, 150, 235);

  rotateSvg("elevation-actual-group", -model.el.position, 150, 235);



  updateTelemetry(model.az, model.targetAz, model.az.lastError);

  updateTelemetry(model.el, model.targetEl, model.el.lastError);



  $("dashboard-delay").textContent =

    `${Math.max(model.az.delayMs, model.el.delayMs)} ms`;



  $("dashboard-wind").textContent =

    `${(Math.abs(model.az.wind) + Math.abs(model.el.wind)).toFixed(2)}°/s²`;



  $("dashboard-az-speed").textContent =

    `${fmt(model.az.velocity)}°/s`;



  $("dashboard-el-speed").textContent =

    `${fmt(model.el.velocity)}°/s`;



  $("response-status").textContent = model.running ? "LIVE" : "PAUSED";

  $("response-status").className = model.running ? "" : "status-warning";



  const statusText = $("system-status-text");



  if (statusText) {

    statusText.textContent = model.running

      ? "SIMULATION ACTIVE"

      : "SIMULATION PAUSED";

  }



  updateMetrics();

  drawPositionChart();

  drawErrorChart();

}



function canvasContext(canvas) {

  const bounds = canvas.getBoundingClientRect();

  const pixelRatio = window.devicePixelRatio || 1;

  const width = Math.max(1, bounds.width);

  const height = Math.max(1, bounds.height);



  if (

    canvas.width !== Math.round(width * pixelRatio) ||

    canvas.height !== Math.round(height * pixelRatio)

  ) {

    canvas.width = Math.round(width * pixelRatio);

    canvas.height = Math.round(height * pixelRatio);

  }



  const context = canvas.getContext("2d");

  context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);



  return { context, width, height };

}



function drawAxes(

  context,

  width,

  height,

  minimumY,

  maximumY,

  yLabel,

  startTime,

  endTime

) {

  const left = 58;

  const right = 16;

  const top = 22;

  const bottom = 32;

  const plotWidth = Math.max(1, width - left - right);

  const plotHeight = Math.max(1, height - top - bottom);



  context.clearRect(0, 0, width, height);

  context.font = "12px Segoe UI, Arial";

  context.lineWidth = 1;



  for (let i = 0; i <= 4; i += 1) {

    const y = top + (plotHeight * i) / 4;

    const value = maximumY - ((maximumY - minimumY) * i) / 4;



    context.strokeStyle = "#29434d";

    context.beginPath();

    context.moveTo(left, y);

    context.lineTo(width - right, y);

    context.stroke();



    context.fillStyle = "#b6cbd1";

    context.textAlign = "right";

    context.fillText(

      `${value.toFixed(Math.abs(maximumY - minimumY) < 5 ? 1 : 0)}°`,

      left - 8,

      y + 4

    );

  }



  for (let i = 0; i <= 4; i += 1) {

    const x = left + (plotWidth * i) / 4;

    const seconds =

      startTime + ((endTime - startTime) * i) / 4;



    context.strokeStyle = "#203a45";

    context.beginPath();

    context.moveTo(x, top);

    context.lineTo(x, top + plotHeight);

    context.stroke();



    context.fillStyle = "#b6cbd1";

    context.textAlign = "center";

    context.fillText(`${seconds.toFixed(0)} s`, x, height - 8);

  }



  context.fillStyle = "#a6bdc5";

  context.textAlign = "left";

  context.fillText(yLabel, left, 14);



  return {

    left,

    top,

    plotWidth,

    plotHeight,

  };

}



function drawLine(

  context,

  samples,

  valueKey,

  color,

  frame,

  minimumY,

  maximumY,

  startTime,

  endTime

) {

  if (samples.length < 2) {

    return;

  }



  context.strokeStyle = color;

  context.lineWidth = 2.2;

  context.lineJoin = "round";

  context.beginPath();



  let hasStarted = false;



  for (const sample of samples) {

    const x =

      frame.left +

      ((sample.time - startTime) /

        Math.max(0.001, endTime - startTime)) *

        frame.plotWidth;



    const value = sample[valueKey];

    const y =

      frame.top +

      ((maximumY - value) /

        Math.max(0.001, maximumY - minimumY)) *

        frame.plotHeight;



    if (!Number.isFinite(x) || !Number.isFinite(y)) {

      continue;

    }



    if (!hasStarted) {

      context.moveTo(x, y);

      hasStarted = true;

    } else {

      context.lineTo(x, y);

    }

  }



  context.stroke();

}



function drawPositionChart() {

  const { context, width, height } = canvasContext(ui.posCanvas);



  const endTime = Math.max(model.time, 10);

  const startTime = Math.max(0, endTime - model.historySeconds);



  const samples = model.samples.filter(

    (sample) => sample.time >= startTime

  );



  const positions = samples.flatMap((sample) => [

    sample.targetAz,

    sample.actualAz,

    sample.measuredAz,

  ]);



  let minimumY = positions.length ? Math.min(...positions) : 0;

  let maximumY = positions.length ? Math.max(...positions) : 90;



  const padding = Math.max(2, (maximumY - minimumY) * 0.14);



  minimumY = Math.max(0, minimumY - padding);

  maximumY = Math.min(360, maximumY + padding);



  if (maximumY - minimumY < 8) {

    minimumY = Math.max(0, minimumY - 4);

    maximumY = Math.min(360, maximumY + 4);

  }



  const frame = drawAxes(

    context,

    width,

    height,

    minimumY,

    maximumY,

    "Azimuth position",

    startTime,

    endTime

  );



  drawLine(

    context,

    samples,

    "targetAz",

    "#f2bd60",

    frame,

    minimumY,

    maximumY,

    startTime,

    endTime

  );



  drawLine(

    context,

    samples,

    "actualAz",

    "#61ddd8",

    frame,

    minimumY,

    maximumY,

    startTime,

    endTime

  );



  drawLine(

    context,

    samples,

    "measuredAz",

    "#b9a2ff",

    frame,

    minimumY,

    maximumY,

    startTime,

    endTime

  );

}



function drawErrorChart() {

  const { context, width, height } = canvasContext(ui.errCanvas);



  const endTime = Math.max(model.time, 10);

  const startTime = Math.max(0, endTime - model.historySeconds);



  const samples = model.samples.filter(

    (sample) => sample.time >= startTime

  );



  const errors = samples.flatMap((sample) => [

    sample.azError,

    sample.elError,

  ]);



  let range = Math.max(2, ...errors.map(Math.abs));

  range = Math.min(90, Math.ceil(range / 2) * 2);



  const frame = drawAxes(

    context,

    width,

    height,

    -range,

    range,

    "Tracking error",

    startTime,

    endTime

  );



  const zeroY =

    frame.top +

    (range / (2 * range)) * frame.plotHeight;



  context.strokeStyle = "#79919a";

  context.setLineDash([5, 4]);

  context.beginPath();

  context.moveTo(frame.left, zeroY);

  context.lineTo(frame.left + frame.plotWidth, zeroY);

  context.stroke();

  context.setLineDash([]);



  drawLine(

    context,

    samples,

    "azError",

    "#61ddd8",

    frame,

    -range,

    range,

    startTime,

    endTime

  );



  drawLine(

    context,

    samples,

    "elError",

    "#f2bd60",

    frame,

    -range,

    range,

    startTime,

    endTime

  );

}



function resetState() {

  model.time = 0;
  model.accumulator = 0;

  model.lastFrame = null;

  model.lastSample = -Infinity;

  model.samples = [];



  for (const name of ["az", "el"]) {

    const axis = model[name];



    axis.position = 0;

    axis.velocity = 0;
    axis.motorEffort = 0;

    axis.integral = 0;

    axis.previousMeasurement = null;

    axis.filteredMeasuredVelocity = 0;

    axis.command = 0;

    axis.feedback = [];

    axis.lastMeasured = 0;

    axis.lastError = 0;

  }

}



function animationFrame(timestamp) {
  // Schedule the next frame first so a display/telemetry error cannot silently
  // terminate the animation loop. Errors remain visible in the browser console.
  requestAnimationFrame(animationFrame);

  if (model.lastFrame === null) {
    model.lastFrame = timestamp;
  }

  const elapsed = clamp((timestamp - model.lastFrame) / 1000, 0, 0.05);
  model.lastFrame = timestamp;

  try {
    if (model.running && elapsed > 0) {
      updateSimulation(elapsed);
    }
    updateVisuals();
  } catch (error) {
    console.error("SATCOM simulator frame error:", error);
    const statusText = $("system-status-text");
    if (statusText) {
      statusText.textContent = "SIMULATION ERROR — open browser console";
    }
    const responseStatus = $("response-status");
    if (responseStatus) {
      responseStatus.textContent = "ERROR";
    }
  }
}



/* Bind all simulator controls. */

for (const name of ["az", "el"]) {

  for (const key of [

    "kp",

    "ki",

    "kd",

    "maxSpeed",

    "maxAccel",

    "damping",

    "wind",

    "delay",

    "noise",

    "bias",

  ]) {

    ui[name][key].addEventListener("input", readControls);

  }

}



ui.azTarget.addEventListener("input", readControls);

ui.elTarget.addEventListener("input", readControls);



ui.pause.addEventListener("click", () => {

  model.running = !model.running;

  ui.pause.textContent = model.running ? "Pause" : "Resume";

  model.lastFrame = null;

  updateVisuals();

});



ui.reset.addEventListener("click", () => {

  resetState();

  updateVisuals();

});



ui.clear.addEventListener("click", () => {

  model.samples = [];

  model.lastSample = -Infinity;

  updateVisuals();

});



window.addEventListener("resize", () => {

  drawPositionChart();

  drawErrorChart();

});



/* Start at the HTML slider values and initialise display. */

const requiredElements = [
  "azimuth-slider", "elevation-slider", "pause-button", "reset-button",
  "clear-history-button", "position-chart", "error-chart",
  "azimuth-kp-slider", "azimuth-ki-slider", "azimuth-kd-slider",
  "elevation-kp-slider", "elevation-ki-slider", "elevation-kd-slider"
];
const missingElements = requiredElements.filter((id) => !$(id));
if (missingElements.length) {
  console.error("SATCOM simulator could not start. Missing HTML element IDs:", missingElements);
  const statusText = $("system-status-text");
  if (statusText) statusText.textContent = `STARTUP ERROR: missing ${missingElements.join(", ")}`;
  throw new Error(`Missing required HTML elements: ${missingElements.join(", ")}`);
}

readControls();

ensureMetricsPanel();

updateVisuals();

requestAnimationFrame(animationFrame);
