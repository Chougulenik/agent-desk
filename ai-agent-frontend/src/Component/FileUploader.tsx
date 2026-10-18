import React, { useRef, useState, useEffect } from 'react';
import {
  Box,
  Button,
  Typography,
  CircularProgress,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Paper,
  LinearProgress,
  Chip,
  IconButton,
  Tooltip,
  Alert,
} from '@mui/material';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';
import HourglassEmptyIcon from '@mui/icons-material/HourglassEmpty';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import DescriptionIcon from '@mui/icons-material/Description';
import TableChartIcon from '@mui/icons-material/TableChart';
import DataObjectIcon from '@mui/icons-material/DataObject';
import RefreshIcon from '@mui/icons-material/Refresh';

export type IngestionStatus = 'uploading' | 'pending' | 'processing' | 'completed' | 'failed';

export interface UploadedDocument {
  id: string; // upload_id
  name: string;
  fileType: string;
  sizeBytes: number;
  status: IngestionStatus;
  progress: number;
  chunkCount?: number;
  extractedChars?: number;
  errorMessage?: string;
  createdAt: string;
}

const API_BASE_URL = 'http://localhost:8000';

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

function getFileIcon(fileType: string) {
  const type = fileType.toLowerCase().replace('.', '');
  switch (type) {
    case 'pdf':
      return <PictureAsPdfIcon fontSize="small" sx={{ color: '#ef4444' }} />;
    case 'csv':
      return <TableChartIcon fontSize="small" sx={{ color: '#10b981' }} />;
    case 'json':
      return <DataObjectIcon fontSize="small" sx={{ color: '#f59e0b' }} />;
    case 'md':
    case 'markdown':
    case 'txt':
    case 'docx':
    default:
      return <DescriptionIcon fontSize="small" sx={{ color: '#6366f1' }} />;
  }
}

