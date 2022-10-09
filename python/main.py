"""
Generates plots of the weight lifted for each exercise for each session over
time from the data extracted from the Keylifts app.
"""
import matplotlib.pyplot as plt
import pandas as pd

FILE_PATH = "../workouts.xlsx"
SHEET = "Rows"


def main() -> None:
    df = pd.read_excel(FILE_PATH, sheet_name=SHEET)

    # Column names
    WEIGHT = "Weight (kg)"
    EXERCISE = "Exercise"
    DATE = "Date Completed"
    REPS = "Reps"

    # Add Weight x Reps column
    WEIGHT_X_REPS = "Weight x Reps"
    df[WEIGHT_X_REPS] = df[WEIGHT] * df[REPS]

    # Filter for only the big 4 lifts
    df = df.loc[df[EXERCISE].isin(["Bench Press", "Squat", "Deadlift", "Press"])]

    fig = plt.figure(figsize=(10, 10))

    gridspec_kw = {
        "hspace": 0.3,
        "wspace": 0.3,
        "top": 0.9,
        "bottom": 0.1,
        "left": 0.1,
        "right": 0.9,
    }
    grid_spec = fig.add_gridspec(2, 2, **gridspec_kw)
    ax1 = fig.add_subplot(grid_spec[0, 0])
    ax2 = fig.add_subplot(grid_spec[0, 1])
    ax3 = fig.add_subplot(grid_spec[1, :])

    # Plot the total weight by exercise for each sessions
    total_weight = df.groupby([DATE, EXERCISE])[WEIGHT_X_REPS].sum().unstack()
    total_weight_ax = total_weight.interpolate("index").plot(
        kind="line", marker="o", ax=ax1
    )
    total_weight_ax.set_xlabel("Date")
    total_weight_ax.set_title("Total Weight Lifted")

    # Get the max lift for each session
    max_set = df.loc[df.groupby([DATE, EXERCISE])[WEIGHT].idxmax()]
    max_set = max_set[[DATE, EXERCISE, WEIGHT, REPS, WEIGHT_X_REPS]]

    # Plot the weight x reps for the max lift for each session
    max_total_weight = max_set.pivot(index=DATE, columns=EXERCISE, values=WEIGHT_X_REPS)
    max_total_weight_ax = max_total_weight.interpolate("index").plot(
        kind="line", marker="o", ax=ax2
    )
    max_total_weight_ax.set_xlabel("Date")
    max_total_weight_ax.set_title("Max Set Weight Lifted")

    # Plot the weight for the max lift for each session
    max_weight = max_set.pivot(index=DATE, columns=EXERCISE, values=WEIGHT)
    max_weight_ax = max_weight.interpolate("index").plot(
        kind="line", marker="o", ax=ax3
    )
    max_weight_ax.set_xlabel("Date")
    max_weight_ax.set_title("Max Set Weight")

    plt.show()


if __name__ == "__main__":
    main()
