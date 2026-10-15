from fastapi import APIRouter, Request, HTTPException
from sse_starlette.sse import EventSourceResponse
from app.schemas.chat import ChatRequest
from app.services.llm_client import stream_llm_tokens
from app.services.research_workflow import start_research, pause_research, resume_research, cancel_research, stream_research_events

router = APIRouter()

@router.post("/stream")
async def chat_stream(request: Request, chat_request: ChatRequest):
    """
    Streaming endpoint that yields Server-Sent Events (SSE).
    """
    async def event_generator():
        # Iterate over the async generator from the LLM client
        async for token in stream_llm_tokens(chat_request.message):
            # If the client disconnects, stop generating tokens
            if await request.is_disconnected():
                break
            
            # Yield the text chunk in SSE format
            yield {
                "event": "text_delta",
                "data": token
            }
            
    return EventSourceResponse(event_generator())

@router.post("/research/start")
async def research_start(chat_request: ChatRequest):
    """Starts a long-running research task."""
    task_id = start_research(chat_request.message)
    return {"task_id": task_id}

@router.get("/research/stream/{task_id}")
async def research_stream(task_id: str, request: Request):
    """Streams the state machine progress via SSE."""
    async def event_generator():
        async for event_json in stream_research_events(task_id):
            if await request.is_disconnected():
                break
            yield {
                "event": "message",
                "data": event_json
            }
    return EventSourceResponse(event_generator())

@router.post("/research/pause/{task_id}")
async def research_pause(task_id: str):
    pause_research(task_id)
    return {"status": "paused"}

@router.post("/research/resume/{task_id}")
async def research_resume(task_id: str):
    resume_research(task_id)
    return {"status": "resumed"}

@router.post("/research/cancel/{task_id}")
async def research_cancel(task_id: str):
    cancel_research(task_id)
    return {"status": "cancelled"}
