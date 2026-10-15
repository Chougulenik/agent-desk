# Interview Questions: Strongly Typed Event Definitions

1. What is a Discriminated Union in TypeScript and how does it drastically improve type safety in complex data structures?
2. Explain the purpose of a discriminator property (e.g., `type: 'text_delta'`) in a union type and how the compiler utilizes it.
3. What are Template Literal Types in TypeScript, and how can they be used to enforce rigid string patterns (like `agent_text_delta`)?
4. How do Template Literal Types help enforce strict naming conventions and API contracts across a large codebase?
5. What is a Mapped Type, and how can it dynamically generate union types or interfaces from an existing Record or key-value definition?
6. Explain the syntax `[K in keyof EventPayloads]` and describe a practical scenario where it saves boilerplate code.
7. What is an exhaustive check in TypeScript and why is it a best practice in Redux/useReducer architectures?
8. How does an `assertNever(x: never)` function work to enforce exhaustive checks at compile time?
9. Walk through exactly what happens during compilation if you add a new event type to the `AgentEvent` union but forget to handle it in the reducer's switch statement.
10. Why is the `never` type crucial for building robust, future-proof `switch` cases?
11. How do you ensure that parsed JSON data from a backend actually conforms to the TypeScript `AgentEvent` type at runtime (since TS types are erased)?
12. What is the fundamental difference between type assertion (e.g., `as AgentEvent`) and type narrowing/type guarding?
13. Describe the mechanics of how TypeScript narrows the type of an object inside a `switch (event.type)` block.
14. What are the UI and architectural benefits of representing a chat message as an array of structured `MessagePart` objects instead of a single concatenated string?
15. Describe how you would handle an unknown or malformed event type bypassing the type system at runtime (e.g., corrupted JSON from the network).
16. How does TypeScript's `isolatedModules: true` flag (often used in Vite/esbuild) affect how types and interfaces must be imported and exported?
17. Why do we need to use `import type { ... }` instead of a standard `import { ... }` in a modern bundler environment?
18. In your experience, how does implementing rigorous compile-time type safety reduce runtime errors and bugs in complex UI state management?