export function FileUploader() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [documents, setDocuments] = useState<UploadedDocument[]>([]);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Active polling intervals mapped by upload_id
  const activePollers = useRef<Map<string, number>>(new Map());

  // Cleanup polling intervals on unmount
  useEffect(() => {
    return () => {
      activePollers.current.forEach((intervalId) => window.clearInterval(intervalId));
      activePollers.current.clear();
    };
  }, []);

  // Poll status endpoint for a specific upload_id
  const startStatusPolling = (uploadId: string) => {
    if (activePollers.current.has(uploadId)) return;

    const intervalId = window.setInterval(async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/upload/${uploadId}/status`);
        if (!response.ok) {
          // Fallback to /api/v1/upload/{upload_id}/status if direct /upload is rerouted
          const fallback = await fetch(`${API_BASE_URL}/api/v1/upload/${uploadId}/status`);
          if (!fallback.ok) return;
          const data = await fallback.json();
          handleStatusUpdate(uploadId, data);
          return;
        }

        const data = await response.json();
        handleStatusUpdate(uploadId, data);
      } catch (err) {
        console.warn(`Polling error for upload ${uploadId}:`, err);
      }
    }, 800);

    activePollers.current.set(uploadId, intervalId);
  };

  const handleStatusUpdate = (uploadId: string, data: any) => {
    const { status, progress, chunks_count, extracted_chars, error } = data;

    setDocuments((prev) =>
      prev.map((doc) => {
        if (doc.id !== uploadId) return doc;

        return {
          ...doc,
          status: status as IngestionStatus,
          progress: progress ?? (status === 'completed' ? 100 : doc.progress),
          chunkCount: chunks_count ?? doc.chunkCount,
          extractedChars: extracted_chars ?? doc.extractedChars,
          errorMessage: error ?? doc.errorMessage,
        };
      })
    );

    // Stop polling if completed or failed
    if (status === 'completed' || status === 'failed') {
      const intervalId = activePollers.current.get(uploadId);
      if (intervalId) {
        window.clearInterval(intervalId);
        activePollers.current.delete(uploadId);
      }
    }
  };

  const uploadFileToBackend = async (file: File) => {
    const tempId = `temp_${Date.now()}_${Math.random().toString(36).substring(7)}`;
    const ext = file.name.split('.').pop()?.toLowerCase() || 'txt';

    const tempDoc: UploadedDocument = {
      id: tempId,
      name: file.name,
      fileType: ext,
      sizeBytes: file.size,
      status: 'uploading',
      progress: 5,
      createdAt: new Date().toLocaleTimeString(),
    };

    setDocuments((prev) => [tempDoc, ...prev]);

    const formData = new FormData();
    formData.append('file', file);

    try {
      // POST /upload (with fallback to /api/v1/upload)
      let response = await fetch(`${API_BASE_URL}/upload`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok && response.status === 404) {
        response = await fetch(`${API_BASE_URL}/api/v1/upload`, {
          method: 'POST',
          body: formData,
        });
      }

      if (!response.ok) {
        const errorDetail = await response.json().catch(() => ({ detail: response.statusText }));
        throw new Error(errorDetail.detail || `Upload failed with HTTP ${response.status}`);
      }

      const uploadResult = await response.json();
      const realUploadId = uploadResult.upload_id;

      // Update state with server tracking upload_id
      setDocuments((prev) =>
        prev.map((d) =>
          d.id === tempId
            ? {
              ...d,
              id: realUploadId,
              status: (uploadResult.status as IngestionStatus) || 'pending',
              progress: 10,
            }
            : d
        )
      );

      // Start background status polling
      startStatusPolling(realUploadId);
    } catch (err: any) {
      console.error('File upload failed:', err);
      setDocuments((prev) =>
        prev.map((d) =>
          d.id === tempId
            ? {
              ...d,
              status: 'failed',
              progress: 0,
              errorMessage: err.message || 'Network upload error',
            }
            : d
        )
      );
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = event.target.files;
    if (!selectedFiles || selectedFiles.length === 0) return;

    setErrorMessage(null);
    setIsUploading(true);

    const uploads = Array.from(selectedFiles).map((file) => uploadFileToBackend(file));
    await Promise.allSettled(uploads);

    setIsUploading(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <Paper
      sx={{
        p: 2,
        bgcolor: 'rgba(15, 23, 42, 0.5)',
        backdropFilter: 'blur(16px)',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        borderRadius: 2,
      }}
      elevation={0}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.5 }}>
        <Typography
          variant="h6"
          color="text.primary"
          sx={{ display: 'flex', alignItems: 'center', gap: 1, fontWeight: 700, fontSize: '1rem' }}
        >
          <UploadFileIcon sx={{ color: 'primary.light' }} /> Ingestion Pipeline
        </Typography>
        <Chip
          label="Multi-Format"
          size="small"
          sx={{
            fontSize: '0.65rem',
            bgcolor: 'rgba(99, 102, 241, 0.15)',
            color: 'primary.light',
            border: '1px solid rgba(99, 102, 241, 0.3)',
          }}
        />
      </Box>

      {errorMessage && (
        <Alert severity="error" sx={{ mb: 1.5, py: 0.5, fontSize: '0.75rem' }} onClose={() => setErrorMessage(null)}>
          {errorMessage}
        </Alert>
      )}

      {/* Upload action area */}
      <Button
        variant="outlined"
        component="label"
        fullWidth
        disabled={isUploading}
        sx={{
          mb: 2,
          py: 1.2,
          borderStyle: 'dashed',
          borderWidth: 2,
          color: 'primary.light',
          borderColor: 'rgba(99, 102, 241, 0.5)',
          bgcolor: 'rgba(99, 102, 241, 0.05)',
          '&:hover': {
            borderColor: 'primary.main',
            bgcolor: 'rgba(99, 102, 241, 0.12)',
          },
          textTransform: 'none',
          fontWeight: 600,
        }}
      >
        {isUploading ? (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <CircularProgress size={16} sx={{ color: 'primary.light' }} />
            <span>Streaming to Server...</span>
          </Box>
        ) : (
          'Upload Documents (Up to 50MB+)'
        )}
        <input
          ref={fileInputRef}
          type="file"
          hidden
          multiple
          onChange={handleFileUpload}
          accept=".pdf,.md,.txt,.docx,.csv,.json"
        />
      </Button>

      <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mb: 1.5, px: 0.5 }}>
        Supported: <strong>PDF, MD, TXT, DOCX, CSV, JSON</strong>
      </Typography>

      {/* Documents queue and status */}
      <Box sx={{ flexGrow: 1, overflowY: 'auto', pr: 0.5 }}>
        {documents.length === 0 ? (
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              py: 5,
              opacity: 0.5,
              textAlign: 'center',
            }}
          >
            <UploadFileIcon sx={{ fontSize: 40, mb: 1 }} />
            <Typography variant="body2" color="text.secondary">
              No files uploaded yet.
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Drop a 50MB PDF or dataset to test ingestion.
            </Typography>
          </Box>
        ) : (
          <List dense disablePadding>
            {documents.map((doc) => (
              <ListItem
                key={doc.id}
                sx={{
                  bgcolor: 'rgba(255, 255, 255, 0.03)',
                  borderRadius: 2,
                  mb: 1.2,
                  p: 1.2,
                  border: '1px solid rgba(255, 255, 255, 0.06)',
                  flexDirection: 'column',
                  alignItems: 'flex-start',
                }}
              >
                <Box sx={{ display: 'flex', width: '100%', alignItems: 'center', mb: 0.8 }}>
                  <ListItemIcon sx={{ minWidth: 28 }}>{getFileIcon(doc.fileType)}</ListItemIcon>
                  <ListItemText
                    primary={doc.name}
                    secondary={`${formatBytes(doc.sizeBytes)} • ${doc.fileType.toUpperCase()}`}
                    primaryTypographyProps={{
                      color: 'text.primary',
                      noWrap: true,
                      variant: 'body2',
                      fontWeight: 600,
                    }}
                    secondaryTypographyProps={{
                      color: 'text.secondary',
                      variant: 'caption',
                    }}
                  />
                  <Box sx={{ ml: 'auto', display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    {doc.status === 'uploading' && (
                      <Chip
                        size="small"
                        icon={<CircularProgress size={12} sx={{ color: 'info.main' }} />}
                        label="Uploading"
                        sx={{ fontSize: '0.65rem', height: 20 }}
                      />
                    )}
                    {doc.status === 'pending' && (
                      <Chip
                        size="small"
                        icon={<HourglassEmptyIcon sx={{ fontSize: '12px !important' }} />}
                        label="Queued"
                        color="warning"
                        variant="outlined"
                        sx={{ fontSize: '0.65rem', height: 20 }}
                      />
                    )}
                    {doc.status === 'processing' && (
                      <Chip
                        size="small"
                        icon={<CircularProgress size={12} sx={{ color: 'primary.light' }} />}
                        label={`${Math.round(doc.progress)}%`}
                        color="primary"
                        sx={{ fontSize: '0.65rem', height: 20 }}
                      />
                    )}
                    {doc.status === 'completed' && (
                      <Chip
                        size="small"
                        icon={<CheckCircleIcon sx={{ fontSize: '12px !important' }} />}
                        label="Indexed"
                        color="success"
                        sx={{ fontSize: '0.65rem', height: 20 }}
                      />
                    )}
                    {doc.status === 'failed' && (
                      <Tooltip title={doc.errorMessage || 'Processing failed'}>
                        <Chip
                          size="small"
                          icon={<ErrorIcon sx={{ fontSize: '12px !important' }} />}
                          label="Failed"
                          color="error"
                          sx={{ fontSize: '0.65rem', height: 20 }}
                        />
                      </Tooltip>
                    )}
                  </Box>
                </Box>

                {/* Progress bar for ongoing states */}
                {(doc.status === 'uploading' || doc.status === 'pending' || doc.status === 'processing') && (
                  <Box sx={{ width: '100%', mt: 0.5 }}>
                    <LinearProgress
                      variant={doc.status === 'processing' ? 'determinate' : 'indeterminate'}
                      value={doc.progress}
                      sx={{
                        height: 4,
                        borderRadius: 2,
                        bgcolor: 'rgba(255, 255, 255, 0.08)',
                        '& .MuiLinearProgress-bar': {
                          bgcolor: doc.status === 'processing' ? 'primary.main' : 'info.main',
                        },
                      }}
                    />
                  </Box>
                )}

                {/* Details upon completion */}
                {doc.status === 'completed' && doc.chunkCount !== undefined && (
                  <Box
                    sx={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      width: '100%',
                      mt: 0.5,
                      pt: 0.5,
                      borderTop: '1px solid rgba(255, 255, 255, 0.04)',
                    }}
                  >
                    <Typography variant="caption" sx={{ color: 'secondary.main', fontWeight: 600 }}>
                      ✓ {doc.chunkCount.toLocaleString()} chunks ready
                    </Typography>
                    <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '0.65rem' }}>
                      ID: {doc.id.substring(0, 8)}...
                    </Typography>
                  </Box>
                )}

                {/* Details on failure */}
                {doc.status === 'failed' && (
                  <Typography variant="caption" sx={{ color: 'error.main', mt: 0.5, fontSize: '0.7rem' }}>
                    {doc.errorMessage || 'Ingestion encountered an error.'}
                  </Typography>
                )}
              </ListItem>
            ))}
          </List>
        )}
      </Box>
    </Paper>
  );
}
