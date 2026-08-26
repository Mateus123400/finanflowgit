import React, { useState } from 'react';
import {
  X,
  LogOut,
  Trash2,
  User,
  Mail,
  Shield,
  AlertTriangle,
  Loader2,
  ChevronRight,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { insforge } from '../lib/insforge';
import type { InsforgeUser } from '../lib/insforge';

interface UserAccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: InsforgeUser;
}

export function UserAccountModal({ isOpen, onClose, user }: UserAccountModalProps) {
  const { signOut } = useAuth();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteInput, setDeleteInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const displayName = user.profile?.name || user.email?.split('@')[0] || 'Usuário';
  const avatarInitial = (user.profile?.name?.charAt(0) || user.email?.charAt(0) || 'U').toUpperCase();

  const handleSignOut = async () => {
    setLoading(true);
    await signOut();
    setLoading(false);
    onClose();
  };

  const handleDeleteAccount = async () => {
    if (deleteInput !== 'EXCLUIR') {
      setError('Digite EXCLUIR para confirmar.');
      return;
    }
    setLoading(true);
    try {
      // Deletar todos os dados do usuário primeiro
      await Promise.all([
        insforge.database.from('transactions').delete().eq('user_id', user.id),
        insforge.database.from('incomes').delete().eq('user_id', user.id),
        insforge.database.from('category_targets').delete().eq('user_id', user.id),
        insforge.database.from('months').delete().eq('user_id', user.id),
      ]);
      // Fazer logout
      await signOut();
      onClose();
    } catch (e) {
      setError('Erro ao excluir conta. Tente novamente.');
      setLoading(false);
    }
  };

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Bottom Sheet no mobile / Modal centralizado no desktop */}
      <div className="fixed inset-x-0 bottom-0 z-50 md:inset-0 md:flex md:items-center md:justify-center md:p-4">
        <div className="bg-slate-900 border border-slate-800 rounded-t-3xl md:rounded-2xl w-full md:max-w-sm shadow-2xl overflow-hidden animate-in slide-in-from-bottom-4 md:zoom-in-95 duration-200">

          {/* Handle bar (mobile) */}
          <div className="flex justify-center pt-3 pb-1 md:hidden">
            <div className="w-10 h-1 bg-slate-700 rounded-full" />
          </div>

          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800">
            <h2 className="text-sm font-semibold text-white">Minha Conta</h2>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-500 hover:text-slate-300 hover:bg-slate-800 rounded-lg transition"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {!showDeleteConfirm ? (
            <div className="p-5 space-y-4">
              {/* Avatar + Info */}
              <div className="flex items-center gap-4 p-4 bg-slate-800/60 rounded-2xl border border-slate-700/50">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500 to-violet-600 flex items-center justify-center text-white text-xl font-bold shadow-lg shadow-blue-500/20 shrink-0">
                  {user.profile?.avatar_url ? (
                    <img
                      src={user.profile.avatar_url}
                      alt={displayName}
                      className="w-full h-full rounded-2xl object-cover"
                    />
                  ) : (
                    avatarInitial
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-white font-semibold truncate">{displayName}</p>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <Mail className="w-3 h-3 text-slate-500 shrink-0" />
                    <p className="text-slate-400 text-xs truncate">{user.email}</p>
                  </div>
                  <div className="flex items-center gap-1.5 mt-1">
                    <Shield className="w-3 h-3 text-emerald-500 shrink-0" />
                    <span className="text-emerald-400 text-[11px]">
                      {user.emailVerified ? 'Email verificado' : 'Email não verificado'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Login providers */}
              <div className="px-1">
                <p className="text-xs text-slate-500 mb-2">Conectado via</p>
                <div className="flex gap-2 flex-wrap">
                  {user.providers?.map((p) => (
                    <span
                      key={p}
                      className="px-2.5 py-1 bg-slate-800 border border-slate-700 rounded-lg text-xs text-slate-300 capitalize flex items-center gap-1.5"
                    >
                      {p === 'google' && (
                        <svg className="w-3 h-3" viewBox="0 0 24 24">
                          <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                          <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                          <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                          <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                        </svg>
                      )}
                      {p === 'email' ? 'Email & Senha' : p.charAt(0).toUpperCase() + p.slice(1)}
                    </span>
                  ))}
                </div>
              </div>

              <div className="border-t border-slate-800" />

              {/* Ações */}
              <div className="space-y-2">
                {/* Sair da conta */}
                <button
                  id="modal-signout-btn"
                  onClick={handleSignOut}
                  disabled={loading}
                  className="w-full flex items-center justify-between px-4 py-3.5 bg-slate-800/50 hover:bg-slate-800 border border-slate-700/50 hover:border-slate-700 rounded-2xl transition-all group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-slate-700 flex items-center justify-center group-hover:bg-blue-500/20 transition">
                      {loading ? (
                        <Loader2 className="w-4 h-4 text-slate-300 animate-spin" />
                      ) : (
                        <LogOut className="w-4 h-4 text-slate-300 group-hover:text-blue-400 transition" />
                      )}
                    </div>
                    <div className="text-left">
                      <p className="text-sm font-medium text-slate-200">Sair da conta</p>
                      <p className="text-xs text-slate-500">Encerrar sessão atual</p>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-600 group-hover:text-slate-400 transition" />
                </button>

                {/* Excluir conta */}
                <button
                  id="modal-delete-account-btn"
                  onClick={() => setShowDeleteConfirm(true)}
                  className="w-full flex items-center justify-between px-4 py-3.5 bg-rose-500/5 hover:bg-rose-500/10 border border-rose-500/20 hover:border-rose-500/30 rounded-2xl transition-all group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-rose-500/10 flex items-center justify-center group-hover:bg-rose-500/20 transition">
                      <Trash2 className="w-4 h-4 text-rose-400" />
                    </div>
                    <div className="text-left">
                      <p className="text-sm font-medium text-rose-400">Excluir conta</p>
                      <p className="text-xs text-rose-400/60">Apaga todos os seus dados</p>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-rose-500/40 group-hover:text-rose-400 transition" />
                </button>
              </div>
            </div>
          ) : (
            /* Confirmação de exclusão */
            <div className="p-5 space-y-4">
              <div className="flex items-start gap-3 p-4 bg-rose-500/10 border border-rose-500/30 rounded-2xl">
                <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
                <div>
                  <p className="text-rose-300 font-semibold text-sm">Ação irreversível!</p>
                  <p className="text-rose-400/80 text-xs mt-1 leading-relaxed">
                    Todos os seus meses, transações, rendas e metas serão excluídos permanentemente. Não é possível desfazer.
                  </p>
                </div>
              </div>

              <div>
                <label className="block text-xs text-slate-400 mb-2">
                  Digite <span className="font-bold text-rose-400">EXCLUIR</span> para confirmar:
                </label>
                <input
                  type="text"
                  value={deleteInput}
                  onChange={(e) => { setDeleteInput(e.target.value); setError(null); }}
                  placeholder="EXCLUIR"
                  className="w-full px-4 py-2.5 bg-slate-800 border border-rose-500/30 focus:border-rose-500 text-slate-100 placeholder-slate-600 rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-rose-500 transition"
                />
                {error && <p className="text-rose-400 text-xs mt-1.5">{error}</p>}
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => { setShowDeleteConfirm(false); setDeleteInput(''); setError(null); }}
                  className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium rounded-xl text-sm transition"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleDeleteAccount}
                  disabled={loading || deleteInput !== 'EXCLUIR'}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-rose-600 hover:bg-rose-500 text-white font-medium rounded-xl text-sm transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Excluir tudo'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
