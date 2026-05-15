# 贡献指南

欢迎提交 Issue 和 Pull Request。建议先在 Issue 中说明问题、复现步骤或功能设计，再提交实现。

## 本地开发

1. 启动后端：`cd backend && uvicorn main:app --reload`
2. 打开浏览器扩展管理页，加载 `plugin/` 目录
3. 修改插件代码后，回到扩展管理页点击重新加载

## 提交要求

- 不提交 `.env`、API Key、真实用户数据或浏览记录。
- 后端接口响应必须保持 README 中的 JSON 字段，避免破坏插件渲染。
- 涉及 AI 输出格式的改动，需要同时更新 Pydantic 模型和 JSON Schema。
