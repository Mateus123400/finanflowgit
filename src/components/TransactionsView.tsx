import React, { useState, useMemo } from 'react';
import {
  Plus,
  Search,
  Filter,
  Edit2,
  Trash2,
  Calendar,
  CreditCard,
  DollarSign,
  RotateCw,
  ArrowUpDown,
  FileSpreadsheet,
  CheckCircle,
  Tag,
} from 'lucide-react';
import { CategoryId, IncomeEntry, MonthData, TransactionEntry } from '../types';
import { CATEGORIES_CONFIG, CATEGORY_IDS } from '../utils/constants';
import { formatCurrency, formatDateBR } from '../utils/formatters';
import { CategoryIcon } from './CategoryIcon';

interface TransactionsViewProps {
  currentMonth: MonthData;
  initialFilterCategory?: CategoryId | 'all';
  onOpenAddTransaction: (defaultCategory?: CategoryId) => void;
  onOpenEditTransaction: (transaction: TransactionEntry) => void;
  onOpenDeleteTransaction: (transaction: TransactionEntry) => void;
  onOpenAddIncome: () => void;
  onOpenEditIncome: (income: IncomeEntry) => void;
  onOpenDeleteIncome: (income: IncomeEntry) => void;
}

export const TransactionsView: React.FC<TransactionsViewProps> = ({
  currentMonth,
  initialFilterCategory = 'all',
  onOpenAddTransaction,
  onOpenEditTransaction,
  onOpenDeleteTransaction,
  onOpenAddIncome,
  onOpenEditIncome,
  onOpenDeleteIncome,
}) => {
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<CategoryId | 'all'>(
    initialFilterCategory
  );
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'date_desc' | 'date_asc' | 'amount_desc' | 'amount_asc'>('date_desc');
  const [activeSection, setActiveSection] = useState<'all' | 'transactions' | 'incomes'>('all');

  const incomes = currentMonth.incomes || [];
  const transactions = currentMonth.transactions || [];

  // Filtered transactions
  const filteredTransactions = useMemo(() => {
    return transactions.filter((tx) => {
      const matchCat =
        selectedCategoryFilter === 'all' || tx.categoryId === selectedCategoryFilter;
      const matchSearch =
        !searchQuery.trim() ||
        tx.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (tx.notes && tx.notes.toLowerCase().includes(searchQuery.toLowerCase()));
      return matchCat && matchSearch;
    }).sort((a, b) => {
      if (sortBy === 'date_desc') return (b.date || '').localeCompare(a.date || '');
      if (sortBy === 'date_asc') return (a.date || '').localeCompare(b.date || '');
      if (sortBy === 'amount_desc') return b.amount - a.amount;
      if (sortBy === 'amount_asc') return a.amount - b.amount;
      return 0;
    });
  }, [transactions, selectedCategoryFilter, searchQuery, sortBy]);

  // Filtered incomes
  const filteredIncomes = useMemo(() => {
    return incomes.filter((inc) => {
      const matchSearch =
        !searchQuery.trim() ||
        inc.description.toLowerCase().includes(searchQuery.toLowerCase());
      return matchSearch;
    }).sort((a, b) => {
      if (sortBy === 'date_desc') return (b.date || '').localeCompare(a.date || '');
      if (sortBy === 'date_asc') return (a.date || '').localeCompare(b.date || '');
      if (sortBy === 'amount_desc') return b.amount - a.amount;
      if (sortBy === 'amount_asc') return a.amount - b.amount;
      return 0;
    });
  }, [incomes, searchQuery, sortBy]);

  const totalFilteredTxAmount = filteredTransactions.reduce((acc, t) => acc + t.amount, 0);
  const totalIncomeAmount = incomes.reduce((acc, i) => acc + i.amount, 0);

  const paymentLabels: Record<string, string> = {
    pix: 'PIX',
    cartao_credito: 'Crédito',
    cartao_debito: 'Débito',
    boleto: 'Boleto',
    dinheiro: 'Espécie',
  };

  const incomeTypeLabels: Record<string, string> = {
    salario: 'Salário / CLT',
    freelance: 'Freelance / PJ',
    dividendos: 'Dividendos',
    renda_extra: 'Renda Extra',
    outros: 'Outros',
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* 1. TOP HEADER & ACTION BUTTONS */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900/60 p-4 rounded-2xl border border-slate-800">
        <div>
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <span>Gestão de Lançamentos & Renda</span>
          </h2>
          <p className="text-xs text-slate-400">
            Adicione, edite e acompanhe todos os fluxos de dinheiro do mês
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            id="tx-view-add-income-btn"
            onClick={onOpenAddIncome}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-emerald-300 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 rounded-xl transition-all"
          >
            <Plus className="w-4 h-4 text-emerald-400" />
            <span>+ Adicionar Renda</span>
          </button>

          <button
            id="tx-view-add-tx-btn"
            onClick={() => onOpenAddTransaction(selectedCategoryFilter !== 'all' ? selectedCategoryFilter : undefined)}
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-medium text-white bg-blue-600 hover:bg-blue-500 active:bg-blue-700 shadow-md shadow-blue-600/20 rounded-xl transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>+ Novo Lançamento</span>
          </button>
        </div>
      </div>

      {/* 2. INCOME SECTION (RENDA DO MÊS) */}
      {(activeSection === 'all' || activeSection === 'incomes') && (
        <div id="income-sources-section" className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-lg shadow-black/20 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                <DollarSign className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">Fontes de Renda do Mês</h3>
                <span className="text-xs text-slate-400">
                  {incomes.length} entrada(s) cadastradas
                </span>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="text-right">
                <span className="text-[11px] text-slate-400 block">Renda Total:</span>
                <span className="text-base font-bold text-emerald-400">
                  {formatCurrency(totalIncomeAmount)}
                </span>
              </div>
              <button
                id="section-add-income-btn"
                onClick={onOpenAddIncome}
                className="p-2 text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/10 rounded-lg transition-colors border border-emerald-500/20"
                title="Adicionar fonte de renda"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </div>

          {filteredIncomes.length === 0 ? (
            <div className="text-center py-6 text-slate-400 text-xs border border-dashed border-slate-800 rounded-xl">
              Nenhuma entrada de renda encontrada.
              <button
                onClick={onOpenAddIncome}
                className="block mx-auto mt-2 text-blue-400 hover:underline font-medium"
              >
                + Adicionar Renda (Salário, Freelance...)
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {filteredIncomes.map((inc) => (
                <div
                  key={inc.id}
                  id={`income-card-${inc.id}`}
                  className="p-3.5 bg-slate-950/60 border border-slate-800 hover:border-slate-700/80 rounded-xl flex items-center justify-between gap-3 group transition-all"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="px-2 py-0.5 text-[10px] font-semibold bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 rounded-md">
                        {incomeTypeLabels[inc.sourceType || 'salario']}
                      </span>
                      {inc.date && (
                        <span className="text-[11px] text-slate-500 flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {formatDateBR(inc.date)}
                        </span>
                      )}
                    </div>
                    <h4 className="text-xs font-semibold text-white truncate">
                      {inc.description}
                    </h4>
                    <span className="text-sm font-bold text-emerald-400 block mt-0.5">
                      {formatCurrency(inc.amount)}
                    </span>
                  </div>

                  <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
                    <button
                      id={`edit-income-btn-${inc.id}`}
                      onClick={() => onOpenEditIncome(inc)}
                      className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
                      title="Editar Renda"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      id={`delete-income-btn-${inc.id}`}
                      onClick={() => onOpenDeleteIncome(inc)}
                      className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-950/30 rounded-lg transition-colors"
                      title="Excluir Renda"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 3. EXPENSES & ALLOCATIONS SECTION */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-lg shadow-black/20 space-y-4">
        {/* Filter and Search Bar */}
        <div className="space-y-3 border-b border-slate-800 pb-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-bold text-white">Lançamentos de Gastos & Aportes</h3>
              <span className="text-xs text-slate-400">
                {filteredTransactions.length} item(ns) encontrado(s) • Total filtrado:{' '}
                <strong className="text-slate-200">{formatCurrency(totalFilteredTxAmount)}</strong>
              </span>
            </div>

            {/* Search Input and Sorter */}
            <div className="flex items-center gap-2">
              <div className="relative flex-1 sm:w-64">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  id="transaction-search-input"
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Buscar lançamento..."
                  className="w-full pl-8 pr-3 py-1.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                />
              </div>

              <select
                id="transaction-sort-select"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="px-2.5 py-1.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-300 focus:outline-none focus:border-blue-500 [color-scheme:dark]"
              >
                <option value="date_desc">Data (Recentes)</option>
                <option value="date_asc">Data (Antigos)</option>
                <option value="amount_desc">Maior Valor</option>
                <option value="amount_asc">Menor Valor</option>
              </select>
            </div>
          </div>

          {/* Category Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
            <button
              id="filter-cat-all"
              onClick={() => setSelectedCategoryFilter('all')}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition-all border ${
                selectedCategoryFilter === 'all'
                  ? 'bg-blue-600 text-white border-blue-500 shadow-sm shadow-blue-500/20'
                  : 'bg-slate-950/60 text-slate-400 border-slate-800 hover:text-slate-200'
              }`}
            >
              Todas ({transactions.length})
            </button>

            {CATEGORY_IDS.map((catId) => {
              const cat = CATEGORIES_CONFIG[catId];
              const isSelected = selectedCategoryFilter === catId;
              const count = transactions.filter((t) => t.categoryId === catId).length;

              return (
                <button
                  key={catId}
                  id={`filter-cat-${catId}`}
                  onClick={() => setSelectedCategoryFilter(catId)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition-all border ${
                    isSelected
                      ? 'bg-blue-600/20 border-blue-500 text-blue-300 shadow-sm shadow-blue-500/10'
                      : 'bg-slate-950/60 text-slate-400 border-slate-800 hover:text-slate-200'
                  }`}
                >
                  <CategoryIcon categoryId={catId} className="w-3.5 h-3.5" />
                  <span>{cat.name}</span>
                  <span className="text-[10px] opacity-70">({count})</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Transactions Table / List */}
        {filteredTransactions.length === 0 ? (
          <div className="text-center py-10 text-slate-400 text-xs border border-dashed border-slate-800 rounded-xl space-y-2">
            <p>Nenhum lançamento encontrado para os filtros selecionados.</p>
            <button
              id="empty-state-add-tx-btn"
              onClick={() => onOpenAddTransaction(selectedCategoryFilter !== 'all' ? selectedCategoryFilter : undefined)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-medium hover:bg-blue-500"
            >
              <Plus className="w-3.5 h-3.5" />
              Adicionar Primeiro Lançamento
            </button>
          </div>
        ) : (
          <div className="space-y-2">
            {filteredTransactions.map((tx) => {
              const cat = CATEGORIES_CONFIG[tx.categoryId] || CATEGORIES_CONFIG.despesas;

              return (
                <div
                  key={tx.id}
                  id={`tx-item-${tx.id}`}
                  className="p-3 sm:p-3.5 bg-slate-950/50 hover:bg-slate-950/80 border border-slate-800/80 hover:border-slate-700/80 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-all group"
                >
                  {/* Left: Category Icon, Description, Tags */}
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className="p-2.5 rounded-xl border shrink-0"
                      style={{
                        backgroundColor: cat.accentBg,
                        borderColor: cat.borderColor,
                        color: cat.color,
                      }}
                    >
                      <CategoryIcon categoryId={tx.categoryId} className="w-4 h-4" />
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-semibold text-white truncate max-w-[240px] sm:max-w-xs md:max-w-md">
                          {tx.description}
                        </span>
                        <span
                          className="text-[10px] font-medium px-2 py-0.2 rounded-md border"
                          style={{
                            backgroundColor: cat.accentBg,
                            borderColor: cat.borderColor,
                            color: cat.color,
                          }}
                        >
                          {cat.name}
                        </span>
                        {tx.isRecurring && (
                          <span className="text-[10px] text-blue-400 bg-blue-500/10 border border-blue-500/20 px-1.5 py-0.2 rounded-md flex items-center gap-0.5">
                            <RotateCw className="w-2.5 h-2.5" /> Recorrente
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-3 text-[11px] text-slate-500 mt-1 flex-wrap">
                        {tx.date && (
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {formatDateBR(tx.date)}
                          </span>
                        )}
                        {tx.paymentMethod && (
                          <span className="flex items-center gap-1">
                            <CreditCard className="w-3 h-3" />
                            {paymentLabels[tx.paymentMethod] || tx.paymentMethod}
                          </span>
                        )}
                        {tx.notes && (
                          <span className="text-slate-400 italic truncate max-w-xs">
                            "{tx.notes}"
                          </span>
                        )}
                      </div>

                      {/* Negócios Invested vs Return details */}
                      {tx.categoryId === 'negocios' && (
                        <div className="flex items-center gap-2 mt-2 pt-1.5 border-t border-slate-850 flex-wrap text-xs">
                          <span className="text-slate-400">
                            Investido:{' '}
                            <strong className="text-amber-300">
                              {formatCurrency(tx.investedAmount !== undefined ? tx.investedAmount : tx.amount)}
                            </strong>
                          </span>
                          <span className="text-slate-600">•</span>
                          <span className="text-slate-400">
                            Retorno:{' '}
                            <strong className="text-emerald-400">
                              {formatCurrency(tx.returnAmount || 0)}
                            </strong>
                          </span>
                          <span className="text-slate-600">•</span>
                          {(() => {
                            const inv = tx.investedAmount !== undefined ? tx.investedAmount : tx.amount;
                            const ret = tx.returnAmount || 0;
                            const net = ret - inv;
                            const roi = inv > 0 ? (net / inv) * 100 : 0;
                            return (
                              <span
                                className={`font-semibold px-1.5 py-0.5 rounded text-[11px] ${
                                  net >= 0
                                    ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                    : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                                }`}
                              >
                                {net >= 0 ? `+${formatCurrency(net)}` : formatCurrency(net)} ({roi >= 0 ? `+${roi.toFixed(1)}%` : `${roi.toFixed(1)}%`})
                              </span>
                            );
                          })()}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Right: Amount & Actions */}
                  <div className="flex items-center justify-between sm:justify-end gap-4 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-850">
                    <span className="text-sm sm:text-base font-bold text-slate-100">
                      {formatCurrency(tx.amount)}
                    </span>

                    <div className="flex items-center gap-1 opacity-90 group-hover:opacity-100 transition-opacity">
                      <button
                        id={`edit-tx-btn-${tx.id}`}
                        onClick={() => onOpenEditTransaction(tx)}
                        className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
                        title="Editar lançamento"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        id={`delete-tx-btn-${tx.id}`}
                        onClick={() => onOpenDeleteTransaction(tx)}
                        className="p-2 text-slate-400 hover:text-rose-400 hover:bg-rose-950/40 rounded-lg transition-colors"
                        title="Excluir lançamento"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
