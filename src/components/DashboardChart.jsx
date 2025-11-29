import React from 'react';
import { Bar } from 'react-chartjs-2';
import { Chart, BarElement, CategoryScale, LinearScale, Tooltip, Legend } from 'chart.js';

Chart.register(BarElement, CategoryScale, LinearScale, Tooltip, Legend);

const DashboardChart = ({ stats }) => {
  // Example: visualize clubs, players, transfers, approvals
  const chartData = {
    labels: ['Clubs', 'Players', 'Transfers', 'Approvals'],
    datasets: [
      {
        label: 'Dashboard Stats',
        data: [
          Number(stats.totalClubs) || 0,
          Number(stats.totalPlayers) || 0,
          Number(stats.activeTransfers) || 0,
          Number(stats.pendingApprovals) || 0,
        ],
        backgroundColor: [
          '#1976d2',
          '#2e7d32',
          '#ed6c02',
          '#d32f2f',
        ],
        borderRadius: 6,
      },
    ],
  };

  const options = {
    responsive: true,
    plugins: {
      legend: { display: false },
      tooltip: { enabled: true },
    },
    scales: {
      y: { beginAtZero: true },
    },
  };

  return (
    <div style={{ width: '100%', maxWidth: 600, margin: '0 auto', marginBottom: 32 }}>
      <Bar data={chartData} options={options} />
    </div>
  );
};

export default DashboardChart;
