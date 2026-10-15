import React from 'react';
import { Box, Paper, Typography, CircularProgress, Collapse } from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';

interface Props {
  toolName: string;
  status: 'pending' | 'completed';
  result?: string;
}

export function ToolCall({ toolName, status, result }: Props) {
  const isPending = status === 'pending';

  // Format dynamic action text based on the tool being used
  let actionText = `Executing ${toolName}...`;
  if (toolName.includes('search') || toolName.includes('analyze')) {
    actionText = isPending ? 'Searching knowledge base...' : 'Knowledge retrieved';
  } else if (toolName.includes('compare')) {
    actionText = isPending ? 'Comparing architectures...' : 'Comparison completed';
  } else if (toolName.includes('query')) {
    actionText = isPending ? 'Querying vector database...' : 'Vector search completed';
  }

  return (
    <Paper 
      sx={{ 
        p: 2, 
        my: 1.5, 
        bgcolor: isPending ? 'rgba(99, 102, 241, 0.08)' : 'rgba(16, 185, 129, 0.05)', 
        borderLeft: '4px solid', 
        borderColor: isPending ? 'primary.main' : 'secondary.main',
        borderRadius: 2,
        transition: 'all 0.4s ease-in-out',
        width: 'fit-content',
        minWidth: '280px'
      }} 
      elevation={0}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
        {isPending ? (
          <CircularProgress size={22} sx={{ color: 'primary.main' }} />
        ) : (
          <CheckCircleIcon sx={{ color: 'secondary.main', fontSize: 26 }} />
        )}
        <Box sx={{ flexGrow: 1 }}>
          <Typography variant="body2" sx={{ fontWeight: 700, color: 'text.primary', display: 'flex', alignItems: 'center', gap: 1 }}>
            {isPending && <AutoAwesomeIcon fontSize="small" sx={{ color: 'primary.light' }} />}
            {actionText}
          </Typography>
          
          {/* Smoothly expand the result once completed */}
          <Collapse in={!isPending && !!result} timeout="auto">
             <Typography variant="caption" sx={{ color: 'secondary.main', display: 'block', mt: 0.5, fontWeight: 600 }}>
               ✓ {result}
             </Typography>
          </Collapse>
        </Box>
      </Box>
    </Paper>
  );
}
