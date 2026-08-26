import React, { useState, useEffect } from 'react';
import {
  X,
  CreditCard,
  FileText,
  AlertCircle,
  HelpCircle,
  CheckCircle2,
  Calendar,
  Layers,
} from 'lucide-react';
import { LiabilityItem, LiabilityType } from '../types';
import { getTodayDateInputString } from '../utils/formatters';

interface LiabilityModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (liability: LiabilityItem) => Promise<void>;
  initialData?: LiabilityItem | null;
}

const LIABILITY_TYPE_OPTIONS: { id: LiabilityType; label: string; icon: React.ReactNode; desc: string }[] = [
  { id: 'financiamento', label: 'Financiamento', icon: <Layers className="w-4 h-4" />, desc: 'Imobiliário, auto, longo prazo' },
  { id: 'emprestimo', label: 'Empréstimo', icon: <FileText className="w-4 h-4" />, desc: 'Bancário, pessoal, consignado' },
  { id: 'divida', label: 'Dívida / Pendência', icon: <AlertCircle className="w-4 h-4" />, desc: 'Cheque especial, impostos, renegociação' },
  { id: 'parcelamento', label: 'Parcelamento', icon: <CreditCard className="w-4 h-4" />, desc: 'Fatura de cartão, compras parceladas' },
  { id: 'outro', label: 'Outro Passivo', icon: <HelpCircle className="w-4 h-4" />, desc: 'Outros compromissos financeiros' },
];

export const LiabilityModal: React.FC<LiabilityModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialData,
}) => {
  const [name, setName] = useState('');
  const [type, setType] = useState<LiabilityType>('financiamento');
  const [currentValueStr, setCurrentValueStr] = useState('');
  const [valuationDate, setValuationDate] = useState('');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        setName(initialData.name);
        setType(initialData.type);
        setCurrentValueStr(String(initialData.currentValue || ''));
        setValuationDate(initialData.valuationDate || getTodayDateInputString());
        setNotes(initialData.notes || '');
      } else {
        setName('');
        setType('financiamento');
        setCurrentValueStr('');
        setValuationDate(getTodayDateInputString());
        setNotes('');
      }
      setError('');
    }
  }, [isOpen, initialData]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Por favor, informe o nome do passivo/dívida.');
      return;
    }

    const val = parseFloat(currentValueStr.replace(',', '.'));
    if (isNaN(val) || val < 0) {
      setError('Informe um saldo devedor válido (maior ou igual a zero).');
      return;
    }

    setSaving(true);
    try {
      const now = new Date().toISOString();
      const liability: LiabilityItem = {
        id: initialData?.id || `liab-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
        name: name.trim(),
        type,
        currentValue: Math.round(val * 100) / 100,
        valuationDate: valuationDate || getTodayDateInputString(),
        notes: notes.trim() || undefined,
        createdAt: initialData?.createdAt || now,
        updatedAt: now,
      };

      await onSave(liability);
      onClose();
    } catch (err) {
      console.error(err);
      setError('Erro ao salvar passivo. Tente novamente.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        id="liability-modal-container"
        className="bg-slate-900 border border-slate-800 text-slate-100 w-full max-w-md rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800/80 bg-slate-900/90">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-rose-500/10 text-rose-400 border border-rose-500/20">
              <CreditCard className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-white">
                {initialData ? 'Editar Passivo' : 'Adicionar Passivo / Dívida'}
              </h2>
              <p className="text-xs text-slate-400">Compromissos, financiamentos e saldo devedor</p>
            </div>
          </div>
          <button
            id="close-liability-modal-btn"
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto flex-1 custom-scrollbar">
          {error && (
            <div className="p-3 text-xs text-rose-300 bg-rose-950/40 border border-rose-800/50 rounded-xl">
              {error}
            </div>
          )}

          {/* Nome */}
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">
              Nome do Passivo / Dívida *
            </label>
            <input
              id="liability-name-input"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: Financiamento Caixa, Empréstimo BB, Cartão de Crédito..."
              required
              className="w-full px-3.5 py-2.5 bg-slate-800/90 border border-slate-700 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-rose-500"
            />
          </div>

          {/* Tipo de Passivo */}
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-2">
              Tipo de Passivo *
            </label>
            <div className="grid grid-cols-2 gap-2">
              {LIABILITY_TYPE_OPTIONS.map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setType(opt.id)}
                  className={`flex items-start gap-2 p-2.5 rounded-xl border text-left transition-all ${
                    type === opt.id
                      ? 'bg-rose-500/15 border-rose-500/40 text-rose-300 shadow-sm'
                      : 'bg-slate-800/50 border-slate-750 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <span className="mt-0.5 text-rose-400">{opt.icon}</span>
                  <div>
                    <div className="text-xs font-semibold">{opt.label}</div>
                    <div className="text-[10px] text-slate-500 line-clamp-1">{opt.desc}</div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Saldo Devedor Atual e Data */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Saldo Devedor Atual (R$) *
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-sm font-semibold">
                  R$
                </span>
                <input
                  id="liability-value-input"
                  type="number"
                  step="0.01"
                  min="0"
                  value={currentValueStr}
                  onChange={(e) => setCurrentValueStr(e.target.value)}
                  placeholder="0,00"
                  required
                  className="w-full pl-10 pr-3.5 py-2.5 bg-slate-800/90 border border-slate-700 rounded-xl text-sm font-semibold text-white placeholder-slate-500 focus:outline-none focus:border-rose-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Data de Posição
              </label>
              <input
                id="liability-date-input"
                type="date"
                value={valuationDate}
                onChange={(e) => setValuationDate(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-800/90 border border-slate-700 rounded-xl text-sm text-white focus:outline-none focus:border-rose-500 [color-scheme:dark]"
              />
            </div>
          </div>

          {/* Observações */}
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">
              Observações (opcional)
            </label>
            <textarea
              id="liability-notes-input"
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Ex: Taxa de juros 1.2% a.m., restam 36 parcelas de R$ 1.200..."
              className="w-full px-3.5 py-2 bg-slate-800/90 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-rose-500 resize-none"
            />
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
            <button
              id="cancel-liability-btn"
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-slate-300 hover:text-white hover:bg-slate-800 rounded-xl transition-colors"
            >
              Cancelar
            </button>
            <button
              id="save-liability-btn"
              type="submit"
              disabled={saving}
              className="flex items-center gap-2 px-5 py-2 text-sm font-medium text-white bg-rose-600 hover:bg-rose-500 active:bg-rose-700 rounded-xl shadow-lg shadow-rose-600/25 transition-all"
            >
              <CheckCircle2 className="w-4 h-4" />
              {saving ? 'Salvando...' : initialData ? 'Atualizar Passivo' : 'Salvar Passivo'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
