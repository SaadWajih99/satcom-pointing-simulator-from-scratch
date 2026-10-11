# Import time so terminal updates are easier to watch.
import time

# Import the reusable PI controller function.
from python_model.pi_controller import calculate_pi_command

# Set the azimuth direction the antenna should reach.
target_azimuth = 72.0

# Start the antenna at 0 degrees.
actual_azimuth = 0.0

# Use a stronger proportional response for this tuning experiment.
kp = 1.50

# Use a stronger integral response for this tuning experiment.
ki = 0.50

# Start with no accumulated error.
integral_error = 0.0

# Set the maximum motor speed in degrees per second.
max_speed = 20.0

# Set the time represented by each simulation update.
time_step = 0.1

# Stop when the antenna is close enough to its target.
tolerance = 0.1

# Start simulated time at zero.
simulation_time = 0.0

# Start the update counter at zero.
step = 0

# Continue until the antenna is within the allowed pointing error.
while abs(target_azimuth - actual_azimuth) > tolerance:
    # Calculate PI controller values using the current antenna position.
    error, integral_error, p_part, i_part, requested_speed = calculate_pi_command(
        target_azimuth,
        actual_azimuth,
        kp,
        ki,
        integral_error,
        time_step,
    )

    # Limit the requested speed to what the motor can physically deliver.
    actual_speed = max(-max_speed, min(requested_speed, max_speed))

    # Convert speed into an angular movement during this time step.
    angle_change = actual_speed * time_step

    # Move the antenna by the allowed angular movement.
    actual_azimuth = actual_azimuth + angle_change

    # Advance the simulation clock.
    simulation_time = simulation_time + time_step

    # Count this simulation update.
    step = step + 1

    # Calculate remaining pointing error after the movement.
    remaining_error = target_azimuth - actual_azimuth

    # Print controller and antenna values for this update.
    print(
        f"time = {simulation_time:.1f} s, "
        f"P = {p_part:.2f}, "
        f"I = {i_part:.2f}, "
        f"speed = {actual_speed:.2f} deg/s, "
        f"position = {actual_azimuth:.2f} deg, "
        f"error = {remaining_error:.2f} deg"
    )

    # Pause briefly so the output is readable.
    time.sleep(0.1)

# Print the final simulation result.
print("\nTarget reached within tolerance.")
print(f"Final time: {simulation_time:.1f} s")
print(f"Final antenna position: {actual_azimuth:.2f} deg")
print(f"Final tracking error: {target_azimuth - actual_azimuth:.2f} deg")
print(f"Final integral error: {integral_error:.2f} deg*s")