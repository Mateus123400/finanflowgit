import React, { useState, useEffect } from 'react';
import {
  X,
  DollarSign,
  Briefcase,
  CheckCircle2,
  Sparkles,
  Zap,
  TrendingUp,
  Plus,
} from 'lucide-react';
import { IncomeActivity, IncomeEntry, IncomeNature } from '../types';
import { getTodayDateInputString } from '../utils/formatters';

interface IncomeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (income: Omit<IncomeEntry, 'id'>, editId?: string) => void;
  initialData?: IncomeEntry | null;
  monthId: string;
  activities?: IncomeActivity[];
  onOpenActivitiesModal?: () => void;
}

export const IncomeModal: React.FC<IncomeModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialData,
  monthId,
  activities = [],
  onOpenActivitiesModal,
}) => {
  const [description, setDescription] = useState('');
  const [amountStr, setAmountStr] = useState('');
  const [date, setDate] = useState('');
  const [sourceType, setSourceType] = useState<IncomeEntry['sourceType']>('salario');
  const [incomeNature, setIncomeNature] = useState<IncomeNature>('active');
  const [activityId, setActivityId] = useState<string>('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        setDescription(initialData.description);
        setAmountStr(String(initialData.amount || ''));
        setDate(initialData.date || `${monthId}-05`);
        setSourceType(initialData.sourceType || 'salario');
        setIncomeNature(initialData.incomeNature || (initialData.sourceType === 'dividendos' ? 'passive' : 'active'));
        setActivityId(initialData.activityId || '');
      } else {
        setDescription('');
        setAmountStr('');
        const today = getTodayDateInputString();
        const defaultDate = today.startsWith(monthId) ? today : `${monthId}-05`;
        setDate(defaultDate);
        setSourceType('salario');
        setIncomeNature('active');
        setActivityId('');
      }
      setError('');
    }
  }, [isOpen, initialData, monthId]);

  if (!isOpen) return null;

  const handleSelectActivity = (actId: string) => {
    setActivityId(actId);
    if (actId) {
      const selected = activities.find((a) => a.id === actId);
      if (selected) {
        setIncomeNature(selected.defaultType);
      }
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const numAmount = parseFloat(amountStr.replace(',', '.'));

    if (!description.trim()) {
      setError('Por favor, informe a descrição da fonte de renda.');
      return;
    }
    if (isNaN(numAmount) || numAmount <= 0) {
      setError('Informe um valor de renda válido maior que zero.');
      return;
    }

    onSave(
      {
        description: description.trim(),
        amount: Math.round(numAmount * 100) / 100,
        date: date || `${monthId}-05`,
        sourceType,
        incomeNature,
        activityId: activityId || undefined,
      },
      initialData?.id
    );
    onClose();
  };

  // Filtrar atividades ativas ou a selecionada atualmente
  const selectableActivities = activities.filter((a) => a.isActive || a.id === activityId);

  const quickPresets = [
    { desc: 'Salário Principal', type: 'salario' as const, nature: 'active' as const },
    { desc: 'Freelance / Projeto Extra', type: 'freelance' as const, nature: 'active' as const },
    { desc: 'Dividendos & Rendimentos', type: 'dividendos' as const, nature: 'passive' as const },
    { desc: 'Aluguel Recebido', type: 'renda_extra' as const, nature: 'passive' as const },
    { desc: 'Venda de Produtos / Infoproduto', type: 'renda_extra' as const, nature: 'active' as const },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        id="income-modal-container"
        className="bg-slate-900 border border-slate-800 text-slate-100 w-full max-w-md rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800/80 bg-slate-900/90">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20">
              <DollarSign className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-white">
                {initialData ? 'Editar Renda' : 'Adicionar Entrada de Renda'}
              </h2>
              <p className="text-xs text-slate-400">Classifique como Renda Ativa ou Passiva</p>
            </div>
          </div>
          <button
            id="close-income-modal-btn"
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto flex-1 custom-scrollbar">
          {error && (
            <div className="p-3 text-sm text-rose-300 bg-rose-950/40 border border-rose-800/50 rounded-xl">
              {error}
            </div>
          )}

          {/* Seletor Renda Ativa vs Passiva */}
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">
              Classificação da Renda *
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setIncomeNature('active')}
                className={`flex items-center justify-center gap-2 p-3 rounded-xl border font-semibold text-xs transition-all ${
                  incomeNature === 'active'
                    ? 'bg-blue-600/20 border-blue-500 text-blue-200 shadow-sm shadow-blue-500/20'
                    : 'bg-slate-800/50 border-slate-750 text-slate-400 hover:text-slate-200'
                }`}
              >
                <Zap className="w-4 h-4 text-blue-400" />
                <span>Renda Ativa</span>
              </button>

              <button
                type="button"
                onClick={() => setIncomeNature('passive')}
                className={`flex items-center justify-center gap-2 p-3 rounded-xl border font-semibold text-xs transition-all ${
                  incomeNature === 'passive'
                    ? 'bg-emerald-600/20 border-emerald-500 text-emerald-200 shadow-sm shadow-emerald-500/20'
                    : 'bg-slate-800/50 border-slate-750 text-slate-400 hover:text-slate-200'
                }`}
              >
                <TrendingUp className="w-4 h-4 text-emerald-400" />
                <span>Renda Passiva</span>
              </button>
            </div>
            <span className="text-[11px] text-slate-500 mt-1 block">
              {incomeNature === 'active'
                ? '💼 Fruto do seu trabalho direto (salário, consultoria, vendas)'
                : '🌱 Ganhos automáticos e patrimoniais (aluguéis, dividendos, juros)'}
            </span>
          </div>

          {/* Quick Presets */}
          {!initialData && (
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5 flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5 text-blue-400" />
                Sugestões Rápidas:
              </label>
              <div className="flex flex-wrap gap-1.5">
                {quickPresets.map((preset, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      setDescription(preset.desc);
                      setSourceType(preset.type);
                      setIncomeNature(preset.nature);
                    }}
                    className="text-[11px] px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-750 text-slate-300 border border-slate-700 transition-colors"
                  >
                    {preset.desc}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Description */}
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">
              Descrição da Renda *
            </label>
            <input
              id="income-description-input"
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Ex: Salário CLT, Freelance Design, Dividendos MXRF11..."
              required
              className="w-full px-3.5 py-2.5 bg-slate-800/90 border border-slate-700 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            />
          </div>

          {/* Vínculo com Atividade de Renda */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-medium text-slate-300">
                Atividade de Renda (opcional)
              </label>
              {onOpenActivitiesModal && (
                <button
                  type="button"
                  onClick={onOpenActivitiesModal}
                  className="text-[11px] text-blue-400 hover:text-blue-300 inline-flex items-center gap-0.5"
                >
                  <Plus className="w-3 h-3" />
                  Gerenciar Atividades
                </button>
              )}
            </div>
            <select
              id="income-activity-select"
              value={activityId}
              onChange={(e) => handleSelectActivity(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-800/90 border border-slate-700 rounded-xl text-sm text-white focus:outline-none focus:border-blue-500 [color-scheme:dark]"
            >
              <option value="">Nenhuma atividade vinculada</option>
              {selectableActivities.map((act) => (
                <option key={act.id} value={act.id}>
                  {act.name} {act.defaultType === 'passive' ? '(Passiva)' : '(Ativa)'} {!act.isActive ? '[Arquivada]' : ''}
                </option>
              ))}
            </select>
          </div>

          {/* Amount and Date */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Valor (R$) *
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-sm font-semibold">
                  R$
                </span>
                <input
                  id="income-amount-input"
                  type="number"
                  step="0.01"
                  min="0.01"
                  value={amountStr}
                  onChange={(e) => setAmountStr(e.target.value)}
                  placeholder="0,00"
                  required
                  className="w-full pl-10 pr-3.5 py-2.5 bg-slate-800/90 border border-slate-700 rounded-xl text-sm font-semibold text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Data do Recebimento
              </label>
              <input
                id="income-date-input"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-800/90 border border-slate-700 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 [color-scheme:dark]"
              />
            </div>
          </div>

          {/* Source Type */}
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">
              Tipo / Canal de Recebimento
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {[
                { id: 'salario', label: 'Salário / Pró-labore' },
                { id: 'freelance', label: 'Freelance / PJ' },
                { id: 'dividendos', label: 'Dividendos / Invest.' },
                { id: 'renda_extra', label: 'Renda Extra' },
                { id: 'outros', label: 'Outros' },
              ].map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setSourceType(t.id as any)}
                  className={`py-2 px-2.5 rounded-xl text-xs font-medium border text-center transition-all ${
                    sourceType === t.id
                      ? 'bg-blue-600/25 border-blue-500 text-blue-200 shadow-sm'
                      : 'bg-slate-800/50 border-slate-750 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
            <button
              id="cancel-income-modal-btn"
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-slate-300 hover:text-white hover:bg-slate-800 rounded-xl transition-colors"
            >
              Cancelar
            </button>
            <button
              id="save-income-modal-btn"
              type="submit"
              className="flex items-center gap-2 px-5 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-500 active:bg-blue-700 rounded-xl shadow-lg shadow-blue-600/25 transition-all"
            >
              <CheckCircle2 className="w-4 h-4" />
              {initialData ? 'Atualizar Renda' : 'Salvar Renda'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

