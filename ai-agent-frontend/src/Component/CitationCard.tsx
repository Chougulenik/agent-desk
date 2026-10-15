import React from 'react';
import { Tooltip, Box } from '@mui/material';

interface Props {
  title: string;
  url: string;
  onOpenCitation?: (title: string, url: string, line: number) => void;
}

export function CitationCard({ title, url, onOpenCitation }: Props) {
  const lineMatch = url.match(/line=(\d+)/);
  const line = lineMatch ? parseInt(lineMatch[1], 10) : 1;

  return (
    <Tooltip title={`Source: ${title} (Line ${line})`} placement="top" arrow>
      <Box 
        component="span"
        onClick={(e) => {
          e.preventDefault();
          window.location.hash = url;
          onOpenCitation?.(title, url, line);
        }}
        sx={{ 
          color: 'primary.light',
          cursor: 'pointer',
          fontWeight: 700,
          fontSize: '0.75rem',
          verticalAlign: 'super',
          mx: '2px',
          transition: 'all 0.2s ease',
          '&:hover': {
            color: '#fff',
            textShadow: '0 0 8px rgba(99, 102, 241, 0.8)',
          }
        }}
      >
        [{line}]
      </Box>
    </Tooltip>
  );
}
