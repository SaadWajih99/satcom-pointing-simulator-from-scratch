# SATCOM Two-Axis Antenna Pointing Simulator

An educational, browser-based simulator for a ground antenna tracking commanded azimuth and elevation angles. The project demonstrates independent PID controllers, simplified actuator dynamics, encoder-feedback effects, disturbance response, live telemetry, and control-system performance metrics.

> **Educational use only:** This simulator is not validated for controlling real antenna hardware. Its parameters are illustrative and are not calibrated against a physical antenna or drive system.

## Open the Simulator

[**Launch the Live Simulator**](https://cautious-potato-jjx65r4wvj562qx69-8000.app.github.dev/)

The live preview runs through GitHub Codespaces. It may be unavailable when the Codespace is stopped or its forwarded port is inactive. If the link stops working, start the server in your active Codespace and open the current forwarded address from the Ports tab.

## Features

### Two-Axis Pointing Control
- Independent azimuth and elevation target commands.
- Azimuth target range: 0° to 360°.
- Elevation target range: 0° to 90°.
- Separate PID gain settings for both axes.
- Real-time antenna-position visualisations.

### PID Controller Tuning
- Adjustable proportional gain (\(K_p\)).
- Adjustable integral gain (\(K_i\)).
- Adjustable derivative gain (\(K_d\)).
- Conditional integration to limit integral windup during actuator saturation.
- Filtered derivative contribution based on measured angular velocity.

### Actuator Model
- Configurable maximum angular speed.
- Configurable maximum angular acceleration.
- Velocity-proportional damping.
- Adjustable disturbance acceleration.

### Encoder Feedback
- Adjustable feedback delay.
- Measurement noise.
- Encoder bias.
- Separate true antenna position and measured encoder position.

### Visualisation and Telemetry
- Azimuth plan view with compass directions.
- Elevation side view.
- Target and actual antenna-position indicators.
- Live target, position, encoder reading, and tracking-error telemetry.
- Angular velocity and motor-command displays.
- Step-response and tracking-error plots.
- Pause, resume, reset, and clear-chart-history controls.

### Performance Metrics
The simulator reports response and tracking metrics, including:

- Rise time.
- Overshoot.
- Settling time.
- Steady-state error.
- Root-mean-square (RMS) tracking error.
- Maximum tracking error.

Metric values depend on the target command, selected controller settings, and recorded simulation interval.

## Control-System Model

The azimuth and elevation axes are simulated independently. Each axis has its own target, controller configuration, actuator state, and encoder-feedback state.

The simulation follows this sequence:

1. Read the commanded target angle.
2. Calculate position error using the encoder-measured angle.
3. Apply PID control to calculate a requested angular-speed command.
4. Apply actuator speed and acceleration limits, damping, and disturbance acceleration.
5. Update antenna position and angular velocity.
6. Apply encoder delay, bias, and measurement noise to the feedback.
7. Record simulation samples for telemetry, response plots, and performance metrics.

### PID Control Law

The controller uses the following PID-style expression:

```text
u = Kp × e + Ki × integral(e dt) − Kd × filtered(measured angular velocity)
