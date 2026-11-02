import React from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';
import { Bar } from 'react-chartjs-2';

// Register standard Chart.js bar modules
ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

/**
 * BarChartCard
 *
 * Orders Overview bar chart comparing Customer Orders vs Wholesale Orders
 * derived from recentCustomerOrders and recentWholesaleOrders counts.
 * Uses brand red (#C62828) with rounded bar tops (borderRadius: 8).
 * Gracefully shows a "Not enough data yet" fallback if counts are 0.
 */
const BarChartCard = ({
  customerCount = 0,
  wholesaleCount = 0,
  totalOrders = 0
}) => {
  const hasData = customerCount > 0 || wholesaleCount > 0 || totalOrders > 0;

  const data = {
    labels: ['Customer Orders', 'Wholesale Orders'],
    datasets: [
      {
        label: 'Recent Volume',
        data: [customerCount, wholesaleCount],
        backgroundColor: ['#C62828', '#8E1B1B'],
        hoverBackgroundColor: ['#8E1B1B', '#5C1111'],
        borderRadius: {
          topLeft: 10,
          topRight: 10,
          bottomLeft: 0,
          bottomRight: 0
        },
        borderSkipped: false,
        barThickness: 42,
        maxBarThickness: 54
      }
    ]
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false
      },
      tooltip: {
        backgroundColor: '#2C2C2A',
        titleFont: { size: 12, weight: 'bold' },
        bodyFont: { size: 12 },
        padding: 10,
        cornerRadius: 8,
        displayColors: false,
        callbacks: {
          label: (context) => ` ${context.parsed.y} orders in recent batch`
        }
      }
    },
    scales: {
      x: {
        grid: {
          display: false
        },
        ticks: {
          color: '#6B7280',
          font: { size: 11, weight: '600' }
        }
      },
      y: {
        beginAtZero: true,
        grid: {
          color: '#F3F4F6'
        },
        ticks: {
          stepSize: 1,
          color: '#9CA3AF',
          font: { size: 11 }
        }
      }
    }
  };

  return (
    <div className="bg-white border border-gray-200/80 rounded-2xl p-5 shadow-xs flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between mb-1">
          <h3 className="text-sm font-bold text-gray-900 tracking-tight">Orders Overview</h3>
          <span className="text-[10px] font-semibold uppercase tracking-wider text-gray-400 bg-gray-100 px-2.5 py-0.5 rounded-full">
            Channel Comparison
          </span>
        </div>
        <p className="text-xs text-gray-500 mb-4">
          Retail vs Wholesale distribution derived from latest order activity.
        </p>
      </div>

      <div className="h-56 relative w-full flex items-center justify-center">
        {!hasData ? (
          <div className="text-center text-xs text-gray-400 font-medium">
            Not enough data yet.
          </div>
        ) : (
          <Bar data={data} options={options} />
        )}
      </div>

      <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between text-[11px] text-gray-500">
        <div className="flex items-center gap-4">
          <span className="inline-flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#C62828]" />
            Retail ({customerCount})
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#8E1B1B]" />
            Wholesale ({wholesaleCount})
          </span>
        </div>
        <span className="font-semibold text-gray-700">
          Total in system: {totalOrders}
        </span>
      </div>
    </div>
  );
};

export default BarChartCard;

