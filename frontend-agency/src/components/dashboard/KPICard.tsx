import { LucideIcon } from 'lucide-react';
import { DesgloseCategorias, CATEGORIA_LABELS } from '../../types';
import { formatCurrency } from '../../utils/formatters';

type KPIColor = 'primary' | 'accent' | 'success' | 'warning' | 'neutral';

const COLOR_MAP: Record<KPIColor, string> = {
  primary: '#512DDB',
  accent: '#4E30B2',
  success: '#16a34a',
  warning: '#f59e0b',
  neutral: '#6b7280',
};

interface KPICardProps {
  label: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  color: KPIColor;
  desglose?: DesgloseCategorias;
  isLoading?: boolean;
  isEmpty?: boolean;
  formatAsCurrency?: boolean;
  expanded?: boolean;
}

function formatCompactValue(value: number, asCurrency: boolean): string {
  if (!asCurrency) return value.toLocaleString('es-CO');
  
  if (value >= 1000000) {
    return `$${(value / 1000000).toFixed(1)}M`;
  }
  if (value >= 1000) {
    return `$${(value / 1000).toFixed(0)}K`;
  }
  return formatCurrency(value);
}

function hasDesgloseValues(desglose: DesgloseCategorias | undefined): boolean {
  if (!desglose) return false;
  return Object.values(desglose).some(v => v > 0);
}

function KPISkeleton() {
  return (
    <div className="animate-pulse space-y-2">
      <div className="h-3 w-20 bg-gray-200 rounded" />
      <div className="h-6 w-28 bg-gray-200 rounded" />
    </div>
  );
}

function EmptyState() {
  return (
    <span className="text-xs text-gray-400">Sin datos</span>
  );
}

export function KPICard({ 
  label, 
  value, 
  subtitle, 
  icon: Icon, 
  color, 
  desglose,
  isLoading = false,
  isEmpty = false,
  formatAsCurrency = false,
  expanded = false
}: KPICardProps) {
  const borderColor = COLOR_MAP[color];
  const displayValue = formatCompactValue(typeof value === 'number' ? value : 0, formatAsCurrency);
  const hasDesglose = hasDesgloseValues(desglose);
  const shouldExpand = expanded || (hasDesglose && !isLoading && !isEmpty);
  
  const categoryKeys = Object.keys(CATEGORIA_LABELS) as Array<keyof DesgloseCategorias>;
  
  if (isLoading) {
    return (
      <div className="relative overflow-hidden rounded-lg bg-white border border-gray-border shadow-sm p-4">
        <div className="absolute left-0 top-0 bottom-0 w-1" style={{ backgroundColor: borderColor }} />
        <KPISkeleton />
      </div>
    );
  }
  
  if (isEmpty) {
    return (
      <div className="relative overflow-hidden rounded-lg bg-white border border-gray-border shadow-sm p-4">
        <div className="absolute left-0 top-0 bottom-0 w-1" style={{ backgroundColor: borderColor }} />
        <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">{label}</p>
        <EmptyState />
      </div>
    );
  }
  
  return (
    <div className="relative overflow-hidden rounded-lg bg-white border border-gray-border shadow-sm hover:shadow-md transition-all duration-200">
      <div className="absolute left-0 top-0 bottom-0 w-1" style={{ backgroundColor: borderColor }} />
      
      <div className="p-4 pl-5">
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1">
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">{label}</p>
            <p className="text-2xl font-bold mt-1" style={{ color: borderColor }}>
              {displayValue}
            </p>
            {subtitle && (
              <p className="text-xs text-gray-400 mt-1">{subtitle}</p>
            )}
          </div>
          <div className="p-2 rounded-lg" style={{ backgroundColor: `${borderColor}15` }}>
            <Icon className="w-5 h-5" style={{ color: borderColor }} />
          </div>
        </div>
        
        {shouldExpand && (
          <div className="pt-3 border-t border-gray-100">
            <p className="text-[10px] font-medium text-gray-400 uppercase tracking-wide mb-2">
              Desglose
            </p>
            <div className="grid grid-cols-3 gap-x-2 gap-y-1">
              {categoryKeys.map((key) => {
                const catValue = desglose[key] || 0;
                const display = formatCompactValue(catValue, formatAsCurrency);
                return (
                  <div key={key} className="flex justify-between items-center py-0.5 text-xs">
                    <span className="text-gray-500 truncate mr-1">{CATEGORIA_LABELS[key]}</span>
                    <span className={`font-semibold whitespace-nowrap ${catValue === 0 ? 'text-gray-300' : 'text-gray-700'}`}>
                      {display}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export { COLOR_MAP };
export type { KPIColor };