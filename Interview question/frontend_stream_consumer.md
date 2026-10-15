# Interview Questions: Frontend Stream Consumer

1. What is the Web Streams API and what specific advantages does it offer over traditional Promise-based fetch responses?
2. How does `ReadableStream` handle incoming data chunks from a long-running fetch request?
3. What is the purpose of `TextDecoderStream` when piping a ReadableStream, and why is it necessary?
4. Why is decoding byte chunk boundaries accurately so important when dealing with UTF-8 streamed text?
5. How does `response.body.pipeThrough()` work under the hood in the browser?
6. Explain the concept of "backpressure" in the context of web streams. How does the browser manage it?
7. How do you implement a continuous asynchronous read loop (e.g., `while(!isDone)`) on a stream reader?
8. Why did we use the `fetch` API with Web Streams instead of the browser's native `EventSource` object for our POST request?
9. What is a React reducer (`useReducer`) and why is it often preferred over `useState` for complex, continuous state updates?
10. How does the `APPEND_TEXT` action in our reducer prevent unnecessary full-page re-renders while updating the active message state?
11. Describe how React (specifically React 18+) batches state updates when receiving rapid consecutive tokens from an SSE stream.
12. What challenges arise when updating deeply nested state (like an array of message parts) in React immutably?
13. How do you gracefully close, abort, or cancel an active fetch stream on the frontend when a user unmounts the component or clicks "Stop"?
14. Explain the difference between mutative state updates and immutable state updates in our chat reducer. Why does mutation break React?
15. How can you detect if a browser does not support the Web Streams API, and what fallback mechanism would you use?
16. If the server sends malformed SSE data or non-JSON strings intermittently, how should the frontend parser handle the error without breaking the UI?
17. How does the JavaScript event loop handle the continuous resolution of `await reader.read()` without blocking the main rendering thread?
18. Why do we split the incoming chunk by `\n` and check for the `data: ` prefix manually in our custom stream consumer?
