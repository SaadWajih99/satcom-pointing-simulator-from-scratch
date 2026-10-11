# Import time so the terminal updates appear gradually.
import time

# Set the antenna target direction in degrees.
target_azimuth = 72.0

# Start the antenna at 0 degrees.
actual_azimuth = 0.0

# Set the proportional gain for the position controller.
proportional_gain = 0.50

# Set the maximum motor speed in degrees per second.
max_speed = 20.0

# Set how much simulated time passes during one update.
time_step = 0.1

# Stop when the remaining pointing error is small enough.
tolerance = 0.1

# Start simulated time at zero seconds.
simulation_time = 0.0

# Start the update counter at zero.
step = 0

# Repeat until the antenna is within the allowed pointing error.
while abs(target_azimuth - actual_azimuth) > tolerance:
    # Calculate the pointing error before this update.
    tracking_error = target_azimuth - actual_azimuth

    # Request an angular speed based on the current pointing error.
    requested_speed = proportional_gain * tracking_error

    # Keep the requested speed inside the motor speed limits.
    actual_speed = max(-max_speed, min(requested_speed, max_speed))

    # Convert angular speed into an angle movement for this time step.
    angle_change = actual_speed * time_step

    # Update the antenna pointing angle.
    actual_azimuth = actual_azimuth + angle_change

    # Advance the simulated clock.
    simulation_time = simulation_time + time_step

    # Increase the update counter.
    step = step + 1

    # Calculate the error after the antenna moves.
    remaining_error = target_azimuth - actual_azimuth

    # Print the current simulation values.
    print(
        f"time = {simulation_time:.1f} s, "
        f"speed = {actual_speed:.2f} deg/s, "
        f"position = {actual_azimuth:.2f} deg, "
        f"error = {remaining_error:.2f} deg"
    )

    # Pause briefly so the output is readable.
    time.sleep(0.1)

# Print the final result.
print("\nTarget reached within tolerance.")
print(f"Final time: {simulation_time:.1f} s")
print(f"Final antenna position: {actual_azimuth:.2f} deg")
print(f"Final tracking error: {target_azimuth - actual_azimuth:.2f} deg")