import React, { useState, useEffect } from 'react';
import {
  Sliders,
  CheckCircle2,
  RotateCcw,
  Sparkles,
  Info,
  Copy,
  PieChart as PieIcon,
  HelpCircle,
  Save,
  Check,
} from 'lucide-react';
import { CategoryId, CategoryTargets, MonthData } from '../types';
import { CATEGORIES_CONFIG, CATEGORY_IDS, DEFAULT_TARGETS } from '../utils/constants';
import { formatCurrency, formatPercent, parseMonthId } from '../utils/formatters';
import { CategoryIcon } from './CategoryIcon';

interface TargetsViewProps {
  currentMonth: MonthData;
  allMonths: MonthData[];
  onSaveTargetsForMonth: (targets: CategoryTargets) => void;
  onApplyTargetsToAllMonths: (targets: CategoryTargets) => void;
  onDuplicateStructureFromMonth: (sourceMonthId: string) => void;
}

export const TargetsView: React.FC<TargetsViewProps> = ({
  currentMonth,
  allMonths,
  onSaveTargetsForMonth,
  onApplyTargetsToAllMonths,
  onDuplicateStructureFromMonth,
}) => {
  const [targets, setTargets] = useState<CategoryTargets>({
    ...DEFAULT_TARGETS,
    ...(currentMonth.targets || {}),
  });

  const [savedFeedback, setSavedFeedback] = useState('');
  const [sourceMonthToDuplicate, setSourceMonthToDuplicate] = useState<string>('');

  useEffect(() => {
    setTargets({
      ...DEFAULT_TARGETS,
      ...(currentMonth.targets || {}),
    });
  }, [currentMonth]);

  const totalIncome = (currentMonth.incomes || []).reduce((acc, curr) => acc + curr.amount, 0);

  const handleTargetChange = (catId: CategoryId, value: number) => {
    const clamped = Math.max(0, Math.min(100, isNaN(value) ? 0 : value));
    setTargets((prev) => ({
      ...prev,
      [catId]: clamped,
    }));
  };

  const totalAllocatedPercent = CATEGORY_IDS.reduce(
    (acc, catId) => acc + (targets[catId] || 0),
    0
  );
  const unallocatedPercent = Math.max(0, 100 - totalAllocatedPercent);
  const isOverAllocated = totalAllocatedPercent > 100;

  const handleSaveForThisMonth = () => {
    onSaveTargetsForMonth(targets);
    setSavedFeedback('Metas salvas com sucesso para este mês!');
    setTimeout(() => setSavedFeedback(''), 3000);
  };

  const handleApplyGlobal = () => {
    if (
      window.confirm(
        'Deseja aplicar estas porcentagens como padrão para todos os meses cadastrados?'
      )
    ) {
      onApplyTargetsToAllMonths(targets);
      setSavedFeedback('Metas aplicadas a todos os meses com sucesso!');
      setTimeout(() => setSavedFeedback(''), 3000);
    }
  };

  const handleResetToDefault = () => {
    setTargets({ ...DEFAULT_TARGETS });
    setSavedFeedback('Valores redefinidos para o padrão oficial (20/20/10/10/10/10)!');
    setTimeout(() => setSavedFeedback(''), 3000);
  };

  const handleDuplicateFromSelected = () => {
    if (!sourceMonthToDuplicate) return;
    onDuplicateStructureFromMonth(sourceMonthToDuplicate);
    setSavedFeedback('Estrutura de metas duplicada com sucesso!');
    setTimeout(() => setSavedFeedback(''), 3000);
  };

  const currentLabel = parseMonthId(currentMonth.id).label;

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* 1. TOP HEADER */}
      <div className="bg-slate-900/60 p-4 rounded-2xl border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <Sliders className="w-5 h-5 text-blue-400" />
            <span>Configuração de Metas Percentuais</span>
          </h2>
          <p className="text-xs text-slate-400">
            Ajuste a porcentagem da renda destinada a cada uma das 6 categorias para {currentLabel}
          </p>
        </div>

        {savedFeedback && (
          <div className="flex items-center gap-2 px-3.5 py-1.5 bg-emerald-950/60 border border-emerald-800 text-emerald-300 rounded-xl text-xs font-semibold animate-in fade-in">
            <Check className="w-4 h-4 text-emerald-400" />
            <span>{savedFeedback}</span>
          </div>
        )}
      </div>

      {/* 2. OVERVIEW & ALLOCATION GAUGE */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Summary Cards & Tips */}
        <div className="lg:col-span-4 space-y-4">
          {/* Target Balance Card */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-lg shadow-black/20 space-y-4">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Distribuição da Renda
            </h3>

            <div className="space-y-2">
              <div className="flex items-baseline justify-between">
                <span className="text-xs text-slate-400">Total Alocado nas Metas:</span>
                <span className="text-xl font-bold text-white">
                  {formatPercent(totalAllocatedPercent, 0)}
                </span>
              </div>

              <div className="flex items-baseline justify-between">
                <span className="text-xs text-slate-400">Livre / Não Alocado:</span>
                <span
                  className={`text-xl font-bold ${
                    isOverAllocated ? 'text-rose-400' : 'text-blue-400'
                  }`}
                >
                  {formatPercent(unallocatedPercent, 0)}
                </span>
              </div>
            </div>

            {/* Visual allocation progress bar */}
            <div className="h-3 w-full bg-slate-950 rounded-full overflow-hidden p-0.5 border border-slate-800 flex">
              {CATEGORY_IDS.map((catId) => {
                const p = targets[catId] || 0;
                if (p <= 0) return null;
                const cat = CATEGORIES_CONFIG[catId];
                return (
                  <div
                    key={catId}
                    className="h-full first:rounded-l-full last:rounded-r-full transition-all duration-300"
                    style={{
                      width: `${p}%`,
                      backgroundColor: cat.color,
                    }}
                    title={`${cat.name}: ${p}%`}
                  />
                );
              })}
              {unallocatedPercent > 0 && (
                <div
                  className="h-full bg-slate-800 rounded-r-full transition-all"
                  style={{ width: `${unallocatedPercent}%` }}
                  title={`Livre: ${unallocatedPercent}%`}
                />
              )}
            </div>

            {isOverAllocated && (
              <div className="p-2.5 rounded-xl bg-rose-950/50 border border-rose-800/60 text-rose-300 text-xs">
                ⚠️ A soma das metas ({totalAllocatedPercent}%) ultrapassou 100% da renda.
              </div>
            )}

            <div className="pt-2 border-t border-slate-800 text-[11px] text-slate-400 leading-relaxed">
              💡 As porcentagens não precisam somar 100%. A folga restante é tratada automaticamente como margem livre de segurança.
            </div>
          </div>

          {/* Current Month Income Reference */}
          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 text-xs space-y-2">
            <span className="text-slate-400 block font-medium">Renda base deste mês:</span>
            <div className="text-lg font-bold text-emerald-400">
              {formatCurrency(totalIncome)}
            </div>
            <p className="text-[11px] text-slate-500">
              Os valores em R$ mostrados nas categorias abaixo são calculados dinamicamente com base nesta renda.
            </p>
          </div>

          {/* Duplicate Structure Tool */}
          {allMonths.length > 1 && (
            <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 space-y-3">
              <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
                <Copy className="w-4 h-4 text-blue-400" />
                Duplicar Metas de Outro Mês
              </h4>
              <p className="text-[11px] text-slate-400">
                Copie a estrutura percentual configurada em outro mês para o mês atual.
              </p>
              <div className="space-y-2">
                <select
                  value={sourceMonthToDuplicate}
                  onChange={(e) => setSourceMonthToDuplicate(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-blue-500 [color-scheme:dark]"
                >
                  <option value="">Selecione o mês de origem...</option>
                  {allMonths
                    .filter((m) => m.id !== currentMonth.id)
                    .map((m) => {
                      const { label } = parseMonthId(m.id);
                      return (
                        <option key={m.id} value={m.id}>
                          {label}
                        </option>
                      );
                    })}
                </select>

                <button
                  id="btn-apply-duplicate-structure"
                  onClick={handleDuplicateFromSelected}
                  disabled={!sourceMonthToDuplicate}
                  className="w-full py-2 px-3 text-xs font-medium text-blue-200 bg-blue-600/20 hover:bg-blue-600/30 border border-blue-500/40 rounded-xl disabled:opacity-40 transition-colors"
                >
                  Importar Metas Deste Mês
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Right: Category Target Sliders and Numerical Inputs */}
        <div className="lg:col-span-8 space-y-4">
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-lg shadow-black/20 space-y-5">
            <h3 className="text-sm font-bold text-white border-b border-slate-800 pb-3">
              Metas das 5 Categorias Fixas
            </h3>

            <div className="space-y-5">
              {CATEGORY_IDS.map((catId) => {
                const cat = CATEGORIES_CONFIG[catId];
                const percent = targets[catId] || 0;
                const valueInReais = (percent / 100) * totalIncome;

                return (
                  <div
                    key={catId}
                    id={`target-setting-row-${catId}`}
                    className="p-4 bg-slate-950/60 border border-slate-800 hover:border-slate-700/80 rounded-xl space-y-3 transition-all"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="flex items-center gap-3">
                        <div
                          className="p-2 rounded-xl border"
                          style={{
                            backgroundColor: cat.accentBg,
                            borderColor: cat.borderColor,
                            color: cat.color,
                          }}
                        >
                          <CategoryIcon categoryId={catId} className="w-4 h-4" />
                        </div>
                        <div>
                          <h4 className="text-xs sm:text-sm font-bold text-white">
                            {cat.name}
                          </h4>
                          <p className="text-[11px] text-slate-400">{cat.description}</p>
                        </div>
                      </div>

                      {/* Percentage Input + Value in R$ */}
                      <div className="flex items-center gap-3 self-end sm:self-auto">
                        <div className="text-right">
                          <span className="text-[10px] text-slate-400 block">Equivalente em R$:</span>
                          <span className="text-xs font-bold text-slate-200">
                            {formatCurrency(valueInReais)}
                          </span>
                        </div>

                        <div className="relative flex items-center w-24">
                          <input
                            id={`target-input-${catId}`}
                            type="number"
                            min="0"
                            max="100"
                            step="1"
                            value={percent}
                            onChange={(e) => handleTargetChange(catId, parseFloat(e.target.value))}
                            className="w-full pl-3 pr-7 py-1.5 bg-slate-900 border border-slate-700 rounded-xl text-xs font-bold text-white text-right focus:outline-none focus:border-blue-500"
                          />
                          <span className="absolute right-2.5 text-xs text-slate-400 font-semibold pointer-events-none">
                            %
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Interactive Range Slider */}
                    <div className="flex items-center gap-3 pt-1">
                      <input
                        id={`target-slider-${catId}`}
                        type="range"
                        min="0"
                        max="60"
                        step="1"
                        value={percent}
                        onChange={(e) => handleTargetChange(catId, parseInt(e.target.value, 10))}
                        className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-blue-500"
                      />
                      <span className="text-xs font-medium text-slate-400 w-10 text-right">
                        {percent}%
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Actions Bar */}
            <div className="pt-4 border-t border-slate-800 flex flex-wrap items-center justify-between gap-3">
              <button
                id="reset-targets-to-default-btn"
                type="button"
                onClick={handleResetToDefault}
                className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-xl transition-colors"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Restaurar Padrão (20/20/10/10/10)</span>
              </button>

              <div className="flex items-center gap-2">
                <button
                  id="apply-targets-to-all-btn"
                  type="button"
                  onClick={handleApplyGlobal}
                  className="px-4 py-2 text-xs font-medium text-slate-300 bg-slate-800 hover:bg-slate-750 hover:text-white rounded-xl border border-slate-700 transition-colors"
                >
                  Definir como Padrão Global
                </button>

                <button
                  id="save-targets-for-month-btn"
                  type="button"
                  onClick={handleSaveForThisMonth}
                  className="flex items-center gap-2 px-5 py-2 text-xs font-medium text-white bg-blue-600 hover:bg-blue-500 active:bg-blue-700 rounded-xl shadow-lg shadow-blue-600/25 transition-all"
                >
                  <Save className="w-4 h-4" />
                  <span>Salvar Metas para {currentLabel}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
