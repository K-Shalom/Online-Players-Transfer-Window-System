import React, { useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  Grid,
  Card,
  CardContent,
  MenuItem,
  TextField,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
} from '@mui/material';
import {
  Assessment as ReportIcon,
  Download as DownloadIcon,
  PictureAsPdf as PdfIcon,
  TableChart as ExcelIcon,
  TrendingUp,
  SportsSoccer,
  SwapHoriz,
  AttachMoney,
} from '@mui/icons-material';

const ReportsManagement = () => {
  const [reportType, setReportType] = useState('transfer_summary');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  const reportTypes = [
    { value: 'transfer_summary', label: 'Transfer Summary', icon: <SwapHoriz /> },
    { value: 'club_performance', label: 'Club Performance', icon: <TrendingUp /> },
    { value: 'player_statistics', label: 'Player Statistics', icon: <SportsSoccer /> },
    { value: 'financial_overview', label: 'Financial Overview', icon: <AttachMoney /> },
  ];

  const sampleReportData = [
    { id: 1, metric: 'Total Transfers', value: '156', change: '+12%' },
    { id: 2, metric: 'Total Transfer Value', value: '$45.2M', change: '+8%' },
    { id: 3, metric: 'Active Clubs', value: '45', change: '+5%' },
    { id: 4, metric: 'Active Players', value: '1,250', change: '+15%' },
  ];

  const handleGenerateReport = () => {
    console.log('Generating report:', reportType, dateFrom, dateTo);
    // TODO: Implement API call to generate report
  };

  const handleExportPDF = () => {
    console.log('Exporting to PDF');
    // TODO: Implement PDF export
  };

  const handleExportExcel = () => {
    console.log('Exporting to Excel');
    // TODO: Implement Excel export
  };

  return (
    <Box>
      <Typography variant="h4" sx={{ fontWeight: 'bold', mb: 3 }}>
        Reports & Analytics
      </Typography>

      {/* Report Configuration */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 2 }}>
          Generate Report
        </Typography>
        <Grid container spacing={2}>
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              select
              label="Report Type"
              value={reportType}
              onChange={(e) => setReportType(e.target.value)}
            >
              {reportTypes.map((type) => (
                <MenuItem key={type.value} value={type.value}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    {type.icon}
                    {type.label}
                  </Box>
                </MenuItem>
              ))}
            </TextField>
          </Grid>
          <Grid item xs={12} md={3}>
            <TextField
              fullWidth
              label="From Date"
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              InputLabelProps={{ shrink: true }}
            />
          </Grid>
          <Grid item xs={12} md={3}>
            <TextField
              fullWidth
              label="To Date"
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              InputLabelProps={{ shrink: true }}
            />
          </Grid>
          <Grid item xs={12} md={2}>
            <Button
              fullWidth
              variant="contained"
              onClick={handleGenerateReport}
              sx={{ height: '56px' }}
            >
              Generate
            </Button>
          </Grid>
        </Grid>
      </Paper>

      {/* Quick Stats */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        {reportTypes.map((type, index) => (
          <Grid item xs={12} sm={6} md={3} key={type.value}>
            <Card sx={{ background: `linear-gradient(135deg, #1976d215 0%, #1976d205 100%)` }}>
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <Box>
                    <Typography color="textSecondary" gutterBottom variant="body2">
                      {type.label}
                    </Typography>
                    <Typography variant="h5" component="div" sx={{ fontWeight: 'bold' }}>
                      {index === 0 ? '156' : index === 1 ? '45' : index === 2 ? '1,250' : '$45.2M'}
                    </Typography>
                    <Chip
                      label={`+${5 + index * 3}%`}
                      size="small"
                      color="success"
                      sx={{ mt: 1 }}
                    />
                  </Box>
                  <Box sx={{ color: '#1976d2', fontSize: 40 }}>
                    {type.icon}
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Report Preview */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
            Report Preview
          </Typography>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button
              variant="outlined"
              startIcon={<PdfIcon />}
              onClick={handleExportPDF}
            >
              Export PDF
            </Button>
            <Button
              variant="outlined"
              startIcon={<ExcelIcon />}
              onClick={handleExportExcel}
            >
              Export Excel
            </Button>
          </Box>
        </Box>

        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell><strong>Metric</strong></TableCell>
                <TableCell><strong>Value</strong></TableCell>
                <TableCell><strong>Change</strong></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {sampleReportData.map((row) => (
                <TableRow key={row.id} hover>
                  <TableCell>{row.metric}</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>{row.value}</TableCell>
                  <TableCell>
                    <Chip
                      label={row.change}
                      size="small"
                      color="success"
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      {/* Recent Reports */}
      <Paper sx={{ p: 3 }}>
        <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 2 }}>
          Recent Reports
        </Typography>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell><strong>Report Name</strong></TableCell>
                <TableCell><strong>Type</strong></TableCell>
                <TableCell><strong>Generated Date</strong></TableCell>
                <TableCell><strong>Status</strong></TableCell>
                <TableCell><strong>Actions</strong></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              <TableRow hover>
                <TableCell>Q4 Transfer Summary</TableCell>
                <TableCell>Transfer Summary</TableCell>
                <TableCell>{new Date().toLocaleDateString()}</TableCell>
                <TableCell>
                  <Chip label="Ready" size="small" color="success" />
                </TableCell>
                <TableCell>
                  <Button size="small" startIcon={<DownloadIcon />}>
                    Download
                  </Button>
                </TableCell>
              </TableRow>
              <TableRow hover>
                <TableCell>Club Performance Report</TableCell>
                <TableCell>Club Performance</TableCell>
                <TableCell>{new Date().toLocaleDateString()}</TableCell>
                <TableCell>
                  <Chip label="Ready" size="small" color="success" />
                </TableCell>
                <TableCell>
                  <Button size="small" startIcon={<DownloadIcon />}>
                    Download
                  </Button>
                </TableCell>
              </TableRow>
              <TableRow hover>
                <TableCell>Player Statistics 2025</TableCell>
                <TableCell>Player Statistics</TableCell>
                <TableCell>{new Date().toLocaleDateString()}</TableCell>
                <TableCell>
                  <Chip label="Processing" size="small" color="warning" />
                </TableCell>
                <TableCell>
                  <Button size="small" disabled>
                    Download
                  </Button>
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>
    </Box>
  );
};

export default ReportsManagement;
