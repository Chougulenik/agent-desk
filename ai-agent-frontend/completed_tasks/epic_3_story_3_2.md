# Epic 3: Document Processing & Browser Architecture

## Completed Tasks
### Story 3.2: Tool-Call Visualization
- **Task 1**: Replaced the static, inline text rendering of agent actions with a newly built, dedicated `<ToolCall />` component. This component dynamically interprets the `tool_started` event and maps internal tool names (e.g. `analyze_repo`) to human-readable transient states (e.g. "Searching knowledge base...").
- **Task 2**: Leveraged Material UI's `<Collapse />` API and color transitions. When the `tool_completed` event arrives, the component dynamically transforms from a blue pulsing `CircularProgress` loader to an emerald `CheckCircleIcon`, smoothly dropping down an animated reveal of the tool's result.

## Implementation Flow
By parsing Server-Sent Events (SSE) individually and utilizing a `useReducer` to manipulate the `MessagePart` array in real-time, we are able to change the status of an active tool in the UI without re-rendering the entire chat tree. This allows the user to see a step-by-step breakdown of the AI's "thought process" and background actions precisely as they happen on the backend, dramatically improving perceived latency and transparency.
