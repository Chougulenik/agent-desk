# Epic 4: Citation System & Document Viewer

## Completed Tasks
### Story 4.2: Deep-Linked Citations
- **Task 1**: Updated the Python backend to emit strongly-typed `citation` JSON events that include URL hashes containing document coordinates (e.g. `?line=852`).
- **Task 2**: Built the `CitationCard` React component. It parses the line numbers from the URL hash and renders as a stylish, superscript action button embedded inline directly within the chat text (just like Wikipedia citations).
- **Task 3**: Implemented **DOM virtualization auto-scrolling**. When a user clicks the citation, it extracts the document ID and line number, dynamically opens the Document Viewer split-pane, and utilizes `react-virtuoso`'s `.scrollToIndex()` API to instantly scroll the viewport to line 852.

## Highlight & Animations
To ensure the user doesn't lose their place in a massive document, the deeply-linked line is also highlighted with a vibrant indigo border and background tint to immediately draw the eye to the referenced evidence!
