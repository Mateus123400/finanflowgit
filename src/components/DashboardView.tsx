import React from 'react';
import {
  DollarSign,
  TrendingUp,
  Wallet,
  PieChart as PieIcon,
  BarChart3,
  ArrowUpRight,
  ArrowDownRight,
  AlertCircle,
  CheckCircle2,
  AlertTriangle,
  Plus,
  ShieldCheck,
  Zap,
  Info,
  Briefcase,
  Landmark,
  Layers,
} from 'lucide-react';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
} from 'recharts';
import { CategoryId, IncomeActivity, MonthData, MonthSummary, NetWorthSummary } from '../types';
import { CATEGORIES_CONFIG, CATEGORY_IDS } from '../utils/constants';
import { formatCurrency, formatPercent } from '../utils/formatters';
import { CategoryIcon } from './CategoryIcon';

interface DashboardViewProps {
  currentMonth: MonthData;
  summary: MonthSummary;
  activities?: IncomeActivity[];
  netWorthSummary?: NetWorthSummary;
  onOpenTransactionModal: (defaultCategory?: CategoryId) => void;
  onOpenIncomeModal: () => void;
  onGoToTargets: () => void;
  onGoToTransactions: (filterCategory?: CategoryId) => void;
  onGoToPatrimonio?: () => void;
  onOpenActivitiesModal?: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  currentMonth,
  summary,
  activities = [],
  netWorthSummary,
  onOpenTransactionModal,
  onOpenIncomeModal,
  onGoToTargets,
  onGoToTransactions,
  onGoToPatrimonio,
  onOpenActivitiesModal,
}) => {
  const {
    totalIncome,
    activeIncome,
    passiveIncome,
    totalExpensesAndAllocations,
    totalOperationalExpenses,
    totalGrowthInvestments,
    businessTotalInvested,
    businessTotalReturned,
    businessNetProfit,
    businessRoiPercent,
    remainingBalance,
    availableCashBalance,
    categories,
    unallocatedTargetPercent,
    unallocatedTargetAmount,
    investmentAndSavingsRate,
    growthTotal,
    activitySummaries = [],
  } = summary;

  // Donut chart data (distribution of actual expenses/allocations)
  const donutData = CATEGORY_IDS.map((catId) => {
    const calc = categories[catId];
    return {
      name: calc.category.name,
      value: calc.actualAmount,
      color: calc.category.color,
      id: catId,
    };
  }).filter((item) => item.value > 0);

  const hasTransactions = donutData.length > 0;
  const pieDisplayData = hasTransactions
    ? donutData
    : [{ name: 'Sem lançamentos', value: 1, color: '#334155', id: 'none' }];

  // Comparison Bar Chart data (Planned Meta R$ vs Real R$)
  const comparisonBarData = CATEGORY_IDS.map((catId) => {
    const calc = categories[catId];
    return {
      name: calc.category.name,
      id: catId,
      meta: calc.targetAmount,
      real: calc.actualAmount,
      color: calc.category.color,
    };
  });

  // Custom Recharts Tooltip for Donut
  const CustomDonutTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0];
      const percentOfTotal = totalExpensesAndAllocations > 0
        ? (data.value / totalExpensesAndAllocations) * 100
        : 0;
      const percentOfIncome = totalIncome > 0
        ? (data.value / totalIncome) * 100
        : 0;

      return (
        <div className="bg-slate-900/95 border border-slate-700 p-3 rounded-xl shadow-xl text-xs space-y-1 backdrop-blur-sm">
          <p className="font-semibold text-white flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: data.payload.color }} />
            {data.name}
          </p>
          <p className="text-slate-200 font-bold">{formatCurrency(data.value)}</p>
          <p className="text-[11px] text-slate-400">
            {formatPercent(percentOfTotal)} do total alocado
          </p>
          <p className="text-[11px] text-blue-400">
            {formatPercent(percentOfIncome)} da renda total
          </p>
        </div>
      );
    }
    return null;
  };

  // Custom Bar Chart Tooltip
  const CustomBarTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const meta = payload.find((p: any) => p.dataKey === 'meta')?.value || 0;
      const real = payload.find((p: any) => p.dataKey === 'real')?.value || 0;
      const diff = meta - real;

      return (
        <div className="bg-slate-900/95 border border-slate-700 p-3 rounded-xl shadow-xl text-xs space-y-1.5 backdrop-blur-sm">
          <p className="font-semibold text-white">{label}</p>
          <div className="space-y-0.5">
            <p className="text-slate-400 flex items-center justify-between gap-4">
              <span>Meta planejada:</span>
              <span className="font-medium text-slate-200">{formatCurrency(meta)}</span>
            </p>
            <p className="text-blue-400 flex items-center justify-between gap-4">
              <span>Valor real:</span>
              <span className="font-bold text-blue-300">{formatCurrency(real)}</span>
            </p>
            <p className={`flex items-center justify-between gap-4 text-[11px] font-medium pt-1 border-t border-slate-800 ${
              diff >= 0 ? 'text-emerald-400' : 'text-rose-400'
            }`}>
              <span>{diff >= 0 ? 'Diferença disponível:' : 'Excedeu em:'}</span>
              <span>{formatCurrency(Math.abs(diff))}</span>
            </p>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* ─── 1. TOP FLUXO FINANCIAL KPI CARDS ─── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* 1. Total Income Card com Renda Ativa e Passiva */}
        <div
          id="kpi-total-income-card"
          className="relative bg-slate-900/80 border border-slate-800 hover:border-slate-700/80 rounded-2xl p-5 shadow-lg shadow-black/20 transition-all group overflow-hidden"
        >
          <div className="flex items-center justify-between mb-2.5">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Renda Total do Mês
            </span>
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 group-hover:scale-105 transition-transform">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="space-y-2">
            <div className="text-2xl font-black tracking-tight text-white">
              {formatCurrency(totalIncome)}
            </div>
            
            {/* Badges Ativa vs Passiva */}
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium bg-blue-500/10 text-blue-300 border border-blue-500/20">
                <Zap className="w-3 h-3 text-blue-400" />
                Ativa: {formatCurrency(activeIncome)}
              </span>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
                <TrendingUp className="w-3 h-3 text-emerald-400" />
                Passiva: {formatCurrency(passiveIncome)}
              </span>
            </div>

            <div className="flex items-center justify-between text-xs text-slate-400 pt-1">
              <span>{(currentMonth.incomes || []).length} entrada(s)</span>
              <button
                id="kpi-add-income-btn"
                onClick={onOpenIncomeModal}
                className="text-emerald-400 hover:text-emerald-300 hover:underline font-medium inline-flex items-center gap-0.5"
              >
                + Nova Renda
              </button>
            </div>
          </div>
        </div>

        {/* 2. Despesas Operacionais / Essenciais */}
        <div
          id="kpi-operational-expenses-card"
          className="relative bg-slate-900/80 border border-slate-800 hover:border-slate-700/80 rounded-2xl p-5 shadow-lg shadow-black/20 transition-all group overflow-hidden"
        >
          <div className="flex items-center justify-between mb-2.5">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Despesas & Consumo
            </span>
            <div className="p-2 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20 group-hover:scale-105 transition-transform">
              <Wallet className="w-4 h-4" />
            </div>
          </div>
          <div className="space-y-2">
            <div className="text-2xl font-black tracking-tight text-white">
              {formatCurrency(totalOperationalExpenses)}
            </div>
            <div className="text-xs text-slate-400">
              <span>
                {totalIncome > 0
                  ? `${formatPercent((totalOperationalExpenses / totalIncome) * 100)} da renda consumida`
                  : '0% da renda'}
              </span>
            </div>
            <div className="flex items-center justify-between text-xs text-slate-400 pt-1">
              <span>Fixos, contas & doações</span>
              <button
                onClick={() => onOpenTransactionModal('despesas')}
                className="text-blue-400 hover:text-blue-300 hover:underline font-medium inline-flex items-center gap-0.5"
              >
                + Lançar
              </button>
            </div>
          </div>
        </div>

        {/* 3. Aportes & Investimentos Patrimoniais */}
        <div
          id="kpi-investment-rate-card"
          className="relative bg-slate-900/80 border border-slate-800 hover:border-slate-700/80 rounded-2xl p-5 shadow-lg shadow-black/20 transition-all group overflow-hidden"
        >
          <div className="flex items-center justify-between mb-2.5">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Aportes & Investimentos
            </span>
            <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 group-hover:scale-105 transition-transform">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="space-y-2">
            <div className="text-2xl font-black tracking-tight text-white flex items-baseline gap-2">
              <span>{formatCurrency(growthTotal)}</span>
              <span className="text-sm font-semibold text-cyan-400">
                ({formatPercent(investmentAndSavingsRate)})
              </span>
            </div>
            <div className="text-xs text-slate-400">
              <span>Mudança de composição patrimonial</span>
            </div>
            <div className="flex items-center justify-between text-xs text-slate-400 pt-1">
              <span className="text-cyan-400 font-medium">Investimentos + Poupança</span>
              <button
                onClick={() => onOpenTransactionModal('investimento')}
                className="text-cyan-400 hover:text-cyan-300 hover:underline font-medium"
              >
                + Aportar
              </button>
            </div>
          </div>
        </div>

        {/* 4. Saldo Disponível em Caixa */}
        <div
          id="kpi-remaining-balance-card"
          className="relative bg-slate-900/80 border border-slate-800 hover:border-slate-700/80 rounded-2xl p-5 shadow-lg shadow-black/20 transition-all group overflow-hidden"
        >
          <div className="flex items-center justify-between mb-2.5">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Saldo Disponível
            </span>
            <div
              className={`p-2 rounded-xl border transition-transform group-hover:scale-105 ${
                remainingBalance >= 0
                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                  : 'bg-rose-500/10 text-rose-400 border-rose-500/20'
              }`}
            >
              {remainingBalance >= 0 ? (
                <ShieldCheck className="w-4 h-4" />
              ) : (
                <AlertCircle className="w-4 h-4" />
              )}
            </div>
          </div>
          <div className="space-y-2">
            <div
              className={`text-2xl font-black tracking-tight ${
                remainingBalance >= 0 ? 'text-emerald-400' : 'text-rose-400'
              }`}
            >
              {formatCurrency(remainingBalance)}
            </div>
            <div className="text-xs text-slate-400 flex items-center justify-between">
              <span>
                {remainingBalance >= 0 ? 'Margem livre do mês' : 'Gastos excederam renda'}
              </span>
            </div>
            <div className="flex items-center justify-between text-xs text-slate-400 pt-1">
              <span>Buffer planejado:</span>
              <span className="font-semibold text-slate-300">{formatCurrency(unallocatedTargetAmount)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* ─── 2. SEÇÃO DE NEGÓCIOS & ATIVIDADES DE RENDA ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Card: Resultado Consolidado de Negócios */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-lg space-y-3.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
                <Briefcase className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">Resultado de Negócios</h3>
                <p className="text-[11px] text-slate-400">Projetos, revendas e empreendimentos</p>
              </div>
            </div>
            <button
              onClick={() => onOpenTransactionModal('negocios')}
              className="text-xs text-amber-400 hover:text-amber-300 font-semibold"
            >
              + Negócio
            </button>
          </div>

          <div className="grid grid-cols-2 gap-2 pt-1 text-xs">
            <div className="p-2.5 bg-slate-850 rounded-xl border border-slate-750">
              <span className="text-[10px] text-slate-400 block">Capital Investido:</span>
              <span className="text-sm font-bold text-white block mt-0.5">
                {formatCurrency(businessTotalInvested)}
              </span>
            </div>
            <div className="p-2.5 bg-slate-850 rounded-xl border border-slate-750">
              <span className="text-[10px] text-slate-400 block">Retorno Recebido:</span>
              <span className="text-sm font-bold text-emerald-400 block mt-0.5">
                {formatCurrency(businessTotalReturned)}
              </span>
            </div>
          </div>

          <div className="p-3 bg-slate-950/80 rounded-xl border border-slate-800 flex items-center justify-between">
            <div>
              <span className="text-[10px] text-slate-400 block">Resultado Líquido:</span>
              <span className={`text-base font-black ${businessNetProfit >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                {formatCurrency(businessNetProfit)}
              </span>
            </div>
            <div className="text-right">
              <span className="text-[10px] text-slate-400 block">ROI Geral:</span>
              <span className={`text-sm font-bold ${businessRoiPercent >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                {businessRoiPercent >= 0 ? `+${formatPercent(businessRoiPercent)}` : formatPercent(businessRoiPercent)}
              </span>
            </div>
          </div>
        </div>

        {/* Card: Distribuição por Atividade de Renda */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-lg space-y-3.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20">
                <Zap className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">Atividades de Renda</h3>
                <p className="text-[11px] text-slate-400">Ganhos agrupados por canal</p>
              </div>
            </div>
            {onOpenActivitiesModal && (
              <button
                onClick={onOpenActivitiesModal}
                className="text-xs text-blue-400 hover:text-blue-300 font-semibold"
              >
                Gerenciar
              </button>
            )}
          </div>

          <div className="space-y-2 max-h-40 overflow-y-auto custom-scrollbar text-xs">
            {activitySummaries.length === 0 ? (
              <div className="text-center py-6 text-slate-500 text-xs">
                Nenhuma atividade vinculada neste mês. Vincule rendas e negócios a atividades dinâmicas.
              </div>
            ) : (
              activitySummaries.map((act) => (
                <div
                  key={act.activityId}
                  className="flex items-center justify-between p-2 bg-slate-850 rounded-xl border border-slate-750"
                >
                  <div className="flex items-center gap-2">
                    <div
                      className="w-2.5 h-2.5 rounded-full shrink-0"
                      style={{ backgroundColor: act.color || '#3b82f6' }}
                    />
                    <div>
                      <span className="font-semibold text-white block">{act.name}</span>
                      <span className="text-[10px] text-slate-400">
                        {act.nature === 'passive' ? 'Passiva' : 'Ativa'}
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="font-bold text-emerald-400 block">{formatCurrency(act.totalIncome)}</span>
                    {act.totalInvested > 0 && (
                      <span className={`text-[10px] ${act.netProfit >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                        Lucro: {formatCurrency(act.netProfit)}
                      </span>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Card: Visão Rápida de Patrimônio */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-lg space-y-3.5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  <Landmark className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">Patrimônio Consolidado</h3>
                  <p className="text-[11px] text-slate-400">Bens, contas e passivos</p>
                </div>
              </div>
              {onGoToPatrimonio && (
                <button
                  onClick={onGoToPatrimonio}
                  className="text-xs text-emerald-400 hover:text-emerald-300 font-semibold"
                >
                  Ver Tudo &rarr;
                </button>
              )}
            </div>

            {netWorthSummary ? (
              <div className="space-y-2 text-xs">
                <div className="flex items-center justify-between p-2 bg-slate-850 rounded-xl border border-slate-750">
                  <span className="text-slate-300">Total de Ativos:</span>
                  <span className="font-bold text-emerald-400">{formatCurrency(netWorthSummary.totalAssets)}</span>
                </div>
                <div className="flex items-center justify-between p-2 bg-slate-850 rounded-xl border border-slate-750">
                  <span className="text-slate-300">Total de Passivos:</span>
                  <span className="font-bold text-rose-400">{formatCurrency(netWorthSummary.totalLiabilities)}</span>
                </div>
                <div className="flex items-center justify-between p-2 bg-slate-950 rounded-xl border border-emerald-500/30">
                  <span className="font-semibold text-emerald-300">Patrimônio Líquido:</span>
                  <span className="font-black text-emerald-400 text-sm">{formatCurrency(netWorthSummary.netWorth)}</span>
                </div>
              </div>
            ) : (
              <div className="text-center py-6 text-slate-500 text-xs">
                Nenhum ativo ou passivo cadastrado.
              </div>
            )}
          </div>

          {onGoToPatrimonio && (
            <button
              onClick={onGoToPatrimonio}
              className="w-full py-2 text-xs font-semibold text-center text-emerald-300 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 rounded-xl transition-all"
            >
              Acessar Módulo Patrimônio
            </button>
          )}
        </div>
      </div>

      {/* ─── 3. CATEGORY PROGRESS & TARGETS SECTION ─── */}
      <div className="space-y-3 pt-2">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <span>Distribuição da Renda por Metas Percentuais</span>
            </h2>
            <p className="text-xs text-slate-400">
              Metas percentuais planejadas sobre a Renda Total vs valores executados
            </p>
          </div>

          <button
            id="adjust-targets-shortcut-btn"
            onClick={onGoToTargets}
            className="text-xs font-medium text-blue-400 hover:text-blue-300 self-start sm:self-auto flex items-center gap-1 hover:underline"
          >
            Ajustar % das Metas
          </button>
        </div>

        {/* 6 Categories Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {CATEGORY_IDS.map((catId) => {
            const calc = categories[catId];
            const { category, targetPercent, targetAmount, actualAmount, difference, status } = calc;

            let barColor = 'bg-blue-500';
            let statusBadge = { text: 'No limite', color: 'text-slate-300 bg-slate-800 border-slate-700' };

            if (category.nature === 'growth' || category.nature === 'security') {
              if (status === 'achieved') {
                barColor = 'bg-emerald-500 shadow-sm shadow-emerald-500/50';
                statusBadge = { text: 'Meta Atingida! 🎉', color: 'text-emerald-300 bg-emerald-950/40 border-emerald-800/50' };
              } else if (status === 'on_track') {
                barColor = 'bg-cyan-500';
                statusBadge = { text: 'Em andamento', color: 'text-cyan-300 bg-cyan-950/40 border-cyan-800/50' };
              } else {
                barColor = 'bg-blue-500';
                statusBadge = { text: 'Abaixo da meta', color: 'text-blue-300 bg-blue-950/40 border-blue-800/50' };
              }
            } else {
              if (status === 'danger') {
                barColor = 'bg-rose-500 shadow-sm shadow-rose-500/50';
                statusBadge = { text: 'Estourou meta ⚠️', color: 'text-rose-300 bg-rose-950/40 border-rose-800/50' };
              } else if (status === 'warning') {
                barColor = 'bg-amber-500';
                statusBadge = { text: 'Perto do limite', color: 'text-amber-300 bg-amber-950/40 border-amber-800/50' };
              } else {
                barColor = 'bg-emerald-500';
                statusBadge = { text: 'Dentro da meta', color: 'text-emerald-300 bg-emerald-950/40 border-emerald-800/50' };
              }
            }

            const barWidthPercent = targetAmount > 0
              ? Math.min(100, Math.max(0, (actualAmount / targetAmount) * 100))
              : actualAmount > 0 ? 100 : 0;

            return (
              <div
                key={catId}
                id={`category-card-${catId}`}
                className="bg-slate-900/80 border border-slate-800 hover:border-slate-700/80 rounded-2xl p-4 sm:p-5 shadow-lg shadow-black/20 flex flex-col justify-between transition-all"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div className="flex items-center gap-2.5">
                      <div
                        className="p-2 rounded-xl border shrink-0"
                        style={{
                          backgroundColor: category.accentBg,
                          borderColor: category.borderColor,
                          color: category.color,
                        }}
                      >
                        <CategoryIcon categoryId={catId} className="w-4 h-4" />
                      </div>
                      <div>
                        <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
                          {category.name}
                        </h3>
                        <span className="text-[11px] text-slate-400">
                          Meta: <strong className="text-slate-200">{formatPercent(targetPercent, 0)}</strong> da renda
                        </span>
                      </div>
                    </div>

                    <span
                      className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${statusBadge.color}`}
                    >
                      {statusBadge.text}
                    </span>
                  </div>

                  <div className="space-y-1 my-3">
                    <div className="flex items-baseline justify-between">
                      <span className="text-xs text-slate-400">
                        {catId === 'negocios' ? 'Total Investido:' : 'Realizado:'}
                      </span>
                      <span className="text-lg font-bold text-white">
                        {formatCurrency(actualAmount)}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-xs text-slate-400">
                      <span>Meta em R$:</span>
                      <span className="font-semibold text-slate-300">
                        {formatCurrency(targetAmount)}
                      </span>
                    </div>

                    {catId === 'negocios' && (
                      <div className="pt-2 mt-2 border-t border-slate-800/80 space-y-1.5 bg-slate-950/40 p-2 rounded-xl">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-slate-400">Total Retornado:</span>
                          <span className="font-bold text-emerald-400">
                            {formatCurrency(calc.totalReturned || 0)}
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-slate-400">Resultado Líquido:</span>
                          <div className="flex items-center gap-1.5">
                            <span
                              className={`font-bold ${
                                (calc.netProfit || 0) >= 0
                                  ? 'text-emerald-400'
                                  : 'text-rose-400'
                              }`}
                            >
                              {formatCurrency(calc.netProfit || 0)}
                            </span>
                            <span
                              className={`text-[10px] px-1.5 py-0.5 rounded font-semibold ${
                                (calc.netProfit || 0) >= 0
                                  ? 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/20'
                                  : 'bg-rose-500/10 text-rose-300 border border-rose-500/20'
                              }`}
                            >
                              {(calc.roiPercent || 0) >= 0
                                ? `+${formatPercent(calc.roiPercent || 0, 0)}`
                                : formatPercent(calc.roiPercent || 0, 0)}
                            </span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="space-y-1.5 my-3">
                    <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden p-0.5 border border-slate-750">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${barColor}`}
                        style={{ width: `${barWidthPercent}%` }}
                      />
                    </div>

                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-slate-400 font-medium">
                        {targetAmount > 0
                          ? `${formatPercent((actualAmount / targetAmount) * 100, 0)} atingido`
                          : 'Meta 0%'}
                      </span>
                      <span
                        className={`font-semibold ${
                          difference >= 0 ? 'text-emerald-400' : 'text-rose-400'
                        }`}
                      >
                        {difference >= 0
                          ? `Falta/Resta ${formatCurrency(difference)}`
                          : `Passou ${formatCurrency(Math.abs(difference))}`}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="pt-3 mt-1 border-t border-slate-800/80 flex items-center justify-between gap-2">
                  <button
                    id={`view-tx-category-${catId}-btn`}
                    onClick={() => onGoToTransactions(catId)}
                    className="text-xs text-slate-400 hover:text-white transition-colors"
                  >
                    Ver {calc.count} lançamento(s)
                  </button>

                  <button
                    id={`add-tx-to-${catId}-btn`}
                    onClick={() => onOpenTransactionModal(catId)}
                    className="flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-blue-300 bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/30 rounded-lg transition-colors"
                  >
                    <Plus className="w-3 h-3" />
                    <span>Lançar</span>
                  </button>
                </div>
              </div>
            );
          })}

          {/* Unallocated / Free Buffer Card */}
          <div
            id="category-card-unallocated"
            className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-4 sm:p-5 shadow-lg shadow-black/20 flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-slate-800 text-slate-300 border border-slate-700">
                    <Info className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-200">
                      Livre / Não Alocado
                    </h3>
                    <span className="text-[11px] text-slate-400">
                      Meta padrão: <strong>{formatPercent(unallocatedTargetPercent, 0)}</strong> da renda
                    </span>
                  </div>
                </div>

                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full border bg-slate-800 text-slate-300 border-slate-700">
                  Buffer / Margem
                </span>
              </div>

              <div className="space-y-1 my-3">
                <div className="flex items-baseline justify-between">
                  <span className="text-xs text-slate-400">Saldo Livre Atual:</span>
                  <span className="text-lg font-bold text-blue-400">
                    {formatCurrency(remainingBalance)}
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs text-slate-400">
                  <span>Meta Planejada:</span>
                  <span className="font-semibold text-slate-300">
                    {formatCurrency(unallocatedTargetAmount)}
                  </span>
                </div>
              </div>

              <p className="text-xs text-slate-400 leading-relaxed my-2">
                A margem livre proporciona flexibilidade financeira para imprevistos ou lazer sem comprometer as metas fixas.
              </p>
            </div>

            <div className="pt-3 mt-1 border-t border-slate-800/80 flex items-center justify-between">
              <span className="text-xs text-slate-500">
                {totalIncome > 0
                  ? `${formatPercent((remainingBalance / totalIncome) * 100)} da renda livre`
                  : 'Aguardando renda'}
              </span>
              <button
                id="adjust-targets-from-unallocated-btn"
                onClick={onGoToTargets}
                className="text-xs text-blue-400 hover:text-blue-300 font-medium hover:underline"
              >
                Configurar %
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ─── 4. CHARTS SECTION (DONUT & COMPARISON BARS) ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 pt-2">
        {/* Donut Chart: Real Distribution */}
        <div
          id="chart-donut-distribution-container"
          className="lg:col-span-5 bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-lg shadow-black/20 flex flex-col justify-between"
        >
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <PieIcon className="w-4 h-4 text-blue-400" />
                Distribuição Real dos Gastos
              </h3>
              <span className="text-xs text-slate-400">
                Total: <strong className="text-slate-200">{formatCurrency(totalExpensesAndAllocations)}</strong>
              </span>
            </div>
            <p className="text-xs text-slate-400 mb-4">
              Proporção de cada categoria no total realizado
            </p>
          </div>

          <div className="h-64 w-full flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieDisplayData}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={85}
                  paddingAngle={hasTransactions ? 3 : 0}
                  dataKey="value"
                  stroke="#0f172a"
                  strokeWidth={2}
                >
                  {pieDisplayData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                {hasTransactions && <Tooltip content={<CustomDonutTooltip />} />}
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Legends */}
          <div className="grid grid-cols-2 gap-2 pt-3 border-t border-slate-800 text-xs">
            {CATEGORY_IDS.map((catId) => {
              const calc = categories[catId];
              return (
                <div key={catId} className="flex items-center justify-between gap-1">
                  <div className="flex items-center gap-1.5 truncate">
                    <span
                      className="w-2.5 h-2.5 rounded-full shrink-0"
                      style={{ backgroundColor: calc.category.color }}
                    />
                    <span className="text-slate-300 truncate">{calc.category.name}:</span>
                  </div>
                  <span className="font-medium text-slate-200 text-[11px] shrink-0">
                    {formatCurrency(calc.actualAmount)}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Bar Chart: Planned Meta vs Real */}
        <div
          id="chart-planned-vs-actual-container"
          className="lg:col-span-7 bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-lg shadow-black/20 flex flex-col justify-between"
        >
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-blue-400" />
                Meta Planejada (R$) vs Valor Real (R$)
              </h3>
              <div className="flex items-center gap-3 text-xs">
                <span className="flex items-center gap-1.5 text-slate-400">
                  <span className="w-3 h-3 rounded bg-slate-700 inline-block" />
                  Meta Planejada
                </span>
                <span className="flex items-center gap-1.5 text-blue-400">
                  <span className="w-3 h-3 rounded bg-blue-500 inline-block" />
                  Valor Real
                </span>
              </div>
            </div>
            <p className="text-xs text-slate-400 mb-4">
              Comparativo direto por categoria em Reais
            </p>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={comparisonBarData}
                margin={{ top: 10, right: 10, left: -10, bottom: 0 }}
              >
                <XAxis
                  dataKey="name"
                  stroke="#64748b"
                  fontSize={11}
                  tickLine={false}
                  axisLine={{ stroke: '#334155' }}
                />
                <YAxis
                  stroke="#64748b"
                  fontSize={11}
                  tickLine={false}
                  axisLine={{ stroke: '#334155' }}
                  tickFormatter={(val) => `R$${val >= 1000 ? `${(val/1000).toFixed(0)}k` : val}`}
                />
                <Tooltip content={<CustomBarTooltip />} />
                <Bar
                  dataKey="meta"
                  name="Meta Planejada"
                  fill="#334155"
                  radius={[4, 4, 0, 0]}
                  maxBarSize={32}
                />
                <Bar
                  dataKey="real"
                  name="Valor Real"
                  fill="#3b82f6"
                  radius={[4, 4, 0, 0]}
                  maxBarSize={32}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="pt-3 border-t border-slate-800 text-xs text-slate-400 flex items-center justify-between">
            <span>💡 Mantenha os valores reais dentro das metas planejadas.</span>
            <button
              id="goto-all-transactions-btn"
              onClick={() => onGoToTransactions()}
              className="text-blue-400 hover:underline font-medium"
            >
              Ver todos lançamentos &rarr;
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
