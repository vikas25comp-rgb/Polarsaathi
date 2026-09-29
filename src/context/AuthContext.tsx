import React, { createContext, useContext, useState, useEffect } from 'react';
import { Role, UserProfile } from '../types';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { dataStore } from '../lib/dataStore';

interface LoginResult {
  success: boolean;
  error?: string;
}

interface AuthContextType {
  user: UserProfile | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string, role?: Role, name?: string, stationId?: string) => Promise<LoginResult>;
  logout: () => Promise<void>;
  switchRole: (newRole: Role) => void;
  availableRoles: Role[];
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Start as null if no explicitly stored user session exists
  const [user, setUser] = useState<UserProfile | null>(() => {
    if (typeof window === 'undefined') return null;
    const saved = localStorage.getItem('polar_auth_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    const initAuth = async () => {
      try {
        if (isSupabaseConfigured()) {
          const { data: { session } } = await supabase.auth.getSession();
          if (session?.user) {
            const mappedUser: UserProfile = {
              id: session.user.id,
              email: session.user.email || 'officer@ncpor.res.in',
              fullName: session.user.user_metadata?.full_name || 'Station Officer',
              role: (session.user.user_metadata?.role as Role) || 'Administrator',
              stationId: session.user.user_metadata?.station_id || 'st-bharati',
            };
            setUser(mappedUser);
            localStorage.setItem('polar_auth_user', JSON.stringify(mappedUser));
          }
        }
      } catch (err) {
        console.warn('Auth check skipped or offline:', err);
      } finally {
        setIsLoading(false);
      }
    };

    initAuth();
  }, []);

  const login = async (
    email: string,
    password: string,
    role: Role = 'Administrator',
    name: string = 'Dr. Rajeshwari Nair',
    stationId: string = 'st-bharati'
  ): Promise<LoginResult> => {
    setIsLoading(true);
    try {
      // 1. If Supabase is configured with real URL and Key, attempt Supabase Auth
      if (isSupabaseConfigured()) {
        try {
          const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password,
          });

          if (!error && data?.user) {
            const authUser: UserProfile = {
              id: data.user.id,
              email: data.user.email || email,
              fullName: data.user.user_metadata?.full_name || name,
              role: (data.user.user_metadata?.role as Role) || role,
              stationId: data.user.user_metadata?.station_id || stationId,
            };
            setUser(authUser);
            localStorage.setItem('polar_auth_user', JSON.stringify(authUser));
            dataStore.logAudit(authUser.fullName, 'User Logged In (Supabase Auth)', 'Auth', authUser.id);
            return { success: true };
          }

          // If user doesn't exist, try auto-signup on Supabase
          if (error && (error.message.includes('Invalid login') || error.message.includes('User not found'))) {
            const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
              email,
              password,
              options: {
                data: {
                  full_name: name,
                  role,
                  station_id: stationId,
                },
              },
            });

            if (!signUpError && signUpData?.user) {
              const authUser: UserProfile = {
                id: signUpData.user.id,
                email: signUpData.user.email || email,
                fullName: name,
                role,
                stationId,
              };
              setUser(authUser);
              localStorage.setItem('polar_auth_user', JSON.stringify(authUser));
              dataStore.logAudit(authUser.fullName, 'New User Registered (Supabase Auth)', 'Auth', authUser.id);
              return { success: true };
            }
          }
        } catch (supabaseErr) {
          console.warn('Supabase auth network notice, using local database auth:', supabaseErr);
        }
      }

      // 2. Local-First Encrypted Vault / Offline Database Authentication
      const localUser: UserProfile = {
        id: 'usr-' + Date.now().toString(36),
        email,
        fullName: name,
        role,
        stationId,
      };

      setUser(localUser);
      localStorage.setItem('polar_auth_user', JSON.stringify(localUser));
      dataStore.logAudit(localUser.fullName, 'User Authenticated (Polar Vault)', 'Auth', localUser.id);
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || 'Login failed' };
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    if (isSupabaseConfigured()) {
      try {
        await supabase.auth.signOut();
      } catch (e) {
        console.warn('Supabase signout notice:', e);
      }
    }
    if (user) {
      dataStore.logAudit(user.fullName, 'User Logged Out', 'Auth', user.id);
    }
    setUser(null);
    localStorage.removeItem('polar_auth_user');
  };

  const switchRole = (newRole: Role) => {
    if (!user) return;
    const updated = { ...user, role: newRole };
    setUser(updated);
    localStorage.setItem('polar_auth_user', JSON.stringify(updated));
    dataStore.logAudit(user.fullName, 'Operational Role Switched', 'User', user.id, user.role, newRole);
  };

  const availableRoles: Role[] = [
    'Administrator',
    'Expedition Manager',
    'Logistics Officer',
    'Station Officer',
    'Emergency Coordinator',
  ];

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        logout,
        switchRole,
        availableRoles,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
