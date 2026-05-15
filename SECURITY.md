# Security Policy

## Secrets

Do not commit `OPENAI_API_KEY` or any other secret to GitHub. Use a local `.env` file for development and use your deployment platform's secret management for production.

The repository should only track `.env.example`, never `.env`.

## Privacy

The browser extension sends user-selected content to the backend API for analysis. This may include text, image URLs, webpage URLs, selected page content, and links.

Before using this project in production, clearly document:

- What data is sent to the backend.
- Whether data is stored.
- How long logs are retained.
- Whether third-party AI models are called.
- How users can request data deletion, if applicable.

## Recommended Production Safeguards

- Add user authentication before exposing the API publicly.
- Add rate limiting and abuse protection.
- Redact sensitive content from logs.
- Use HTTPS for all production traffic.
- Restrict CORS origins instead of using `*`.
- Monitor backend errors and unusual request volume.
- Avoid storing raw analyzed content unless there is a clear product need and user consent.

## Reporting a Vulnerability

If you discover a security issue, contact the maintainer through a private channel. Do not post API keys, personal data, exploit details, or sensitive logs in a public Issue.
