# Epic 4: Citation System & Document Viewer

## Completed Tasks
### Story 4.1: The Document Viewer Component
- **Task 1**: Re-architected the main workspace layout to support a split-pane UI. The Chat interface is now sandwiched between the File Ingestion sidebar on the left and the new Document Viewer pane on the right. Inline document events in the chat now render as interactive buttons that slide open the right pane to reveal the full document.
- **Task 2**: Integrated advanced rendering strategies within the Document Viewer:
  - **Virtualization**: Integrated `react-virtuoso` to dynamically render large `.txt` or `.json` files. By only rendering the lines of text currently visible in the DOM viewport, the app can handle a million-line document without dropping frames.
  - **Rich Text**: Integrated `react-markdown` to parse and beautifully format `.md` documents dynamically, matching the global glassmorphism dark theme.

## Architecture Highlights
This Split-Pane UI allows users to engage in a conversation with the AgentDesk on the left side while cross-referencing cited material, reading architectural diagrams, or verifying evidence in the full Document Viewer on the right side simultaneously!
