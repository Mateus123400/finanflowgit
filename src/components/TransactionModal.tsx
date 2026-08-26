import React, { useState, useEffect } from 'react';
import {
  X,
  Calendar,
  DollarSign,
  Tag,
  FileText,
  CheckCircle2,
  RotateCw,
  TrendingUp,
  ArrowUpRight,
  ArrowDownRight,
  Briefcase,
} from 'lucide-react';
import { CategoryId, TransactionEntry } from '../types';
import { CATEGORIES_CONFIG, CATEGORY_IDS } from '../utils/constants';
import { CategoryIcon } from './CategoryIcon';
import { formatCurrency, formatPercent, getTodayDateInputString } from '../utils/formatters';

interface TransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (transaction: Omit<TransactionEntry, 'id'>, editId?: string) => void;
  initialData?: TransactionEntry | null;
  defaultCategoryId?: CategoryId;
  monthId: string;
}

export const TransactionModal: React.FC<TransactionModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialData,
  defaultCategoryId = 'despesas',
  monthId,
}) => {
  const [categoryId, setCategoryId] = useState<CategoryId>(defaultCategoryId);
  const [description, setDescription] = useState('');
  const [amountStr, setAmountStr] = useState('');
  const [investedStr, setInvestedStr] = useState('');
  const [returnStr, setReturnStr] = useState('');
  const [date, setDate] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<TransactionEntry['paymentMethod']>('pix');
  const [notes, setNotes] = useState('');
  const [isRecurring, setIsRecurring] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        setCategoryId(initialData.categoryId);
        setDescription(initialData.description);
        const amt = String(initialData.amount || '');
        setAmountStr(amt);
        setInvestedStr(
          initialData.investedAmount !== undefined
            ? String(initialData.investedAmount)
            : amt
        );
        setReturnStr(
          initialData.returnAmount !== undefined
            ? String(initialData.returnAmount)
            : ''
        );
        setDate(initialData.date || `${monthId}-10`);
        setPaymentMethod(initialData.paymentMethod || 'pix');
        setNotes(initialData.notes || '');
        setIsRecurring(!!initialData.isRecurring);
      } else {
        const cat = defaultCategoryId || 'despesas';
        setCategoryId(cat);
        setDescription('');
        setAmountStr('');
        setInvestedStr('');
        setReturnStr('');
        const today = getTodayDateInputString();
        // If current month matches monthId, use today; otherwise first week of monthId
        const defaultDate = today.startsWith(monthId) ? today : `${monthId}-10`;
        setDate(defaultDate);
        setPaymentMethod('pix');
        setNotes('');
        setIsRecurring(false);
      }
      setError('');
    }
  }, [isOpen, initialData, defaultCategoryId, monthId]);

  if (!isOpen) return null;

  const isNegocios = categoryId === 'negocios';

  // Real-time calculations for Negócios
  const numInvested = parseFloat(investedStr.replace(',', '.')) || 0;
  const numReturn = parseFloat(returnStr.replace(',', '.')) || 0;
  const profitLoss = numReturn - numInvested;
  const roi = numInvested > 0 ? (profitLoss / numInvested) * 100 : 0;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!description.trim()) {
      setError(
        isNegocios
          ? 'Por favor, informe o nome ou descrição do negócio.'
          : 'Por favor, informe a descrição do lançamento.'
      );
      return;
    }

    if (isNegocios) {
      if (isNaN(numInvested) || numInvested < 0) {
        setError('Informe um valor de investimento válido (0 ou superior).');
        return;
      }
      if (isNaN(numReturn) || numReturn < 0) {
        setError('Informe um valor de retorno válido (0 ou superior).');
        return;
      }
      if (numInvested === 0 && numReturn === 0) {
        setError('Informe ao menos o valor investido ou o valor de retorno do negócio.');
        return;
      }

      onSave(
        {
          categoryId: 'negocios',
          description: description.trim(),
          amount: Math.round(numInvested * 100) / 100,
          investedAmount: Math.round(numInvested * 100) / 100,
          returnAmount: Math.round(numReturn * 100) / 100,
          date: date || `${monthId}-01`,
          paymentMethod,
          notes: notes.trim() || undefined,
          isRecurring,
        },
        initialData?.id
      );
    } else {
      const numAmount = parseFloat(amountStr.replace(',', '.'));
      if (isNaN(numAmount) || numAmount <= 0) {
        setError('Informe um valor válido maior que zero.');
        return;
      }

      onSave(
        {
          categoryId,
          description: description.trim(),
          amount: Math.round(numAmount * 100) / 100,
          date: date || `${monthId}-01`,
          paymentMethod,
          notes: notes.trim() || undefined,
          isRecurring,
        },
        initialData?.id
      );
    }

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        id="transaction-modal-container"
        className="bg-slate-900 border border-slate-800 text-slate-100 w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800/80 bg-slate-900/90">
          <div className="flex items-center gap-3">
            <div
              className="p-2 rounded-xl border"
              style={{
                backgroundColor: CATEGORIES_CONFIG[categoryId]?.accentBg,
                borderColor: CATEGORIES_CONFIG[categoryId]?.borderColor,
                color: CATEGORIES_CONFIG[categoryId]?.color,
              }}
            >
              <CategoryIcon categoryId={categoryId} className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-white">
                {initialData
                  ? isNegocios
                    ? 'Editar Negócio'
                    : 'Editar Lançamento'
                  : isNegocios
                  ? 'Novo Negócio / Empreendimento'
                  : 'Novo Lançamento'}
              </h2>
              <p className="text-xs text-slate-400">
                {isNegocios
                  ? 'Cadastre o valor investido e o retorno obtido no negócio'
                  : `Lançamento para ${CATEGORIES_CONFIG[categoryId]?.name}`}
              </p>
            </div>
          </div>
          <button
            id="close-transaction-modal-btn"
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto flex-1 custom-scrollbar">
          {error && (
            <div className="p-3 text-sm text-rose-300 bg-rose-950/40 border border-rose-800/50 rounded-xl">
              {error}
            </div>
          )}

          {/* Category Selector */}
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-2">
              Categoria
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {CATEGORY_IDS.map((catId) => {
                const cat = CATEGORIES_CONFIG[catId];
                const isSelected = categoryId === catId;
                return (
                  <button
                    key={catId}
                    type="button"
                    onClick={() => {
                      setCategoryId(catId);
                      if (catId === 'negocios' && !investedStr && amountStr) {
                        setInvestedStr(amountStr);
                      } else if (catId !== 'negocios' && !amountStr && investedStr) {
                        setAmountStr(investedStr);
                      }
                    }}
                    className={`flex items-center gap-2 p-2.5 rounded-xl border text-left text-xs font-medium transition-all ${
                      isSelected
                        ? 'bg-blue-600/20 border-blue-500 text-blue-300 shadow-sm shadow-blue-500/10'
                        : 'bg-slate-800/60 border-slate-750 hover:border-slate-700 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <CategoryIcon categoryId={catId} className="w-4 h-4 shrink-0" />
                    <span className="truncate">{cat.name}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">
              {isNegocios
                ? 'Nome / Descrição do Negócio *'
                : 'Descrição do Gasto / Aporte *'}
            </label>
            <div className="relative">
              <input
                id="transaction-description-input"
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder={
                  isNegocios
                    ? 'Ex: Loja Virtual de Roupas, Consultoria PJ, Venda de Bolos...'
                    : 'Ex: Conta de luz, Curso de Finanças, Aporte Selic...'
                }
                required
                className="w-full px-3.5 py-2.5 bg-slate-800/90 border border-slate-700 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* NEGÓCIOS SPECIFIC FIELDS: Quanto Investiu & Quanto Retornou */}
          {isNegocios ? (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* 1. Quanto Investiu */}
                <div className="p-3.5 bg-amber-500/5 border border-amber-500/20 rounded-xl space-y-1.5">
                  <label className="block text-xs font-bold text-amber-400">
                    1. Quanto você Investiu? (R$) *
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm font-semibold">
                      R$
                    </span>
                    <input
                      id="business-invested-input"
                      type="number"
                      step="0.01"
                      min="0"
                      value={investedStr}
                      onChange={(e) => setInvestedStr(e.target.value)}
                      placeholder="0,00"
                      required
                      className="w-full pl-10 pr-3.5 py-2 bg-slate-900 border border-amber-500/30 rounded-lg text-sm font-bold text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
                    />
                  </div>
                  <span className="text-[11px] text-slate-400 block">
                    Custo / Aporte inicial neste negócio
                  </span>
                </div>

                {/* 2. Quanto Retornou */}
                <div className="p-3.5 bg-emerald-500/5 border border-emerald-500/20 rounded-xl space-y-1.5">
                  <label className="block text-xs font-bold text-emerald-400">
                    2. Quanto ele Retornou? (R$) *
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm font-semibold">
                      R$
                    </span>
                    <input
                      id="business-return-input"
                      type="number"
                      step="0.01"
                      min="0"
                      value={returnStr}
                      onChange={(e) => setReturnStr(e.target.value)}
                      placeholder="0,00"
                      className="w-full pl-10 pr-3.5 py-2 bg-slate-900 border border-emerald-500/30 rounded-lg text-sm font-bold text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                  <span className="text-[11px] text-slate-400 block">
                    Faturamento / Receita obtida com o negócio
                  </span>
                </div>
              </div>

              {/* Live ROI / Profit Metric Feedback Card */}
              {(numInvested > 0 || numReturn > 0) && (
                <div className="p-3.5 bg-slate-950 border border-slate-800 rounded-xl flex items-center justify-between gap-4">
                  <div>
                    <span className="text-[11px] text-slate-400 block">
                      Resultado Líquido do Negócio:
                    </span>
                    <div className="flex items-center gap-2">
                      <span
                        className={`text-base font-bold ${
                          profitLoss > 0
                            ? 'text-emerald-400'
                            : profitLoss < 0
                            ? 'text-rose-400'
                            : 'text-slate-300'
                        }`}
                      >
                        {formatCurrency(profitLoss)}
                      </span>
                      <span
                        className={`text-[11px] font-semibold px-2 py-0.5 rounded-md ${
                          profitLoss > 0
                            ? 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/20'
                            : profitLoss < 0
                            ? 'bg-rose-500/10 text-rose-300 border border-rose-500/20'
                            : 'bg-slate-800 text-slate-300'
                        }`}
                      >
                        {profitLoss > 0
                          ? 'Lucro'
                          : profitLoss < 0
                          ? 'Prejuízo'
                          : 'Empate'}
                      </span>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="text-[11px] text-slate-400 block">
                      Rentabilidade / ROI:
                    </span>
                    <span
                      className={`text-sm font-bold ${
                        roi >= 0 ? 'text-emerald-400' : 'text-rose-400'
                      }`}
                    >
                      {roi >= 0 ? `+${formatPercent(roi)}` : formatPercent(roi)}
                    </span>
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* Standard Amount for other categories */
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
                    id="transaction-amount-input"
                    type="number"
                    step="0.01"
                    min="0.01"
                    value={amountStr}
                    onChange={(e) => setAmountStr(e.target.value)}
                    placeholder="0,00"
                    required
                    className="w-full pl-10 pr-3.5 py-2.5 bg-slate-800/90 border border-slate-700 rounded-xl text-sm font-medium text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Data (opcional)
                </label>
                <div className="relative">
                  <input
                    id="transaction-date-input"
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-800/90 border border-slate-700 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 [color-scheme:dark]"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Date input for Negocios (placed cleanly) */}
          {isNegocios && (
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Data do Aporte / Lançamento
              </label>
              <div className="relative">
                <input
                  id="transaction-date-input-negocios"
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-800/90 border border-slate-700 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 [color-scheme:dark]"
                />
              </div>
            </div>
          )}

          {/* Payment Method */}
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">
              Meio de Pagamento / Movimentação
            </label>
            <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
              {[
                { id: 'pix', label: 'PIX' },
                { id: 'cartao_credito', label: 'Crédito' },
                { id: 'cartao_debito', label: 'Débito' },
                { id: 'boleto', label: 'Boleto' },
                { id: 'dinheiro', label: 'Espécie' },
              ].map((method) => (
                <button
                  key={method.id}
                  type="button"
                  onClick={() => setPaymentMethod(method.id as any)}
                  className={`py-1.5 px-2 rounded-lg text-xs font-medium border text-center transition-colors ${
                    paymentMethod === method.id
                      ? 'bg-blue-600/30 border-blue-500 text-blue-200'
                      : 'bg-slate-800/40 border-slate-750 text-slate-400 hover:text-slate-300'
                  }`}
                >
                  {method.label}
                </button>
              ))}
            </div>
          </div>

          {/* Recurring Checkbox */}
          <div className="pt-1">
            <label className="flex items-center gap-3 p-3 bg-slate-800/40 border border-slate-800 rounded-xl cursor-pointer hover:bg-slate-800/70 transition-colors">
              <input
                id="transaction-recurring-checkbox"
                type="checkbox"
                checked={isRecurring}
                onChange={(e) => setIsRecurring(e.target.checked)}
                className="w-4 h-4 rounded border-slate-700 bg-slate-800 text-blue-600 focus:ring-blue-500/20"
              />
              <div className="flex items-center gap-2">
                <RotateCw className="w-4 h-4 text-blue-400" />
                <div>
                  <span className="text-xs font-medium text-slate-200 block">
                    {isNegocios
                      ? 'Negócio ou Projeto Recorrente'
                      : 'Gasto ou Aporte Recorrente'}
                  </span>
                  <span className="text-[11px] text-slate-400 block">
                    Facilita duplicar a estrutura para os próximos meses
                  </span>
                </div>
              </div>
            </label>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">
              Observações (opcional)
            </label>
            <textarea
              id="transaction-notes-input"
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder={
                isNegocios
                  ? 'Ex: Vendas no Mercado Livre, custos com embalagem e frete...'
                  : 'Notas adicionais sobre o lançamento...'
              }
              className="w-full px-3.5 py-2 bg-slate-800/90 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 resize-none"
            />
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
            <button
              id="cancel-transaction-modal-btn"
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-slate-300 hover:text-white hover:bg-slate-800 rounded-xl transition-colors"
            >
              Cancelar
            </button>
            <button
              id="save-transaction-modal-btn"
              type="submit"
              className="flex items-center gap-2 px-5 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-500 active:bg-blue-700 rounded-xl shadow-lg shadow-blue-600/25 transition-all"
            >
              <CheckCircle2 className="w-4 h-4" />
              {initialData
                ? isNegocios
                  ? 'Atualizar Negócio'
                  : 'Atualizar Lançamento'
                : isNegocios
                ? 'Adicionar Negócio'
                : 'Adicionar Lançamento'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
