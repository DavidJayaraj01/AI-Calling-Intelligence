/**
 * Chart Components
 * Reusable chart components using Recharts
 */

import React from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
} from 'recharts';
import type { ChartDataPoint, TimeSeriesDataPoint } from '../../types';

interface LineChartProps {
  data: TimeSeriesDataPoint[];
  height?: number;
}

interface PieChartProps {
  data: ChartDataPoint[];
  height?: number;
}

interface BarChartProps {
  data: ChartDataPoint[];
  height?: number;
}

// Line Chart for sentiment timeline
export const SentimentLineChart: React.FC<LineChartProps> = ({ data, height = 300 }) => {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis 
          dataKey="label" 
          tick={{ fontSize: 12 }}
          axisLine={false}
        />
        <YAxis 
          domain={[0, 10]}
          tick={{ fontSize: 12 }}
          axisLine={false}
        />
        <Tooltip 
          contentStyle={{
            backgroundColor: 'white',
            border: '1px solid #e5e7eb',
            borderRadius: '8px',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
          }}
        />
        <Line 
          type="monotone" 
          dataKey="value" 
          stroke="#0ea5e9" 
          strokeWidth={2}
          dot={{ fill: '#0ea5e9', strokeWidth: 2, r: 4 }}
          activeDot={{ r: 6, fill: '#0284c7' }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
};

// Pie Chart for categorical data
export const CategoryPieChart: React.FC<PieChartProps> = ({ data, height = 300 }) => {
  const COLORS = ['#0ea5e9', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];
  
  // Transform data for recharts
  const chartData = data.map(item => ({
    name: item.label,
    value: item.value,
    color: item.color,
  }));

  return (
    <ResponsiveContainer width="100%" height={height}>
      <PieChart>
        <Pie
          data={chartData}
          cx="50%"
          cy="50%"
          labelLine={false}
          label={({ name, percent }: any) => `${name} ${(percent * 100).toFixed(0)}%`}
          outerRadius={80}
          fill="#8884d8"
          dataKey="value"
        >
          {chartData.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={entry.color || COLORS[index % COLORS.length]} />
          ))}
        </Pie>
        <Tooltip 
          contentStyle={{
            backgroundColor: 'white',
            border: '1px solid #e5e7eb',
            borderRadius: '8px',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
          }}
        />
      </PieChart>
    </ResponsiveContainer>
  );
};

// Bar Chart for status data
export const StatusBarChart: React.FC<BarChartProps> = ({ data, height = 300 }) => {
  // Transform data for recharts
  const chartData = data.map(item => ({
    name: item.label,
    value: item.value,
    color: item.color,
  }));

  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={chartData}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis 
          dataKey="name" 
          tick={{ fontSize: 12 }}
          axisLine={false}
        />
        <YAxis 
          tick={{ fontSize: 12 }}
          axisLine={false}
        />
        <Tooltip 
          contentStyle={{
            backgroundColor: 'white',
            border: '1px solid #e5e7eb',
            borderRadius: '8px',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
          }}
        />
        <Bar 
          dataKey="value" 
          fill="#0ea5e9"
          radius={[4, 4, 0, 0]}
        />
      </BarChart>
    </ResponsiveContainer>
  );
};
