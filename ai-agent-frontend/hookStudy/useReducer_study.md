# useReducer Hook Study

## What is it?
`useReducer` is an alternative to `useState` that borrows the reducer pattern popularized by Redux. It manages state using a central "reducer" function that receives "actions."

## What problem do they actually solve?
When a component has complex state logic (like managing multiple arrays, objects, or state variables that update together), `useState` leads to multiple `setState` calls spread randomly throughout the code, causing bugs and race conditions. `useReducer` solves this by centralizing all state-update logic into a single, predictable function.

## Why do we need them?
We need `useReducer` to make complex state transitions predictable and testable. By dispatching "actions" rather than modifying state directly, we ensure that every update follows strict rules.

## What happens under the hood?
Under the hood, `useReducer` is actually the foundational hook that `useState` is built upon! When you dispatch an action, React passes your current state and the action to your custom reducer function. React then takes whatever object your reducer returns and forces a re-render using that new state.

## When should we use them?
- When the next state depends heavily on the previous state.
- When managing deeply nested objects or arrays.
- When you want to decouple the complex state logic from the UI rendering logic.

## When should we avoid them?
- Avoid `useReducer` for simple primitives (like toggling a boolean or storing a single string). It introduces unnecessary boilerplate and complexity where `useState` would suffice.

## Syntax
```tsx
const [state, dispatch] = useReducer(reducerFunction, initialState);
```

## How We Used It in AgentDesk
In `src/Component/Chat.tsx`, managing the incoming Server-Sent Events (SSE) stream involves deeply nested state updates (maintaining an array of `messages`, where the active message contains an array of `MessagePart` objects).

Using `useState` for this would be extremely messy and prone to race conditions since SSE streams arrive in rapid chunks.

Instead, we built a strongly-typed `chatReducer`:
```tsx
const [state, dispatch] = useReducer(chatReducer, initialState);

// Example dispatch:
dispatch({ type: 'PROCESS_AGENT_EVENT', event: parsedJSON });
```

This architecture allowed us to decouple the complex mapping logic from the React rendering body, keeping our UI code perfectly clean while maintaining strict TypeScript type-safety (via `assertNever`).
