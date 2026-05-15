# Heaven's Eye: Information Verification Extension + Backend API

Heaven's Eye is a GitHub-ready starter template for an information credibility checker. It includes a browser extension that captures webpage text, images, and links, plus a FastAPI backend that returns a credibility score, risk labels, risk explanations, verification suggestions, and an evidence trail.

## Features

- Capture visible text, image URLs, and links from the current webpage.
- Analyze manually entered text, image URLs, or webpage URLs.
- Analyze selected text, links, and images from the browser context menu.
- Click webpage elements to analyze a specific image, link, or text block.
- Highlight keywords on the current webpage.
- Render API results in a simple extension popup UI.
- Provide a `/api/verify` endpoint with a stable JSON response shape.
- Return local mock results when `OPENAI_API_KEY` is not configured.
- Use the OpenAI Responses API with JSON Schema structured output when an API key is configured.

## Project Structure

```text
info-verifier/
├─ plugin/
│  ├─ manifest.json
│  ├─ content.js
│  ├─ background.js
│  ├─ popup.html
│  ├─ popup.js
│  └─ styles.css
├─ backend/
│  ├─ main.py
│  ├─ requirements.txt
│  └─ README.md
├─ .github/workflows/backend-ci.yml
├─ .env.example
├─ .gitignore
├─ CONTRIBUTING.md
├─ SECURITY.md
├─ README.md
└─ LICENSE
```

## Quick Start

### 1. Start the backend

```bash
cd backend
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
copy ..\.env.example .env
uvicorn main:app --reload --host 127.0.0.1 --port 8000
```

For macOS/Linux:

```bash
source .venv/bin/activate
```

If `OPENAI_API_KEY` is not configured, the API returns mock analysis results so the extension can still be tested locally.

### 2. Load the browser extension

1. Open the Chrome or Edge extensions page.
2. Enable Developer mode.
3. Click "Load unpacked".
4. Select `info-verifier/plugin/`.

### 3. Use the extension

- Click the extension icon and enter text, a URL, or an image URL for analysis.
- Click "Analyze current page" to analyze page text, images, and links in batch.
- Click "Click webpage element to analyze", then select an image, link, or text area on the page.
- Select text, right-click a link, or right-click an image and use the context menu.
- Enter a keyword and click "Highlight" to mark matching text on the current page.

## API

### `POST /api/verify`

Request:

```json
{
  "type": "text",
  "content": "Content to analyze"
}
```

Supported `type` values:

- `text`
- `image`
- `url`

Response:

```json
{
  "可信度": 75,
  "风险标签": ["来源不明", "数据未验证", "情绪煽动", "AI痕迹"],
  "风险说明": {
    "来源不明": "The source cannot be verified from the provided content."
  },
  "验证建议": ["Check official announcements", "Cross-check the data", "Run reverse image search"],
  "证据链": ["Related links or screenshots"]
}
```

The response keys are intentionally kept in Chinese because the extension and backend share this JSON contract.

## OpenAI Configuration

Copy `.env.example` to `.env` and set:

```bash
OPENAI_API_KEY=your_api_key_here
OPENAI_MODEL=gpt-5-mini
```

The backend uses the OpenAI Responses API for text and image inputs, and constrains the model output with JSON Schema so the extension can render the response directly.

For production, add authentication, rate limiting, log redaction, monitoring, and a clear data retention policy.

## GitHub Upload Checklist

- Git is installed and the repository is initialized.
- `.env` is not committed; only `.env.example` is tracked.
- The README explains the purpose, setup steps, API shape, and privacy considerations.
- `LICENSE` contains the full license text.
- The backend passes basic `GET /health` and `POST /api/verify` checks.
- Browser extension permissions in `manifest.json` are kept minimal.
- If publishing to the Chrome Web Store, add extension icons, screenshots, and a privacy policy.

## Disclaimer

This project provides assisted information verification only. It does not replace professional fact-checking, legal advice, medical advice, financial advice, or authoritative source review. AI output can be wrong, and important claims should be cross-checked with reliable sources.
