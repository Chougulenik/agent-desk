import React, { useRef, useState, useEffect } from 'react';
import { Box, Button, Typography, CircularProgress, List, ListItem, ListItemText, ListItemIcon, Paper } from '@mui/material';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';

interface ProcessedFile {
  id: string;
  name: string;
  chunkCount: number;
  status: 'processing' | 'done';
}

export function FileUploader() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const workerRef = useRef<Worker | null>(null);
  const [files, setFiles] = useState<ProcessedFile[]>([]);

  useEffect(() => {
    // Initialize the background Web Worker
    workerRef.current = new Worker(new URL('../workers/documentWorker.ts', import.meta.url), { type: 'module' });

    workerRef.current.onmessage = (e) => {
      if (e.data.type === 'DOCUMENT_PROCESSED') {
        const { documentId, chunkCount } = e.data.payload;
        setFiles(prev => prev.map(f => f.id === documentId ? { ...f, status: 'done', chunkCount } : f));
      }
    };

    return () => {
      workerRef.current?.terminate();
    };
  }, []);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = event.target.files;
    if (!selectedFiles || selectedFiles.length === 0) return;

    for (let i = 0; i < selectedFiles.length; i++) {
      const file = selectedFiles[i];
      const documentId = Math.random().toString(36).substring(7);
      
      setFiles(prev => [...prev, { id: documentId, name: file.name, chunkCount: 0, status: 'processing' }]);

      // Read file as ArrayBuffer for zero-copy Transferable Object handoff
      const arrayBuffer = await file.arrayBuffer();

      workerRef.current?.postMessage({
        type: 'PROCESS_DOCUMENT',
        payload: {
          fileBuffer: arrayBuffer,
          fileName: file.name,
          fileType: file.type,
          documentId
        }
      }, [arrayBuffer]); 
    }
    
    // Reset file input
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <Paper sx={{ p: 2, bgcolor: 'rgba(15, 23, 42, 0.4)', backdropFilter: 'blur(10px)', border: '1px solid rgba(255,255,255,0.1)', height: '100%', display: 'flex', flexDirection: 'column' }} elevation={0}>
      <Typography variant="h6" color="text.primary" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1, fontWeight: 'bold' }}>
        <UploadFileIcon /> Knowledge Base
      </Typography>
      
      <Button 
        variant="outlined" 
        component="label" 
        fullWidth 
        sx={{ mb: 2, borderStyle: 'dashed', borderWidth: 2, color: 'primary.light', borderColor: 'primary.main', bgcolor: 'rgba(99, 102, 241, 0.05)' }}
      >
        Upload Documents
        <input ref={fileInputRef} type="file" hidden multiple onChange={handleFileUpload} accept=".pdf,.md,.txt,.docx,.csv,.json" />
      </Button>

      <Box sx={{ flexGrow: 1, overflowY: 'auto' }}>
        <List dense>
          {files.map(f => (
            <ListItem key={f.id} sx={{ bgcolor: 'rgba(255,255,255,0.03)', borderRadius: 2, mb: 1, border: '1px solid rgba(255,255,255,0.05)' }}>
              <ListItemIcon sx={{ minWidth: 36 }}>
                {f.status === 'processing' ? <CircularProgress size={16} sx={{ color: 'primary.light' }} /> : <CheckCircleIcon color="secondary" fontSize="small" />}
              </ListItemIcon>
              <ListItemText 
                primary={f.name} 
                secondary={f.status === 'done' ? `${f.chunkCount.toLocaleString()} chunks indexed` : 'Processing deeply...'} 
                primaryTypographyProps={{ color: 'text.primary', noWrap: true, variant: 'body2', fontWeight: 600 }}
                secondaryTypographyProps={{ color: f.status === 'done' ? 'secondary.main' : 'text.secondary', variant: 'caption' }}
              />
            </ListItem>
          ))}
        </List>
      </Box>
    </Paper>
  );
}
