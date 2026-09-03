import React, { useState, useMemo } from 'react';
import {
  Landmark,
  Plus,
  Edit2,
  Trash2,
  Building2,
  TrendingUp,
  Wallet,
  Briefcase,
  Car,
  HelpCircle,
  CreditCard,
  Layers,
  AlertCircle,
  FileText,
  ShieldCheck,
  ArrowUpRight,
  ArrowDownRight,
  PieChart as PieIcon,
  BarChart3,
  Sparkles,
  Info,
  PiggyBank,
  LineChart as LineChartIcon,
  Coins,
  Scale,
  Calendar,
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
  AreaChart,
  Area,
  Line,
} from 'recharts';
import {
  AssetItem,
  AssetType,
  LiabilityItem,
  LiabilityType,
  MonthData,
  IncomeActivity,
  NetWorthSummary,
  PatrimonioEvolutionSummary,
} from '../types';
import { calculateNetWorthSummary, calculatePatrimonioEvolution } from '../utils/calculations';
import { formatCurrency, formatPercent, formatDateBR } from '../utils/formatters';
import { AssetModal } from './AssetModal';
import { LiabilityModal } from './LiabilityModal';
import { DeleteConfirmModal } from './DeleteConfirmModal';

interface PatrimonioViewProps {
  assets: AssetItem[];
  liabilities: LiabilityItem[];
  allMonths?: MonthData[];
  activities?: IncomeActivity[];
  onSaveAsset: (asset: AssetItem) => Promise<void>;
  onDeleteAsset: (assetId: string) => Promise<void>;
  onSaveLiability: (liability: LiabilityItem) => Promise<void>;
  onDeleteLiability: (liabilityId: string) => Promise<void>;
}

const ASSET_TYPE_CONFIG: Record<AssetType, { label: string; icon: React.ReactNode; color: string }> = {
  conta: { label: 'Dinheiro / Contas', icon: <Wallet className="w-4 h-4" />, color: '#06b6d4' },
  poupanca: { label: 'Poupança', icon: <PiggyBank className="w-4 h-4" />, color: '#eab308' },
  investimento: { label: 'Investimentos Gerais', icon: <TrendingUp className="w-4 h-4" />, color: '#10b981' },
  acoes: { label: 'Ações (B3 / Global)', icon: <LineChartIcon className="w-4 h-4" />, color: '#3b82f6' },
  fiis: { label: 'FIIs (Imobiliários)', icon: <Building2 className="w-4 h-4" />, color: '#6366f1' },
  tesouro: { label: 'Tesouro / Renda Fixa', icon: <Landmark className="w-4 h-4" />, color: '#14b8a6' },
  cripto: { label: 'Criptomoedas', icon: <Coins className="w-4 h-4" />, color: '#f59e0b' },
  imovel: { label: 'Imóveis', icon: <Building2 className="w-4 h-4" />, color: '#8b5cf6' },
  veiculo: { label: 'Veículos', icon: <Car className="w-4 h-4" />, color: '#ec4899' },
  negocio: { label: 'Negócios / Participações', icon: <Briefcase className="w-4 h-4" />, color: '#f97316' },
  outro: { label: 'Outros Ativos', icon: <HelpCircle className="w-4 h-4" />, color: '#64748b' },
};

const LIABILITY_TYPE_CONFIG: Record<LiabilityType, { label: string; icon: React.ReactNode; color: string }> = {
  financiamento: { label: 'Financiamento', icon: <Layers className="w-4 h-4" />, color: '#f43f5e' },
  emprestimo: { label: 'Empréstimo', icon: <FileText className="w-4 h-4" />, color: '#e11d48' },
  divida: { label: 'Dívida / Pendência', icon: <AlertCircle className="w-4 h-4" />, color: '#be123c' },
  parcelamento: { label: 'Parcelamento', icon: <CreditCard className="w-4 h-4" />, color: '#fb7185' },
  outro: { label: 'Outro Passivo', icon: <HelpCircle className="w-4 h-4" />, color: '#9f1239' },
};

