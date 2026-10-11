# Define a function that calculates a proportional control command.
def calculate_proportional_command(target, actual, gain):
    # Calculate the difference between required and measured position.
    error = target - actual

    # Calculate the command by multiplying error by gain.
    command = gain * error

    # Return both values so another file can use them.
    return error, command