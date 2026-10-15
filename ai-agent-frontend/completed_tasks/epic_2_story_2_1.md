# Epic 2: Rich Component Rendering

## Completed Tasks
### Story 2.1: Strongly Typed Event Definitions
- **Task 1**: Defined the `AgentEvent` discriminated union in TypeScript, effectively capturing payloads like `text_delta`, `tool_started`, `tool_completed`, `citation`, `artifact`, and `error`.
- **Task 2**: Defined `MessagePart` unions (`TextPart`, `ToolCallPart`, `TablePart`, `ChartPart`, `CitationPart`, `ArtifactPart`) to structure state strictly.

## Implementation Flow & Architecture

### 1. Advanced TypeScript Features (`src/types/agent.ts`)
- **Template Literal Types**: We built `PrefixedEventType<T>` to show how we can rigorously lock strings based on prefixes (e.g. `agent_text_delta`) ensuring high-level type safety.
- **Mapped Types**: Instead of manually joining types, `AgentEventMap` iterates over `EventPayloads` using `[K in keyof EventPayloads]` mapping the `{ type: K }` discriminator automatically.

### 2. State Mapping & Reducer Exhaustive Checks (`src/Component/Chat.tsx`)
- The internal state in `ChatState` was transitioned from a monolithic `string` to an array of `MessagePart`s (`parts: MessagePart[]`). 
- When an event arrives via SSE, it's parsed as JSON. 
- The `PROCESS_AGENT_EVENT` reducer handles mapping the transient `AgentEvent` over into a visual `MessagePart`.
- **Exhaustive Checks**: The `switch` statement over `event.type` calls `assertNever(event)` in the `default` block. This asserts to the TypeScript compiler that the variable must be of type `never`. If a developer adds a new event to the union but forgets to handle it, `event` is NOT `never`, breaking the build and guaranteeing absolute safety.
