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
import { AssetItem, AssetType, LiabilityItem, LiabilityType, NetWorthSummary } from '../types';
import { calculateNetWorthSummary } from '../utils/calculations';
import { formatCurrency, formatPercent, formatDateBR } from '../utils/formatters';
import { AssetModal } from './AssetModal';
import { LiabilityModal } from './LiabilityModal';
import { DeleteConfirmModal } from './DeleteConfirmModal';

interface PatrimonioViewProps {
  assets: AssetItem[];
  liabilities: LiabilityItem[];
  onSaveAsset: (asset: AssetItem) => Promise<void>;
  onDeleteAsset: (assetId: string) => Promise<void>;
  onSaveLiability: (liability: LiabilityItem) => Promise<void>;
  onDeleteLiability: (liabilityId: string) => Promise<void>;
}

const ASSET_TYPE_CONFIG: Record<AssetType, { label: string; icon: React.ReactNode; color: string }> = {
  imovel: { label: 'Imóvel', icon: <Building2 className="w-4 h-4" />, color: '#3b82f6' },
  investimento: { label: 'Investimento', icon: <TrendingUp className="w-4 h-4" />, color: '#10b981' },
  conta: { label: 'Dinheiro / Conta', icon: <Wallet className="w-4 h-4" />, color: '#06b6d4' },
  negocio: { label: 'Negócio / Empresa', icon: <Briefcase className="w-4 h-4" />, color: '#f59e0b' },
  veiculo: { label: 'Veículo', icon: <Car className="w-4 h-4" />, color: '#8b5cf6' },
  outro: { label: 'Outro Ativo', icon: <HelpCircle className="w-4 h-4" />, color: '#64748b' },
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
  onSaveAsset,
  onDeleteAsset,
  onSaveLiability,
  onDeleteLiability,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'all' | 'assets' | 'liabilities'>('all');
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

  const { totalAssets, totalLiabilities, netWorth, assetsByType, liabilitiesByType } = summary;

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
    { name: 'Patrimônio', Ativos: totalAssets, Passivos: totalLiabilities },
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
            Patrimônio Líquido & Balanço Pessoal
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

      {/* ─── CARD EDUCATIVO: REGRA FUNDAMENTAL DO PATRIMÔNIO ─── */}
      <div className="p-4 bg-slate-900/60 border border-slate-800/80 rounded-2xl flex items-start gap-3.5">
        <div className="p-2 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20 shrink-0 mt-0.5">
          <Info className="w-4 h-4" />
        </div>
        <div className="text-xs text-slate-300 space-y-1">
          <span className="font-semibold text-white block">
            Princípio Fundamental: Movimentação Financeira vs Composição Patrimonial
          </span>
          <p className="text-slate-400 leading-relaxed">
            Transferir dinheiro da sua conta corrente para investimentos ou poupança <strong>não é uma despesa ou perda financeira</strong>. É apenas uma mudança na composição dos seus ativos: diminui o saldo em conta e aumenta o saldo investido, mantendo o seu patrimônio total intacto.
          </p>
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

              <div className="space-y-2 text-xs">
                {assetChartData.map((entry) => (
                  <div key={entry.name} className="flex items-center justify-between p-2 bg-slate-850 rounded-xl border border-slate-750">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: entry.color }} />
                      <span className="font-medium text-slate-200">{entry.name}</span>
                    </div>
                    <div className="text-right">
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
                <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '8px' }} />
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
              Visão Geral ({assets.length + liabilities.length})
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
                Nenhum ativo cadastrado. Adicione seus imóveis, veículos, contas bancárias e investimentos.
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
        itemDescription={deleteTarget?.item.name || ''}
        itemAmount={deleteTarget?.item.currentValue}
        itemCategoryName={
          deleteTarget?.type === 'asset'
            ? ASSET_TYPE_CONFIG[(deleteTarget.item as AssetItem).type]?.label
            : LIABILITY_TYPE_CONFIG[(deleteTarget.item as LiabilityItem).type]?.label
        }
      />
    </div>
  );
};
