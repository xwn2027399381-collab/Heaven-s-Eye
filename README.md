# 信息真实性甄别插件 + 后端 API

这是一个可上传到 GitHub 的项目模板：浏览器插件负责捕获网页文本、图片和链接，后端 API 负责输出可信度评分、风险标签、风险说明、验证建议和证据链。

## 功能

- 捕获当前网页可见文本、图片 URL、页面链接
- 支持手动输入文本、图片 URL、网页链接分析
- 支持右键菜单分析选中文本、图片、链接
- 支持点击网页元素分析，并可高亮指定关键词
- 后端提供 `/api/verify`，响应字段使用固定中文 JSON
- 未配置 OpenAI API Key 时提供本地模拟结果，方便前端联调
- 配置 OpenAI API Key 后可使用 Responses API 和结构化输出生成严格 JSON

## 目录结构

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

## 快速开始

### 1. 启动后端

```bash
cd backend
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
copy ..\.env.example .env
uvicorn main:app --reload --host 127.0.0.1 --port 8000
```

如果暂时不配置 `OPENAI_API_KEY`，接口会返回模拟分析结果。

### 2. 加载浏览器插件

1. 打开 Chrome 或 Edge 的扩展程序页面
2. 开启开发者模式
3. 点击“加载已解压的扩展程序”
4. 选择 `info-verifier/plugin/`

### 3. 使用插件

- 点击插件图标，输入文本、链接或图片 URL 后分析
- 点击“分析当前网页”批量分析页面文本、图片和链接
- 点击“点击网页元素分析”，再回到网页点击图片、链接或文本区域
- 在网页中选中文本、右键链接或右键图片，可通过右键菜单分析
- 输入关键词后点击“高亮”，可在当前网页中标记风险关键词

## API

### `POST /api/verify`

请求：

```json
{
  "type": "text",
  "content": "待分析内容"
}
```

响应：

```json
{
  "可信度": 75,
  "风险标签": ["来源不明", "数据未验证", "情绪煽动", "AI痕迹"],
  "风险说明": {
    "来源不明": "未找到可靠来源"
  },
  "验证建议": ["查官方公告", "交叉验证数据", "图片反向搜索"],
  "证据链": ["相关链接或截图"]
}
```

## OpenAI 配置

复制 `.env.example` 并填写：

```bash
OPENAI_API_KEY=your_api_key_here
OPENAI_MODEL=gpt-5-mini
```

后端使用 OpenAI Responses API 处理文本和图片输入，并用 JSON Schema 约束输出，方便插件直接渲染。生产环境建议增加用户鉴权、速率限制、日志脱敏和内容保存策略。

## 上传到 GitHub 前建议检查

- 已安装 Git 并初始化仓库：`git init`
- `.env` 没有被提交，仓库只保留 `.env.example`
- README 能说明项目用途、启动步骤、接口格式和隐私风险
- License 使用完整协议文本
- 后端至少能通过 `GET /health` 和 `POST /api/verify` 基础测试
- 插件 `manifest.json` 权限保持最小化
- 如果要发布到 Chrome Web Store，需要补充图标、隐私政策和扩展截图

## 免责声明

本项目只提供辅助甄别能力，不能替代专业事实核查、法律意见、医学意见或金融建议。AI 输出可能出错，重要结论应通过权威来源交叉验证。
