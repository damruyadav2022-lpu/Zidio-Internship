import React from 'react';
import {
  ResponsiveContainer,
  ComposedChart,
  Line,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend
} from 'recharts';
import { HistoryPoint, ForecastPoint } from '../types';

interface ForecastChartProps {
  history: HistoryPoint[];
  forecast: ForecastPoint[];
  height?: number;
  modelName?: string;
}

export const ForecastChart: React.FC<ForecastChartProps> = ({
  history,
  forecast,
  height = 340,
  modelName = 'PyTorch LSTM'
}) => {
  // Combine history and forecast into unified chart array
  const combinedData = [
    ...history.map(h => ({
      ds: h.ds,
      actual: h.actual,
      forecast: null as number | null,
      range: null as [number, number] | null
    })),
    ...forecast.map(f => ({
      ds: f.ds,
      actual: null as number | null,
      forecast: f.yhat,
      range: [f.yhat_lower, f.yhat_upper] as [number, number]
    }))
  ];

  return (
    <div style={{ width: '100%', height }}>
      <ResponsiveContainer>
        <ComposedChart data={combinedData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
          <defs>
            <linearGradient id="confidenceBand" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#7c3aed" stopOpacity={0.18} />
              <stop offset="95%" stopColor="#7c3aed" stopOpacity={0.05} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" opacity={0.6} />
          <XAxis
            dataKey="ds"
            tickLine={false}
            axisLine={false}
            tick={{ fontSize: 11, fill: '#94a3b8' }}
            tickFormatter={(val) => {
              const parts = val.split('-');
              return `${parts[1]}/${parts[2]}`;
            }}
          />
          <YAxis
            tickLine={false}
            axisLine={false}
            tick={{ fontSize: 11, fill: '#94a3b8' }}
            tickFormatter={(val) => `${val}u`}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: '#0f172a',
              borderRadius: '8px',
              border: 'none',
              color: '#ffffff',
              fontSize: '12px'
            }}
            formatter={(value: any, name: any) => {
              if (Array.isArray(value)) {
                return [`${value[0]} - ${value[1]} units`, '95% Confidence Band'];
              }
              return [`${value} units`, name];
            }}
          />
          <Legend
            verticalAlign="top"
            align="right"
            iconType="circle"
            wrapperStyle={{ paddingBottom: '10px', fontSize: '12px' }}
          />
          <Area
            type="monotone"
            dataKey="range"
            name="95% Confidence Interval"
            fill="url(#confidenceBand)"
            stroke="none"
          />
          <Line
            type="monotone"
            dataKey="actual"
            name="Historical Sales Velocity"
            stroke="#94a3b8"
            strokeWidth={2}
            dot={false}
          />
          <Line
            type="monotone"
            dataKey="forecast"
            name={`${modelName} Projection`}
            stroke="#7c3aed"
            strokeWidth={3}
            dot={{ r: 2, fill: '#7c3aed' }}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
};
