import React, { useState, useReducer, useRef, useEffect } from 'react';
import { Box, Container, Typography, TextField, Button, Paper, Avatar, CircularProgress, Switch } from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import SmartToyIcon from '@mui/icons-material/SmartToy';
import PersonIcon from '@mui/icons-material/Person';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import type { AgentEvent, MessagePart } from '../types/agent';
import { ComparisonTable } from './ComparisonTable';
import { Chart } from './Chart';
import { DocumentViewer } from './DocumentViewer';
import { ToolCall } from './ToolCall';
import { CitationCard } from './CitationCard';
import { ResearchWorkflow } from './ResearchWorkflow';
import DescriptionIcon from '@mui/icons-material/Description';

interface Message {
  role: 'user' | 'agent';
  content?: string; 
  parts?: MessagePart[]; 
}

interface ChatState {
  messages: Message[];
  error: string | null;
  isLoading: boolean;
}

const initialState: ChatState = {
  messages: [],
  error: null,
  isLoading: false,
};

type ChatAction =
  | { type: 'ADD_USER_MESSAGE'; payload: string }
  | { type: 'START_AGENT_MESSAGE' }
  | { type: 'PROCESS_AGENT_EVENT'; event: AgentEvent }
  | { type: 'SET_ERROR'; payload: string }
  | { type: 'SET_LOADING'; payload: boolean };

function assertNever(x: never): never {
  throw new Error("Unexpected event type: " + JSON.stringify(x));
}

function chatReducer(state: ChatState, action: ChatAction): ChatState {
  switch (action.type) {
    case 'ADD_USER_MESSAGE':
      return { ...state, messages: [...state.messages, { role: 'user', content: action.payload }], error: null };
    case 'START_AGENT_MESSAGE':
      return { ...state, messages: [...state.messages, { role: 'agent', parts: [] }] };
    case 'PROCESS_AGENT_EVENT': {
      const event = action.event;
      const newMessages = [...state.messages];
      const lastMsg = newMessages[newMessages.length - 1];
      if (!lastMsg || lastMsg.role !== 'agent' || !lastMsg.parts) return state;

      const newParts = [...lastMsg.parts];
      
      switch (event.type) {
        case 'text_delta': {
          const lastPart = newParts[newParts.length - 1];
          if (lastPart && lastPart.partType === 'text') {
            newParts[newParts.length - 1] = { ...lastPart, text: lastPart.text + event.delta };
          } else {
            newParts.push({ partType: 'text', text: event.delta });
          }
          break;
        }
        case 'tool_started':
          newParts.push({ partType: 'tool_call', toolName: event.toolName, input: event.toolInput, status: 'pending' });
          break;
        case 'tool_completed':
          for (let i = newParts.length - 1; i >= 0; i--) {
            const p = newParts[i];
            if (p.partType === 'tool_call' && p.toolName === event.toolName && p.status === 'pending') {
              newParts[i] = { ...p, status: 'completed', result: event.result };
              break;
            }
          }
          break;
        case 'citation':
          newParts.push({ partType: 'citation', url: event.url, title: event.title });
          break;
        case 'artifact':
          newParts.push({ partType: 'artifact', title: event.title, content: event.content });
          break;
        case 'comparison_table':
          newParts.push({ partType: 'table', headers: event.headers, rows: event.rows });
          break;
        case 'chart':
          newParts.push({ partType: 'chart', chartType: event.chartType, data: event.data });
          break;
        case 'document_viewer':
          newParts.push({ partType: 'document_viewer', title: event.title, content: event.content });
          break;
        case 'workflow_started':
          newParts.push({ partType: 'research_workflow', taskId: (event as any).taskId });
          break;
        case 'error':
          return { ...state, error: event.message, isLoading: false };
        default:
          // Ignore unknown events gracefully instead of crashing
          break;
      }
      
      newMessages[newMessages.length - 1] = { ...lastMsg, parts: newParts };
      return { ...state, messages: newMessages };
    }
    case 'SET_ERROR':
      return { ...state, error: action.payload, isLoading: false };
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
    default:
      return state;
  }
}

