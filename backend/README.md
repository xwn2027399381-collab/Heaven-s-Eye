# 后端 API

FastAPI 服务提供 `/api/verify` 接口，支持 `text`、`image`、`url` 三类输入。未配置 `OPENAI_API_KEY` 时会返回本地模拟结果，便于插件开发调试。

## 启动

```bash
cd backend
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
copy ..\.env.example .env
uvicorn main:app --reload --host 127.0.0.1 --port 8000
```

macOS/Linux 激活虚拟环境：

```bash
source .venv/bin/activate
```

## 环境变量

```bash
OPENAI_API_KEY=your_api_key_here
OPENAI_MODEL=gpt-5-mini
CORS_ALLOW_ORIGINS=*
```

## 请求示例

```bash
curl -X POST http://127.0.0.1:8000/api/verify \
  -H "Content-Type: application/json" \
  -d "{\"type\":\"text\",\"content\":\"这是一条待核验信息\"}"
```

## 响应格式

```json
{
  "可信度": 75,
  "风险标签": ["来源不明", "数据未验证"],
  "风险说明": {
    "来源不明": "缺少明确发布主体",
    "数据未验证": "缺少可交叉验证的数据来源"
  },
  "验证建议": ["查官方公告", "交叉验证数据"],
  "证据链": []
}
```
