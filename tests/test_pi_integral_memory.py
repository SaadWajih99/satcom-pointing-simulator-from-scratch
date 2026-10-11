# Import the PI controller function.
from python_model.pi_controller import calculate_pi_command

# Set a target position in degrees.
target = 72.0

# Keep the antenna still at 60 degrees for this memory test.
actual = 60.0

# Set the proportional gain.
kp = 0.5

# Set the integral gain.
ki = 0.1

# Start with no stored integral error.
integral_error = 0.0

# Use one second per controller update for easy checking.
time_step = 1.0

# Run the first controller update.
_, integral_error, _, first_i_part, _ = calculate_pi_command(
    target,
    actual,
    kp,
    ki,
    integral_error,
    time_step,
)

# Run the second controller update using the stored integral error.
_, integral_error, _, second_i_part, _ = calculate_pi_command(
    target,
    actual,
    kp,
    ki,
    integral_error,
    time_step,
)

# Check the first value after rounding to avoid tiny decimal-storage differences.
assert round(first_i_part, 6) == 1.2

# Check the second value after rounding to avoid tiny decimal-storage differences.
assert round(second_i_part, 6) == 2.4

# Print a success message only if both checks passed.
print("PI integral memory test passed.")
