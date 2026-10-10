# Import time so the simulation can pause briefly between updates.
import time

# Set the direction we want the antenna to point toward.
target_azimuth = 72.0

# Start the antenna facing north at 0 degrees.
actual_azimuth = 0.0

# Choose how strongly the antenna responds to the remaining error.
response_fraction = 0.15

# Choose the smallest error at which we call the target reached.
tolerance = 0.1

# Start a counter so we can label each simulation update.
step = 0

# Keep moving until the antenna is close enough to the target.
while abs(target_azimuth - actual_azimuth) > tolerance:
    # Calculate the remaining difference between target and actual position.
    tracking_error = target_azimuth - actual_azimuth

    # Move the antenna by 15 percent of the remaining difference.
    actual_azimuth = actual_azimuth + response_fraction * tracking_error

    # Increase the update counter by one.
    step = step + 1

    # Print this update in a clear format.
    print(
        f"Step {step}: "
        f"actual = {actual_azimuth:.2f}°, "
        f"error = {tracking_error:.2f}°"
    )

    # Pause for 0.2 seconds so you can watch the updates.
    time.sleep(0.2)

# Calculate the final remaining error after the loop finishes.
final_error = target_azimuth - actual_azimuth

# Print a clear summary.
print("\nTarget reached within tolerance.")
print(f"Final antenna position: {actual_azimuth:.2f}°")
print(f"Final tracking error: {final_error:.2f}°")