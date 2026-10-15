# Interview Questions: Backend SSE Implementation

1. What are Server-Sent Events (SSE) and how do they fundamentally differ from WebSockets?
2. In what scenarios would you choose SSE over WebSockets for a real-time AI streaming application?
3. How does the FastAPI framework support Server-Sent Events?
4. Explain the role and mechanics of `EventSourceResponse` (from `sse-starlette`) in yielding data.
5. What is an asynchronous generator in Python (`async def` with `yield`) and how is it utilized in our implementation?
6. How does the `yield` keyword function inside an async generator compared to a standard synchronous function?
7. Explain how the `request.is_disconnected()` check works in FastAPI and why it is critical for backend compute and memory management.
8. How would you handle and propagate backend errors or exceptions during an active, already-yielding SSE stream?
9. What HTTP headers are inherently required (e.g., `Content-Type: text/event-stream`) for an SSE connection to be recognized by the client?
10. In the context of LLM token streaming, what factors cause network or inference latency, and how does SSE handle chunked data delivery efficiently?
11. How can you implement retry logic or heartbeat/keep-alive signals in an SSE stream to prevent load balancers from dropping the connection?
12. Discuss the scalability implications of holding thousands of open SSE connections on a FastAPI server running with Uvicorn workers.
13. How does Python's `asyncio.sleep()` differ from `time.sleep()`, and why is using `time.sleep()` dangerous in an async SSE generator?
14. What are the architectural limitations of Server-Sent Events regarding bidirectional communication?
15. If a client drops the connection abruptly, what is the exact lifecycle of the FastAPI worker terminating the request?
16. How would you secure an SSE endpoint using JWTs or HttpOnly cookies, considering standard `EventSource` limitations?
17. What is the impact of CORS on Server-Sent Events and how is it properly configured in FastAPI to allow cross-origin streaming?
18. Can you explain the standard payload format of an SSE text stream (e.g., the roles of `event:`, `data:`, `id:`, and `retry:`)?
