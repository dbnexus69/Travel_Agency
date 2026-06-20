import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
} from 'recharts';
import { CategoryData } from '../../types';
import { formatCurrency } from '../../utils/formatters';

interface DistributionChartProps {
  data: CategoryData[];
  colors: string[];
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{ payload: CategoryData }>;
}

function CustomTooltip({ active, payload }: CustomTooltipProps) {
  if (!active || !payload?.length) return null;
  
  const { name, value, percentage } = payload[0].payload;
  
  return (
    <div className="bg-white border border-gray-border rounded-lg shadow-lg p-3">
      <p className="text-sm font-semibold text-primary">{name}</p>
      <p className="text-xs text-gray-500 mt-1">{formatCurrency(value)}</p>
      <p className="text-xs font-medium text-accent">{percentage.toFixed(1)}%</p>
    </div>
  );
}

export function DistributionChart({ data, colors }: DistributionChartProps) {
  return (
    <div className="grid grid-cols-2 gap-6">
      <div className="h-56">
        <ResponsiveContainer width="100%" height="100%" minWidth={0}>
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={50}
              outerRadius={80}
              paddingAngle={2}
              dataKey="value"
            >
              {data.map((_, index) => (
                <Cell 
                  key={`cell-${index}`} 
                  fill={colors[index % colors.length]}
                  stroke="transparent"
                />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
          </PieChart>
        </ResponsiveContainer>
      </div>
      <div className="space-y-3">
        {data.map((item, index) => (
          <div key={item.name}>
            <div className="flex justify-between text-xs mb-1">
              <span className="text-gray-600">{item.name}</span>
              <span className="font-semibold text-primary">{item.percentage.toFixed(0)}%</span>
            </div>
            <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{
                  width: `${item.percentage}%`,
                  backgroundColor: colors[index],
                }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}