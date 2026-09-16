import React from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend
} from 'recharts';

interface ROCChartProps {
  data: Array<{ fpr: number; tpr: number }>;
  height?: number;
}

export const ROCChart: React.FC<ROCChartProps> = ({ data, height = 280 }) => {
  // Add random guessing baseline (0,0 to 1,1)
  const chartData = data.map(d => ({
    ...d,
    baseline: d.fpr
  }));

  return (
    <div style={{ width: '100%', height }}>
      <ResponsiveContainer>
        <LineChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" opacity={0.6} />
          <XAxis
            dataKey="fpr"
            name="False Positive Rate (1 - Specificity)"
            tickLine={false}
            axisLine={false}
            tick={{ fontSize: 11, fill: '#94a3b8' }}
            tickFormatter={(v) => `${(v * 100).toFixed(0)}%`}
          />
          <YAxis
            dataKey="tpr"
            name="True Positive Rate (Sensitivity)"
            tickLine={false}
            axisLine={false}
            tick={{ fontSize: 11, fill: '#94a3b8' }}
            tickFormatter={(v) => `${(v * 100).toFixed(0)}%`}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: '#0f172a',
              borderRadius: '8px',
              border: 'none',
              color: '#ffffff',
              fontSize: '12px'
            }}
            formatter={(value: any, name: any) => [
              `${(Number(value) * 100).toFixed(1)}%`,
              name === 'tpr' ? 'XGBoost ROC Curve' : 'Random Guess'
            ]}
          />
          <Legend
            verticalAlign="top"
            align="right"
            iconType="circle"
            wrapperStyle={{ paddingBottom: '8px', fontSize: '11px' }}
          />
          <Line
            type="monotone"
            dataKey="baseline"
            name="Random Baseline (AUC = 0.50)"
            stroke="#94a3b8"
            strokeDasharray="4 4"
            strokeWidth={1.5}
            dot={false}
          />
          <Line
            type="monotone"
            dataKey="tpr"
            name="XGBoost Classifier (AUC = 0.9615)"
            stroke="#7c3aed"
            strokeWidth={3}
            dot={{ r: 3, fill: '#7c3aed' }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};
