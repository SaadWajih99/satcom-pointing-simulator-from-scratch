# SATCOM Two-Axis Antenna Pointing Simulator

An educational browser-based simulator for a ground antenna tracking azimuth and elevation commands. It combines independent PID controllers, simplified actuator dynamics, encoder effects, live telemetry, response plots, and performance metrics.

> **Educational model only:** this simulator is not validated for controlling real antenna hardware. Its parameters are illustrative, not measured specifications for a real antenna or drive system.



![Two-axis antenna pointing simulator dashboard](docs/simulator-dashboard.png)

## Features

- Independent azimuth and elevation targets and PID gains.
- Configurable actuator speed, acceleration, damping, and disturbance inputs.
- Encoder feedback with adjustable delay, noise, and bias.
- Live antenna views, telemetry, step-response plot, and tracking-error plot.
- Response metrics including rise time, overshoot, settling, steady-state error, RMS error, and maximum error.
- Pause/resume, reset, and clear-chart-history controls.

## Run the simulator

The simulator is plain HTML, CSS, and JavaScript. It requires no package installation or build step.

From the repository root, run:

```bash
python -m http.server 8000 --bind 0.0.0.0 --directory web
```

Open `http://localhost:8000` in your browser. In GitHub Codespaces, open forwarded port `8000` from the **Ports** tab.

## How the model works

The two axes are simulated independently.

1. The target angle is compared with the encoder measurement to calculate position error.
2. The PID controller calculates a requested angular-speed command.
3. A simplified speed-servo model applies acceleration limits, viscous damping, speed limits, and a disturbance acceleration.
4. The antenna position is updated from angular velocity.
5. The encoder model adds configurable delay, bias, and measurement noise to the feedback.
6. Recorded simulation samples are used to draw plots and calculate response metrics.

### Controller equation

The controller uses:

```text
u = Kp × e + Ki × integral(e dt) − Kd × filtered(measured angular velocity)
```

where `u` is the requested angular speed, and `e` is target angle minus measured angle. Conditional integration limits integral windup while the requested command is saturated.

### Units

- Position and error: degrees (°).
- Angular velocity and requested speed: degrees per second (°/s).
- Angular acceleration and disturbance input: degrees per second squared (°/s²).
- Time: seconds (s).

## Assumptions and limitations

- The actuator is an illustrative speed-servo model, not a torque/inertia model fitted to a specific antenna.
- The damping control represents velocity-proportional damping; it is not mechanical backlash.
- Encoder delay, noise, and bias are modelled. Encoder quantisation and backlash are not implemented.
- The disturbance control represents acceleration disturbance, not a detailed wind or structural-load model.
- Response metrics are calculated from the recorded simulation window. Interpret them in the context of the target move and selected settings.
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
- `web/styles.css` — dashboard layout and styling.
- `web/app.js` — controller, actuator, encoder, plots, telemetry, and metrics.
- `python_model/` — Python tracking-model experiments.
- `tests/` — Python model tests.

## Tests

Run the Python test suite with:

```bash
python -m unittest discover -s tests
```

Only report tests as passing after running them in your environment. The JavaScript browser simulator has not been hardware-validated.

## License

See [LICENSE](LICENSE).
