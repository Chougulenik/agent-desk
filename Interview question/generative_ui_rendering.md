# Interview Questions: Generative UI Rendering

1. What is Generative UI, and how does it fundamentally differ from standard markdown-based UI rendering?
2. Why emit structured JSON payloads (like `{"type": "comparison_table"}`) from the backend instead of just sending pre-rendered HTML or markdown tables?
3. How does React handle the dynamic swapping of components (e.g., matching a string type to a `<ComparisonTable />`) efficiently during a stream?
4. What are the advantages of moving UI component generation directly into the language model's output schema?
5. How would you handle a scenario where the backend emits a massive, complex JSON payload (like a 5MB chart data object) via SSE without blocking the main thread?
6. When rendering Generative UI components inline with conversational text, how do you manage scroll positioning smoothly?
7. Explain how you would pass callback functions (like `onSort` or `onClick`) to a dynamically rendered component that was triggered by the LLM.
8. How does TypeScript ensure that the `ComparisonTable` component always receives the correct `headers` and `rows` props from the reducer state?
9. What is a "hallucination" in the context of structured JSON, and how can you gracefully fallback if the LLM generates an invalid chart data schema?
10. In our `Chat.tsx`'s `renderPart` function, we use the `idx` as the `key` prop. Why is this generally discouraged in React, and how could we implement stable unique IDs for streamed parts?
11. How can you style dynamically generated UI components so they seamlessly blend with the chat interface and dark/light modes?
12. If a user asks the LLM to modify an already rendered chart (e.g., "Change the bar chart to a pie chart"), how would you reflect this update architecturally instead of appending a brand new chart?
13. Describe the lifecycle of a Generative UI component from the moment the backend yields the first byte of its JSON string to when it appears on the screen.
14. What are the security implications of rendering complex JSON objects (like Document contents or Charts) sent directly from an LLM prompt response? (e.g., XSS)
15. How would you implement a "loading skeleton" for a Generative UI component while its massive JSON payload is still buffering over the network?
16. In a production environment, how would you lazily load heavy visualization libraries (like `Chart.js` or `Recharts`) only when a `ChartPart` is actually streamed?
17. What are Server-Side Rendering (SSR) limitations when dealing with heavily interactive Generative UI blocks that stream in post-load?
18. How does combining text streaming (`text_delta`) and discrete data block streaming enhance the perceived performance and UX of an AI chat application?
