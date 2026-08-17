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
    let cancelled = false;
    const stored = sessionStorage.getItem(STORAGE_KEY);
    if (!stored) {
      setLoading(false);
      return;
    }
    let parsed: Utilisateur | null = null;
    try {
      parsed = JSON.parse(stored);
    } catch {
      sessionStorage.removeItem(STORAGE_KEY);
      setLoading(false);
      return;
    }
    // Validate the stored session still exists in the database
    // (a reset may have deleted non-organisateur accounts)
    supabase
      .from('utilisateurs')
      .select('id')
      .eq('id', parsed!.id)
      .maybeSingle()
      .then(({ data }) => {
        if (cancelled) return;
        if (data) {
          setUser(parsed);
        } else {
          sessionStorage.removeItem(STORAGE_KEY);
        }
        setLoading(false);
      })
      .catch(() => {
        if (cancelled) return;
        setUser(parsed);
        setLoading(false);
      });
    return () => {
      cancelled = true;
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
