# Import time so each update is easier to watch in the terminal.
import time

# Set the direction that the antenna should reach.
target_azimuth = 72.0

# Start the antenna at north, which is 0 degrees.
actual_azimuth = 0.0

# Set the proportional response value used to request a movement.
proportional_gain = 0.30

# Set the largest allowed movement during one update, in degrees.
max_move_per_step = 4.0

# Stop when the antenna is within this many degrees of the target.
tolerance = 0.1

# Start the update counter at zero.
step = 0

# Repeat while the antenna is still outside the allowed error tolerance.
while abs(target_azimuth - actual_azimuth) > tolerance:
    # Calculate the remaining difference between target and actual angle.
    tracking_error = target_azimuth - actual_azimuth

    # Ask for a movement proportional to the current error.
    requested_move = proportional_gain * tracking_error

    # Limit the requested movement so it stays within motor capability.
    actual_move = max(-max_move_per_step, min(requested_move, max_move_per_step))

    # Apply the limited movement to the antenna position.
    actual_azimuth = actual_azimuth + actual_move

    # Increase the counter by one for this completed update.
    step = step + 1

    # Calculate the error after the antenna has moved.
    remaining_error = target_azimuth - actual_azimuth

    # Print the most important values from this update.
    print(
        f"Step {step}: "
        f"requested = {requested_move:.2f}°, "
        f"actual move = {actual_move:.2f}°, "
        f"position = {actual_azimuth:.2f}°, "
        f"remaining error = {remaining_error:.2f}°"
    )

    # Pause briefly so the terminal output is readable.
    time.sleep(0.2)

# Print the result when the antenna is close enough to its target.
print("\nTarget reached within tolerance.")
print(f"Final antenna position: {actual_azimuth:.2f}°")
print(f"Final tracking error: {target_azimuth - actual_azimuth:.2f}°")