import { useMemo } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { TrendData } from '../../types';
import { formatCurrency } from '../../utils/formatters';

const MONTHS = [
  'Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun',
  'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'
];

interface TrendChartProps {
  data: TrendData[];
  currentYear?: number;
  previousYear?: number;
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{ value: number; dataKey: string; color: string }>;
  label?: string;
}

function CustomTooltip({ active, payload, label }: CustomTooltipProps) {
  if (!active || !payload?.length) return null;
  
  return (
    <div className="bg-white border border-gray-border rounded-lg shadow-lg p-3">
      <p className="text-sm font-semibold text-primary mb-2">{label}</p>
      {payload.map((entry, index) => (
        <div key={index} className="flex items-center gap-2 text-xs">
          <span 
            className="w-2 h-2 rounded-full" 
            style={{ backgroundColor: entry.color }}
          />
          <span className="text-gray-500">
            {entry.dataKey === 'currentYear' ? '2026:' : '2025:'}
          </span>
          <span className="font-semibold text-primary">
            {formatCurrency(entry.value)}
          </span>
        </div>
      ))}
    </div>
  );
}

export function TrendChart({ 
  data, 
  currentYear = 2026, 
  previousYear = 2025 
}: TrendChartProps) {
  const chartData = useMemo(() => {
    if (!data || data.length === 0) return [];
    return data.map(item => ({
      ...item,
      fullMonth: MONTHS[item.month] || MONTHS[item.month - 1] || '',
    }));
  }, [data]);

  const hasData = chartData.some(d => d.currentYear > 0 || d.previousYear > 0);

  if (!hasData) {
    return (
      <div className="h-72 flex items-center justify-center text-gray-400 text-sm">
        No hay datos disponibles
      </div>
    );
  }

  return (
    <div className="h-72">
      <ResponsiveContainer width="100%" height="100%" minWidth={0}>
        <BarChart
          data={chartData}
          margin={{ top: 20, right: 20, left: 0, bottom: 5 }}
        >
          <defs>
            <linearGradient id="gradientCurrent" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#032650" stopOpacity={1}/>
              <stop offset="95%" stopColor="#1e3a5f" stopOpacity={0.85}/>
            </linearGradient>
            <linearGradient id="gradientPrevious" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#94a3b8" stopOpacity={1}/>
              <stop offset="95%" stopColor="#cbd5e1" stopOpacity={0.85}/>
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
          <XAxis 
            dataKey="fullMonth" 
            tick={{ fontSize: 11, fill: '#6b7280' }}
            axisLine={{ stroke: '#e5e5e5' }}
            tickLine={false}
          />
          <YAxis 
            tick={{ fontSize: 11, fill: '#6b7280' }}
            axisLine={false}
            tickLine={false}
            tickFormatter={(value) => `${(value / 1000000).toFixed(1)}M`}
          />
          <Tooltip 
            content={<CustomTooltip />}
            formatter={(value: number) => formatCurrency(value)}
          />
          <Legend 
            wrapperStyle={{ paddingTop: '16px' }}
            formatter={(value) => (
              <span className="text-xs text-gray-600">
                {value === 'currentYear' ? currentYear.toString() : previousYear.toString()}
              </span>
            )}
          />
          <Bar 
            dataKey="previousYear" 
            name={previousYear.toString()}
            fill="url(#gradientPrevious)" 
            radius={[4, 4, 0, 0]}
            maxBarSize={24}
          />
          <Bar 
            dataKey="currentYear" 
            name={currentYear.toString()}
            fill="url(#gradientCurrent)" 
            radius={[4, 4, 0, 0]}
            maxBarSize={24}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}