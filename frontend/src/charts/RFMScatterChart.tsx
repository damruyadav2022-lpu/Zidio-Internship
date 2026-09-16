import React from 'react';
import {
  ResponsiveContainer,
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  ZAxis,
  CartesianGrid,
  Tooltip,
  Legend
} from 'recharts';
import { ScatterPoint } from '../types';
import { formatCurrency } from '../utils/formatters';

interface RFMScatterChartProps {
  data: ScatterPoint[];
  height?: number;
  onSelectCustomer?: (customerId: string) => void;
}

const SEGMENT_COLORS: Record<string, string> = {
  'VIP Champions': '#10b981',
  'Loyal Customers': '#4f46e5',
  'Potential Loyalists': '#06b6d4',
  'At-Risk Customers': '#f59e0b',
  'Lost Customers': '#ef4444'
};

export const RFMScatterChart: React.FC<RFMScatterChartProps> = ({
  data,
  height = 360,
  onSelectCustomer
}) => {
  // Group points by segment for legend & coloring
  const segments = Array.from(new Set(data.map(d => d.Segment)));

  return (
    <div style={{ width: '100%', height }}>
      <ResponsiveContainer>
        <ScatterChart margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" opacity={0.6} />
          <XAxis
            type="number"
            dataKey="pca_x"
            name="PCA Dimension 1 (Spend & Frequency)"
            tickLine={false}
            axisLine={false}
            tick={{ fontSize: 11, fill: '#94a3b8' }}
          />
          <YAxis
            type="number"
            dataKey="pca_y"
            name="PCA Dimension 2 (Recency Velocity)"
            tickLine={false}
            axisLine={false}
            tick={{ fontSize: 11, fill: '#94a3b8' }}
          />
          <ZAxis type="number" dataKey="Monetary" range={[40, 200]} name="Monetary GMV" />
          <Tooltip
            cursor={{ strokeDasharray: '3 3' }}
            contentStyle={{
              backgroundColor: '#0f172a',
              borderRadius: '8px',
              border: 'none',
              color: '#ffffff',
              fontSize: '12px'
            }}
            formatter={(value: any, name: any, item: any) => {
              const p = item.payload as ScatterPoint;
              if (name === 'PCA Dimension 1 (Spend & Frequency)') {
                return [`Recency: ${p.Recency}d, Orders: ${p.Frequency}`, p.CustomerID];
              }
              if (name === 'Monetary GMV') {
                return [formatCurrency(p.Monetary), 'Lifetime Spend'];
              }
              return [value, name];
            }}
          />
          <Legend
            verticalAlign="top"
            align="right"
            iconType="circle"
            wrapperStyle={{ paddingBottom: '10px', fontSize: '11px' }}
          />
          {segments.map(seg => {
            const segData = data.filter(d => d.Segment === seg);
            return (
              <Scatter
                key={seg}
                name={seg}
                data={segData}
                fill={SEGMENT_COLORS[seg] || '#64748b'}
                onClick={(node) => onSelectCustomer && onSelectCustomer((node as any).CustomerID)}
                cursor="pointer"
              />
            );
          })}
        </ScatterChart>
      </ResponsiveContainer>
    </div>
  );
};
