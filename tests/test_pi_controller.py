# Import the reusable PI controller function.
from python_model.pi_controller import calculate_pi_command

# Set a target antenna position in degrees.
target_azimuth = 72.0

# Set the current antenna position in degrees.
actual_azimuth = 60.0

# Set proportional gain.
kp = 0.5

# Set integral gain.
ki = 0.1

# Start with no accumulated past error.
integral_error = 0.0

# Set one simulation update to one second for simple arithmetic.
time_step = 1.0

# Run one PI controller update.
error, integral_error, p_part, i_part, command = calculate_pi_command(
    target_azimuth,
    actual_azimuth,
    kp,
    ki,
    integral_error,
    time_step,
)

# Print the current error.
print(f"Error: {error:.1f} deg")

# Print the accumulated error.
print(f"Integral error: {integral_error:.1f} deg*s")

# Print the proportional contribution.
print(f"P contribution: {p_part:.1f} deg/s")

# Print the integral contribution.
print(f"I contribution: {i_part:.1f} deg/s")

# Print the final requested speed.
print(f"PI requested speed: {command:.1f} deg/s")

# Run the controller a second time with the same position and stored integral error.
error, integral_error, p_part, i_part, command = calculate_pi_command(
    target_azimuth,
    actual_azimuth,
    kp,
    ki,
    integral_error,
    time_step,
)

# Print a blank line and heading for the second update.
print("\nSecond controller update:")

# Print the new accumulated error after two updates.
print(f"Integral error: {integral_error:.1f} deg*s")

# Print the new integral contribution.
print(f"I contribution: {i_part:.1f} deg/s")

# Print the new total requested speed.
print(f"PI requested speed: {command:.1f} deg/s")