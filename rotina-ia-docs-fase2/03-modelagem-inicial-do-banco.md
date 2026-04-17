# Modelagem Inicial do Banco

A base do projeto deve ser relacional.

## Tabela: users
```sql
id
name
email
password_hash
created_at
updated_at
```

## Tabela: profiles
```sql
id
user_id
timezone
language
energy_pattern
work_style
study_style
sleep_schedule
preferences_json
created_at
updated_at
```

## Tabela: goals
```sql
id
user_id
title
description
category
priority
status
start_date
target_date
created_at
updated_at
```

## Tabela: plans
```sql
id
user_id
goal_id
title
description
version
status
planning_horizon
source
created_by_agent
created_at
updated_at
```

## Tabela: routines
```sql
id
plan_id
name
description
frequency_type
frequency_rule
time_preference
context
created_at
updated_at
```

## Tabela: tasks
```sql
id
plan_id
routine_id
parent_task_id
title
description
category
priority
difficulty
status
estimated_minutes
due_date
scheduled_date
context
energy_required
order_index
created_at
updated_at
```

## Tabela: task_dependencies
```sql
id
task_id
depends_on_task_id
created_at
```

## Tabela: execution_logs
```sql
id
user_id
task_id
started_at
ended_at
actual_minutes
status
difficulty_reported
focus_score
notes
created_at
```

## Tabela: reviews
```sql
id
user_id
plan_id
review_type
period_start
period_end
completion_rate
adherence_rate
observations
created_at
```

## Tabela: recommendations
```sql
id
user_id
plan_id
source
title
description
recommendation_type
status
created_at
```

## Tabela: agent_sessions
```sql
id
user_id
input_summary
output_summary
context_snapshot
created_at
```
