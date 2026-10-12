
# SATCOM Two-Axis Antenna Pointing Simulator

**Live Demo:** [Open the SATCOM Two-Axis Pointing Simulator](https://saadwajih99.github.io/satcom-two-axis-pointing-simulator/)

An interactive, browser-based educational simulator for understanding closed-loop azimuth and elevation antenna pointing control in satellite communications (SATCOM).

The simulator models two independent control axes, actuator dynamics, encoder feedback effects, and tracking performance. It provides live visualisations and telemetry to help explore how controller tuning and physical limitations influence antenna pointing behaviour.

## Features

### Two-Axis Pointing Control
- Independent azimuth and elevation target commands.
- Separate PID controller tuning for each axis.
- Live tracking error and antenna position monitoring.

### Actuator and Mechanical Model
- Adjustable maximum actuator speed.
- Adjustable maximum acceleration.
- Configurable mechanical damping.
- Wind disturbance inputs.
- Elevation travel limits and continuous azimuth rotation.

### Encoder Feedback
- Adjustable feedback delay.
- Configurable measurement noise.
- Adjustable encoder bias.
- Comparison between true antenna position and measured encoder position.

### Visualisation and Telemetry
- Live azimuth and elevation pointing views.
- Step-response plots.
- Tracking-error plots.
- Real-time position, velocity, control error, and motor command telemetry.
- Response-quality metrics, including rise time, overshoot, settling time, steady-state error, RMS error, and maximum error.
- Pause, reset, and chart-history controls.

## How It Works

The simulator represents a simplified closed-loop antenna pointing system.

1. **Target reference:** The user selects the commanded azimuth and elevation angles.
2. **Feedback measurement:** The encoder model produces a measured position that can include delay, noise, and bias.
3. **PID control:** Independent controllers calculate actuator speed commands using the tracking error.
4. **Actuator dynamics:** The simulated actuators respond subject to speed, acceleration, damping, and disturbance limits.
5. **Performance monitoring:** The interface displays antenna motion, tracking errors, telemetry, and response-quality metrics.

The two axes can be tuned independently to explore how proportional, integral, and derivative gains influence tracking response.

## Technology

- HTML5
- CSS3
- JavaScript
- Python model and unit-test files for additional experimentation

The interactive browser interface runs directly in a web browser and does not require a local Python server when accessed through the live demo.

## Run Locally

Clone the repository:

```bash
git clone https://github.com/SaadWajih99/satcom-two-axis-pointing-simulator.git
cd satcom-two-axis-pointing-simulator
```

Start a local web server from the repository root:

```bash
python -m http.server 8000 --directory web
```

Open the simulator at:

http://localhost:8000/

Press `Ctrl+C` in the terminal to stop the server.

## Project Structure

```text
.
├── web/
│   ├── index.html
│   ├── styles.css
│   └── app.js
├── python_model/
├── tests/
└── README.md
```

- `web/` contains the browser-based simulator.
- `python_model/` contains the supplementary Python model.
- `tests/` contains the Python unit tests.

## Run the Python Tests

From the repository root, run:

```bash
python -m unittest discover -s tests
```

This command runs the available tests. Test results depend on the current code and environment.

## Model Assumptions and Limitations

This is a simplified educational simulation intended to demonstrate control-system concepts.

- The actuator dynamics are approximate and are not a validated model of a specific antenna drive.
- Encoder delay, noise, and bias are simplified representations of feedback imperfections.
- PID performance depends on controller gains, actuator constraints, feedback quality, and disturbances.
- The response metrics are intended for exploratory comparison and should not be treated as certified engineering measurements.
- The simulator has not been validated against real SATCOM antenna hardware.

It is not intended for hardware deployment, operational antenna control, or safety-critical applications.

## Purpose

This project demonstrates practical exploration of:

- Closed-loop control systems.
- PID controller tuning.
- Actuator dynamics and mechanical constraints.
- Encoder feedback and measurement imperfections.
- Tracking performance and response analysis.
- Interactive engineering simulation and visualisation.

**Note:** This project is an educational demonstration, not a validated operational SATCOM control system.
