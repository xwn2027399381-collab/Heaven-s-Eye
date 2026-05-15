import json
import os
from enum import Enum
from typing import Dict, List

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from openai import OpenAI
from pydantic import BaseModel, Field
from dotenv import load_dotenv


load_dotenv()


class VerifyType(str, Enum):
    text = "text"
    image = "image"
    url = "url"


class VerifyRequest(BaseModel):
    type: VerifyType
    content: str = Field(min_length=1, max_length=20000)


class VerifyResponse(BaseModel):
    credibility: int = Field(alias="可信度", ge=0, le=100)
    risk_labels: List[str] = Field(alias="风险标签")
    risk_reasons: Dict[str, str] = Field(alias="风险说明")
    suggestions: List[str] = Field(alias="验证建议")
    evidence: List[str] = Field(alias="证据链")

    class Config:
        populate_by_name = True


RISK_LABELS = ["来源不明", "数据未验证", "情绪煽动", "AI痕迹"]

VERIFY_SCHEMA = {
    "type": "object",
    "additionalProperties": False,
    "required": ["可信度", "风险标签", "风险说明", "验证建议", "证据链"],
    "properties": {
        "可信度": {"type": "integer", "minimum": 0, "maximum": 100},
        "风险标签": {
            "type": "array",
            "items": {"type": "string", "enum": RISK_LABELS}
        },
        "风险说明": {
            "type": "object",
            "additionalProperties": False,
            "required": RISK_LABELS,
            "properties": {
                "来源不明": {"type": "string"},
                "数据未验证": {"type": "string"},
                "情绪煽动": {"type": "string"},
                "AI痕迹": {"type": "string"}
            }
        },
        "验证建议": {
            "type": "array",
            "items": {"type": "string"}
        },
        "证据链": {
            "type": "array",
            "items": {"type": "string"}
        }
    }
}

app = FastAPI(
    title="信息真实性甄别 API",
    version="0.3.0",
    description="为浏览器插件提供文本、图片、链接真实性风险分析。"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=os.getenv("CORS_ALLOW_ORIGINS", "*").split(","),
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)


def mock_verify(req: VerifyRequest) -> VerifyResponse:
    labels = ["数据未验证"]
    reasons = {"数据未验证": "当前为本地模拟分析，未接入外部事实核查或 AI 模型。"}
    score = 72

    content_lower = req.content.lower()
    if req.type == VerifyType.url:
        labels.insert(0, "来源不明")
        reasons["来源不明"] = "仅提供链接时需要进一步核对域名、发布主体和原始出处。"
        score = 65
    if req.type == VerifyType.image:
        labels.append("来源不明")
        reasons["来源不明"] = "图片需要反向搜索、EXIF 和上下文来源共同验证。"
        score = 62
    if any(word in content_lower for word in ["震惊", "绝密", "马上转发", "100%"]):
      labels.append("情绪煽动")
      reasons["情绪煽动"] = "内容包含强烈情绪或绝对化表达，建议降低转发优先级并交叉验证。"
      score = min(score, 48)

    labels = list(dict.fromkeys(labels))
    return VerifyResponse.model_validate({
        "可信度": score,
        "风险标签": labels,
        "风险说明": reasons,
        "验证建议": ["查官方公告", "交叉验证数据", "核对原始出处", "图片反向搜索"],
        "证据链": []
    })


def build_input(req: VerifyRequest):
    prompt = (
        "请分析以下信息的真实性风险。只输出符合 JSON Schema 的 JSON，不要输出 Markdown。"
        "风险标签只能从：来源不明、数据未验证、情绪煽动、AI痕迹 中选择。"
        "风险说明必须包含全部四个标签键；未命中的标签原因填写空字符串。"
        "证据链只填写输入中可见、可引用的链接或需要用户进一步核查的线索；不要编造来源。"
    )

    if req.type == VerifyType.image:
        return [
            {
                "role": "user",
                "content": [
                    {"type": "input_text", "text": prompt},
                    {"type": "input_image", "image_url": req.content}
                ]
            }
        ]

    return [
        {
            "role": "user",
            "content": [
                {
                    "type": "input_text",
                    "text": f"{prompt}\n\n输入类型：{req.type.value}\n待分析内容：\n{req.content}"
                }
            ]
        }
    ]


def ai_verify(req: VerifyRequest) -> VerifyResponse:
    client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))
    model = os.getenv("OPENAI_MODEL", "gpt-5-mini")

    response = client.responses.create(
        model=model,
        input=build_input(req),
        text={
            "format": {
                "type": "json_schema",
                "name": "verify_result",
                "strict": True,
                "schema": VERIFY_SCHEMA
            }
        }
    )

    raw = response.output_text
    return VerifyResponse.model_validate(json.loads(raw))


@app.get("/health")
def health():
    return {"status": "ok"}


@app.post("/api/verify", response_model=VerifyResponse, response_model_by_alias=True)
def verify(req: VerifyRequest):
    if not req.content.strip():
        raise HTTPException(status_code=400, detail="content 不能为空")

    if not os.getenv("OPENAI_API_KEY"):
        return mock_verify(req)

    try:
        return ai_verify(req)
    except Exception as exc:
        raise HTTPException(status_code=502, detail=f"AI 分析失败：{exc}") from exc
