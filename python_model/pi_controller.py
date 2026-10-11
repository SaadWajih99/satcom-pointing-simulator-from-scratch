# Define a function that calculates a proportional-integral control command.
def calculate_pi_command(target, actual, kp, ki, integral_error, time_step):
    # Calculate the current pointing error.
    error = target - actual

    # Add this error over the current time step to the stored error total.
    integral_error = integral_error + error * time_step

    # Calculate the proportional part using the current error.
    proportional_part = kp * error

    # Calculate the integral part using accumulated past error.
    integral_part = ki * integral_error

    # Add both parts to make the requested motor speed.
    command = proportional_part + integral_part

    # Return every useful value for the simulation and dashboard.
    return error, integral_error, proportional_part, integral_part, command
