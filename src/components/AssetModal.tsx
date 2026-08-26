import React, { useState, useEffect } from 'react';
import {
  X,
  Building2,
  TrendingUp,
  Wallet,
  Briefcase,
  Car,
  HelpCircle,
  CheckCircle2,
  Calendar,
  Landmark,
} from 'lucide-react';
import { AssetItem, AssetType } from '../types';
import { getTodayDateInputString } from '../utils/formatters';

interface AssetModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (asset: AssetItem) => Promise<void>;
  initialData?: AssetItem | null;
}

const ASSET_TYPE_OPTIONS: { id: AssetType; label: string; icon: React.ReactNode; desc: string }[] = [
  { id: 'imovel', label: 'Imóvel', icon: <Building2 className="w-4 h-4" />, desc: 'Casas, apartamentos, terrenos' },
  { id: 'investimento', label: 'Investimentos', icon: <TrendingUp className="w-4 h-4" />, desc: 'Ações, FIIs, Tesouro, Cripto' },
  { id: 'conta', label: 'Dinheiro / Contas', icon: <Wallet className="w-4 h-4" />, desc: 'Saldo bancário, reserva, CDB' },
  { id: 'negocio', label: 'Negócio / Empresa', icon: <Briefcase className="w-4 h-4" />, desc: 'Participação societária, estoque' },
  { id: 'veiculo', label: 'Veículo', icon: <Car className="w-4 h-4" />, desc: 'Carros, motos, embarcações' },
  { id: 'outro', label: 'Outro Ativo', icon: <HelpCircle className="w-4 h-4" />, desc: 'Joias, relógios, bens de valor' },
];

export const AssetModal: React.FC<AssetModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialData,
}) => {
  const [name, setName] = useState('');
  const [type, setType] = useState<AssetType>('investimento');
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
        setType('investimento');
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
      setError('Por favor, informe o nome do ativo.');
      return;
    }

    const val = parseFloat(currentValueStr.replace(',', '.'));
    if (isNaN(val) || val < 0) {
      setError('Informe um valor de avaliação válido (maior ou igual a zero).');
      return;
    }

    setSaving(true);
    try {
      const now = new Date().toISOString();
      const asset: AssetItem = {
        id: initialData?.id || `asset-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
        name: name.trim(),
        type,
        currentValue: Math.round(val * 100) / 100,
        valuationDate: valuationDate || getTodayDateInputString(),
        notes: notes.trim() || undefined,
        createdAt: initialData?.createdAt || now,
        updatedAt: now,
      };

      await onSave(asset);
      onClose();
    } catch (err) {
      console.error(err);
      setError('Erro ao salvar ativo. Tente novamente.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        id="asset-modal-container"
        className="bg-slate-900 border border-slate-800 text-slate-100 w-full max-w-md rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800/80 bg-slate-900/90">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <Landmark className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-white">
                {initialData ? 'Editar Ativo' : 'Adicionar Ativo Patrimonial'}
              </h2>
              <p className="text-xs text-slate-400">Bens, direitos e patrimônio que somam ao seu valor</p>
            </div>
          </div>
          <button
            id="close-asset-modal-btn"
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
              Nome do Ativo *
            </label>
            <input
              id="asset-name-input"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: Apartamento Jardins, Carteira XP, Reserva Nubank..."
              required
              className="w-full px-3.5 py-2.5 bg-slate-800/90 border border-slate-700 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
            />
          </div>

          {/* Tipo de Ativo */}
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-2">
              Tipo de Ativo *
            </label>
            <div className="grid grid-cols-2 gap-2">
              {ASSET_TYPE_OPTIONS.map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setType(opt.id)}
                  className={`flex items-start gap-2 p-2.5 rounded-xl border text-left transition-all ${
                    type === opt.id
                      ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300 shadow-sm'
                      : 'bg-slate-800/50 border-slate-750 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <span className="mt-0.5 text-emerald-400">{opt.icon}</span>
                  <div>
                    <div className="text-xs font-semibold">{opt.label}</div>
                    <div className="text-[10px] text-slate-500 line-clamp-1">{opt.desc}</div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Valor Atual e Data de Avaliação */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Valor Atual (R$) *
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-sm font-semibold">
                  R$
                </span>
                <input
                  id="asset-value-input"
                  type="number"
                  step="0.01"
                  min="0"
                  value={currentValueStr}
                  onChange={(e) => setCurrentValueStr(e.target.value)}
                  placeholder="0,00"
                  required
                  className="w-full pl-10 pr-3.5 py-2.5 bg-slate-800/90 border border-slate-700 rounded-xl text-sm font-semibold text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Data da Avaliação
              </label>
              <input
                id="asset-date-input"
                type="date"
                value={valuationDate}
                onChange={(e) => setValuationDate(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-800/90 border border-slate-700 rounded-xl text-sm text-white focus:outline-none focus:border-emerald-500 [color-scheme:dark]"
              />
            </div>
          </div>

          {/* Observações */}
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">
              Observações (opcional)
            </label>
            <textarea
              id="asset-notes-input"
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Ex: Valor de mercado segundo corretor, rendimento médio de 0.9% ao mês..."
              className="w-full px-3.5 py-2 bg-slate-800/90 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 resize-none"
            />
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
            <button
              id="cancel-asset-btn"
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-slate-300 hover:text-white hover:bg-slate-800 rounded-xl transition-colors"
            >
              Cancelar
            </button>
            <button
              id="save-asset-btn"
              type="submit"
              disabled={saving}
              className="flex items-center gap-2 px-5 py-2 text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 rounded-xl shadow-lg shadow-emerald-600/25 transition-all"
            >
              <CheckCircle2 className="w-4 h-4" />
              {saving ? 'Salvando...' : initialData ? 'Atualizar Ativo' : 'Salvar Ativo'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
