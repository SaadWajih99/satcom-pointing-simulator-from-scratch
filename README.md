# SATCOM Two-Axis Antenna Pointing Simulator

An educational browser-based simulator for a ground antenna tracking azimuth and elevation commands. It includes independent PID controllers, a simplified actuator model, encoder feedback effects, live telemetry, response plots, and performance metrics.

> **Educational model only:** this simulator is not validated for controlling real antenna hardware. Its parameters are illustrative, not measured specifications for a real antenna or drive system.

## Open the simulator

[Launch the live simulator](https://cautious-potato-jjx65r4wvj562qx69-8000.app.github.dev/web/)

This preview runs through GitHub Codespaces. It may be unavailable when the Codespace is stopped or its forwarded port is inactive.

## Features

- Independent azimuth and elevation target commands and PID gains.
- Configurable actuator speed, acceleration, damping, and disturbance inputs.
- Encoder feedback with adjustable delay, measurement noise, and bias.
- Live antenna views, telemetry, step-response and tracking-error plots.
- Response metrics including rise time, overshoot, settling, steady-state error, RMS error, and maximum error.
- Pause/resume, reset, and clear-chart-history controls.

## Run locally

The simulator uses plain HTML, CSS, and JavaScript. No package installation or build step is required.

From the repository root, run:

```bash
python -m http.server 8000 --directory web
```

Then open [http://localhost:8000](http://localhost:8000) on the **same computer** running that server. In Codespaces, use the forwarded address from the Ports tab instead.

## Model overview

The azimuth and elevation axes are simulated independently:

1. Compare each target with its encoder measurement to calculate position error.
2. Use PID control to calculate a requested angular-speed command.
3. Apply simplified actuator dynamics, acceleration and speed limits, damping, and disturbance acceleration.
4. Update antenna position from angular velocity.
5. Apply encoder delay, bias, and measurement noise to feedback.
6. Record simulation samples for plots and performance metrics.

The controller uses:

```text
u = Kp × e + Ki × integral(e dt) − Kd × filtered(measured angular velocity)
```

Here, `u` is requested angular speed and `e` is target angle minus measured angle. Conditional integration limits integral windup when the requested output saturates.

## Units

- Position and error: degrees (°).
- Angular velocity and requested speed: degrees per second (°/s).
- Angular acceleration and disturbance: degrees per second squared (°/s²).
- Time: seconds (s).

## Assumptions and limitations

- The actuator is an illustrative speed-servo model, not a torque/inertia model fitted to a particular antenna.
- Damping is velocity-proportional damping; it is not mechanical backlash.
- Encoder quantization and mechanical backlash are not implemented.
- Disturbance input is acceleration, not a detailed aerodynamic or structural-load model.
- Metrics are calculated from recorded samples and should be interpreted in the context of the target move and selected settings.
- Do not use this model to control physical equipment.

## Project structure

```text
web/
  index.html
  styles.css
  app.js
python_model/
tests/
```

- `web/index.html` — simulator interface and visualizations.
- `web/styles.css` — dashboard styling and responsive layout.
- `web/app.js` — controller, actuator, encoder, plots, telemetry, and metrics.
- `python_model/` — Python tracking-model experiments.
- `tests/` — Python model tests.

## Tests

Run the Python tests with:

```bash
python -m unittest discover -s tests
```

Only report tests as passing after running them in your environment.

## License

See [LICENSE](LICENSE).
