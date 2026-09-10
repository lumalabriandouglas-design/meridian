-- One estimate desk per signed-in user. The JSON is the same shape as the
-- client MoneyState (profile, rate, clients, estimates, invoices, timeEntries).
create table if not exists desks (
  user_id    text primary key,
  state      jsonb not null,
  updated_at timestamptz not null default now()
);
