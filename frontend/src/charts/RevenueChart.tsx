import React from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  Bar,
  Line,
  ComposedChart,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend
} from 'recharts';
import { MonthlyTrend } from '../types';
import { formatCurrency, formatNumber } from '../utils/formatters';

interface RevenueChartProps {
  data: MonthlyTrend[];
  height?: number;
  mode?: 'sales_profit' | 'orders_aov' | 'sales_only';
}

export const RevenueChart: React.FC<RevenueChartProps> = ({ 
  data, 
  height = 320, 
  mode = 'sales_profit' 
}) => {
  // Compute AOV per month
  const chartData = data.map(item => ({
    ...item,
    AOV: item.Orders > 0 ? Math.round(item.Sales / item.Orders) : 0
  }));

  if (mode === 'orders_aov') {
    return (
      <div style={{ width: '100%', height }}>
        <ResponsiveContainer>
          <ComposedChart data={chartData} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
            <defs>
              <linearGradient id="orderGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.8} />
                <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0.2} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" opacity={0.5} />
            <XAxis
              dataKey="YearMonth"
              tickLine={false}
              axisLine={false}
              tick={{ fontSize: 11, fill: '#94a3b8' }}
            />
            <YAxis
              yAxisId="left"
              tickLine={false}
              axisLine={false}
              tick={{ fontSize: 11, fill: '#94a3b8' }}
              tickFormatter={(val) => `${val}`}
            />
            <YAxis
              yAxisId="right"
              orientation="right"
              tickLine={false}
              axisLine={false}
              tick={{ fontSize: 11, fill: '#94a3b8' }}
              tickFormatter={(val) => `$${val}`}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: '#0f172a',
                borderRadius: '12px',
                border: '1px solid #334155',
                color: '#ffffff',
                fontSize: '12px',
                boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.3)'
              }}
              formatter={(value: any, name: any) => [
                name === 'Orders' ? formatNumber(Number(value)) : formatCurrency(Number(value)),
                name === 'Orders' ? 'Total Order Volume' : 'Average Order Value (AOV)'
              ]}
            />
            <Legend
              verticalAlign="top"
              align="right"
              iconType="circle"
              wrapperStyle={{ paddingBottom: '12px', fontSize: '12px', fontWeight: 600 }}
            />
            <Bar
              yAxisId="left"
              dataKey="Orders"
              name="Orders"
              fill="url(#orderGrad)"
              radius={[6, 6, 0, 0]}
              maxBarSize={45}
            />
            <Line
              yAxisId="right"
              type="monotone"
              dataKey="AOV"
              name="AOV"
              stroke="#f59e0b"
              strokeWidth={3}
              dot={{ r: 3, fill: '#f59e0b' }}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    );
  }

  return (
    <div style={{ width: '100%', height }}>
      <ResponsiveContainer>
        <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
          <defs>
            <linearGradient id="salesGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.35} />
              <stop offset="95%" stopColor="#4f46e5" stopOpacity={0.0} />
            </linearGradient>
            <linearGradient id="profitGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#10b981" stopOpacity={0.35} />
              <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" opacity={0.5} />
          <XAxis
            dataKey="YearMonth"
            tickLine={false}
            axisLine={false}
            tick={{ fontSize: 11, fill: '#94a3b8' }}
          />
          <YAxis
            tickLine={false}
            axisLine={false}
            tick={{ fontSize: 11, fill: '#94a3b8' }}
            tickFormatter={(val) => `$${(val / 1000).toFixed(0)}k`}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: '#0f172a',
              borderRadius: '12px',
              border: '1px solid #334155',
              color: '#ffffff',
              fontSize: '12px',
              boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.3)'
            }}
            formatter={(value: any, name: any) => [
              formatCurrency(Number(value)),
              name === 'Sales' ? 'Gross Revenue' : 'Net Operating Profit'
            ]}
          />
          <Legend
            verticalAlign="top"
            align="right"
            iconType="circle"
            wrapperStyle={{ paddingBottom: '12px', fontSize: '12px', fontWeight: 600 }}
          />
          <Area
            type="monotone"
            dataKey="Sales"
            name="Sales"
            stroke="#4f46e5"
            strokeWidth={3}
            fillOpacity={1}
            fill="url(#salesGrad)"
          />
          {mode !== 'sales_only' && (
            <Area
              type="monotone"
              dataKey="Profit"
              name="Profit"
              stroke="#10b981"
              strokeWidth={2.5}
              fillOpacity={1}
              fill="url(#profitGrad)"
            />
          )}
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};
