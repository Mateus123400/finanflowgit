import React, { useState } from 'react';
import { X, Calendar, Copy, Sparkles, PlusCircle } from 'lucide-react';
import { MonthData } from '../types';
import { MONTH_NAMES } from '../utils/constants';
import { parseMonthId } from '../utils/formatters';

interface NewMonthModalProps {
  isOpen: boolean;
  onClose: () => void;
  existingMonths: MonthData[];
  currentMonthId: string;
  onCreateMonth: (
    year: number,
    month: number,
    duplicateFromMonthId?: string,
    copyRecurringStructure?: boolean
  ) => void;
}

export const NewMonthModal: React.FC<NewMonthModalProps> = ({
  isOpen,
  onClose,
  existingMonths,
  currentMonthId,
  onCreateMonth,
}) => {
  // Suggest the next month sequentially
  const { year: curYear, month: curMonth } = parseMonthId(currentMonthId || '2026-03');
  const nextMonthNum = curMonth === 12 ? 1 : curMonth + 1;
  const nextYearNum = curMonth === 12 ? curYear + 1 : curYear;

  const [selectedYear, setSelectedYear] = useState<number>(nextYearNum);
  const [selectedMonth, setSelectedMonth] = useState<number>(nextMonthNum);
  const [duplicateStructure, setDuplicateStructure] = useState(true);
  const [sourceMonthId, setSourceMonthId] = useState<string>(currentMonthId);
  const [copyRecurring, setCopyRecurring] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const targetId = `${selectedYear}-${String(selectedMonth).padStart(2, '0')}`;
  const isAlreadyExisting = existingMonths.some((m) => m.id === targetId);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isAlreadyExisting) {
      setError(`O mês de ${MONTH_NAMES[selectedMonth - 1]} de ${selectedYear} já existe!`);
      return;
    }

    onCreateMonth(
      selectedYear,
      selectedMonth,
      duplicateStructure ? sourceMonthId : undefined,
      copyRecurring
    );
    onClose();
  };

  const years = [2025, 2026, 2027, 2028, 2029, 2030];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        id="new-month-modal-container"
        className="bg-slate-900 border border-slate-800 text-slate-100 w-full max-w-md rounded-2xl shadow-2xl overflow-hidden flex flex-col"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800/80 bg-slate-900/90">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-white">Criar Novo Mês</h2>
              <p className="text-xs text-slate-400">Organize suas finanças para um novo ciclo</p>
            </div>
          </div>
          <button
            id="close-new-month-modal-btn"
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 text-xs text-rose-300 bg-rose-950/40 border border-rose-800/50 rounded-xl">
              {error}
            </div>
          )}

          {/* Month and Year Selection */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Mês
              </label>
              <select
                id="new-month-select"
                value={selectedMonth}
                onChange={(e) => {
                  setSelectedMonth(Number(e.target.value));
                  setError('');
                }}
                className="w-full px-3 py-2.5 bg-slate-800/90 border border-slate-700 rounded-xl text-xs font-medium text-white focus:outline-none focus:border-blue-500 [color-scheme:dark]"
              >
                {MONTH_NAMES.map((name, idx) => (
                  <option key={idx + 1} value={idx + 1}>
                    {name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Ano
              </label>
              <select
                id="new-year-select"
                value={selectedYear}
                onChange={(e) => {
                  setSelectedYear(Number(e.target.value));
                  setError('');
                }}
                className="w-full px-3 py-2.5 bg-slate-800/90 border border-slate-700 rounded-xl text-xs font-medium text-white focus:outline-none focus:border-blue-500 [color-scheme:dark]"
              >
                {years.map((y) => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Duplication Structure Option */}
          <div className="space-y-3 pt-2">
            <div className="p-3.5 bg-slate-800/40 border border-slate-800 rounded-xl space-y-3">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  id="duplicate-structure-checkbox"
                  type="checkbox"
                  checked={duplicateStructure}
                  onChange={(e) => setDuplicateStructure(e.target.checked)}
                  className="w-4 h-4 rounded border-slate-750 bg-slate-800 text-blue-600 focus:ring-blue-500/20"
                />
                <div className="flex items-center gap-2">
                  <Copy className="w-4 h-4 text-blue-400" />
                  <div>
                    <span className="text-xs font-medium text-slate-200 block">
                      Duplicar estrutura de categorias e metas
                    </span>
                    <span className="text-[11px] text-slate-400 block">
                      Copia as metas (%) sem duplicar os valores de gastos
                    </span>
                  </div>
                </div>
              </label>

              {duplicateStructure && existingMonths.length > 0 && (
                <div className="pl-7 pt-1">
                  <label className="block text-[11px] text-slate-400 mb-1">
                    Copiar metas a partir de:
                  </label>
                  <select
                    id="source-month-select"
                    value={sourceMonthId}
                    onChange={(e) => setSourceMonthId(e.target.value)}
                    className="w-full px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs text-slate-200 focus:outline-none focus:border-blue-500 [color-scheme:dark]"
                  >
                    {existingMonths.map((m) => {
                      const { label } = parseMonthId(m.id);
                      return (
                        <option key={m.id} value={m.id}>
                          {label}
                        </option>
                      );
                    })}
                  </select>
                </div>
              )}
            </div>

            {/* Recurring items template copy */}
            {duplicateStructure && (
              <label className="flex items-center gap-3 p-3 bg-slate-800/20 border border-slate-800/60 rounded-xl cursor-pointer hover:bg-slate-800/40 transition-colors">
                <input
                  id="copy-recurring-template-checkbox"
                  type="checkbox"
                  checked={copyRecurring}
                  onChange={(e) => setCopyRecurring(e.target.checked)}
                  className="w-4 h-4 rounded border-slate-750 bg-slate-800 text-blue-600 focus:ring-blue-500/20"
                />
                <div>
                  <span className="text-xs font-medium text-slate-300 block">
                    Copiar títulos de gastos recorrentes
                  </span>
                  <span className="text-[11px] text-slate-500 block">
                    Copia os nomes de contas fixas (com valor R$ 0,00 para preencher)
                  </span>
                </div>
              </label>
            )}
          </div>

          {/* Validation Notice */}
          {isAlreadyExisting && (
            <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs">
              ⚠️ Este mês já está cadastrado. Escolha outro período.
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
            <button
              id="cancel-new-month-btn"
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-slate-300 hover:text-white hover:bg-slate-800 rounded-xl transition-colors"
            >
              Cancelar
            </button>
            <button
              id="submit-create-month-btn"
              type="submit"
              disabled={isAlreadyExisting}
              className="flex items-center gap-2 px-5 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed active:bg-blue-700 rounded-xl shadow-lg shadow-blue-600/25 transition-all"
            >
              <PlusCircle className="w-4 h-4" />
              Criar Mês
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