export function Chat({ onOpenDocument, onOpenCitation }: { 
  onOpenDocument?: (doc: { title: string; content: string }) => void,
  onOpenCitation?: (title: string, url: string, line: number) => void 
}) {
  const [state, dispatch] = useReducer(chatReducer, initialState);
  const [inputValue, setInputValue] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [state.messages]);

  const [isDeepResearch, setIsDeepResearch] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim()) return;

    const currentInput = inputValue;
    setInputValue('');
    dispatch({ type: 'ADD_USER_MESSAGE', payload: currentInput });
    dispatch({ type: 'START_AGENT_MESSAGE' });
    dispatch({ type: 'SET_LOADING', payload: true });

    try {
      if (isDeepResearch) {
        // Deep Research Mode
        const res = await fetch('http://localhost:8000/api/v1/chat/research/start', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ message: currentInput }),
        });
        const data = await res.json();
        dispatch({ 
          type: 'PROCESS_AGENT_EVENT', 
          event: { type: 'text_delta', delta: "I've started an autonomous research workflow for you. You can monitor the progress below.\n\n" } as AgentEvent 
        });
        // Push the workflow component!
        dispatch({ 
          type: 'PROCESS_AGENT_EVENT', 
          // Injecting a raw part indirectly by faking an event or we can just append it if we have a custom event.
          // Since our reducer doesn't have an event for pushing custom parts easily, we can add a dummy event or update the reducer.
          // Let's add a pseudo-event 'workflow_started' to the reducer
          event: { type: 'workflow_started', taskId: data.task_id } as unknown as AgentEvent
        });
      } else {
        // Normal Stream
        const response = await fetch('http://localhost:8000/api/v1/chat/stream', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ message: currentInput }),
        });

        if (!response.body) throw new Error('ReadableStream not supported');
        const reader = response.body.pipeThrough(new TextDecoderStream()).getReader();

        let isDone = false;
        while (!isDone) {
          const { value, done } = await reader.read();
          isDone = done;
          if (value) {
            const lines = value.split('\n');
            for (const line of lines) {
              if (line.startsWith('data: ')) {
                const dataStr = line.substring(6);
                try {
                   const parsed = JSON.parse(dataStr) as AgentEvent;
                   dispatch({ type: 'PROCESS_AGENT_EVENT', event: parsed });
                } catch {
                   dispatch({ type: 'PROCESS_AGENT_EVENT', event: { type: 'text_delta', delta: dataStr } as AgentEvent });
                }
              }
            }
          }
        }
      }
    } catch (err: any) {
      dispatch({ type: 'SET_ERROR', payload: err.message });
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  const renderPart = (part: MessagePart, idx: number) => {
    switch (part.partType) {
      case 'text':
        return <Typography key={idx} variant="body1" component="span" sx={{ whiteSpace: 'pre-wrap', lineHeight: 1.8, color: 'text.primary', letterSpacing: '0.01em' }}>{part.text}</Typography>;
      case 'citation':
        return <CitationCard key={idx} title={part.title} url={part.url} onOpenCitation={onOpenCitation} />;
      
      // Block-level elements
      case 'research_workflow':
        return <Box key={idx} sx={{ display: 'block', width: '100%', my: 2 }}><ResearchWorkflow taskId={part.taskId} /></Box>;
      case 'tool_call':
        return <Box key={idx} sx={{ display: 'block', width: '100%', my: 1.5 }}><ToolCall toolName={part.toolName} status={part.status as 'pending' | 'completed'} result={part.result} /></Box>;
      case 'table':
        return <Box key={idx} sx={{ display: 'block', width: '100%', my: 2 }}><ComparisonTable headers={part.headers} rows={part.rows} /></Box>;
      case 'chart':
        return <Box key={idx} sx={{ display: 'block', width: '100%', my: 2 }}><Chart chartType={part.chartType} data={part.data} /></Box>;
      case 'document_viewer':
        return (
          <Box key={idx} sx={{ display: 'block', width: '100%', my: 1.5 }}>
            <Paper sx={{ 
              p: 2, 
              background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.1) 0%, rgba(99, 102, 241, 0.02) 100%)', 
              border: '1px solid rgba(99, 102, 241, 0.2)', 
              display: 'flex', justifyContent: 'space-between', alignItems: 'center', 
              borderRadius: '16px',
              transition: 'all 0.2s',
              '&:hover': { borderColor: 'primary.main', boxShadow: '0 4px 12px rgba(99,102,241,0.1)' }
            }} elevation={0}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, color: 'primary.light' }}>
                <DescriptionIcon />
                <Typography variant="subtitle2" fontWeight="700">{part.title}</Typography>
              </Box>
              <Button variant="outlined" size="small" onClick={() => onOpenDocument?.({ title: part.title, content: part.content })}>
                 Open Viewer
              </Button>
            </Paper>
          </Box>
        );
      default:
        return null;
    }
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', position: 'relative' }}>
      
      {/* Premium Gradient Header */}
      <Box sx={{ 
        p: 2, 
        px: 4,
        background: 'linear-gradient(180deg, rgba(7, 11, 20, 0.9) 0%, rgba(7, 11, 20, 0.4) 100%)',
        backdropFilter: 'blur(12px)',
        borderBottom: '1px solid rgba(255,255,255,0.05)',
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between',
        position: 'absolute',
        top: 0, left: 0, right: 0,
        zIndex: 10
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Box sx={{ 
            width: 36, height: 36, borderRadius: '12px', 
            background: 'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)', 
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 4px 12px rgba(99, 102, 241, 0.4)'
          }}>
            <AutoAwesomeIcon sx={{ color: '#fff', fontSize: 20 }} />
          </Box>
          <Typography variant="h6" sx={{ fontWeight: 700, background: 'linear-gradient(90deg, #fff, #94a3b8)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            AgentDesk AI
          </Typography>
        </Box>
      </Box>

      {/* Messages Viewport */}
      <Box sx={{ flexGrow: 1, overflowY: 'auto', p: 4, pt: 12, pb: 16, display: 'flex', flexDirection: 'column', gap: 3 }}>
        {state.messages.length === 0 && (
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'text.secondary', opacity: 0.6, gap: 2 }}>
            <AutoAwesomeIcon sx={{ fontSize: 64, mb: 1, color: 'primary.main' }} />
            <Typography variant="h5" fontWeight="600">How can I assist you today?</Typography>
            <Typography variant="body1">Upload a document on the left, or ask a question below.</Typography>
          </Box>
        )}

        {state.messages.map((msg, index) => (
          <Box 
            key={index} 
            sx={{ 
              display: 'flex', 
              flexDirection: 'column',
              alignItems: msg.role === 'user' ? 'flex-end' : 'flex-start',
            }}
          >
            <Box sx={{ 
              display: 'flex', 
              alignItems: 'flex-start',
              gap: 2,
              maxWidth: '85%',
              flexDirection: msg.role === 'user' ? 'row-reverse' : 'row'
            }}>
              {/* Avatar */}
              <Box sx={{ 
                width: 32, height: 32, borderRadius: '50%', flexShrink: 0, mt: 1,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                bgcolor: msg.role === 'user' ? 'rgba(255,255,255,0.1)' : 'rgba(99,102,241,0.15)',
                border: msg.role === 'agent' ? '1px solid rgba(99,102,241,0.3)' : '1px solid transparent',
              }}>
                {msg.role === 'user' ? <PersonIcon fontSize="small" /> : <AutoAwesomeIcon fontSize="small" sx={{ color: 'primary.light' }} />}
              </Box>

              {/* Bubble Content */}
              <Paper 
                elevation={0}
                sx={{
                  p: 2.5,
                  borderRadius: msg.role === 'user' ? '24px 24px 4px 24px' : '24px 24px 24px 4px',
                  background: msg.role === 'user' 
                    ? 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)'
                    : 'rgba(15, 23, 42, 0.6)',
                  border: msg.role === 'user' ? 'none' : '1px solid rgba(255,255,255,0.05)',
                  boxShadow: msg.role === 'user' 
                    ? '0 8px 24px rgba(99, 102, 241, 0.25)' 
                    : '0 8px 32px rgba(0, 0, 0, 0.15)',
                  color: msg.role === 'user' ? '#fff' : 'text.primary',
                }}
              >
                {msg.content && <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap', lineHeight: 1.8 }}>{msg.content}</Typography>}
                {msg.parts && msg.parts.length > 0 && (
                  <Box sx={{ mt: msg.content ? 1.5 : 0 }}>
                    {msg.parts.map((part, idx) => renderPart(part, idx))}
                  </Box>
                )}
              </Paper>
            </Box>
          </Box>
        ))}

        {state.isLoading && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, ml: 6 }}>
            <CircularProgress size={20} sx={{ color: 'primary.main' }} />
            <Typography variant="body2" sx={{ color: 'text.secondary', fontStyle: 'italic' }}>Agent is thinking...</Typography>
          </Box>
        )}
        <div ref={messagesEndRef} />
      </Box>

      {/* Floating Input Area */}
      <Box 
        component="form" 
        onSubmit={handleSubmit}
        sx={{ 
          position: 'absolute',
          bottom: 24,
          left: '50%',
          transform: 'translateX(-50%)',
          width: '80%',
          maxWidth: 900,
          display: 'flex', 
          flexDirection: 'column',
          gap: 1.5,
          p: 1.5,
          bgcolor: 'rgba(15, 23, 42, 0.85)',
          backdropFilter: 'blur(24px)',
          borderRadius: '28px',
          border: '1px solid rgba(255,255,255,0.1)',
          boxShadow: '0 16px 40px rgba(0,0,0,0.4)',
          zIndex: 10
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', px: 2, pt: 1, gap: 2 }}>
          <Typography variant="caption" sx={{ color: isDeepResearch ? 'primary.light' : 'text.secondary', fontWeight: isDeepResearch ? 'bold' : 'normal', transition: 'all 0.2s' }}>
            Deep Research Mode
          </Typography>
          <Switch 
            size="small" 
            checked={isDeepResearch} 
            onChange={(e) => setIsDeepResearch(e.target.checked)} 
            color="primary"
          />
        </Box>
        <Box sx={{ display: 'flex', gap: 1.5 }}>
          <TextField
            fullWidth
            variant="outlined"
            placeholder="Ask anything or request a document summary..."
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            disabled={state.isLoading}
            sx={{
              '& .MuiOutlinedInput-root': {
                bgcolor: 'transparent',
                backdropFilter: 'none',
                '& fieldset': { border: 'none' },
                '&.Mui-focused fieldset': { border: 'none', boxShadow: 'none' },
              }
            }}
          />
          <Button 
            type="submit" 
            variant="contained" 
            disabled={state.isLoading || !inputValue.trim()}
            sx={{ 
              borderRadius: '20px', 
              minWidth: 56, 
              height: 56,
              p: 0,
              background: 'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)',
              '&:hover': { background: 'linear-gradient(135deg, #4f46e5 0%, #9333ea 100%)' }
            }}
          >
            <SendIcon />
          </Button>
        </Box>
      </Box>
    </Box>
  );
}
