# Interview Questions: Tool-Call Visualization (Story 3.2)

1. What is Server-Sent Events (SSE), and how does it differ from WebSockets when streaming AI responses?
2. How did we differentiate between a standard text stream and a tool call event in our JSON payload?
3. Why did we use a `useReducer` to manage the chat state instead of a standard `useState` array?
4. Explain how the `useReducer` updates a deeply nested array without mutating the original state.
5. What does the `tool_started` event signify in an Agentic AI architecture?
6. How did we map internal developer tool names (like `analyze_repo`) to user-friendly UI text (like "Searching knowledge base...")?
7. Describe the visual lifecycle of a tool call component from the user's perspective (Pending vs. Completed).
8. Why is it important to show transient tool states to a user before the final LLM text response begins?
9. What is Material UI's `<Collapse>` component, and how did we use it to animate the result reveal?
10. How does React handle reconciling the `ToolCall` component when its `status` prop changes from 'pending' to 'completed'?
11. If multiple tools run in parallel, how does our reducer know which specific tool to mark as completed?
12. Why did we use a backwards `for` loop (`for (let i = newParts.length - 1; i >= 0; i--)`) to find and update the pending tool?
13. How did we simulate network latency and heavy background searching in our backend Python mock?
14. What are the UX benefits of using a skeleton loader or a `CircularProgress` spinner during tool execution?
15. If a tool fails to execute on the backend, how should the frontend UI handle and display the `tool_error` event?
16. Explain the concept of "perceived latency". How does tool-call visualization improve perceived latency even if the total processing time remains the same?
17. How did we ensure strict type-safety in TypeScript when parsing the different variants of `AgentEvent`?
18. What is the `assertNever` pattern in TypeScript, and how does it protect our reducer from unhandled event types?
