import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase, Utilisateur, RoleSupplementaire } from '@/lib/supabase';

interface AuthContextValue {
  user: Utilisateur | null;
  rolesSupplementaires: RoleSupplementaire[];
  loading: boolean;
  login: (pin: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  hasRoleSupplementaire: (role: RoleSupplementaire) => boolean;
  isTreasury: boolean;
  isController: boolean;
}

const AuthContext = createContext<AuthContextValue | null>(null);

const STORAGE_KEY = 'lmc_user';

// Safe storage wrapper for Safari private mode
const safeStorage = {
  getItem: (key: string): string | null => {
    try {
      return sessionStorage.getItem(key);
    } catch (e) {
      console.warn('SessionStorage not available (private mode?)');
      return null;
    }
  },
  setItem: (key: string, value: string): void => {
    try {
      sessionStorage.setItem(key, value);
    } catch (e) {
      console.warn('SessionStorage not available (private mode?)');
    }
  },
  removeItem: (key: string): void => {
    try {
      sessionStorage.removeItem(key);
    } catch (e) {
      console.warn('SessionStorage not available (private mode?)');
    }
  }
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<Utilisateur | null>(null);
  const [rolesSupplementaires, setRolesSupplementaires] = useState<RoleSupplementaire[]>([]);
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
    
    const stored = safeStorage.getItem(STORAGE_KEY);
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
      safeStorage.removeItem(STORAGE_KEY);
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
          // Fetch supplementary roles
          supabase.rpc('obtenir_roles_supp', { p_utilisateur_id: parsed.id }).then(({ data: rolesData, error: rolesError }) => {
            if (rolesError) {
              console.error('Erreur lors de la récupération des rôles (session):', rolesError);
            }
            if (rolesData) {
              const roles = rolesData.roles || [];
              console.log('Rôles supplémentaires (session):', roles);
              setRolesSupplementaires(roles);
            }
          });
        } else {
          console.log('AuthContext: Session no longer valid');
          safeStorage.removeItem(STORAGE_KEY);
        }
        setLoading(false);
      })
      .catch((err) => {
        console.error('AuthContext: Unexpected error:', err);
        if (cancelled) return;
        clearTimeout(timeoutId);
        // On network error, use stored session for offline capability
        setUser(parsed);
        // Try to fetch supplementary roles even on network error
        if (parsed) {
          supabase.rpc('obtenir_roles_supp', { p_utilisateur_id: parsed.id }).then(({ data: rolesData }) => {
            if (rolesData) {
              const roles = rolesData.roles || [];
              setRolesSupplementaires(roles);
            }
          });
        }
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
    safeStorage.setItem(STORAGE_KEY, JSON.stringify(u));
    
    // Fetch supplementary roles
    const { data: rolesData, error: rolesError } = await supabase.rpc('obtenir_roles_supp', { p_utilisateur_id: u.id });
    if (rolesError) {
      console.error('Erreur lors de la récupération des rôles supplémentaires:', rolesError);
    }
    if (rolesData) {
      const roles = rolesData.roles || [];
      console.log('Rôles supplémentaires récupérés:', roles);
      setRolesSupplementaires(roles);
    } else {
      console.log('Aucun rôle supplémentaire trouvé');
    }
    
    return { success: true };
  };

  const logout = () => {
    setUser(null);
    setRolesSupplementaires([]);
    safeStorage.removeItem(STORAGE_KEY);
  };

  const hasRoleSupplementaire = (role: RoleSupplementaire): boolean => {
    return rolesSupplementaires.some(r => r.role_supp === role);
  };

  const isTreasury = hasRoleSupplementaire('treasurer');
  const isController = hasRoleSupplementaire('controller');

  return (
    <AuthContext.Provider value={{ user, rolesSupplementaires, loading, login, logout, hasRoleSupplementaire, isTreasury, isController }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
