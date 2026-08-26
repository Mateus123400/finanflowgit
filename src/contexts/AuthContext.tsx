import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from 'react';
import { insforge } from '../lib/insforge';
import type { InsforgeUser } from '../lib/insforge';

interface AuthContextValue {
  user: InsforgeUser | null;
  loading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue>({
  user: null,
  loading: true,
  signOut: async () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<InsforgeUser | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshUser = async () => {
    const { data } = await insforge.auth.getCurrentUser();
    setUser((data?.user as InsforgeUser) ?? null);
    setLoading(false);
  };

  useEffect(() => {
    // 1. Verificar sessão existente no carregamento inicial.
    //    O SDK detecta e troca automaticamente o insforge_code do OAuth callback neste ponto.
    refreshUser();

    // 2. Escutar mudanças de estado de autenticação em tempo real.
    //    Isso garante que quando o SDK finaliza o processamento do callback OAuth do Google
    //    (emitindo "signedIn"), o contexto atualize o usuário sem precisar de reload.
    const unsubscribe = insforge.auth.onAuthStateChange((event) => {
      if (event === 'signedIn' || event === 'tokenRefreshed') {
        refreshUser();
      } else if (event === 'signedOut') {
        setUser(null);
        setLoading(false);
      }
    });

    return () => {
      unsubscribe();
    };
  }, []);

  const signOut = async () => {
    await insforge.auth.signOut();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
