# Backend API

This FastAPI service provides the `/api/verify` endpoint used by the browser extension. It supports `text`, `image`, and `url` inputs. If `OPENAI_API_KEY` is not configured, the service returns local mock results so the extension can be developed and tested without an external model call.

## Start the Server

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

## Environment Variables

```bash
OPENAI_API_KEY=your_api_key_here
OPENAI_MODEL=gpt-5-mini
CORS_ALLOW_ORIGINS=*
```

## Request Example

```bash
curl -X POST http://127.0.0.1:8000/api/verify \
  -H "Content-Type: application/json" \
  -d "{\"type\":\"text\",\"content\":\"This is a claim that needs verification.\"}"
```

## Response Format

```json
{
  "可信度": 75,
  "风险标签": ["来源不明", "数据未验证"],
  "风险说明": {
    "来源不明": "The source is not clearly identified.",
    "数据未验证": "The claim does not include verifiable supporting data."
  },
  "验证建议": ["Check official announcements", "Cross-check the data"],
  "证据链": []
}
```

The Chinese response keys are part of the API contract shared with the extension UI.
