# Contributing Guide

Contributions are welcome through Issues and Pull Requests. For non-trivial changes, please open an Issue first to describe the problem, reproduction steps, or proposed feature design.

## Local Development

1. Start the backend:

```bash
cd backend
uvicorn main:app --reload
```

2. Open the browser extension management page and load the `plugin/` directory as an unpacked extension.
3. After changing extension code, reload the extension from the browser extension page.

## Pull Request Guidelines

- Do not commit `.env`, API keys, real user data, browsing history, or other sensitive data.
- Keep the `/api/verify` response fields compatible with the README contract so the extension renderer does not break.
- When changing AI output formatting, update both the Pydantic response model and the JSON Schema in `backend/main.py`.
- Keep browser extension permissions as narrow as possible.
- Include a short explanation of what changed and how you tested it.

## Testing

Before opening a Pull Request, run at least:

```bash
python -m py_compile backend/main.py
```

If dependencies are installed, also run a local API smoke test:

```bash
curl http://127.0.0.1:8000/health
```

For extension changes, manually reload the unpacked extension and verify the popup, page capture, context menu analysis, and keyword highlighting paths.
