# AgentDesk

AgentDesk is an intelligent AI agent desktop workspace that bridges real-time language model streaming with rich **Generative UI** components, off-main-thread document processing, deep citation tracking, and autonomous multi-step research workflows.

---

## Features

- **Real-Time Token Streaming**: Streams Gemini LLM responses token-by-token using FastAPI Server-Sent Events (SSE) and native browser `ReadableStream`/`TextDecoderStream` for minimal latency.
- **Generative UI Rendering**: Dynamically parses structured SSE events to render interactive React components—such as comparison tables, charts, and document previews—inline with conversational text.
- **Autonomous Deep Research Workflow**: Orchestrates an interactive multi-phase state machine (Planning, Searching, Reading, Analyzing, Writing, Reviewing) with real-time controls to pause, resume, and cancel tasks.
- **Tool-Call Visualization**: Displays live agent tool execution states with animated progress indicators and collapsible result inspectors to visualize the AI's internal reasoning steps.
- **Deep-Linked Citations & Virtualized Viewer**: Embeds superscript citation badges that open a split-pane viewer and smoothly auto-scroll to exact source line coordinates using `react-virtuoso` across massive documents.
- **Off-Main-Thread Document Ingestion**: Employs background Web Workers with zero-copy Transferable Objects (`ArrayBuffer`) to parse and index tens of thousands of document chunks without freezing the UI thread.
- **Cross-Tab Synchronization**: Keeps workspace state and notifications synchronized across open browser tabs in real time using HTML5 `SharedWorker`.
- **Offline Resilience & Service Worker Caching**: Automatically caches workspace assets and documents via a custom Service Worker with real-time online/offline status detection.
- **Modern Glassmorphic Dark UI**: Designed with Material UI, modern typography, glassmorphism aesthetics, and responsive split-pane navigation.

---

## Running the Services

### Prerequisites

- **Python**: Version 3.11 or higher (with `pip` or [`uv`](https://github.com/astral-sh/uv))
- **Node.js**: Version 18 or higher (with `npm`)
- **Gemini API Key**: A valid Google Gemini API key from [Google AI Studio](https://aistudio.google.com/)

---

### 1. Backend Service (`ai-agent-backend`)

The backend is built with FastAPI and handles LLM token streaming and research state machines.

1. **Navigate to the backend directory:**
   ```powershell
   cd ai-agent-backend
   ```

2. **Configure environment variables:**
   Copy the example environment file and add your Gemini API key:
   ```powershell
   cp .env.example .env
   ```
   Open `.env` and set:
   ```env
   GEMINI_API_KEY=your_actual_gemini_api_key_here
   ```

3. **Set up virtual environment and install dependencies:**
   *Using Standard Python (`venv` + `pip`):*
   ```powershell
   python -m venv .venv
   .\.venv\Scripts\activate   # On Linux/macOS: source .venv/bin/activate
   pip install -e .
   ```

   *Or using `uv`:*
   ```powershell
   uv sync
   .\.venv\Scripts\activate
   ```

4. **Start the FastAPI server:**
   ```powershell
   uvicorn app.main:app --reload --port 8000
   ```

   - **API Server**: [http://localhost:8000](http://localhost:8000)
   - **Interactive Swagger Docs**: [http://localhost:8000/docs](http://localhost:8000/docs)
   - **Health Check**: [http://localhost:8000/health](http://localhost:8000/health)

---

### 2. Frontend Service (`ai-agent-frontend`)

The frontend is built with React 19, TypeScript, Vite, and Material UI.

1. **Navigate to the frontend directory:**
   ```powershell
   cd ai-agent-frontend
   ```

2. **Install Node dependencies:**
   ```powershell
   npm install
   ```

3. **Start the development server:**
   ```powershell
   npm run dev
   ```

4. **Open the application:**
   Navigate to [http://localhost:5173](http://localhost:5173) in your browser.

---

## Sample Commands & Interactions

Once both services are running, try the following prompts and interactions in the frontend chat interface:

### 1. Conversational & Streaming Chat
Ask questions to see low-latency token-by-token streaming via SSE:
- `"Explain the difference between Server-Sent Events (SSE) and WebSockets for AI applications."`
- `"What is Generative UI and how does it improve AI chat interfaces?"`
- `"How do Transferable Objects enable zero-copy data transfer in Web Workers?"`

### 2. Generative UI Components
Ask for comparisons or structured data to observe dynamic component rendering (e.g., tables, charts):
- `"Compare FastAPI, Flask, and Django in a comparison table highlighting performance, async support, and learning curve."`
- `"Show me a comparison between React, Vue, and Svelte for building desktop workspaces."`
- `"Generate a performance benchmark chart comparing REST, GraphQL, and gRPC."`

### 3. Deep Research Mode
Toggle the **Deep Research Mode** switch above the prompt input:
- `"Perform deep research on state-of-the-art agent orchestration patterns in 2026."`
- `"Investigate offline-first architectural patterns using Service Workers, IndexedDB, and SharedWorkers."`
- **Interactive Controls**: Watch the state machine stepper advance through `PLANNING` &rarr; `SEARCHING` &rarr; `READING` &rarr; `ANALYZING` &rarr; `WRITING` &rarr; `REVIEWING` &rarr; `COMPLETE`. Click **Pause**, **Resume**, or **Cancel** to test lifecycle management.

### 4. Knowledge Base & Deep Citations
1. In the left **Knowledge Base** sidebar, click **Upload Documents** and upload a `.md`, `.txt`, or `.pdf` file.
2. Watch the background Web Worker process and index chunks with zero main-thread lag.
3. In the chat, ask:
   - `"Summarize the key takeaways from the uploaded architecture document and provide citations."`
4. Click on any inline citation marker (e.g., `[12]`) to automatically trigger the split-pane **Document Viewer** and smoothly auto-scroll to the highlighted line in the source file.
