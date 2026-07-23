"""
Advisor API — proxies AI business advice chat through the backend.
Keeps the Anthropic API key server-side only.
Set ANTHROPIC_API_KEY in your .env file.
"""
import os
import httpx
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

router = APIRouter()

ANTHROPIC_URL = "https://api.anthropic.com/v1/messages"

SYSTEM_PROMPT = """You are Hunch AI — a business location advisor for Rwanda.

Your ONLY purpose: help people decide what business to open, where in Rwanda, and whether it is a smart risk.

RWANDA CONTEXT:
- 23 sectors: Kigali (CityCenter, Kimironko, Remera, Nyamirambo, Kicukiro, Gisozi, Kanombe, Gikondo, Niboye, Kibagabaga), Northern (Musanze, Byumba, Rulindo), Southern (Huye, Muhanga, Nyanza, Ruhango), Eastern (Rwamagana, Nyagatare), Western (Rubavu, Rusizi, Karongi, Nyamasheke)
- CityCenter/Remera: highest income (RWF 850K–1.1M), most competitive
- Kimironko: balanced — RWF 650K, moderate competition, good foot traffic
- Musanze: tourism economy (Volcanoes NP, gorilla trekking)
- Rubavu: DRC border trade, Lake Kivu tourism
- Rural sectors: lower competition, smaller customer base

BUSINESS TYPES:
- Restaurant: foot traffic ≥6, income ≥RWF 400K, competition manageable
- Café: near offices or universities, income ≥RWF 500K
- Pharmacy: any income, residential density, low existing pharmacy count = opportunity
- Salon: residential density, repeat customers, income ≥RWF 350K
- Hotel: tourism areas (Musanze, Rubavu, Kigali), transit access
- Supermarket: residential density, underserved area
- Gym: income ≥RWF 600K, CityCenter/Remera/Kimironko
- School/Tutoring: families, residential, safe infrastructure

RISK FRAMEWORK:
- Low risk: foot traffic ≥7, income ≥600K, <10 competitors
- Medium risk: foot traffic 5–7, income 350K–600K, 10–20 competitors
- High risk: foot traffic <5, income <350K, >20 competitors

INVESTOR LENS:
- Gap opportunity = high residential density + low business type density
- Low-investment high-growth: Gisozi, Niboye, Kibagabaga
- Premium return: CityCenter, Remera (higher entry cost, premium pricing possible)
- Tourism: Musanze, Rubavu, Nyanza (heritage)

RULES:
1. Max 3 clarifying questions before giving a specific recommendation
2. Always name a SPECIFIC sector, not just "Kigali"
3. Always include risk rating: Low / Medium / High
4. Be honest — do not oversell
5. Max 200 words per reply
6. Business topics only — redirect anything else warmly
7. End final recommendations with: "Want me to run the full ML analysis for this location?" """


class ChatMessage(BaseModel):
    role: str
    content: str


class ChatRequest(BaseModel):
    messages: list[ChatMessage]


@router.post("/advisor/chat")
async def advisor_chat(req: ChatRequest):
    api_key = os.getenv("ANTHROPIC_API_KEY", "")
    if not api_key:
        raise HTTPException(
            status_code=503,
            detail="ANTHROPIC_API_KEY not set. Add it to your .env file."
        )

    payload = {
        "model":      "claude-sonnet-4-6",
        "max_tokens": 1000,
        "system":     SYSTEM_PROMPT,
        "messages":   [m.model_dump() for m in req.messages],
    }

    async with httpx.AsyncClient(timeout=30.0) as client:
        r = await client.post(
            ANTHROPIC_URL,
            json=payload,
            headers={
                "x-api-key":         api_key,
                "anthropic-version": "2023-06-01",
                "content-type":      "application/json",
            },
        )
        if r.status_code != 200:
            raise HTTPException(status_code=502, detail=f"Anthropic error: {r.text}")
        data = r.json()

    return {"reply": data["content"][0]["text"]}