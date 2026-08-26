import React, { useState } from 'react';
import {
  X,
  Plus,
  Briefcase,
  Archive,
  RotateCcw,
  Edit2,
  CheckCircle2,
  Sparkles,
  Zap,
  TrendingUp,
  Tag,
} from 'lucide-react';
import { IncomeActivity, IncomeNature } from '../types';

interface IncomeActivitiesModalProps {
  isOpen: boolean;
  onClose: () => void;
  activities: IncomeActivity[];
  onSaveActivity: (activity: IncomeActivity) => Promise<void>;
  onToggleArchive: (activityId: string, isActive: boolean) => Promise<void>;
}

export const IncomeActivitiesModal: React.FC<IncomeActivitiesModalProps> = ({
  isOpen,
  onClose,
  activities,
  onSaveActivity,
  onToggleArchive,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [defaultType, setDefaultType] = useState<IncomeNature>('active');
  const [color, setColor] = useState('#3b82f6');
  const [error, setError] = useState('');
  const [filterActive, setFilterActive] = useState<'all' | 'active' | 'archived'>('all');
  const [saving, setSaving] = useState(false);

  if (!isOpen) return null;

  const colorOptions = [
    '#3b82f6', // Blue
    '#10b981', // Emerald
    '#8b5cf6', // Purple
    '#f59e0b', // Amber
    '#ec4899', // Pink
    '#06b6d4', // Cyan
    '#f97316', // Orange
    '#64748b', // Slate
  ];

  const handleStartCreate = () => {
    setIsEditing(true);
    setEditingId(null);
    setName('');
    setDefaultType('active');
    setColor('#3b82f6');
    setError('');
  };

  const handleStartEdit = (act: IncomeActivity) => {
    setIsEditing(true);
    setEditingId(act.id);
    setName(act.name);
    setDefaultType(act.defaultType);
    setColor(act.color || '#3b82f6');
    setError('');
  };

  const handleCancelForm = () => {
    setIsEditing(false);
    setEditingId(null);
    setName('');
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Por favor, informe o nome da atividade.');
      return;
    }

    setSaving(true);
    try {
      const now = new Date().toISOString();
      const newActivity: IncomeActivity = {
        id: editingId || `act-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
        name: name.trim(),
        defaultType,
        isActive: true,
        color,
        createdAt: now,
        updatedAt: now,
      };

      await onSaveActivity(newActivity);
      handleCancelForm();
    } catch (err) {
      console.error(err);
      setError('Erro ao salvar atividade. Tente novamente.');
    } finally {
      setSaving(false);
    }
  };

  const filteredActivities = activities.filter((act) => {
    if (filterActive === 'active') return act.isActive;
    if (filterActive === 'archived') return !act.isActive;
    return true;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        id="income-activities-modal-container"
        className="bg-slate-900 border border-slate-800 text-slate-100 w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800/80 bg-slate-900/90">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20">
              <Briefcase className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-white">Atividades de Renda & Negócios</h2>
              <p className="text-xs text-slate-400">Gerencie suas fontes e canais geradores de renda</p>
            </div>
          </div>
          <button
            id="close-activities-modal-btn"
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4 overflow-y-auto flex-1 custom-scrollbar">
          {/* Formulário de Criação/Edição */}
          {isEditing ? (
            <form onSubmit={handleSubmit} className="p-4 bg-slate-850 border border-blue-500/30 rounded-xl space-y-3.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-blue-400 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5" />
                  {editingId ? 'Editar Atividade' : 'Nova Atividade de Renda'}
                </span>
                <button
                  type="button"
                  onClick={handleCancelForm}
                  className="text-xs text-slate-400 hover:text-slate-200"
                >
                  Cancelar
                </button>
              </div>

              {error && (
                <div className="p-2.5 text-xs text-rose-300 bg-rose-950/50 border border-rose-800 rounded-lg">
                  {error}
                </div>
              )}

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Nome da Atividade *
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ex: TikTok Shop, Venda de Sites, Aluguel Imóvel..."
                  required
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Tipo Padrão
                  </label>
                  <div className="grid grid-cols-2 gap-1.5 bg-slate-900 p-1 rounded-lg border border-slate-750">
                    <button
                      type="button"
                      onClick={() => setDefaultType('active')}
                      className={`py-1 text-xs font-medium rounded-md transition-all ${
                        defaultType === 'active'
                          ? 'bg-blue-600 text-white'
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      Ativa
                    </button>
                    <button
                      type="button"
                      onClick={() => setDefaultType('passive')}
                      className={`py-1 text-xs font-medium rounded-md transition-all ${
                        defaultType === 'passive'
                          ? 'bg-emerald-600 text-white'
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      Passiva
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Cor de Identificação
                  </label>
                  <div className="flex items-center gap-1.5 pt-0.5">
                    {colorOptions.map((c) => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => setColor(c)}
                        className={`w-6 h-6 rounded-full border-2 transition-transform ${
                          color === c ? 'scale-110 border-white' : 'border-transparent hover:scale-105'
                        }`}
                        style={{ backgroundColor: c }}
                      />
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={handleCancelForm}
                  className="px-3 py-1.5 text-xs text-slate-300 hover:bg-slate-800 rounded-lg"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex items-center gap-1.5 px-4 py-1.5 text-xs font-medium text-white bg-blue-600 hover:bg-blue-500 rounded-lg shadow-md transition-all"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  {saving ? 'Salvando...' : 'Salvar Atividade'}
                </button>
              </div>
            </form>
          ) : (
            <div className="flex items-center justify-between">
              {/* Filtros */}
              <div className="flex items-center gap-1 bg-slate-800/80 p-1 rounded-xl border border-slate-750 text-xs">
                <button
                  type="button"
                  onClick={() => setFilterActive('all')}
                  className={`px-2.5 py-1 rounded-lg font-medium transition-colors ${
                    filterActive === 'all' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Todas ({activities.length})
                </button>
                <button
                  type="button"
                  onClick={() => setFilterActive('active')}
                  className={`px-2.5 py-1 rounded-lg font-medium transition-colors ${
                    filterActive === 'active' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Ativas ({activities.filter((a) => a.isActive).length})
                </button>
                <button
                  type="button"
                  onClick={() => setFilterActive('archived')}
                  className={`px-2.5 py-1 rounded-lg font-medium transition-colors ${
                    filterActive === 'archived' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Arquivadas ({activities.filter((a) => !a.isActive).length})
                </button>
              </div>

              {/* Botão Nova Atividade */}
              <button
                type="button"
                id="btn-add-new-activity"
                onClick={handleStartCreate}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-blue-600 hover:bg-blue-500 rounded-xl shadow-sm transition-all"
              >
                <Plus className="w-3.5 h-3.5" />
                Nova Atividade
              </button>
            </div>
          )}

          {/* Lista de Atividades */}
          <div className="space-y-2 pt-1">
            {filteredActivities.length === 0 ? (
              <div className="text-center py-10 bg-slate-950/40 rounded-xl border border-slate-800 p-6 space-y-2">
                <Briefcase className="w-8 h-8 text-slate-600 mx-auto" />
                <p className="text-sm font-medium text-slate-300">Nenhuma atividade encontrada</p>
                <p className="text-xs text-slate-500 max-w-xs mx-auto">
                  Crie atividades como "E-commerce", "Consultoria", "Dividendos" para organizar seus ganhos e negócios.
                </p>
              </div>
            ) : (
              filteredActivities.map((act) => (
                <div
                  key={act.id}
                  className={`flex items-center justify-between p-3 rounded-xl border transition-all ${
                    act.isActive
                      ? 'bg-slate-800/40 border-slate-750 hover:border-slate-700'
                      : 'bg-slate-900/40 border-slate-850 opacity-60'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="w-3 h-3 rounded-full shrink-0"
                      style={{ backgroundColor: act.color || '#3b82f6' }}
                    />
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-white">{act.name}</span>
                        <span
                          className={`text-[10px] font-medium px-2 py-0.5 rounded-full border ${
                            act.defaultType === 'passive'
                              ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20'
                              : 'bg-blue-500/10 text-blue-300 border-blue-500/20'
                          }`}
                        >
                          {act.defaultType === 'passive' ? 'Renda Passiva' : 'Renda Ativa'}
                        </span>
                        {!act.isActive && (
                          <span className="text-[10px] font-medium px-2 py-0.5 bg-slate-800 text-slate-400 rounded-full border border-slate-700">
                            Arquivada
                          </span>
                        )}
                      </div>
                      <span className="text-[11px] text-slate-500">
                        {act.isActive
                          ? 'Disponível para novos lançamentos e negócios'
                          : 'Oculta para novos lançamentos (histórico preservado)'}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => handleStartEdit(act)}
                      className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-700/60 rounded-lg transition-colors"
                      title="Editar"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => onToggleArchive(act.id, !act.isActive)}
                      className={`p-1.5 rounded-lg transition-colors ${
                        act.isActive
                          ? 'text-slate-400 hover:text-amber-300 hover:bg-amber-950/30'
                          : 'text-emerald-400 hover:text-emerald-300 hover:bg-emerald-950/30'
                      }`}
                      title={act.isActive ? 'Arquivar / Desativar' : 'Reativar'}
                    >
                      {act.isActive ? (
                        <Archive className="w-3.5 h-3.5" />
                      ) : (
                        <RotateCcw className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end px-6 py-3 border-t border-slate-800 bg-slate-900/90">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-slate-300 hover:text-white hover:bg-slate-800 rounded-xl transition-colors"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};
