import React, { useState, useRef, useEffect } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  PlusCircle,
  TrendingUp,
  BarChart3,
  ListOrdered,
  Sliders,
  Download,
  RotateCcw,
  MoreVertical,
  Calendar,
  CalendarRange,
  Wallet,
  User,
} from 'lucide-react';
import { ActiveTab, MonthData } from '../types';
import type { InsforgeUser } from '../lib/insforge';
import { UserAccountModal } from './UserAccountModal';
import { parseMonthId } from '../utils/formatters';

interface HeaderProps {
  currentMonth: MonthData;
  allMonths: MonthData[];
  activeTab: ActiveTab;
  onSelectTab: (tab: ActiveTab) => void;
  onSelectMonth: (monthId: string) => void;
  onOpenNewMonthModal: () => void;
  onOpenTransactionModal: () => void;
  onOpenIncomeModal: () => void;
  onExportJSON: () => void;
  onExportCSV: () => void;
  onResetDemo: () => void;
  user?: InsforgeUser | null;
}

export const Header: React.FC<HeaderProps> = ({
  currentMonth,
  allMonths,
  activeTab,
  onSelectTab,
  onSelectMonth,
  onOpenNewMonthModal,
  onOpenTransactionModal,
  onOpenIncomeModal,
  onExportJSON,
  onExportCSV,
  onResetDemo,
  user,
}) => {
  const [toolsOpen, setToolsOpen] = useState(false);
  const [accountModalOpen, setAccountModalOpen] = useState(false);
  const toolsRef = useRef<HTMLDivElement>(null);

  // Close tools menu on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (toolsRef.current && !toolsRef.current.contains(e.target as Node)) {
        setToolsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Sorted months for sequential navigation
  const sortedMonths = [...allMonths].sort((a, b) => a.id.localeCompare(b.id));
  const currentIndex = sortedMonths.findIndex((m) => m.id === currentMonth.id);
  const prevMonth = currentIndex > 0 ? sortedMonths[currentIndex - 1] : null;
  const nextMonth = currentIndex < sortedMonths.length - 1 ? sortedMonths[currentIndex + 1] : null;

  const currentLabel = parseMonthId(currentMonth.id).label;

  const tabs: { id: ActiveTab; label: string; icon: React.ReactNode }[] = [
    { id: 'dashboard', label: 'Dashboard do Mês', icon: <BarChart3 className="w-4 h-4" /> },
    { id: 'transactions', label: 'Lançamentos & Renda', icon: <ListOrdered className="w-4 h-4" /> },
    { id: 'history', label: 'Histórico & Comparativo', icon: <TrendingUp className="w-4 h-4" /> },
    { id: 'targets', label: 'Metas & Estrutura', icon: <Sliders className="w-4 h-4" /> },
    { id: 'annual', label: 'Relatório Anual', icon: <CalendarRange className="w-4 h-4" /> },
  ];

  return (
    <header className="sticky top-0 z-40 bg-slate-950/85 backdrop-blur-md border-b border-slate-800/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Top Bar: Brand, Month Navigator, Quick CTA buttons */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 py-3.5 border-b border-slate-850">
          {/* Logo Brand */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-500/20 border border-blue-400/30">
                <Wallet className="w-5 h-5" />
                <span className="absolute -top-1 -right-1 w-3 h-3 bg-cyan-400 rounded-full ring-2 ring-slate-950 animate-pulse" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-lg font-bold tracking-tight text-white flex items-center gap-1.5">
                    Finan<span className="text-blue-400">Flow</span>
                  </h1>
                  <span className="px-2 py-0.5 text-[10px] font-semibold bg-blue-500/10 text-blue-300 border border-blue-500/20 rounded-full">
                    Mensal
                  </span>
                </div>
                <p className="text-[11px] text-slate-400">
                  Gestão financeira pessoal por metas
                </p>
              </div>
            </div>

            {/* Mobile Action buttons quick access */}
            <div className="flex items-center gap-2 md:hidden">
              <button
                id="mobile-quick-add-tx"
                onClick={onOpenTransactionModal}
                className="p-2 text-white bg-blue-600 rounded-lg"
                title="Novo Lançamento"
              >
                <Plus className="w-4 h-4" />
              </button>
              {/* Botão de Perfil Mobile */}
              {user && (
                <button
                  id="mobile-profile-btn"
                  onClick={() => setAccountModalOpen(true)}
                  className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-violet-600 flex items-center justify-center text-white text-xs font-bold shadow-md shadow-blue-500/20"
                  title="Minha conta"
                >
                  {user.profile?.name?.charAt(0)?.toUpperCase() || user.email?.charAt(0)?.toUpperCase() || <User className="w-3.5 h-3.5" />}
                </button>
              )}
            </div>
          </div>

          {/* Month Selector Bar */}
          <div className="flex items-center justify-center gap-1.5 bg-slate-900/90 p-1 rounded-xl border border-slate-800 shadow-inner">
            <button
              id="prev-month-btn"
              onClick={() => prevMonth && onSelectMonth(prevMonth.id)}
              disabled={!prevMonth}
              className="p-2 text-slate-400 hover:text-white disabled:opacity-30 disabled:hover:text-slate-400 rounded-lg hover:bg-slate-800 transition-colors"
              title={prevMonth ? `Mês anterior (${parseMonthId(prevMonth.id).label})` : 'Sem mês anterior'}
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            {/* Month Dropdown */}
            <div className="relative">
              <select
                id="active-month-select"
                value={currentMonth.id}
                onChange={(e) => onSelectMonth(e.target.value)}
                className="appearance-none bg-transparent pl-3 pr-8 py-1.5 text-xs sm:text-sm font-semibold text-white cursor-pointer focus:outline-none [color-scheme:dark]"
              >
                {sortedMonths.map((m) => {
                  const { label } = parseMonthId(m.id);
                  return (
                    <option key={m.id} value={m.id} className="bg-slate-900 text-white">
                      {label}
                    </option>
                  );
                })}
              </select>
              <Calendar className="w-3.5 h-3.5 text-blue-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>

            <button
              id="next-month-btn"
              onClick={() => nextMonth && onSelectMonth(nextMonth.id)}
              disabled={!nextMonth}
              className="p-2 text-slate-400 hover:text-white disabled:opacity-30 disabled:hover:text-slate-400 rounded-lg hover:bg-slate-800 transition-colors"
              title={nextMonth ? `Próximo mês (${parseMonthId(nextMonth.id).label})` : 'Sem próximo mês'}
            >
              <ChevronRight className="w-4 h-4" />
            </button>

            <div className="w-[1px] h-5 bg-slate-800 mx-1" />

            <button
              id="header-new-month-btn"
              onClick={onOpenNewMonthModal}
              className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium text-blue-400 hover:text-blue-300 hover:bg-blue-500/10 rounded-lg transition-colors"
              title="Criar novo mês"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Novo Mês</span>
            </button>
          </div>

          {/* Action CTAs */}
          <div className="hidden md:flex items-center gap-2.5">
            <button
              id="header-add-income-btn"
              onClick={onOpenIncomeModal}
              className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-emerald-300 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 rounded-xl transition-all"
            >
              <Plus className="w-3.5 h-3.5 text-emerald-400" />
              <span>+ Renda</span>
            </button>

            <button
              id="header-add-tx-btn"
              onClick={onOpenTransactionModal}
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-medium text-white bg-blue-600 hover:bg-blue-500 active:bg-blue-700 shadow-md shadow-blue-600/20 rounded-xl transition-all"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>+ Novo Lançamento</span>
            </button>

            {/* Tools Menu */}
            <div className="relative" ref={toolsRef}>
              <button
                id="header-tools-menu-btn"
                onClick={() => setToolsOpen(!toolsOpen)}
                className="p-2 text-slate-400 hover:text-white bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-xl transition-colors"
                title="Opções e Exportação"
              >
                <MoreVertical className="w-4 h-4" />
              </button>

              {toolsOpen && (
                <div className="absolute right-0 mt-2 w-52 bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-1.5 z-50 text-xs animate-in fade-in zoom-in-95 duration-150">
                  <div className="px-3 py-1.5 text-[11px] font-semibold text-slate-400 border-b border-slate-800">
                    Dados & Exportação
                  </div>
                  <button
                    id="export-csv-btn"
                    onClick={() => {
                      onExportCSV();
                      setToolsOpen(false);
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 text-slate-300 hover:text-white hover:bg-slate-800 rounded-xl transition-colors text-left"
                  >
                    <Download className="w-4 h-4 text-blue-400" />
                    <span>Exportar Mês (CSV)</span>
                  </button>
                  <button
                    id="export-json-btn"
                    onClick={() => {
                      onExportJSON();
                      setToolsOpen(false);
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 text-slate-300 hover:text-white hover:bg-slate-800 rounded-xl transition-colors text-left"
                  >
                    <Download className="w-4 h-4 text-cyan-400" />
                    <span>Backup Completo (JSON)</span>
                  </button>
                  <div className="my-1 border-t border-slate-800" />
                  <button
                    id="reset-demo-btn"
                    onClick={() => {
                      if (window.confirm('Deseja recarregar os dados de demonstração iniciais?')) {
                        onResetDemo();
                      }
                      setToolsOpen(false);
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 text-rose-300 hover:text-rose-200 hover:bg-rose-950/40 rounded-xl transition-colors text-left"
                  >
                    <RotateCcw className="w-4 h-4 text-rose-400" />
                    <span>Recarregar Dados Demo</span>
                  </button>
                </div>
              )}
            </div>

            {/* User Avatar + Account Button - Desktop */}
            {user && (
              <div className="flex items-center gap-2 pl-2 border-l border-slate-800 ml-1">
                <button
                  id="desktop-profile-btn"
                  onClick={() => setAccountModalOpen(true)}
                  className="flex items-center gap-2 px-2.5 py-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 rounded-xl transition-all group"
                  title="Minha conta"
                >
                  <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-blue-500 to-violet-600 flex items-center justify-center text-white text-[10px] font-bold">
                    {user.profile?.name?.charAt(0)?.toUpperCase() || user.email?.charAt(0)?.toUpperCase() || <User className="w-3 h-3" />}
                  </div>
                  <span className="text-xs text-slate-400 group-hover:text-slate-200 max-w-[100px] truncate transition">
                    {user.profile?.name || user.email?.split('@')[0]}
                  </span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Modal de Conta */}
        {user && (
          <UserAccountModal
            isOpen={accountModalOpen}
            onClose={() => setAccountModalOpen(false)}
            user={user}
          />
        )}

        {/* Bottom Bar: Tab Navigation */}
        <div className="flex items-center gap-2 overflow-x-auto py-2.5 no-scrollbar">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                id={`tab-btn-${tab.id}`}
                onClick={() => onSelectTab(tab.id)}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-medium whitespace-nowrap transition-all ${
                  isActive
                    ? 'bg-blue-600/20 text-blue-300 border border-blue-500/40 shadow-sm shadow-blue-500/10'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900 border border-transparent'
                }`}
              >
                {tab.icon}
                <span>{tab.label}</span>
                {tab.id === 'transactions' && (
                  <span className="ml-1 px-1.5 py-0.2 bg-slate-800 text-[10px] rounded-full text-slate-400">
                    {(currentMonth.transactions || []).length + (currentMonth.incomes || []).length}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </header>
  );
};
