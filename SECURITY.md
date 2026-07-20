# Security Policy

This repository has been sanitized for public release. Before publishing or deploying, follow these steps:

1. Rotate all secrets found in any external systems (do this before sharing code):
   - JWT_SECRET
   - VAPID_PRIVATE_KEY and NEXT_PUBLIC_VAPID_PUBLIC_KEY
   - FIFA_API_TOKEN (or equivalent sports API tokens)
   - TELEGRAM_BOT_TOKEN and TELEGRAM_CHAT_ID
   - Any SSH keys or server credentials referenced outside this repo

2. Do not commit any secret values to this repository. Use the `.env.example` file as a template only.

3. Reporting
   - If you find a security issue, please contact the repo owner privately and rotate affected credentials immediately.

4. CI / Scanning
   - Ensure GitHub secret scanning and code scanning (SAST) are enabled on the repository.
   - A gitleaks scan workflow has been added to `.github/workflows/gitleaks.yml` to detect secrets in the future.

5. Production hardening
   - Enable branch protection on `main` and require passing status checks for merges.
   - Limit repository administrators and use least privilege for secrets.

This file is a minimal security policy tailored for this sanitized repo.
