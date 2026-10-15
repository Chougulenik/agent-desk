# Story 1.2: Frontend Stream Consumer

## Completed Tasks
- **Task 1**: Implement a fetch call retrieving the SSE stream using `ReadableStream`.
- **Task 2**: Pipe the stream through a `TextDecoderStream` to handle chunk boundaries accurately.
- **Task 3**: Build a React state reducer to progressively append text to the active message.

## Implementation Flow

### 1. `Chat.tsx` State Management
- Utilizes `useReducer` to manage complex states including `activeMessage`, `error`, and `isLoading`.
- The `chatReducer` handles the action `APPEND_TEXT`, which performs a progressive concatenation to the existing message without mutating state directly or triggering unwanted renders.

### 2. Stream Data Fetching
- On form submission, we trigger a `fetch` POST request to our Backend SSE endpoint (`http://localhost:8000/api/v1/chat/stream`).
- The response utilizes the Web Stream API via `response.body`.

### 3. Piping and Parsing Chunks
- To ensure characters and byte segments aren't malformed, we pipe the stream explicitly through `TextDecoderStream()`.
- A continuous `while` loop awaits `reader.read()` and parses lines looking for the `data: ` SSE prefix.
- Once the text token is extracted from the `data` block, it is dispatched to the reducer (`APPEND_TEXT`), mapping immediately to the UI layer allowing the text to stream token-by-token naturally.
