import { ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';

interface SortIconProps {
  active: boolean;
  direction: 'asc' | 'desc';
}

export default function SortIcon({ active, direction }: SortIconProps) {
  if (!active) return <ArrowUpDown size={12} className="text-gray-300" />;
  return direction === 'asc' 
    ? <ArrowUp size={12} className="text-white bg-primary rounded-full p-0.5" /> 
    : <ArrowDown size={12} className="text-white bg-primary rounded-full p-0.5" />;
}
