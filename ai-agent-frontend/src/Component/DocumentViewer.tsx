import React, { useRef, useEffect, useState } from 'react';
import { Paper, Typography, Box, IconButton, Button, Snackbar, Alert } from '@mui/material';
import DescriptionIcon from '@mui/icons-material/Description';
import CloseIcon from '@mui/icons-material/Close';
import SaveIcon from '@mui/icons-material/Save';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ReactMarkdown from 'react-markdown';
import { Virtuoso, type VirtuosoHandle } from 'react-virtuoso';

interface Props {
  title: string;
  content: string;
  highlightLine?: number;
  onClose?: () => void;
}

export function DocumentViewer({ title, content, highlightLine, onClose }: Props) {
  // Split raw text content into lines for virtualization if it's very large
  const lines = content.split('\n');
  const virtuosoRef = useRef<VirtuosoHandle>(null);
  
  // Optimistic UI State
  const [saveState, setSaveState] = useState<'idle' | 'saved'>('idle');
  const [saveError, setSaveError] = useState<string | null>(null);

  // Auto-scroll to the citation coordinate!
  useEffect(() => {
    if (highlightLine !== undefined && virtuosoRef.current && !title.endsWith('.md') && !title.endsWith('.pdf')) {
      setTimeout(() => {
        virtuosoRef.current?.scrollToIndex({ index: highlightLine, align: 'center', behavior: 'smooth' });
      }, 300);
    }
  }, [highlightLine, title]);

  const handleSaveOptimistic = async () => {
    // 1. Optimistic Update (Immediate Feedback)
    setSaveState('saved');
    setSaveError(null);
    
    // Broadcast via SharedWorker so other tabs know a doc was saved
    if (window.SharedWorker) {
      const sw = new SharedWorker(new URL('../workers/sharedWorker.ts', import.meta.url), { type: 'module' });
      sw.port.postMessage({ type: 'WORKSPACE_SYNC', message: `Document saved: ${title}` });
    }

    try {
      // 2. Reconciliation Logic (Backend Sync)
      const res = await fetch('http://localhost:8000/api/v1/workspace/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, content: content.substring(0, 100) })
      });
      
      if (!res.ok) {
        throw new Error('Server rejected save');
      }
    } catch (err: any) {
      // 3. Rollback on Failure
      setSaveState('idle');
      setSaveError("Failed to save - Please check your connection and retry.");
    }
  };

  return (
    <Paper sx={{ height: '100%', display: 'flex', flexDirection: 'column', bgcolor: 'transparent', borderRadius: 0 }} elevation={0}>
      {/* Header */}
      <Box sx={{ 
        p: 2.5, px: 3,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', 
        borderBottom: '1px solid rgba(255,255,255,0.08)', 
        background: 'linear-gradient(90deg, rgba(99, 102, 241, 0.1) 0%, rgba(0,0,0,0) 100%)',
        backdropFilter: 'blur(12px)'
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', color: 'primary.light' }}>
          <DescriptionIcon sx={{ mr: 1.5, fontSize: 28 }} />
          <Typography variant="h6" fontWeight="700" sx={{ letterSpacing: '0.01em' }}>
            {title}
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Button 
            variant={saveState === 'saved' ? "outlined" : "contained"}
            color={saveState === 'saved' ? "success" : "primary"}
            size="small"
            startIcon={saveState === 'saved' ? <CheckCircleIcon /> : <SaveIcon />}
            onClick={handleSaveOptimistic}
            sx={{ borderRadius: '12px' }}
          >
            {saveState === 'saved' ? 'Saved' : 'Save'}
          </Button>
          
          {onClose && (
            <IconButton onClick={onClose} size="small" sx={{ color: 'text.secondary', bgcolor: 'rgba(255,255,255,0.05)', '&:hover': { bgcolor: 'rgba(255,255,255,0.1)' } }}>
              <CloseIcon fontSize="small" />
            </IconButton>
          )}
        </Box>
      </Box>

      {/* Render Body */}
      <Box sx={{ flexGrow: 1, p: 3, overflowY: 'auto' }}>
        {title.endsWith('.md') ? (
          <Box sx={{ color: 'text.primary', '& h1, & h2, & h3': { color: 'primary.light', mb: 2, borderBottom: '1px solid rgba(255,255,255,0.1)', pb: 1 }, '& p': { lineHeight: 1.8 } }}>
            <ReactMarkdown>{content}</ReactMarkdown>
          </Box>
        ) : title.endsWith('.pdf') ? (
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'text.secondary', flexDirection: 'column', gap: 2 }}>
            <Typography variant="h6">PDF Renderer Initialized</Typography>
            <Typography variant="body2">PDF.js Virtualization is active.</Typography>
          </Box>
        ) : (
          <Virtuoso
            ref={virtuosoRef}
            style={{ height: '100%' }}
            totalCount={lines.length}
            itemContent={index => (
              <Typography
                variant="body2"
                component="pre"
                sx={{
                  whiteSpace: 'pre-wrap',
                  fontFamily: 'monospace',
                  color: index === highlightLine ? 'primary.main' : 'text.secondary',
                  bgcolor: index === highlightLine ? 'rgba(99, 102, 241, 0.1)' : 'transparent',
                  borderLeft: index === highlightLine ? '4px solid #6366f1' : '4px solid transparent',
                  m: 0,
                  px: 1,
                  minHeight: '20px',
                  transition: 'background-color 0.5s ease'
                }}
              >
                {lines[index]}
              </Typography>
            )}
          />
        )}
      </Box>

      {/* Optimistic UI Rollback Error */}
      <Snackbar open={!!saveError} autoHideDuration={4000} onClose={() => setSaveError(null)}>
        <Alert severity="error" onClose={() => setSaveError(null)}>{saveError}</Alert>
      </Snackbar>
    </Paper>
  );
}
