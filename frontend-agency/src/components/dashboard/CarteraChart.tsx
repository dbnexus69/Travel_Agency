import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
} from 'recharts';
import { CarteraData } from '../../types';
import { formatCurrency } from '../../utils/formatters';

interface CarteraChartProps {
  data: CarteraData[];
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{ payload: CarteraData }>;
}

function CustomTooltip({ active, payload }: CustomTooltipProps) {
  if (!active || !payload?.length) return null;
  
  const { name, value } = payload[0].payload;
  
  return (
    <div className="bg-white border border-gray-border rounded-lg shadow-lg p-3">
      <p className="text-sm font-semibold text-primary">{name}</p>
      <p className="text-xs font-medium text-accent mt-1">{formatCurrency(value)}</p>
    </div>
  );
}

export function CarteraChart({ data }: CarteraChartProps) {
  const total = data.reduce((sum, item) => sum + item.value, 0);
  
  return (
    <div>
      <div className="h-44">
        <ResponsiveContainer width="100%" height="100%" minWidth={0}>
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={45}
              outerRadius={65}
              paddingAngle={3}
              dataKey="value"
            >
              {data.map((entry, index) => (
                <Cell 
                  key={`cell-${index}`} 
                  fill={entry.color}
                  stroke="transparent"
                />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
          </PieChart>
        </ResponsiveContainer>
      </div>
      <div className="mt-2 space-y-2">
        {data.map((item) => {
          const percentage = total > 0 ? (item.value / total) * 100 : 0;
          return (
            <div key={item.name} className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span 
                  className="w-2.5 h-2.5 rounded-sm" 
                  style={{ backgroundColor: item.color }}
                />
                <span className="text-sm text-gray-600">{item.name}</span>
              </div>
              <div className="text-right">
                <span className="text-sm font-semibold text-primary">
                  {formatCurrency(item.value)}
                </span>
                <span className="text-xs text-gray-400 ml-2">
                  ({percentage.toFixed(0)}%)
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}