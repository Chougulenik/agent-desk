# useEffect Hook Study

## What is it?
`useEffect` is a hook that lets you synchronize a component with an external system. It allows you to perform "side effects" (code that reaches outside the scope of the pure React rendering phase).

## What problem do they actually solve?
React components are supposed to be "pure" functions—they take props and return JSX. They shouldn't do things like fetching data, subscribing to a WebSocket, or interacting with the `window` object during the render phase. `useEffect` solves this by providing a safe place to run impure side-effect code *after* the browser has painted the UI.

## Why do we need them?
We need `useEffect` to handle logic that React cannot naturally handle via rendering alone. If we didn't have `useEffect`, setting up an event listener or fetching an API would block the UI from rendering, cause stuttering, or trigger infinite loops.

## What happens under the hood?
React waits until the component has fully rendered and the browser has painted the screen. Then, it checks the "dependency array" you provided. If any of the variables in the array have changed since the last render, React executes your effect function. If your effect returns a cleanup function, React will run that cleanup function right before the component unmounts or before the effect runs again.

## When should we use them?
- To fetch data from a backend server when a component initially mounts.
- To set up manual event listeners (e.g., `window.addEventListener('resize')`) or initialize Web Workers.
- To integrate with non-React libraries (e.g., initializing a D3 chart manually).

## When should we avoid them?
- Avoid using `useEffect` to transform or filter data that you already have in state. (You can just calculate it directly during render).
- Avoid chaining `useEffect` calls where Effect A updates State B, which triggers Effect C. This leads to extremely hard-to-read code and poor performance.

## Syntax
```tsx
useEffect(() => {
  // Your side effect code here
  
  return () => {
    // Optional cleanup code
  };
}, [dependencyArray]);
```

## How We Used It in AgentDesk
In `src/Component/Chat.tsx`, we combined `useEffect` with `useRef` to create our auto-scrolling mechanism. We want to execute the scroll action *only* after React has fully updated the DOM with the newest streamed messages.

```tsx
useEffect(() => {
  messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
}, [state.messages]);
```

Because we added `state.messages` to the dependency array, this effect fires automatically every single time a new message chunk is added to the state. This effortlessly keeps the user's viewport anchored to the latest streamed data!
