from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.v1.api_router import api_router
from app.api.v1.endpoints import upload

app = FastAPI(
    title="AgentDesk API",
    description="Backend for AgentDesk",
    version="0.1.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all for development
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(api_router, prefix="/api/v1")
app.include_router(upload.router, prefix="/upload", tags=["upload"])

@app.get("/health")
async def health_check():
    return {"status": "ok"}
