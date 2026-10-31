-- =====================================================================
-- COMMAND CENTER - 0002 expand exercises catalog
-- Adds 44 new gold-standard exercises covering all muscle groups and equipment
-- Ensures public read policy so exercises can be queried by anonymous or authenticated clients
-- =====================================================================

-- Allow anon public read access to exercises catalog
drop policy if exists "exercises_read_public" on public.exercises;
create policy "exercises_read_public" on public.exercises for select using (true);

-- Insert or update exercises
insert into public.exercises
  (slug, name, primary_muscle, secondary_muscles, equipment, overload_increment_kg, rep_range_min, rep_range_max, is_compound) values
  -- Chest
  ('barbell-bench-press',        'Barbell Bench Press',          'chest',       '{triceps,shoulders}',      'barbell',    2.5,  5,  8,  true),
  ('incline-barbell-bench',      'Incline Barbell Bench Press',  'chest',       '{shoulders,triceps}',      'barbell',    2.5,  6, 10,  true),
  ('incline-db-press',           'Incline DB Press',             'chest',       '{shoulders,triceps}',      'dumbbell',   2.0,  6, 10,  true),
  ('flat-db-press',              'Flat DB Press',                'chest',       '{triceps,shoulders}',      'dumbbell',   2.0,  6, 10,  true),
  ('decline-db-press',           'Decline DB Press',             'chest',       '{triceps}',                'dumbbell',   2.0,  8, 12,  true),
  ('machine-chest-press',        'Machine Chest Press',          'chest',       '{triceps,shoulders}',      'machine',    2.5,  8, 12,  true),
  ('cable-fly',                  'Cable Fly',                    'chest',       '{}',                       'cable',      1.25, 10, 15,  false),
  ('low-to-high-cable-fly',      'Low-to-High Cable Fly',        'chest',       '{shoulders}',              'cable',      1.25, 12, 15,  false),
  ('high-to-low-cable-fly',      'High-to-Low Cable Fly',        'chest',       '{}',                       'cable',      1.25, 12, 15,  false),
  ('pec-deck-fly',               'Pec Deck Fly',                 'chest',       '{}',                       'machine',    2.5,  10, 15,  false),
  ('weighted-dip',               'Weighted Dip',                 'chest',       '{triceps,shoulders}',      'bodyweight', 2.5,  6, 10,  true),
  ('push-up',                    'Push-Up',                      'chest',       '{triceps,core}',           'bodyweight', 0.0,  10, 25,  true),

  -- Back
  ('barbell-row',                'Barbell Row',                  'back',        '{biceps,rear_delts}',      'barbell',    2.5,  6, 10,  true),
  ('pendlay-row',                'Pendlay Row',                  'back',        '{biceps,rear_delts,core}', 'barbell',    2.5,  5,  8,  true),
  ('weighted-pull-up',           'Weighted Pull-Up',             'back',        '{biceps}',                 'bodyweight', 1.25, 5,  8,  true),
  ('chin-up',                    'Chin-Up',                      'back',        '{biceps}',                 'bodyweight', 1.25, 5,  8,  true),
  ('lat-pulldown',               'Lat Pulldown',                 'back',        '{biceps}',                 'cable',      2.5,  8, 12,  true),
  ('neutral-grip-lat-pulldown',  'Neutral-Grip Lat Pulldown',    'back',        '{biceps}',                 'cable',      2.5,  8, 12,  true),
  ('seated-cable-row',           'Seated Cable Row',             'back',        '{biceps,rear_delts}',      'cable',      2.5,  8, 12,  true),
  ('chest-supported-db-row',     'Chest-Supported DB Row',       'back',        '{biceps,rear_delts}',      'dumbbell',   2.0,  8, 12,  true),
  ('single-arm-db-row',          'Single-Arm DB Row',            'back',        '{biceps}',                 'dumbbell',   2.0,  8, 12,  true),
  ('t-bar-row',                  'T-Bar Row',                    'back',        '{biceps,rear_delts}',      'machine',    2.5,  6, 10,  true),
  ('straight-arm-pulldown',      'Straight-Arm Cable Pulldown',  'back',        '{triceps}',                'cable',      1.25, 10, 15,  false),
  ('conventional-deadlift',      'Conventional Deadlift',        'back',        '{hamstrings,glutes,quads}','barbell',    5.0,  3,  6,  true),

  -- Shoulders & Delts
  ('overhead-press',             'Overhead Press',               'shoulders',   '{triceps,side_delts}',     'barbell',    1.25, 5,  8,  true),
  ('seated-db-shoulder-press',   'Seated DB Shoulder Press',     'shoulders',   '{triceps,side_delts}',     'dumbbell',   2.0,  6, 10,  true),
  ('arnold-press',               'Arnold Press',                 'shoulders',   '{triceps,side_delts}',     'dumbbell',   2.0,  8, 12,  true),
  ('smith-shoulder-press',       'Smith Machine Shoulder Press', 'shoulders',   '{triceps}',                'machine',    2.5,  6, 10,  true),
  ('db-lateral-raise',           'DB Lateral Raise',             'side_delts',  '{}',                       'dumbbell',   1.0,  10, 20,  false),
  ('cable-lateral-raise',        'Cable Lateral Raise',          'side_delts',  '{}',                       'cable',      1.25, 10, 20,  false),
  ('lean-away-cable-lateral',    'Lean-Away Cable Lateral Raise','side_delts',  '{}',                       'cable',      1.25, 12, 20,  false),
  ('reverse-pec-deck',           'Reverse Pec Deck',             'rear_delts',  '{back}',                   'machine',    2.5,  12, 20,  false),
  ('face-pull',                  'Face Pull',                    'rear_delts',  '{back,side_delts}',        'cable',      1.25, 12, 20,  false),
  ('db-rear-delt-fly',           'DB Rear Delt Fly',             'rear_delts',  '{back}',                   'dumbbell',   1.0,  12, 20,  false),

  -- Quads & Lower Body
  ('barbell-squat',              'Barbell Back Squat',           'quads',       '{glutes,core}',            'barbell',    2.5,  5,  8,  true),
  ('front-squat',                'Front Squat',                  'quads',       '{core,glutes}',            'barbell',    2.5,  5,  8,  true),
  ('hack-squat',                 'Hack Squat',                   'quads',       '{glutes}',                 'machine',    5.0,  6, 10,  true),
  ('leg-press',                  'Leg Press',                    'quads',       '{glutes}',                 'machine',    5.0,  8, 12,  true),
  ('bulgarian-split-squat',      'Bulgarian Split Squat',        'quads',       '{glutes}',                 'dumbbell',   2.0,  8, 12,  true),
  ('walking-db-lunge',           'Walking DB Lunge',             'quads',       '{glutes}',                 'dumbbell',   2.0,  10, 14,  true),
  ('goblet-squat',               'Goblet Squat',                 'quads',       '{glutes,core}',            'dumbbell',   2.0,  10, 15,  true),
  ('leg-extension',              'Leg Extension',                'quads',       '{}',                       'machine',    2.5,  10, 15,  false),
  ('belt-squat',                 'Belt Squat',                   'quads',       '{glutes}',                 'machine',    5.0,  8, 12,  true),

  -- Hamstrings & Calves
  ('romanian-deadlift',          'Romanian Deadlift',            'hamstrings',  '{glutes,back}',            'barbell',    2.5,  6, 10,  true),
  ('db-romanian-deadlift',       'DB Romanian Deadlift',         'hamstrings',  '{glutes}',                 'dumbbell',   2.0,  8, 12,  true),
  ('stiff-leg-deadlift',         'Stiff-Leg Deadlift',           'hamstrings',  '{glutes,back}',            'barbell',    2.5,  6, 10,  true),
  ('seated-leg-curl',            'Seated Leg Curl',              'hamstrings',  '{}',                       'machine',    2.5,  10, 15,  false),
  ('lying-leg-curl',             'Lying Leg Curl',               'hamstrings',  '{}',                       'machine',    2.5,  10, 15,  false),
  ('standing-calf-raise',        'Standing Calf Raise',          'calves',      '{}',                       'machine',    5.0,  8, 15,  false),
  ('seated-calf-raise',          'Seated Calf Raise',            'calves',      '{}',                       'machine',    2.5,  10, 20,  false),
  ('leg-press-calf-raise',       'Leg Press Calf Raise',         'calves',      '{}',                       'machine',    5.0,  12, 20,  false),

  -- Glutes
  ('hip-thrust',                 'Barbell Hip Thrust',           'glutes',      '{hamstrings}',             'barbell',    5.0,  8, 12,  true),
  ('cable-glute-kickback',       'Cable Glute Kickback',         'glutes',      '{}',                       'cable',      1.25, 12, 15,  false),

  -- Biceps
  ('ez-bar-curl',                'EZ-Bar Curl',                  'biceps',      '{}',                       'barbell',    1.25, 8, 12,  false),
  ('barbell-curl',               'Barbell Biceps Curl',          'biceps',      '{}',                       'barbell',    1.25, 6, 10,  false),
  ('incline-db-curl',            'Incline DB Curl',              'biceps',      '{}',                       'dumbbell',   1.0,  8, 12,  false),
  ('db-hammer-curl',             'DB Hammer Curl',               'biceps',      '{}',                       'dumbbell',   1.0,  8, 12,  false),
  ('preacher-curl',              'Preacher Curl',                'biceps',      '{}',                       'barbell',    1.25, 8, 12,  false),
  ('bayesian-cable-curl',        'Bayesian Cable Curl',          'biceps',      '{}',                       'cable',      1.25, 10, 15,  false),
  ('spider-curl',                'Spider Curl',                  'biceps',      '{}',                       'dumbbell',   1.0,  10, 15,  false),

  -- Triceps
  ('close-grip-bench-press',     'Close-Grip Bench Press',       'triceps',     '{chest,shoulders}',        'barbell',    2.5,  6, 10,  true),
  ('cable-triceps-pushdown',     'Cable Triceps Pushdown',       'triceps',     '{}',                       'cable',      2.5,  10, 15,  false),
  ('rope-triceps-pushdown',      'Rope Triceps Pushdown',        'triceps',     '{}',                       'cable',      1.25, 10, 15,  false),
  ('overhead-cable-extension',   'Overhead Cable Extension',     'triceps',     '{}',                       'cable',      1.25, 10, 15,  false),
  ('skull-crusher',              'Skull Crusher',                'triceps',     '{}',                       'barbell',    1.25, 8, 12,  false),
  ('machine-triceps-dip',        'Machine Triceps Dip',          'triceps',     '{chest}',                  'machine',    2.5,  8, 12,  true),
  ('db-overhead-extension',      'DB Overhead Triceps Extension','triceps',     '{}',                       'dumbbell',   2.0,  8, 12,  false),

  -- Core & Abs
  ('cable-crunch',               'Cable Crunch',                 'core',        '{}',                       'cable',      2.5,  10, 15,  false),
  ('hanging-leg-raise',          'Hanging Leg Raise',            'core',        '{}',                       'bodyweight', 0.0,  8, 15,  false),
  ('ab-wheel-rollout',           'Ab Wheel Rollout',             'core',        '{}',                       'bodyweight', 0.0,  8, 12,  false),
  ('weighted-plank',             'Weighted Plank',               'core',        '{}',                       'bodyweight', 2.5,  30, 60,  false),
  ('captains-chair-leg-raise',   'Captain''s Chair Leg Raise',   'core',        '{}',                       'bodyweight', 0.0,  10, 20,  false),
  ('pallof-press',               'Pallof Press',                 'core',        '{}',                       'cable',      1.25, 10, 15,  false)
on conflict (slug) do update set
  name = excluded.name,
  primary_muscle = excluded.primary_muscle,
  secondary_muscles = excluded.secondary_muscles,
  equipment = excluded.equipment,
  overload_increment_kg = excluded.overload_increment_kg,
  rep_range_min = excluded.rep_range_min,
  rep_range_max = excluded.rep_range_max,
  is_compound = excluded.is_compound;
