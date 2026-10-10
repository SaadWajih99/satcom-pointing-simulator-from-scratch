# Store the direction we want the antenna to point, in degrees.
target_azimuth = 72.0

# Store where the antenna is currently pointing, in degrees.
actual_azimuth = 0.0

# Calculate the difference between target and actual antenna position.
tracking_error = target_azimuth - actual_azimuth

# Show a title in the terminal.
print("SATCOM antenna pointing model")

# Show the target direction.
print(f"Target azimuth: {target_azimuth:.1f} degrees")

# Show the current antenna direction.
print(f"Actual azimuth: {actual_azimuth:.1f} degrees")

# Show how far the antenna still needs to move.
print(f"Tracking error: {tracking_error:.1f} degrees")