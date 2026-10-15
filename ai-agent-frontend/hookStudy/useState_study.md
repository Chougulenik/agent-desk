# useState Hook Study

## What is it?
`useState` is a React Hook that lets you add state variables to functional components. 

## What problem do they actually solve?
Before Hooks were introduced in React 16.8, functional components were "stateless." If you wanted a component to remember data (like text in an input box), you had to write a complex ES6 Class component. `useState` solves this by allowing simple functional components to retain memory.

## Why do we need them?
We need `useState` so that our application can be interactive. Without state, a React component renders once and remains static forever. `useState` allows a component to remember user inputs, toggle switches, or API data between renders.

## What happens under the hood?
When you call `useState`, React attaches a state cell to the current component's memory tree. When you call the setter function (e.g., `setInputValue`), React places the component in a queue for a re-render. During the next render cycle, React provides the component with the newly updated value from its memory tree.

## When should we use them?
- When you have simple, independent pieces of data (e.g., `isOpen`, `inputValue`, `counter`).
- When the state is local to a specific component and doesn't need to be heavily shared.

## When should we avoid them?
- Avoid using `useState` if the state relies heavily on previous state or involves deeply nested objects/arrays. (Use `useReducer` instead).
- Avoid storing data in `useState` that doesn't actually impact the visual UI. If changing the data shouldn't trigger a re-render, use `useRef` instead.

## Syntax
```tsx
const [state, setState] = useState(initialState);
```

## How We Used It in AgentDesk
In our `src/Component/Chat.tsx` component, we used `useState` to manage the controlled input of the chat box text field:

```tsx
const [inputValue, setInputValue] = useState('');
```

1. **Reading**: We pass `inputValue` to the `value` prop of the `<TextField>`.
2. **Writing**: As the user types, the `onChange` event fires, and we call `setInputValue(e.target.value)`.
3. **Resetting**: When the form is submitted, we send `inputValue` to our backend and immediately clear the box by calling `setInputValue('')`.
