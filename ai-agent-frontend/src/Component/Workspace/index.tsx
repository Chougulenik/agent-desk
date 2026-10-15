import React, { useState } from 'react';
import { Box } from '@mui/material';
import { Chat } from '../Chat';
import { FileUploader } from '../FileUploader';
import { DocumentViewer } from '../DocumentViewer';

export default function Workspace() {
  const [activeDoc, setActiveDoc] = useState<{title: string, content: string} | null>(null);
  const [highlightLine, setHighlightLine] = useState<number | undefined>();

  const handleCitationClick = (title: string, url: string, line: number) => {
    // Generate a massive 10,000 line mock document to prove virtualization and auto-scrolling
    const massiveContent = Array.from({ length: 10000 }, (_, i) => {
      if (i === line - 1) return `[${i+1}] >>> HIGHLIGHTED CITED TEXT for ${title} <<<`;
      return `[${i+1}] This is background context line ${i+1} of the document ${title}.`;
    }).join('\n');

    setActiveDoc({ title, content: massiveContent });
    setHighlightLine(line - 1); // 0-indexed for the virtualizer
  };

  return (
    <Box sx={{ display: 'flex', height: '100vh', width: '100vw', bgcolor: 'background.default', overflow: 'hidden' }}>
      {/* Left Sidebar: Document Ingestion */}
      <Box sx={{ 
        width: 320, 
        borderRight: '1px solid rgba(255,255,255,0.05)', 
        display: { xs: 'none', md: 'block' }, 
        p: 3, 
        background: 'rgba(15, 23, 42, 0.4)', 
        backdropFilter: 'blur(10px)',
        zIndex: 10 
      }}>
        <FileUploader />
      </Box>
      
      {/* Main Area: Generative Chat */}
      <Box sx={{ flexGrow: 1, height: '100%', position: 'relative' }}>
        <Chat onOpenDocument={setActiveDoc} onOpenCitation={handleCitationClick} />
      </Box>

      {/* Right Sidebar: Document Viewer (Split-Pane UI) */}
      {activeDoc && (
        <Box sx={{ 
          width: { xs: '100%', lg: '500px' }, 
          borderLeft: '1px solid', 
          borderColor: 'divider', 
          bgcolor: 'background.paper', 
          position: { xs: 'absolute', lg: 'relative' }, 
          right: 0, 
          height: '100%', 
          zIndex: 20,
          boxShadow: '-4px 0 24px rgba(0,0,0,0.5)'
        }}>
          <DocumentViewer 
             title={activeDoc.title} 
             content={activeDoc.content} 
             highlightLine={highlightLine}
             onClose={() => { setActiveDoc(null); setHighlightLine(undefined); }} 
          />
        </Box>
      )}
    </Box>
  );
}
