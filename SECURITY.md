# Security Policy

## Reporting a vulnerability

Email support@rashid.works with a description, impact, and steps to reproduce.
Do not open a public GitHub issue for security reports.

## Secrets

Never commit `.env`, `.env.local`, JWT secrets, VAPID private keys, FIFA API tokens, or Telegram bot tokens.

Each deployed instance must use a unique `JWT_SECRET` and unique VAPID key pair.

## Auth notes

- Login is username + PIN. PINs are hashed with SHA-256 plus `JWT_SECRET` as pepper.
- Optional `MASTER_PIN` may be set in the environment for emergency admin access. Do not hardcode it.
- `CRON_SECRET` is required in production. The default fallback is rejected.

## Headers

The app sets `X-Content-Type-Options`, `X-Frame-Options`, HSTS, Referrer-Policy, Permissions-Policy, and a conservative CSP.
