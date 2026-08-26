import React, { useState, useMemo } from 'react';
import {
  TrendingUp,
  BarChart2,
  Calendar,
  Layers,
  Sparkles,
  ArrowUpRight,
  ArrowDownRight,
  PiggyBank,
  CheckCircle2,
  DollarSign,
  PieChart as PieIcon,
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
  BarChart,
  Bar,
} from 'recharts';
import { MonthData } from '../types';
import { getHistoricalData, HistoricalMonthPoint } from '../utils/calculations';
import { CATEGORIES_CONFIG, CATEGORY_IDS } from '../utils/constants';
import { formatCurrency, formatPercent, parseMonthId } from '../utils/formatters';
import { CategoryIcon } from './CategoryIcon';

interface HistoryViewProps {
  allMonths: MonthData[];
  currentMonthId: string;
  onSelectMonth: (monthId: string) => void;
}

export const HistoryView: React.FC<HistoryViewProps> = ({
  allMonths,
  currentMonthId,
  onSelectMonth,
}) => {
  const [chartType, setChartType] = useState<'evolution' | 'breakdown'>('evolution');
  const [selectedMonthsToCompare, setSelectedMonthsToCompare] = useState<string[]>(() => {
    // Default to last 2-3 months
    const sorted = [...allMonths].sort((a, b) => a.id.localeCompare(b.id));
    return sorted.slice(-3).map((m) => m.id);
  });

  const historicalData: HistoricalMonthPoint[] = useMemo(() => {
    return getHistoricalData(allMonths);
  }, [allMonths]);

  // Overall calculations across all recorded months
  const totalMonthsCount = historicalData.length;
  const avgMonthlyIncome =
    totalMonthsCount > 0
      ? historicalData.reduce((acc, curr) => acc + curr.totalIncome, 0) / totalMonthsCount
      : 0;
  const avgMonthlyInvestment =
    totalMonthsCount > 0
      ? historicalData.reduce((acc, curr) => acc + curr.investimento, 0) / totalMonthsCount
      : 0;
  const avgMonthlySavings =
    totalMonthsCount > 0
      ? historicalData.reduce((acc, curr) => acc + curr.poupanca, 0) / totalMonthsCount
      : 0;
  const avgGrowthTotal = avgMonthlyInvestment + avgMonthlySavings;
  const avgSavingsRate =
    avgMonthlyIncome > 0 ? (avgGrowthTotal / avgMonthlyIncome) * 100 : 0;

  const totalAccumulatedGrowth = historicalData.reduce(
    (acc, curr) => acc + curr.investimento + curr.poupanca,
    0
  );

  // Comparison items
  const comparisonPoints = useMemo(() => {
    return historicalData.filter((p) => selectedMonthsToCompare.includes(p.id));
  }, [historicalData, selectedMonthsToCompare]);

  const toggleMonthSelection = (id: string) => {
    if (selectedMonthsToCompare.includes(id)) {
      if (selectedMonthsToCompare.length > 1) {
        setSelectedMonthsToCompare(selectedMonthsToCompare.filter((m) => m !== id));
      }
    } else {
      setSelectedMonthsToCompare([...selectedMonthsToCompare, id]);
    }
  };

  // Custom Chart Tooltip
  const CustomHistoryTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-slate-900/95 border border-slate-700 p-3.5 rounded-xl shadow-2xl text-xs space-y-2 backdrop-blur-md">
          <p className="font-bold text-white border-b border-slate-800 pb-1">{label}</p>
          <div className="space-y-1">
            {payload.map((item: any) => (
              <div key={item.dataKey} className="flex items-center justify-between gap-4">
                <span className="flex items-center gap-1.5 text-slate-300">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                  {item.name}:
                </span>
                <span className="font-bold text-slate-100">{formatCurrency(item.value)}</span>
              </div>
            ))}
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* 1. AVERAGE STATS & WEALTH BUILDING KPIS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Average Monthly Investment & Savings Indicator (Mandatory Feature) */}
        <div
          id="kpi-avg-growth-card"
          className="bg-slate-900/80 border border-slate-800 hover:border-slate-700 rounded-2xl p-5 shadow-lg shadow-black/20"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Média Investida & Poupada / Mês
            </span>
            <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold tracking-tight text-cyan-400">
            {formatCurrency(avgGrowthTotal)}
          </div>
          <div className="text-xs text-slate-400 mt-1">
            Representa <strong className="text-white">{formatPercent(avgSavingsRate)}</strong> da renda média
          </div>
        </div>

        {/* Total Accumulated Growth */}
        <div
          id="kpi-total-accumulated-card"
          className="bg-slate-900/80 border border-slate-800 hover:border-slate-700 rounded-2xl p-5 shadow-lg shadow-black/20"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Patrimônio Aportado (Histórico)
            </span>
            <div className="p-2 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20">
              <PiggyBank className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold tracking-tight text-white">
            {formatCurrency(totalAccumulatedGrowth)}
          </div>
          <div className="text-xs text-slate-400 mt-1">
            Soma de aportes e poupança em {totalMonthsCount} meses
          </div>
        </div>

        {/* Average Monthly Income */}
        <div
          id="kpi-avg-income-card"
          className="bg-slate-900/80 border border-slate-800 hover:border-slate-700 rounded-2xl p-5 shadow-lg shadow-black/20"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Renda Média Mensal
            </span>
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold tracking-tight text-white">
            {formatCurrency(avgMonthlyIncome)}
          </div>
          <div className="text-xs text-slate-400 mt-1">
            Considerando todas as fontes de entrada
          </div>
        </div>

        {/* Months Tracked Badge */}
        <div
          id="kpi-months-tracked-card"
          className="bg-slate-900/80 border border-slate-800 hover:border-slate-700 rounded-2xl p-5 shadow-lg shadow-black/20"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Meses Registrados
            </span>
            <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              <Calendar className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold tracking-tight text-white">
            {totalMonthsCount} <span className="text-sm font-normal text-slate-400">meses</span>
          </div>
          <div className="text-xs text-slate-400 mt-1">
            Histórico consistente de controle
          </div>
        </div>
      </div>

      {/* 2. MONTH-OVER-MONTH EVOLUTION CHART */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-lg shadow-black/20 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-blue-400" />
              Evolução Mês a Mês das Finanças
            </h3>
            <p className="text-xs text-slate-400">
              Acompanhe a trajetória de Renda, Despesas, Investimentos e Poupança
            </p>
          </div>

          <div className="flex items-center gap-1.5 bg-slate-950 p-1 rounded-xl border border-slate-800">
            <button
              id="chart-mode-evolution-btn"
              onClick={() => setChartType('evolution')}
              className={`px-3 py-1 text-xs font-medium rounded-lg transition-all ${
                chartType === 'evolution'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Área / Linhas
            </button>
            <button
              id="chart-mode-breakdown-btn"
              onClick={() => setChartType('breakdown')}
              className={`px-3 py-1 text-xs font-medium rounded-lg transition-all ${
                chartType === 'breakdown'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Barras Empilhadas
            </button>
          </div>
        </div>

        {/* The Recharts Chart Container */}
        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            {chartType === 'evolution' ? (
              <AreaChart
                data={historicalData}
                margin={{ top: 10, right: 10, left: -10, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="incomeGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                  </linearGradient>
                  <linearGradient id="investGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#60a5fa" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#60a5fa" stopOpacity={0.0} />
                  </linearGradient>
                  <linearGradient id="expenseGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ef4444" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0.0} />
                  </linearGradient>
                  <linearGradient id="savingsGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2dd4bf" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#2dd4bf" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                <XAxis
                  dataKey="shortLabel"
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
                <Tooltip content={<CustomHistoryTooltip />} />
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                <Area
                  type="monotone"
                  dataKey="totalIncome"
                  name="Renda Total"
                  stroke="#10b981"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#incomeGrad)"
                />
                <Area
                  type="monotone"
                  dataKey="investimento"
                  name="Investimentos"
                  stroke="#60a5fa"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#investGrad)"
                />
                <Area
                  type="monotone"
                  dataKey="despesas"
                  name="Despesas Fixas"
                  stroke="#ef4444"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#expenseGrad)"
                />
                <Area
                  type="monotone"
                  dataKey="poupanca"
                  name="Poupança"
                  stroke="#2dd4bf"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#savingsGrad)"
                />
              </AreaChart>
            ) : (
              <BarChart
                data={historicalData}
                margin={{ top: 10, right: 10, left: -10, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                <XAxis
                  dataKey="shortLabel"
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
                <Tooltip content={<CustomHistoryTooltip />} />
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                <Bar dataKey="despesas" name="Despesas" stackId="a" fill="#3b82f6" />
                <Bar dataKey="investimento" name="Investimento" stackId="a" fill="#60a5fa" />
                <Bar dataKey="conhecimento" name="Conhecimento" stackId="a" fill="#818cf8" />
                <Bar dataKey="doacao" name="Doação" stackId="a" fill="#38bdf8" />
                <Bar dataKey="poupanca" name="Poupança" stackId="a" fill="#2dd4bf" />
                <Bar dataKey="negocios" name="Negócios" stackId="a" fill="#f59e0b" />
                <Bar dataKey="remainingBalance" name="Saldo Livre" stackId="a" fill="#1e293b" />
              </BarChart>
            )}
          </ResponsiveContainer>
        </div>
      </div>

      {/* 3. SIDE-BY-SIDE MONTH COMPARISON (Mandatory Feature) */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-lg shadow-black/20 space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-800 pb-3">
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Layers className="w-4 h-4 text-cyan-400" />
              Comparativo Lado a Lado de Meses
            </h3>
            <p className="text-xs text-slate-400">
              Selecione 2 ou mais meses para comparar desempenhos e alocações detalhadamente
            </p>
          </div>

          {/* Month Selection Toggle Pills */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-xs text-slate-400 mr-1">Comparar:</span>
            {historicalData.map((m) => {
              const isSelected = selectedMonthsToCompare.includes(m.id);
              return (
                <button
                  key={m.id}
                  id={`compare-toggle-${m.id}`}
                  onClick={() => toggleMonthSelection(m.id)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all border ${
                    isSelected
                      ? 'bg-blue-600/30 text-blue-200 border-blue-500 shadow-sm'
                      : 'bg-slate-950 text-slate-500 border-slate-800 hover:text-slate-300'
                  }`}
                >
                  {m.shortLabel}
                </button>
              );
            })}
          </div>
        </div>

        {/* Side-by-side Table Grid */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse min-w-[500px]">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400">
                <th className="py-3 px-3 font-semibold text-slate-300">Métrica / Categoria</th>
                {comparisonPoints.map((p) => (
                  <th key={p.id} className="py-3 px-3 font-bold text-white text-center">
                    <button
                      onClick={() => onSelectMonth(p.id)}
                      className="hover:text-blue-400 hover:underline transition-colors"
                      title="Abrir este mês"
                    >
                      {p.label}
                    </button>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {/* Total Income */}
              <tr className="bg-emerald-950/15">
                <td className="py-2.5 px-3 font-bold text-emerald-300 flex items-center gap-1.5">
                  <DollarSign className="w-3.5 h-3.5" />
                  Renda Total
                </td>
                {comparisonPoints.map((p) => (
                  <td key={p.id} className="py-2.5 px-3 text-center font-bold text-emerald-400">
                    {formatCurrency(p.totalIncome)}
                  </td>
                ))}
              </tr>

              {/* Despesas */}
              <tr>
                <td className="py-2.5 px-3 text-slate-300 flex items-center gap-1.5">
                  <CategoryIcon categoryId="despesas" className="w-3.5 h-3.5 text-blue-400" />
                  Despesas Fixas & Variáveis
                </td>
                {comparisonPoints.map((p) => (
                  <td key={p.id} className="py-2.5 px-3 text-center text-slate-200">
                    {formatCurrency(p.despesas)}
                  </td>
                ))}
              </tr>

              {/* Investimento */}
              <tr>
                <td className="py-2.5 px-3 text-slate-300 flex items-center gap-1.5">
                  <CategoryIcon categoryId="investimento" className="w-3.5 h-3.5 text-blue-300" />
                  Investimentos
                </td>
                {comparisonPoints.map((p) => (
                  <td key={p.id} className="py-2.5 px-3 text-center font-semibold text-blue-300">
                    {formatCurrency(p.investimento)}
                  </td>
                ))}
              </tr>

              {/* Conhecimento */}
              <tr>
                <td className="py-2.5 px-3 text-slate-300 flex items-center gap-1.5">
                  <CategoryIcon categoryId="conhecimento" className="w-3.5 h-3.5 text-indigo-400" />
                  Conhecimento
                </td>
                {comparisonPoints.map((p) => (
                  <td key={p.id} className="py-2.5 px-3 text-center text-slate-200">
                    {formatCurrency(p.conhecimento)}
                  </td>
                ))}
              </tr>

              {/* Doação */}
              <tr>
                <td className="py-2.5 px-3 text-slate-300 flex items-center gap-1.5">
                  <CategoryIcon categoryId="doacao" className="w-3.5 h-3.5 text-cyan-400" />
                  Doação
                </td>
                {comparisonPoints.map((p) => (
                  <td key={p.id} className="py-2.5 px-3 text-center text-slate-200">
                    {formatCurrency(p.doacao)}
                  </td>
                ))}
              </tr>

              {/* Poupança */}
              <tr>
                <td className="py-2.5 px-3 text-slate-300 flex items-center gap-1.5">
                  <CategoryIcon categoryId="poupanca" className="w-3.5 h-3.5 text-teal-400" />
                  Poupança
                </td>
                {comparisonPoints.map((p) => (
                  <td key={p.id} className="py-2.5 px-3 text-center text-teal-300 font-semibold">
                    {formatCurrency(p.poupanca)}
                  </td>
                ))}
              </tr>

              {/* Negócios */}
              <tr>
                <td className="py-2.5 px-3 text-slate-300 flex items-center gap-1.5">
                  <CategoryIcon categoryId="negocios" className="w-3.5 h-3.5 text-amber-400" />
                  Negócios (Aporte)
                </td>
                {comparisonPoints.map((p) => (
                  <td key={p.id} className="py-2.5 px-3 text-center text-amber-300 font-semibold">
                    {formatCurrency(p.negocios)}
                    {p.negociosReturn > 0 && (
                      <span className="block text-[10px] text-emerald-400 font-normal">
                        Retorno: {formatCurrency(p.negociosReturn)}
                      </span>
                    )}
                  </td>
                ))}
              </tr>

              {/* Total Spent */}
              <tr className="bg-slate-950/40">
                <td className="py-2.5 px-3 font-semibold text-slate-300">
                  Total Alocado / Gasto
                </td>
                {comparisonPoints.map((p) => (
                  <td key={p.id} className="py-2.5 px-3 text-center font-bold text-slate-200">
                    {formatCurrency(p.totalSpent)}
                  </td>
                ))}
              </tr>

              {/* Remaining Balance */}
              <tr className="bg-blue-950/15">
                <td className="py-2.5 px-3 font-bold text-blue-300">
                  Saldo Restante / Livre
                </td>
                {comparisonPoints.map((p) => (
                  <td
                    key={p.id}
                    className={`py-2.5 px-3 text-center font-bold ${
                      p.remainingBalance >= 0 ? 'text-blue-400' : 'text-rose-400'
                    }`}
                  >
                    {formatCurrency(p.remainingBalance)}
                  </td>
                ))}
              </tr>

              {/* Rate of Savings/Investment */}
              <tr className="bg-cyan-950/15">
                <td className="py-2.5 px-3 font-bold text-cyan-300">
                  Taxa de Aporte & Poupança (%)
                </td>
                {comparisonPoints.map((p) => (
                  <td key={p.id} className="py-2.5 px-3 text-center font-bold text-cyan-400">
                    {formatPercent(p.savingsRate)}
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
