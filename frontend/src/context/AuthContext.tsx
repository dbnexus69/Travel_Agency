import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { login as apiLogin, logout as apiLogout, getMe } from '../api';
import type { LoginResponse } from '../api/auth';

interface AuthContextType {
  user: LoginResponse['user'] | null;
  login: (email: string, password: string, remember?: boolean) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  isAdmin: boolean;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const SESSION_DURATION = 30 * 60 * 1000;
const REMEMBER_DURATION = 7 * 24 * 60 * 60 * 1000;

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<LoginResponse['user'] | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [sessionExpiry, setSessionExpiry] = useState<number | null>(null);

  useEffect(() => {
    const token = localStorage.getItem('itea_token');
    const expiry = localStorage.getItem('itea_session_expiry');

    if (token && expiry) {
      const expiryTime = parseInt(expiry);
      if (Date.now() < expiryTime) {
        getMe()
          .then((userData) => {
            setUser(userData);
            setSessionExpiry(expiryTime);
          })
          .catch(() => {
            localStorage.removeItem('itea_token');
            localStorage.removeItem('itea_session_expiry');
          })
          .finally(() => setIsLoading(false));
      } else {
        localStorage.removeItem('itea_token');
        localStorage.removeItem('itea_session_expiry');
        setIsLoading(false);
      }
    } else {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!sessionExpiry) return;

    const checkExpiry = setInterval(() => {
      if (Date.now() >= sessionExpiry) {
        logout();
      }
    }, 60000);

    return () => clearInterval(checkExpiry);
  }, [sessionExpiry]);

  useEffect(() => {
    if (!user) return;
    
    const handleActivity = () => {
      const isRemember = localStorage.getItem('itea_remember') === 'true';
      if (isRemember) return; 

      const newExpiry = Date.now() + SESSION_DURATION;
      if (sessionExpiry && newExpiry - sessionExpiry > 60000) {
        setSessionExpiry(newExpiry);
        localStorage.setItem('itea_session_expiry', String(newExpiry));
      }
    };

    window.addEventListener('mousemove', handleActivity);
    window.addEventListener('keydown', handleActivity);
    window.addEventListener('click', handleActivity);
    window.addEventListener('scroll', handleActivity);

    return () => {
      window.removeEventListener('mousemove', handleActivity);
      window.removeEventListener('keydown', handleActivity);
      window.removeEventListener('click', handleActivity);
      window.removeEventListener('scroll', handleActivity);
    };
  }, [user, sessionExpiry]);

  const login = async (email: string, password: string, remember = false): Promise<{ success: boolean; error?: string }> => {
    try {
      const data = await apiLogin(email, password, remember);

      // Limpiar caché vieja antes de guardar el nuevo token (para que getCacheKey funcione con el nuevo usuario)
      localStorage.removeItem('itea_dashboard_cache'); // limpiar caché genérica anterior

      setUser(data.user);

      const duration = remember ? REMEMBER_DURATION : SESSION_DURATION;
      const expiryTime = Date.now() + duration;

      localStorage.setItem('itea_token', data.token);
      localStorage.setItem('itea_session_expiry', String(expiryTime));
      localStorage.setItem('itea_remember', String(remember));
      setSessionExpiry(expiryTime);

      return { success: true };
    } catch (err: any) {
      const message = err.response?.data?.error?.message || 'Error al iniciar sesión';
      return { success: false, error: message };
    }
  };

  const logout = () => {
    apiLogout().catch(() => {});
    setUser(null);
    setSessionExpiry(null);
    localStorage.removeItem('itea_token');
    localStorage.removeItem('itea_user');
    localStorage.removeItem('itea_session_expiry');
    localStorage.removeItem('itea_remember');
  };

  return (
    <AuthContext.Provider value={{
      user,
      login,
      logout,
      isAdmin: user?.role === 'admin',
      isLoading,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}
