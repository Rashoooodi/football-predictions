# Environment variables

Copy `.env.example` to `.env.local`.

## Required

- `JWT_SECRET` — signs session cookies. Unique per instance.

## Strongly recommended

- `CRON_SECRET` — cron endpoint auth. Missing in production returns 503.
- `NEXT_PUBLIC_VAPID_PUBLIC_KEY` / `VAPID_PRIVATE_KEY` — web push.
- `FIFA_API_TOKEN` — live score sync.

## Optional

- `DB_PATH` — SQLite file location.
- `MAINTENANCE_MODE` — `true` shows the maintenance page.
- `ALLOWED_ORIGINS` — comma-separated server-action origins.
- `TELEGRAM_BOT_TOKEN` / `TELEGRAM_CHAT_ID` — admin alerts.
- `MASTER_PIN` — emergency PIN. Leave unset unless you need it.
- `PORT` — listen port.
