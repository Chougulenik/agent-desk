import React, { useState, useEffect, useRef } from 'react';
import { Box, Typography, Button, Paper, Stepper, Step, StepLabel, CircularProgress } from '@mui/material';
import PauseIcon from '@mui/icons-material/Pause';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import CancelIcon from '@mui/icons-material/Cancel';
import type { AgentEvent } from '../types/agent';

const steps = ["PLANNING", "SEARCHING", "READING", "ANALYZING", "WRITING", "REVIEWING", "COMPLETE"];

interface Props {
  taskId: string;
}

export function ResearchWorkflow({ taskId }: Props) {
  const [activeStep, setActiveStep] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [isCancelled, setIsCancelled] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [logs, setLogs] = useState<string[]>([]);
  const abortControllerRef = useRef<AbortController | null>(null);

  const connectStream = () => {
    if (abortControllerRef.current) abortControllerRef.current.abort();
    abortControllerRef.current = new AbortController();

    const streamResearch = async () => {
      try {
        const res = await fetch(`http://localhost:8000/api/v1/chat/research/stream/${taskId}`, {
          signal: abortControllerRef.current?.signal,
        });

        if (!res.body) return;
        const reader = res.body.pipeThrough(new TextDecoderStream()).getReader();

        let buffer = '';
        while (true) {
          const { value, done } = await reader.read();
          if (done) break;

          if (value) {
            buffer += value;
            const lines = buffer.split('\n');
            buffer = lines.pop() || ''; // Keep the incomplete line in buffer

            for (const line of lines) {
              if (line.startsWith('data: ')) {
                const dataStr = line.substring(6);
                try {
                  const event = JSON.parse(dataStr) as AgentEvent;
                  handleEvent(event);
                } catch (e) {
                  // Fallback
                }
              }
            }
          }
        }
      } catch (err: any) {
        if (err.name === 'AbortError') {
          console.log('Research stream aborted (paused)');
        } else {
          setError(err.message);
        }
      }
    };

    streamResearch();
  };

  useEffect(() => {
    connectStream();
    return () => {
      abortControllerRef.current?.abort();
    };
  }, [taskId]);

  const handleEvent = (event: AgentEvent) => {
    if (event.type === 'status_update') {
      const idx = steps.indexOf(event.status);
      if (idx !== -1) setActiveStep(idx);
      setLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] ${event.message}`]);
    } else if (event.type === 'error') {
      setError(event.message);
    } else if (event.type === 'tool_started') {
       setLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] Starting: ${event.toolName}`]);
    } else if (event.type === 'text_delta') {
       setLogs(prev => [...prev, event.delta]);
    }
  };

  const handlePause = async () => {
    await fetch(`http://localhost:8000/api/v1/chat/research/pause/${taskId}`, { method: 'POST' });
    setIsPaused(true);
    abortControllerRef.current?.abort(); // Drop connection when paused
  };

  const handleResume = async () => {
    await fetch(`http://localhost:8000/api/v1/chat/research/resume/${taskId}`, { method: 'POST' });
    setIsPaused(false);
    connectStream(); // Reconnect!
  };

  const handleCancel = async () => {
    await fetch(`http://localhost:8000/api/v1/chat/research/cancel/${taskId}`, { method: 'POST' });
    setIsCancelled(true);
    abortControllerRef.current?.abort();
  };

  return (
    <Paper sx={{ 
      p: 3, my: 2, 
      bgcolor: 'rgba(15, 23, 42, 0.7)', 
      backdropFilter: 'blur(16px)', 
      borderRadius: '24px', 
      border: '1px solid rgba(255,255,255,0.05)',
      width: '100%',
      maxWidth: 800
    }} elevation={0}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h6" color="primary.light" fontWeight="bold">
          Autonomous Research Workflow
        </Typography>
        <Box sx={{ display: 'flex', gap: 1 }}>
          {!isCancelled && activeStep < steps.length - 1 && (
            <>
              {isPaused ? (
                <Button variant="contained" size="small" color="success" onClick={handleResume} startIcon={<PlayArrowIcon />}>
                  Resume
                </Button>
              ) : (
                <Button variant="outlined" size="small" color="warning" onClick={handlePause} startIcon={<PauseIcon />}>
                  Pause
                </Button>
              )}
              <Button variant="outlined" size="small" color="error" onClick={handleCancel} startIcon={<CancelIcon />}>
                Cancel
              </Button>
            </>
          )}
        </Box>
      </Box>

      {error ? (
        <Typography color="error" sx={{ mb: 2 }}>{error}</Typography>
      ) : (
        <Stepper activeStep={activeStep} alternativeLabel sx={{ mb: 4, '& .MuiStepLabel-label': { color: 'text.secondary', mt: 1 }, '& .MuiStepLabel-label.Mui-active': { color: 'primary.light', fontWeight: 'bold' } }}>
          {steps.map((label, index) => (
            <Step key={label}>
              <StepLabel 
                icon={
                  <Box sx={{ 
                    width: 24, height: 24, borderRadius: '50%', 
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    bgcolor: index < activeStep ? 'primary.main' : index === activeStep ? 'transparent' : 'rgba(255,255,255,0.1)',
                    border: index === activeStep ? '2px solid' : 'none',
                    borderColor: 'primary.light',
                    color: index < activeStep ? '#fff' : 'text.secondary'
                  }}>
                    {index === activeStep && !isPaused && !isCancelled ? <CircularProgress size={16} thickness={5} sx={{ color: 'primary.light' }} /> : index + 1}
                  </Box>
                }
              >
                {label}
              </StepLabel>
            </Step>
          ))}
        </Stepper>
      )}

      <Box sx={{ 
        bgcolor: '#000', 
        p: 2, 
        borderRadius: '16px', 
        height: 150, 
        overflowY: 'auto', 
        fontFamily: 'monospace', 
        fontSize: '0.8rem',
        color: 'secondary.light',
        boxShadow: 'inset 0 2px 10px rgba(0,0,0,0.5)'
      }}>
        {logs.length === 0 && <Typography variant="body2" sx={{ opacity: 0.5 }}>Initializing autonomous agent...</Typography>}
        {logs.map((log, i) => (
          <Box key={i} sx={{ mb: 0.5 }}>{log}</Box>
        ))}
        {isPaused && <Box sx={{ color: 'warning.main', mt: 1 }}>[WORKFLOW PAUSED]</Box>}
        {isCancelled && <Box sx={{ color: 'error.main', mt: 1 }}>[WORKFLOW CANCELLED]</Box>}
      </Box>
    </Paper>
  );
}
