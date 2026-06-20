import { useLocation, Link } from 'react-router-dom';
import { LayoutDashboard, BarChart3, Menu, RefreshCw } from 'lucide-react';
import { useData } from '../../context/DataContext';

const pageTitles: Record<string, string> = {
  '/': 'Dashboard',
  '/sales': 'Ventas',
  '/clients': 'Clientes',
  '/itineraries': 'Itinerarios',
  '/users': 'Usuarios',
  '/config': 'Catálogos'
};

const navItems = [
  { path: '/', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/stats', label: 'Estadísticas', icon: BarChart3 },
];

interface HeaderProps {
  onMenuToggle?: () => void;
}

export function Header({ onMenuToggle }: HeaderProps) {
  const location = useLocation();
  const title = pageTitles[location.pathname] || 'iTea';
  const isRootPath = location.pathname === '/' || location.pathname === '/stats';
  const activeNav = location.pathname === '/stats' ? 'stats' : 'dashboard';
  const { refreshData } = useData();

  return (
    <>
      {isRootPath && (
        <nav className="bg-white border-b border-gray-border px-6">
          <div className="flex gap-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeNav === item.path.replace('/', '');
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                    isActive
                      ? 'text-primary border-primary'
                      : 'text-gray-500 border-transparent hover:text-primary hover:border-gray-300'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {item.label}
                </Link>
              );
            })}
          </div>
        </nav>
      )}
      <header className="sticky top-0 z-40 bg-white border-b border-gray-border px-4 md:px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* Mobile Menu Toggle */}
            <button 
              onClick={onMenuToggle}
              className="md:hidden p-1.5 -ml-1.5 text-gray-500 hover:text-primary rounded-lg hover:bg-gray-100 transition-colors"
            >
              <Menu size={20} />
            </button>
            <div className="flex items-center gap-2 text-sm">
              <span className="text-gray-500 hidden sm:inline">iTea</span>
              <span className="text-gray-400 hidden sm:inline">/</span>
              <span className="font-heading font-semibold text-primary">{title}</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={refreshData}
              className="p-2 text-gray-400 hover:text-primary hover:bg-gray-100 rounded-lg transition-colors"
              title="Actualizar datos"
            >
              <RefreshCw size={16} />
            </button>
            <div className="text-sm text-gray-500">
              {new Date().toLocaleDateString('es-CO', {
                weekday: 'long',
                day: 'numeric',
                month: 'long',
                year: 'numeric'
              })}
            </div>
          </div>
        </div>
      </header>
    </>
  );
}