# Import the controller function from the python_model folder.
from python_model.proportional_controller import calculate_proportional_command

# Set the target antenna position in degrees.
target_azimuth = 72.0

# Set the current measured antenna position in degrees.
actual_azimuth = 60.0

# Set the proportional controller gain.
proportional_gain = 0.5

# Run the controller and save its two returned values.
error, command = calculate_proportional_command(
    target_azimuth,
    actual_azimuth,
    proportional_gain,
)

# Print the calculated tracking error.
print(f"Tracking error: {error:.1f} deg")

# Print the requested motor speed from the controller.
print(f"Requested speed: {command:.1f} deg/s")