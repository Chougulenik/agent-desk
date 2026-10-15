import React from 'react';
import { Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper } from '@mui/material';

interface Props {
  headers: string[];
  rows: string[][];
}

export function ComparisonTable({ headers, rows }: Props) {
  return (
    <TableContainer component={Paper} sx={{ my: 2, background: 'rgba(255, 255, 255, 0.03)', border: '1px solid rgba(255,255,255,0.1)' }} elevation={0}>
      <Table aria-label="generative comparison table">
        <TableHead>
          <TableRow>
            {headers.map((h, i) => (
              <TableCell key={i} sx={{ fontWeight: 'bold', color: 'primary.light', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>{h}</TableCell>
            ))}
          </TableRow>
        </TableHead>
        <TableBody>
          {rows.map((row, i) => (
            <TableRow key={i} sx={{ '&:last-child td, &:last-child th': { border: 0 }, '&:hover': { bgcolor: 'rgba(255,255,255,0.05)' }, transition: 'background-color 0.2s' }}>
              {row.map((cell, j) => (
                <TableCell key={j} sx={{ color: 'text.secondary', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>{cell}</TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
}
