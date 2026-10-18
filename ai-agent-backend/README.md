# AI Agent Backend

FastAPI backend service powering the **[AgentDesk](../README.md)** application. It provides real-time Server-Sent Events (SSE) streaming for Gemini LLM responses and long-running autonomous deep research workflows.

## Features
- **SSE Token Streaming**: Real-time token generator powered by the Google GenAI SDK.
- **Deep Research State Machine**: Asynchronous task manager orchestrating multi-step research phases (`PLANNING`, `SEARCHING`, `READING`, `ANALYZING`, `WRITING`, `REVIEWING`, `COMPLETE`).
- **Lifecycle Task Controls**: Endpoints to start, pause, resume, cancel, and stream progress for research tasks.

## Quick Start

### 1. Environment Configuration
Copy `.env.example` to `.env` and add your Gemini API key:
```powershell
cp .env.example .env
```
Ensure `.env` contains:
```env
GEMINI_API_KEY=your_gemini_api_key_here
```

### 2. Install Dependencies
```powershell
python -m venv .venv
.\.venv\Scripts\activate   # Linux/macOS: source .venv/bin/activate
pip install -e .
```
*Or using `uv`:*
```powershell
uv sync
```

### 3. Run the Server
```powershell
uvicorn app.main:app --reload --port 8000
```

- API Base URL: `http://localhost:8000`
- Interactive API Docs: `http://localhost:8000/docs`
- Health Check: `http://localhost:8000/health`

## Key API Endpoints
- `POST /api/v1/chat/stream`: Stream chat responses token-by-token via SSE.
- `POST /api/v1/chat/research/start`: Trigger an asynchronous deep research workflow.
- `GET /api/v1/chat/research/stream/{task_id}`: Stream state machine progress and tool actions via SSE.
- `POST /api/v1/chat/research/pause/{task_id}`: Pause an in-flight research task.
- `POST /api/v1/chat/research/resume/{task_id}`: Resume a paused research task.
- `POST /api/v1/chat/research/cancel/{task_id}`: Cancel a research task.

For the full application overview and frontend setup, refer to the [Root README](../README.md).

