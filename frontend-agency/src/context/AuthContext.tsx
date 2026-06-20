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

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<LoginResponse['user'] | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('moontravel_token');

    if (token) {
      getMe()
        .then((userData) => {
          setUser(userData);
        })
        .catch(() => {
          localStorage.removeItem('moontravel_token');
          localStorage.removeItem('moontravel_session_expiry');
        })
        .finally(() => setIsLoading(false));
    } else {
      setIsLoading(false);
    }
  }, []);

  const login = async (email: string, password: string, remember = false): Promise<{ success: boolean; error?: string }> => {
    try {
      const data = await apiLogin(email, password, remember);

      // Limpiar caché vieja antes de guardar el nuevo token
      localStorage.removeItem('moontravel_dashboard_cache');

      setUser(data.user);

      localStorage.setItem('moontravel_token', data.token);
      localStorage.setItem('moontravel_remember', String(remember));

      return { success: true };
    } catch (err: any) {
      const message = err.response?.data?.error?.message || 'Error al iniciar sesión';
      return { success: false, error: message };
    }
  };

  const logout = () => {
    apiLogout().catch(() => {});
    setUser(null);
    localStorage.removeItem('moontravel_token');
    localStorage.removeItem('moontravel_user');
    localStorage.removeItem('moontravel_session_expiry');
    localStorage.removeItem('moontravel_remember');
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
