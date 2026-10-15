import React from 'react';
import { Paper, Typography, Box } from '@mui/material';
import BarChartIcon from '@mui/icons-material/BarChart';
import { BarChart } from '@mui/x-charts/BarChart';

interface Props {
  chartType: string;
  data: any;
}

export function Chart({ chartType, data }: Props) {
  const labels = data?.labels || [];
  const series = (data?.datasets || []).map((ds: any) => ({
    data: ds.data,
    label: ds.label,
  }));

  return (
    <Paper sx={{ p: 3, my: 2, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)', overflow: 'hidden' }} elevation={0}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <BarChartIcon sx={{ mr: 1, color: 'primary.light' }} />
        <Typography variant="h6" sx={{ fontWeight: 600, color: 'text.primary' }}>
          Interactive {chartType}
        </Typography>
      </Box>
      
      <Box sx={{ width: '100%', minHeight: 320, display: 'flex', justifyContent: 'center' }}>
        {chartType === 'Bar' ? (
           <BarChart
             xAxis={[{ scaleType: 'band', data: labels, tickLabelStyle: { fill: '#cbd5e1' } }]}
             yAxis={[{ tickLabelStyle: { fill: '#cbd5e1' } }]}
             series={series}
             slotProps={{ legend: { labelStyle: { fill: '#cbd5e1' } } }}
             margin={{ top: 20, bottom: 30, left: 60, right: 20 }}
             colors={['#6366f1', '#10b981', '#f59e0b']}
             height={300}
           />
        ) : (
           <Box sx={{ overflowX: 'auto', bgcolor: 'rgba(0,0,0,0.2)', p: 2, borderRadius: 1, width: '100%' }}>
             <Typography variant="body2" component="pre" sx={{ color: 'primary.light', m: 0 }}>
               {JSON.stringify(data, null, 2)}
             </Typography>
           </Box>
        )}
      </Box>
    </Paper>
  );
}
