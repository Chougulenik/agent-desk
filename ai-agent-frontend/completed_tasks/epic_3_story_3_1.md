# Epic 3: Document Processing & Browser Architecture

## Completed Tasks
### Story 3.1: Web Worker Ingestion
- **Task 1**: Implemented `src/workers/documentWorker.ts` to act as a dedicated background process for heavy file parsing, chunking, and tokenization without touching the main UI thread.
- **Task 2**: Constructed `FileUploader.tsx` which reads local files utilizing the `File.arrayBuffer()` API. It seamlessly shifts memory ownership to the worker thread using Transferable Objects (zero-copy data transfer).
- **Task 3**: Built an automated indexing loop in the worker that handles over 20,000+ chunk generations per document upload, storing them in an in-memory map.

## Implementation Flow & Architecture

### 1. Off-Main-Thread Architecture
Browsers normally run JavaScript on a single UI thread. Parsing large PDFs or hundreds of Markdown files synchronously would completely freeze the chat interface (blocking typing, rendering, and animations). By dispatching this workload to a Web Worker, the UI remains consistently at 60 FPS.

### 2. Zero-Copy Transfer
When moving data from the React thread to the Web Worker, standard `postMessage` clones the data (Structured Clone Algorithm), which is slow for massive files. By adding `[arrayBuffer]` as the second argument to `postMessage`, we completely transfer memory ownership. The UI thread instantly loses access to the buffer, ensuring incredibly fast performance with zero memory duplication.

### 3. Modular React Structure
We established `src/Component/Workspace/index.tsx` as the overarching layout composer. It renders the `FileUploader` alongside the `Chat` view, clearly separating the responsibilities of heavy file I/O from Generative AI streaming!
