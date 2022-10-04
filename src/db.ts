import knex_s from 'knex'

const knex = knex_s({
  client: 'better-sqlite3',
  connection: {
    filename: 'watermelon.db',
  },
  useNullAsDefault: true, // suppresses warning "sqlite does not support inserting default values."
})

declare module 'knex/types/tables' {
  interface Exercises {
    id: string
    // _changed: string | null
    // _status: string | null
    name: string | null
    status: string | null
    date_completed: number | null
    type: string | null
    category: string | null
    note: string | null
    equipment: string | null
    units: string | null
    order: string | null
    sequence: number | null
    template_exercise_id: string
    recommendation: string | null
    superset: string | null
    progression: string | null
    workout_id: string
    cycle_id: string | null
    created_at: number | null
    updated_at: number | null
    is_collapsed: string | null
  }
  interface Workouts {
    id: string
    // _changed: string | null
    // _status: string | null
    name: string | null
    status: string | null
    date_started: number | null
    date_completed: number | null
    week: number | null
    note: string | null
    order: string | null
    sequence: number | null
    cycle_id: string | null
    template_workout_id: string | null
    created_at: number | null
    updated_at: number | null
  }
  interface ExerciseSets {
    id: string
    // _changed: string | null
    // _status: string | null
    status: string | null
    date_completed: number | null
    type: string | null
    reps: number | null
    percentage: number | null
    weight: number | null
    exercise_name: string
    template_exercise_set_id: string
    exercise_id: string | null
    sequence: number
    target_reps: null | null
    target_weight: null | null
    duration: string | null
    distance: string | null
    band_resistance: string | null
    target_duration: string | null
    target_distance: string | null
    cycle_id: string | null
    created_at: number | null
    updated_at: number | null
    workout_id: string
    is_personal_record: number | null
    max_reps: string | null
  }

  interface Tables {
    exercises: Exercises
    workouts: Workouts
    exercise_sets: ExerciseSets
  }
}

export { knex }