export const PatrimonioView: React.FC<PatrimonioViewProps> = ({
  assets,
  liabilities,
  allMonths = [],
  activities = [],
  onSaveAsset,
  onDeleteAsset,
  onSaveLiability,
  onDeleteLiability,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'all' | 'assets' | 'liabilities' | 'evolution'>('all');
  const [assetFilter, setAssetFilter] = useState<AssetType | 'all'>('all');
  const [liabilityFilter, setLiabilityFilter] = useState<LiabilityType | 'all'>('all');

  // Modal states
  const [isAssetModalOpen, setIsAssetModalOpen] = useState(false);
  const [editingAsset, setEditingAsset] = useState<AssetItem | null>(null);
  const [isLiabilityModalOpen, setIsLiabilityModalOpen] = useState(false);
  const [editingLiability, setEditingLiability] = useState<LiabilityItem | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<{
    type: 'asset' | 'liability';
    item: AssetItem | LiabilityItem;
  } | null>(null);

  const summary: NetWorthSummary = useMemo(() => {
    return calculateNetWorthSummary(assets, liabilities);
  }, [assets, liabilities]);

  const { totalAssets, totalLiabilities, netWorth, assetsByType } = summary;

  // Evolução Patrimonial Histórica Real
  const evolution: PatrimonioEvolutionSummary = useMemo(() => {
    return calculatePatrimonioEvolution(allMonths, assets, liabilities, activities);
  }, [allMonths, assets, liabilities, activities]);

  // Donut chart data para ativos
  const assetChartData = Object.entries(assetsByType)
    .filter(([, val]) => val > 0)
    .map(([type, val]) => ({
      name: ASSET_TYPE_CONFIG[type as AssetType]?.label || type,
      value: val,
      color: ASSET_TYPE_CONFIG[type as AssetType]?.color || '#3b82f6',
    }));

  // Bar chart comparativo Ativos vs Passivos
  const comparisonData = [
    { name: 'Posição Patrimonial', Ativos: totalAssets, Passivos: totalLiabilities, 'Patrimônio Líquido': Math.max(0, netWorth) },
  ];

  const filteredAssets = assets.filter((a) => assetFilter === 'all' || a.type === assetFilter);
  const filteredLiabilities = liabilities.filter((l) => liabilityFilter === 'all' || l.type === liabilityFilter);

  const handleDeleteConfirmed = async () => {
    if (!deleteTarget) return;
    if (deleteTarget.type === 'asset') {
      await onDeleteAsset(deleteTarget.item.id);
    } else {
      await onDeleteLiability(deleteTarget.item.id);
    }
    setDeleteTarget(null);
  };

  const debtRatio = totalAssets > 0 ? (totalLiabilities / totalAssets) * 100 : 0;

  return (
    <div className="space-y-6 animate-in fade-in duration-300 pb-12">
      {/* ─── HEADER DA ABA ─── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Landmark className="w-5 h-5 text-emerald-400" />
            Patrimônio Líquido & Balanço Patrimonial
          </h2>
          <p className="text-sm text-slate-400 mt-0.5">
            Gestão consolidada de Ativos, Passivos, dívidas e evolução da sua riqueza real
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            id="btn-add-asset"
            onClick={() => {
              setEditingAsset(null);
              setIsAssetModalOpen(true);
            }}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-emerald-300 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 rounded-xl transition-all"
          >
            <Plus className="w-3.5 h-3.5 text-emerald-400" />
            <span>+ Novo Ativo</span>
          </button>

          <button
            type="button"
            id="btn-add-liability"
            onClick={() => {
              setEditingLiability(null);
              setIsLiabilityModalOpen(true);
            }}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-rose-300 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 rounded-xl transition-all"
          >
            <Plus className="w-3.5 h-3.5 text-rose-400" />
            <span>+ Novo Passivo</span>
          </button>
        </div>
      </div>

      {/* ─── TOP KPI CARDS ─── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card: Patrimônio Líquido */}
        <div className="relative bg-gradient-to-br from-emerald-950/40 via-slate-900 to-slate-900 border border-emerald-500/40 rounded-2xl p-5 shadow-xl shadow-emerald-950/20 group overflow-hidden">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider">
              Patrimônio Líquido
            </span>
            <div className="p-2 rounded-xl bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
              <ShieldCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="space-y-1">
            <div className={`text-2xl font-black tracking-tight ${netWorth >= 0 ? 'text-emerald-300' : 'text-rose-400'}`}>
              {formatCurrency(netWorth)}
            </div>
            <div className="text-xs text-slate-400 flex items-center justify-between">
              <span>Ativos − Passivos</span>
              <span className="text-[11px] font-semibold text-emerald-400">
                {netWorth >= 0 ? 'Posição Positiva' : 'Posição Negativa'}
              </span>
            </div>
          </div>
        </div>

        {/* Card: Total de Ativos */}
        <div className="relative bg-slate-900/80 border border-slate-800 hover:border-slate-700/80 rounded-2xl p-5 shadow-lg group overflow-hidden">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Total de Ativos
            </span>
            <div className="p-2 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20">
              <Building2 className="w-4 h-4" />
            </div>
          </div>
          <div className="space-y-1">
            <div className="text-2xl font-bold tracking-tight text-white">
              {formatCurrency(totalAssets)}
            </div>
            <div className="text-xs text-slate-400 flex items-center justify-between">
              <span>{assets.length} item(ns) cadastrado(s)</span>
              <span className="text-blue-400 font-medium">Bens & Direitos</span>
            </div>
          </div>
        </div>

        {/* Card: Total de Passivos */}
        <div className="relative bg-slate-900/80 border border-slate-800 hover:border-slate-700/80 rounded-2xl p-5 shadow-lg group overflow-hidden">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Total de Passivos / Dívidas
            </span>
            <div className="p-2 rounded-xl bg-rose-500/10 text-rose-400 border border-rose-500/20">
              <CreditCard className="w-4 h-4" />
            </div>
          </div>
          <div className="space-y-1">
            <div className="text-2xl font-bold tracking-tight text-white">
              {formatCurrency(totalLiabilities)}
            </div>
            <div className="text-xs text-slate-400 flex items-center justify-between">
              <span>{liabilities.length} compromisso(s)</span>
              <span className="text-rose-400 font-medium">Saldo Devedor</span>
            </div>
          </div>
        </div>

        {/* Card: Grau de Alavancagem */}
        <div className="relative bg-slate-900/80 border border-slate-800 hover:border-slate-700/80 rounded-2xl p-5 shadow-lg group overflow-hidden">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Comprometimento Patrimonial
            </span>
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <BarChart3 className="w-4 h-4" />
            </div>
          </div>
          <div className="space-y-1">
            <div className="text-2xl font-bold tracking-tight text-white">
              {formatPercent(debtRatio)}
            </div>
            <div className="text-xs text-slate-400 flex items-center justify-between">
              <span>Passivos / Ativos</span>
              <span className={`font-medium ${debtRatio <= 30 ? 'text-emerald-400' : debtRatio <= 60 ? 'text-amber-400' : 'text-rose-400'}`}>
                {debtRatio <= 30 ? 'Excelente Solvência' : debtRatio <= 60 ? 'Alavancagem Moderada' : 'Atenção com Dívidas'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ─── CARD EDUCATIVO: REGRA DE OURO DOS APORTES VS PATRIMÔNIO ─── */}
      <div className="p-4.5 bg-gradient-to-r from-slate-900 via-slate-900 to-blue-950/40 border border-blue-500/30 rounded-2xl shadow-lg flex items-start gap-4">
        <div className="p-2.5 rounded-xl bg-blue-500/15 text-blue-400 border border-blue-500/30 shrink-0 mt-0.5">
          <Scale className="w-5 h-5" />
        </div>
        <div className="text-xs text-slate-300 space-y-1.5 flex-1">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="font-bold text-white text-sm">
              Regra de Ouro: Aporte vs Patrimônio Líquido
            </span>
            <span className="px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-300 text-[10px] font-semibold border border-emerald-500/20">
              Sem Dupla Contagem
            </span>
          </div>
          <p className="text-slate-400 leading-relaxed">
            Quando você transfere <strong>R$ 3.000</strong> da conta corrente para investimentos ou poupança, o sistema reconhece a movimentação como:
            <span className="text-white font-medium"> Conta (−R$ 3.000)</span> e <span className="text-white font-medium">Investimentos (+R$ 3.000)</span>.
            O patrimônio líquido <strong>não é duplicado</strong> por esse aporte, mantendo sua precisão real.
            Posteriormente, caso o ativo se valorize para R$ 3.500, o seu patrimônio crescerá em R$ 500 pela <em>valorização real</em> dos ativos.
          </p>
        </div>
      </div>

      {/* ─── SEÇÃO DE EVOLUÇÃO PATRIMONIAL HISTÓRICA ─── */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-emerald-400" />
              Evolução do Patrimônio Líquido
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Trajetória mês a mês construída exclusivamente a partir dos seus dados reais
            </p>
          </div>

          <div className="flex items-center gap-2">
            <div className="px-3 py-1.5 rounded-xl bg-slate-800 border border-slate-700 flex items-center gap-2 text-xs">
              <span className="text-slate-400">Crescimento no Período:</span>
              <span className={`font-bold flex items-center gap-0.5 ${evolution.totalGrowthPercent >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                {evolution.totalGrowthPercent >= 0 ? <ArrowUpRight className="w-3.5 h-3.5" /> : <ArrowDownRight className="w-3.5 h-3.5" />}
                {formatPercent(evolution.totalGrowthPercent)}
              </span>
            </div>
          </div>
        </div>

        {/* Mini KPI Cards da Evolução */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <div className="p-3 bg-slate-850 rounded-xl border border-slate-750">
            <span className="text-[10px] text-slate-400 uppercase font-semibold block">Patrimônio Atual</span>
            <span className="text-sm font-bold text-white mt-1 block">
              {formatCurrency(evolution.currentNetWorth)}
            </span>
          </div>

          <div className="p-3 bg-slate-850 rounded-xl border border-slate-750">
            <span className="text-[10px] text-slate-400 uppercase font-semibold block">Patrimônio Inicial</span>
            <span className="text-sm font-bold text-slate-300 mt-1 block">
              {formatCurrency(evolution.initialNetWorth)}
            </span>
          </div>

          <div className="p-3 bg-slate-850 rounded-xl border border-slate-750">
            <span className="text-[10px] text-slate-400 uppercase font-semibold block">Patrimônio Final</span>
            <span className="text-sm font-bold text-emerald-300 mt-1 block">
              {formatCurrency(evolution.finalNetWorth)}
            </span>
          </div>

          <div className="p-3 bg-slate-850 rounded-xl border border-slate-750">
            <span className="text-[10px] text-slate-400 uppercase font-semibold block">Variação no Mês</span>
            <span className={`text-sm font-bold mt-1 block ${evolution.latestMonthlyVariation >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
              {evolution.latestMonthlyVariation >= 0 ? '+' : ''}{formatCurrency(evolution.latestMonthlyVariation)}
            </span>
          </div>

          <div className="p-3 bg-slate-850 rounded-xl border border-slate-750">
            <span className="text-[10px] text-slate-400 uppercase font-semibold block">Variação Acumulada</span>
            <span className={`text-sm font-bold mt-1 block ${evolution.totalVariation >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
              {evolution.totalVariation >= 0 ? '+' : ''}{formatCurrency(evolution.totalVariation)}
            </span>
          </div>

          <div className="p-3 bg-slate-850 rounded-xl border border-slate-750">
            <span className="text-[10px] text-slate-400 uppercase font-semibold block">Taxa de Crescimento</span>
            <span className={`text-sm font-bold mt-1 block ${evolution.totalGrowthPercent >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
              {formatPercent(evolution.totalGrowthPercent)}
            </span>
          </div>
        </div>

        {/* Gráfico de Linha / Área da Evolução */}
        <div className="h-64 w-full pt-2">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={evolution.points} margin={{ top: 10, right: 15, left: 10, bottom: 0 }}>
              <defs>
                <linearGradient id="patrimonioGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="shortLabel" stroke="#64748b" tick={{ fill: '#94a3b8', fontSize: 11 }} />
              <YAxis
                stroke="#64748b"
                tick={{ fill: '#94a3b8', fontSize: 10 }}
                tickFormatter={(v) => `R$ ${(v / 1000).toFixed(0)}k`}
              />
              <Tooltip
                formatter={(val: any) => [formatCurrency(Number(val)), 'Patrimônio Líquido']}
                labelFormatter={(label, payload) => {
                  const pt = payload?.[0]?.payload;
                  return pt?.label || label;
                }}
                contentStyle={{
                  backgroundColor: '#0f172a',
                  borderColor: '#334155',
                  borderRadius: '12px',
                  fontSize: '12px',
                  boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.5)',
                }}
              />
              <Area
                type="monotone"
                dataKey="netWorth"
                stroke="#10b981"
                strokeWidth={3}
                fillOpacity={1}
                fill="url(#patrimonioGrad)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Tabela Resumida da Evolução Mês a Mês */}
        <div className="overflow-x-auto border border-slate-800 rounded-xl">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-850 text-slate-400 uppercase text-[10px] font-semibold">
              <tr>
                <th className="px-4 py-2.5">Mês</th>
                <th className="px-4 py-2.5 text-right">Patrimônio Líquido</th>
                <th className="px-4 py-2.5 text-right">Variação Mensal</th>
                <th className="px-4 py-2.5 text-right">Crescimento %</th>
                <th className="px-4 py-2.5 text-right">Aportes Acumulados</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {evolution.points.map((pt) => (
                <tr key={pt.monthId} className="hover:bg-slate-850/50 transition-colors">
                  <td className="px-4 py-2.5 font-medium text-white">{pt.label}</td>
                  <td className="px-4 py-2.5 text-right font-bold text-emerald-300">
                    {formatCurrency(pt.netWorth)}
                  </td>
                  <td className={`px-4 py-2.5 text-right font-semibold ${pt.monthlyVariation >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {pt.monthlyVariation >= 0 ? '+' : ''}{formatCurrency(pt.monthlyVariation)}
                  </td>
                  <td className={`px-4 py-2.5 text-right font-semibold ${pt.monthlyVariationPct >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {pt.monthlyVariationPct >= 0 ? '+' : ''}{pt.monthlyVariationPct.toFixed(1)}%
                  </td>
                  <td className="px-4 py-2.5 text-right text-slate-400">
                    {formatCurrency(pt.totalInvestedCumulative + pt.totalSavingsCumulative)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ─── GRÁFICOS VISUAIS DE COMPOSIÇÃO ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Donut Chart: Distribuição de Ativos */}
        <div className="lg:col-span-2 bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-lg space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                <PieIcon className="w-4 h-4 text-emerald-400" />
                Composição dos Ativos por Categoria
              </h3>
              <p className="text-xs text-slate-400">Onde o seu patrimônio está alocado</p>
            </div>
            <span className="text-xs font-semibold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-lg">
              {formatCurrency(totalAssets)}
            </span>
          </div>

          {assetChartData.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 items-center gap-4 pt-2">
              <div className="h-56 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={assetChartData}
                      cx="50%"
                      cy="50%"
                      innerRadius={55}
                      outerRadius={80}
                      paddingAngle={3}
                      dataKey="value"
                    >
                      {assetChartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(val: any) => [formatCurrency(Number(val)), 'Valor']}
                      contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', fontSize: '12px' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              <div className="space-y-1.5 text-xs max-h-56 overflow-y-auto custom-scrollbar pr-1">
                {assetChartData.map((entry) => (
                  <div key={entry.name} className="flex items-center justify-between p-2 bg-slate-850 rounded-xl border border-slate-750">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: entry.color }} />
                      <span className="font-medium text-slate-200 line-clamp-1">{entry.name}</span>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="font-bold text-white block">{formatCurrency(entry.value)}</span>
                      <span className="text-[10px] text-slate-400">
                        {formatPercent(totalAssets > 0 ? (entry.value / totalAssets) * 100 : 0)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="text-center py-12 text-slate-500 text-xs">
              Cadastre seus primeiros ativos para visualizar a distribuição gráfica.
            </div>
          )}
        </div>

        {/* Comparativo Ativos vs Passivos */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-lg space-y-4">
          <div>
            <h3 className="text-sm font-semibold text-white flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-blue-400" />
              Ativos vs Passivos
            </h3>
            <p className="text-xs text-slate-400">Proporção de solidez patrimonial</p>
          </div>

          <div className="h-56 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={comparisonData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <XAxis dataKey="name" stroke="#64748b" tick={{ fill: '#94a3b8', fontSize: 11 }} />
                <YAxis stroke="#64748b" tick={{ fill: '#94a3b8', fontSize: 10 }} tickFormatter={(v) => `R$ ${(v / 1000).toFixed(0)}k`} />
                <Tooltip
                  formatter={(val: any) => [formatCurrency(Number(val)), '']}
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', fontSize: '12px' }}
                />
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
                <Bar dataKey="Ativos" fill="#10b981" radius={[8, 8, 0, 0]} />
                <Bar dataKey="Passivos" fill="#f43f5e" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* ─── LISTAGEM: ATIVOS E PASSIVOS ─── */}
      <div className="space-y-4">
        {/* Abas Secundárias */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setActiveSubTab('all')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                activeSubTab === 'all'
                  ? 'bg-blue-600/20 text-blue-300 border border-blue-500/40'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Todos ({assets.length + liabilities.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveSubTab('assets')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                activeSubTab === 'assets'
                  ? 'bg-emerald-600/20 text-emerald-300 border border-emerald-500/40'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Ativos ({assets.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveSubTab('liabilities')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                activeSubTab === 'liabilities'
                  ? 'bg-rose-600/20 text-rose-300 border border-rose-500/40'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Passivos ({liabilities.length})
            </button>
          </div>
        </div>

        {/* 1. SEÇÃO DE ATIVOS */}
        {(activeSubTab === 'all' || activeSubTab === 'assets') && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-bold text-emerald-400 flex items-center gap-2">
                <Building2 className="w-4 h-4" />
                Ativos Patrimoniais ({filteredAssets.length})
              </h4>
              <button
                type="button"
                onClick={() => {
                  setEditingAsset(null);
                  setIsAssetModalOpen(true);
                }}
                className="text-xs text-emerald-400 hover:text-emerald-300 inline-flex items-center gap-1 font-semibold"
              >
                <Plus className="w-3.5 h-3.5" /> Adicionar Ativo
              </button>
            </div>

            {filteredAssets.length === 0 ? (
              <div className="text-center py-8 bg-slate-900/40 rounded-2xl border border-slate-800 p-6 space-y-1 text-slate-500 text-xs">
                Nenhum ativo cadastrado. Adicione seus imóveis, veículos, contas bancárias, ações, FIIs e tesouro.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {filteredAssets.map((asset) => {
                  const cfg = ASSET_TYPE_CONFIG[asset.type] || ASSET_TYPE_CONFIG.outro;
                  return (
                    <div
                      key={asset.id}
                      className="p-4 bg-slate-900/90 border border-slate-800 hover:border-slate-700/80 rounded-2xl shadow-sm space-y-3 transition-all group"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-2.5">
                          <div
                            className="p-2 rounded-xl border shrink-0"
                            style={{
                              backgroundColor: `${cfg.color}15`,
                              borderColor: `${cfg.color}30`,
                              color: cfg.color,
                            }}
                          >
                            {cfg.icon}
                          </div>
                          <div>
                            <span className="text-sm font-semibold text-white block line-clamp-1">
                              {asset.name}
                            </span>
                            <span className="text-[11px] text-slate-400 block">
                              {cfg.label}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => {
                              setEditingAsset(asset);
                              setIsAssetModalOpen(true);
                            }}
                            className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
                            title="Editar"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setDeleteTarget({ type: 'asset', item: asset })}
                            className="p-1 text-slate-400 hover:text-rose-400 rounded-lg hover:bg-rose-950/30 transition-colors"
                            title="Excluir"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      <div className="flex items-end justify-between pt-1 border-t border-slate-800/80">
                        <div>
                          <span className="text-[10px] text-slate-500 block">Avaliação Atual:</span>
                          <span className="text-base font-bold text-emerald-400">
                            {formatCurrency(asset.currentValue)}
                          </span>
                        </div>
                        <span className="text-[10px] text-slate-500">
                          {formatDateBR(asset.valuationDate)}
                        </span>
                      </div>

                      {asset.notes && (
                        <p className="text-[11px] text-slate-400 bg-slate-950/60 p-2 rounded-lg border border-slate-850 line-clamp-2">
                          {asset.notes}
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* 2. SEÇÃO DE PASSIVOS */}
        {(activeSubTab === 'all' || activeSubTab === 'liabilities') && (
          <div className="space-y-3 pt-4">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-bold text-rose-400 flex items-center gap-2">
                <CreditCard className="w-4 h-4" />
                Passivos & Obrigações ({filteredLiabilities.length})
              </h4>
              <button
                type="button"
                onClick={() => {
                  setEditingLiability(null);
                  setIsLiabilityModalOpen(true);
                }}
                className="text-xs text-rose-400 hover:text-rose-300 inline-flex items-center gap-1 font-semibold"
              >
                <Plus className="w-3.5 h-3.5" /> Adicionar Passivo
              </button>
            </div>

            {filteredLiabilities.length === 0 ? (
              <div className="text-center py-8 bg-slate-900/40 rounded-2xl border border-slate-800 p-6 space-y-1 text-slate-500 text-xs">
                Nenhum passivo ou dívida cadastrada. Excelente posição livre de obrigações financeiras.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {filteredLiabilities.map((liab) => {
                  const cfg = LIABILITY_TYPE_CONFIG[liab.type] || LIABILITY_TYPE_CONFIG.outro;
                  return (
                    <div
                      key={liab.id}
                      className="p-4 bg-slate-900/90 border border-slate-800 hover:border-slate-700/80 rounded-2xl shadow-sm space-y-3 transition-all group"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-2.5">
                          <div
                            className="p-2 rounded-xl border shrink-0"
                            style={{
                              backgroundColor: `${cfg.color}15`,
                              borderColor: `${cfg.color}30`,
                              color: cfg.color,
                            }}
                          >
                            {cfg.icon}
                          </div>
                          <div>
                            <span className="text-sm font-semibold text-white block line-clamp-1">
                              {liab.name}
                            </span>
                            <span className="text-[11px] text-slate-400 block">
                              {cfg.label}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => {
                              setEditingLiability(liab);
                              setIsLiabilityModalOpen(true);
                            }}
                            className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
                            title="Editar"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setDeleteTarget({ type: 'liability', item: liab })}
                            className="p-1 text-slate-400 hover:text-rose-400 rounded-lg hover:bg-rose-950/30 transition-colors"
                            title="Excluir"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      <div className="flex items-end justify-between pt-1 border-t border-slate-800/80">
                        <div>
                          <span className="text-[10px] text-slate-500 block">Saldo Devedor:</span>
                          <span className="text-base font-bold text-rose-400">
                            {formatCurrency(liab.currentValue)}
                          </span>
                        </div>
                        <span className="text-[10px] text-slate-500">
                          {formatDateBR(liab.valuationDate)}
                        </span>
                      </div>

                      {liab.notes && (
                        <p className="text-[11px] text-slate-400 bg-slate-950/60 p-2 rounded-lg border border-slate-850 line-clamp-2">
                          {liab.notes}
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>

      {/* ─── MODAIS ─── */}
      <AssetModal
        isOpen={isAssetModalOpen}
        onClose={() => {
          setIsAssetModalOpen(false);
          setEditingAsset(null);
        }}
        onSave={onSaveAsset}
        initialData={editingAsset}
      />

      <LiabilityModal
        isOpen={isLiabilityModalOpen}
        onClose={() => {
          setIsLiabilityModalOpen(false);
          setEditingLiability(null);
        }}
        onSave={onSaveLiability}
        initialData={editingLiability}
      />

      <DeleteConfirmModal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDeleteConfirmed}
        title={deleteTarget?.type === 'asset' ? 'Excluir Ativo Patrimonial' : 'Excluir Passivo / Dívida'}
        itemDescription={deleteTarget?.item?.name || ''}
        itemAmount={deleteTarget?.item?.currentValue}
        itemCategoryName={
          deleteTarget
            ? deleteTarget.type === 'asset'
              ? ASSET_TYPE_CONFIG[(deleteTarget.item as AssetItem).type]?.label
              : LIABILITY_TYPE_CONFIG[(deleteTarget.item as LiabilityItem).type]?.label
            : ''
        }
      />
    </div>
  );
};
