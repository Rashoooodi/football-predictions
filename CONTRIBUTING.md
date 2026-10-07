# Contributing to Football Prediction

Thanks for your interest in contributing. This document explains how to get started, report issues, and submit changes in a way that keeps the project maintainable.

Getting started

1. Fork the repository and create a feature branch from `main` (or `master` if that is used):

   git checkout -b feat/short-description

2. Install dependencies and run the app locally:

   npm install
   cp .env.example .env
   # edit .env and set required variables
   npm run init-db
   npm run dev

Reporting issues

- Before opening an issue, search existing issues to avoid duplicates.
- Provide a clear title and steps to reproduce the problem.
- Include environment details (Node version, OS) and relevant logs or error messages.

Pull requests

- Open a PR from your fork/feature branch into the repository's `main` branch.
- Keep PRs small and focused; one logical change per PR is preferred.
- Include a concise description of the change and why it is needed.
- If the PR addresses an issue, reference it using `Fixes #<issue-number>` in the PR description.

Coding style

- Follow the existing code style and patterns used in the repository.
- Keep changes minimal and clearly documented. Add comments where intent is not obvious.

Database and migrations

- The repository uses `lib/init-db.ts` to create the initial schema and seed data.
- If you add or change schema, update `lib/init-db.ts` accordingly and document the change in your PR.

Security and secrets

- Do not commit secrets (API tokens, private keys, or JWT secrets) to the repository.
- Use `.env` files for local development and set secrets via your hosting provider for deployments.

Testing

- Add unit tests under `tests/` for scoring, auth, and validation changes.
- Run `npm test` and `npm run typecheck` before opening a PR.

Questions

If you are unsure how to proceed, open an issue describing what you want to change and why. Maintainers will help guide the approach.
