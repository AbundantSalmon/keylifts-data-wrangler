import { ExerciseSets, Workouts } from 'knex/types/tables'
import { knex } from './db'
import * as XLSX from 'xlsx'

const COMPLETE = 'COMPLETE'

const poundsToKilograms = (pounds?: number | null): number | null | undefined => {
  if (pounds) {
    return pounds * 0.453592
  }
  return pounds
}

const main = async () => {
  const workouts_exercises = await knex
    .select('*')
    .from('workouts')
    .leftJoin('exercises', 'workouts.id', 'exercises.workout_id')

  interface ReducedWorkout {
    [key: string]: Partial<Workouts> & {
      exercises: {
        [key: string]: ExerciseSets & {
          exercises_sequence: number
        }
      }
    }
  }
  const summary = workouts_exercises.reduce<ReducedWorkout>((acc, curr) => {
    acc[curr.workout_id] = {
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

  const workouts = await knex('workouts').select('*')
  workouts.forEach(workout => {
    if (workout.id in summary) {
      summary[workout.id] = { ...workout, ...summary[workout.id] }
    }
  })

  const summaryArray = Object.entries(summary).map(([id, workout]) => {
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

  const rowsToExport = summaryArray
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
              poundsToKilograms(exercise.weight)?.toFixed(1),
              exercise.reps,
            ]
          }),
        [''], // row break between workouts
      ]
    })
    .reduce((acc, curr) => {
      return acc.concat(curr)
    }, [])

  const workbook = XLSX.utils.book_new()
  const worksheet = XLSX.utils.aoa_to_sheet(rowsToExport)
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Workouts')
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
