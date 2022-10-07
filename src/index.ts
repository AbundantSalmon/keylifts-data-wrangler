import { ExerciseSets, Workouts } from 'knex/types/tables'
import { knex } from './db'
import * as XLSX from 'xlsx'
import * as math from 'mathjs'

const COMPLETE = 'COMPLETE'

const poundsToKilograms = (pounds?: number | null): number | null | undefined => {
  if (pounds) {
    return pounds * 0.453592
  }
  return pounds
}

const main = async () => {
  const workouts = await knex('workouts').select('*')

  interface WorkoutSummary {
    [key: string]: Partial<Workouts> & {
      exercises: {
        [key: string]: ExerciseSets & {
          exercises_sequence: number
        }
      }
    }
  }

  const summary = workouts.reduce<WorkoutSummary>((acc, curr) => {
    acc[curr.id] = {
      exercises: {},
    }
    return acc
  }, {})

  const exercises = await knex('exercise_sets')
    .leftJoin('exercises', 'exercise_sets.exercise_id', 'exercises.id')
    .select('exercise_sets.*', 'exercises.sequence as exercises_sequence')

  exercises.forEach(exercise => {
    if (exercise.workout_id in summary) {
      summary[exercise.workout_id]['exercises'][exercise.id] = exercise
    }
  })

  workouts.forEach(workout => {
    if (workout.id in summary) {
      summary[workout.id] = { ...workout, ...summary[workout.id] }
    }
  })

  const summaryArrayWithSortedExercises = Object.entries(summary).map(([id, workout]) => {
    const { exercises, ...rest } = workout
    return {
      ...rest,
      exercises: Object.values(exercises).sort((a, b) => {
        if (a.exercises_sequence < b.exercises_sequence) {
          return -1
        }
        if (a.exercises_sequence > b.exercises_sequence) {
          return 1
        }
        return a.sequence - b.sequence
      }),
    }
  })

  const byDayRowsToExport = summaryArrayWithSortedExercises
    .filter(workout => workout.status === COMPLETE)
    .map(workout => {
      return [
        [
          'Date Completed',
          workout.date_completed ? new Date(workout.date_completed) : 'date missing',
          `Week ${workout.week}`,
          workout.name,
        ],
        ['Exercise', 'Weight (kg)', 'Reps'],
        ...workout.exercises
          .filter(exercise => exercise.status === COMPLETE)
          .map(exercise => {
            return [
              exercise.exercise_name,
              math.round(poundsToKilograms(exercise.weight) || 0, 1),
              exercise.reps,
            ]
          }),
        [''], // row break between workouts
      ]
    })
    .reduce((acc, curr) => {
      return acc.concat(curr)
    }, [])

  const rowSheetHeaders = ['Date Completed', 'Week', 'Day', 'Exercise', 'Weight (kg)', 'Reps']
  const rowSheetRowsToExport = summaryArrayWithSortedExercises
    .filter(workout => workout.status === COMPLETE)
    .flatMap(workout => {
      return workout.exercises
        .filter(exercise => exercise.status === COMPLETE)
        .map(exercise => {
          return [
            workout.date_completed ? new Date(workout.date_completed) : 'date missing',
            workout.week,
            workout.name,
            exercise.exercise_name,
            math.round(poundsToKilograms(exercise.weight) || 0, 1),
            exercise.reps,
          ]
        })
    })

  const workbook = XLSX.utils.book_new()

  const byDayWorksheet = XLSX.utils.aoa_to_sheet(byDayRowsToExport)
  XLSX.utils.book_append_sheet(workbook, byDayWorksheet, 'By Day')

  const rowWorksheet = XLSX.utils.aoa_to_sheet([rowSheetHeaders, ...rowSheetRowsToExport])
  XLSX.utils.book_append_sheet(workbook, rowWorksheet, 'Rows')

  XLSX.writeFileXLSX(workbook, 'workouts.xlsx')
}

;(async () => {
  try {
    await main()
    process.exit(0)
  } catch (e) {
    console.log(e)
  }
})()
