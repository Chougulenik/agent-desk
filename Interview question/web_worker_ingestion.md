# Interview Questions: Web Worker & Document Ingestion (Story 3.1)

1. What is a Web Worker in JavaScript, and why is it necessary for heavy document processing?
2. How do Web Workers solve the issue of a single-threaded architecture in the browser?
3. Can a Web Worker directly manipulate the DOM? If not, how does it communicate with the React UI?
4. What is the `postMessage` API, and how does it work between the main thread and a worker thread?
5. Explain the concept of the Structured Clone Algorithm. Why can it be a performance bottleneck for large file uploads?
6. What are "Transferable Objects" in JavaScript, and how do they differ from structured cloning?
7. Explain what `File.arrayBuffer()` does and why we passed it as a transferable object to our Web Worker.
8. What happens to the memory ownership of an ArrayBuffer in the main thread once it has been transferred to a Web Worker?
9. How did you initialize the Web Worker within the React component lifecycle? Why is `useEffect` the right place for it?
10. What is the purpose of returning `workerRef.current?.terminate()` in the cleanup function of `useEffect`?
11. How would you handle errors or exceptions that occur inside a Web Worker?
12. Why did we simulate breaking a document into chunks (tokenization) inside the worker instead of just passing the whole string back?
13. Describe how you would track the progress of a large 50-page PDF parsing job and update the UI accordingly.
14. What is an in-memory search index, and why did we build it inside the Web Worker?
15. If the browser didn't support Web Workers, what alternative techniques (like time-slicing or `requestAnimationFrame`) could you use?
16. How did React's state management handle the async messages coming back from the worker?
17. What are the security limitations of Web Workers? (e.g., Cross-Origin restrictions).
18. How does utilizing Web Workers impact the 60 FPS (Frames Per Second) rendering goal of a modern web application?
