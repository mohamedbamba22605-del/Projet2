import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase, Utilisateur } from '@/lib/supabase';

interface AuthContextValue {
  user: Utilisateur | null;
  loading: boolean;
  login: (pin: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

const STORAGE_KEY = 'lmc_user';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<Utilisateur | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    console.log('AuthContext: Initializing...');
    let cancelled = false;
    
    // Add timeout to prevent hanging on iOS
    const timeoutId = setTimeout(() => {
      if (!cancelled && loading) {
        console.warn('AuthContext: Timeout reached, forcing loading to false');
        setLoading(false);
      }
    }, 5000); // 5 second timeout
    
    const stored = sessionStorage.getItem(STORAGE_KEY);
    if (!stored) {
      console.log('AuthContext: No stored session');
      setLoading(false);
      clearTimeout(timeoutId);
      return;
    }
    let parsed: Utilisateur | null = null;
    try {
      parsed = JSON.parse(stored);
      console.log('AuthContext: Found stored session for user:', parsed?.id);
    } catch {
      console.error('AuthContext: Failed to parse stored session');
      sessionStorage.removeItem(STORAGE_KEY);
      setLoading(false);
      clearTimeout(timeoutId);
      return;
    }
    // Validate the stored session still exists in the database
    // (a reset may have deleted non-organisateur accounts)
    console.log('AuthContext: Validating session with Supabase...');
    supabase
      .from('utilisateurs')
      .select('id')
      .eq('id', parsed!.id)
      .maybeSingle()
      .then(({ data, error }) => {
        if (cancelled) return;
        clearTimeout(timeoutId);
        if (error) {
          console.error('AuthContext: Supabase validation error:', error);
          // On error, still use the stored session for offline capability
          setUser(parsed);
        } else if (data) {
          console.log('AuthContext: Session validated');
          setUser(parsed);
        } else {
          console.log('AuthContext: Session no longer valid');
          sessionStorage.removeItem(STORAGE_KEY);
        }
        setLoading(false);
      })
      .catch((err) => {
        console.error('AuthContext: Unexpected error:', err);
        if (cancelled) return;
        clearTimeout(timeoutId);
        // On network error, use stored session for offline capability
        setUser(parsed);
        setLoading(false);
      });
    return () => {
      cancelled = true;
      clearTimeout(timeoutId);
    };
  }, []);

  const login = async (pin: string) => {
    const { data, error } = await supabase.rpc('verify_pin', { p_pin: pin });
    if (error) return { success: false, error: 'Erreur de connexion' };
    if (!data || data.length === 0 || !data[0].v_id) {
      return { success: false, error: 'PIN incorrect' };
    }
    const u: Utilisateur = { id: data[0].v_id, prenom: data[0].v_prenom, role: data[0].v_role };
    setUser(u);
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(u));
    return { success: true };
  };

  const logout = () => {
    setUser(null);
    sessionStorage.removeItem(STORAGE_KEY);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
