import React, { useState, useEffect, useMemo } from 'react';
import {
  ActiveTab,
  CategoryId,
  CategoryTargets,
  IncomeEntry,
  MonthData,
  TransactionEntry,
  Reward,
} from './types';
import { createNewMonthData, exportDataAsJSON, exportMonthToCSV } from './utils/storage';
import { calculateMonthSummary } from './utils/calculations';
import { Header } from './components/Header';
import { DashboardView } from './components/DashboardView';
import { TransactionsView } from './components/TransactionsView';
import { HistoryView } from './components/HistoryView';
import { TargetsView } from './components/TargetsView';
import { TransactionModal } from './components/TransactionModal';
import { IncomeModal } from './components/IncomeModal';
import { NewMonthModal } from './components/NewMonthModal';
import { DeleteConfirmModal } from './components/DeleteConfirmModal';
import { AuthPage } from './components/AuthPage';
import { AnnualView } from './components/AnnualView';
import { RewardsView } from './components/RewardsView';
import { CATEGORIES_CONFIG, DEFAULT_TARGETS } from './utils/constants';
import { CheckCircle2, Loader2 } from 'lucide-react';
import { useAuth } from './contexts/AuthContext';
import {
  fetchUserMonths,
  upsertMonth,
  upsertIncome,
  deleteIncome,
  upsertTransaction,
  deleteTransaction,
  saveTargets,
  fetchRewards,
} from './lib/db';

export default function App() {
  const { user, loading: authLoading } = useAuth();

  // ——— Auth: detectar OAuth callback ———
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.has('insforge_code') || params.has('insforge_status')) {
      // Limpar query string após callback OAuth
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);

  // ——— Estado principal ———
  const [months, setMonths] = useState<MonthData[]>([]);
  const [rewards, setRewards] = useState<Reward[]>([]);
  const [activeMonthId, setActiveMonthId] = useState<string>('');
  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');
  const [txCategoryFilter, setTxCategoryFilter] = useState<CategoryId | 'all'>('all');
  const [dbLoading, setDbLoading] = useState(false);

  // Modal states
  const [isTxModalOpen, setIsTxModalOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<TransactionEntry | null>(null);
  const [defaultTxCategory, setDefaultTxCategory] = useState<CategoryId>('despesas');
  const [isIncomeModalOpen, setIsIncomeModalOpen] = useState(false);
  const [editingIncome, setEditingIncome] = useState<IncomeEntry | null>(null);
  const [isNewMonthModalOpen, setIsNewMonthModalOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{
    type: 'transaction' | 'income';
    item: TransactionEntry | IncomeEntry;
  } | null>(null);
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'info' } | null>(null);

  const showToast = (text: string, type: 'success' | 'info' = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 3500);
  };

  // ——— Carregar dados do InsForge ao logar / limpar ao sair ———
  useEffect(() => {
    // Quando não há usuário, limpar TUDO para garantir isolamento total
    if (!user) {
      setMonths([]);
      setRewards([]);
      setActiveMonthId('');
      return;
    }

    // Limpar dados do usuário anterior ANTES de buscar os novos
    setMonths([]);
    setRewards([]);
    setActiveMonthId('');
    setDbLoading(true);

    Promise.all([
      fetchUserMonths(user.id),
      fetchRewards(user.id),
    ])
      .then(([monthsData, rewardsData]) => {
        setRewards(rewardsData);
        if (monthsData.length > 0) {
          setMonths(monthsData);
          setActiveMonthId(monthsData[monthsData.length - 1].id);
        } else {
          // Novo usuário sem dados — criar mês atual
          const now = new Date();
          const newMonth = createNewMonthData(now.getFullYear(), now.getMonth() + 1, DEFAULT_TARGETS);
          setMonths([newMonth]);
          setActiveMonthId(newMonth.id);
          upsertMonth(user.id, newMonth).catch(console.error);
        }
      })
      .catch(console.error)
      .finally(() => setDbLoading(false));
  }, [user?.id]); // Depende APENAS do ID — muda quando o usuário muda


  // Current active month object
  const currentMonth = useMemo(() => {
    const found = months.find((m) => m.id === activeMonthId);
    return found || months[months.length - 1];
  }, [months, activeMonthId]);

  const monthSummary = useMemo(() => {
    if (!currentMonth) return null;
    return calculateMonthSummary(currentMonth);
  }, [currentMonth]);

  // ——— CRUD: Transactions ———
  const handleSaveTransaction = async (txData: Omit<TransactionEntry, 'id'>, editId?: string) => {
    const newId = editId ?? `tx-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
    const tx: TransactionEntry = { id: newId, ...txData };

    setMonths((prevMonths) =>
      prevMonths.map((m) => {
        if (m.id !== currentMonth.id) return m;
        const updated = editId
          ? (m.transactions || []).map((t) => (t.id === editId ? tx : t))
          : [...(m.transactions || []), tx];
        return { ...m, transactions: updated, updatedAt: new Date().toISOString() };
      })
    );

    if (user) {
      await upsertTransaction(user.id, currentMonth.id, tx).catch(console.error);
    }

    showToast(
      editId
        ? 'Lançamento atualizado com sucesso!'
        : `Lançamento adicionado em ${CATEGORIES_CONFIG[txData.categoryId]?.name || 'Categoria'}!`
    );
  };

  const handleDeleteConfirmed = async () => {
    if (!deleteTarget) return;

    if (deleteTarget.type === 'transaction') {
      const tx = deleteTarget.item as TransactionEntry;
      setMonths((prev) =>
        prev.map((m) =>
          m.id !== currentMonth.id
            ? m
            : { ...m, transactions: (m.transactions || []).filter((t) => t.id !== tx.id), updatedAt: new Date().toISOString() }
        )
      );
      if (user) await deleteTransaction(tx.id).catch(console.error);
      showToast('Lançamento removido.');
    } else {
      const inc = deleteTarget.item as IncomeEntry;
      setMonths((prev) =>
        prev.map((m) =>
          m.id !== currentMonth.id
            ? m
            : { ...m, incomes: (m.incomes || []).filter((i) => i.id !== inc.id), updatedAt: new Date().toISOString() }
        )
      );
      if (user) await deleteIncome(inc.id).catch(console.error);
      showToast('Fonte de renda removida.');
    }

    setDeleteTarget(null);
  };

  // ——— CRUD: Incomes ———
  const handleSaveIncome = async (incomeData: Omit<IncomeEntry, 'id'>, editId?: string) => {
    const newId = editId ?? `inc-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
    const income: IncomeEntry = { id: newId, ...incomeData };

    setMonths((prevMonths) =>
      prevMonths.map((m) => {
        if (m.id !== currentMonth.id) return m;
        const updated = editId
          ? (m.incomes || []).map((i) => (i.id === editId ? income : i))
          : [...(m.incomes || []), income];
        return { ...m, incomes: updated, updatedAt: new Date().toISOString() };
      })
    );

    if (user) {
      await upsertIncome(user.id, currentMonth.id, income).catch(console.error);
    }

    showToast(editId ? 'Fonte de renda atualizada!' : 'Nova renda adicionada com sucesso!');
  };

  // ——— Month Management ———
  const handleCreateMonth = async (
    year: number,
    month: number,
    duplicateFromMonthId?: string,
    copyRecurringStructure = false
  ) => {
    const sourceMonth = duplicateFromMonthId ? months.find((m) => m.id === duplicateFromMonthId) : undefined;
    const sourceTargets = sourceMonth ? sourceMonth.targets : DEFAULT_TARGETS;
    const newMonth = createNewMonthData(year, month, sourceTargets, copyRecurringStructure, sourceMonth);

    setMonths((prev) => [...prev, newMonth]);
    setActiveMonthId(newMonth.id);
    setActiveTab('dashboard');

    if (user) {
      await upsertMonth(user.id, newMonth).catch(console.error);
    }

    showToast(duplicateFromMonthId ? 'Novo mês criado com a estrutura e metas duplicadas!' : 'Novo mês criado com sucesso!');
  };

  // ——— Target Updates ———
  const handleSaveTargetsForMonth = async (newTargets: CategoryTargets) => {
    setMonths((prev) =>
      prev.map((m) => (m.id === currentMonth.id ? { ...m, targets: newTargets } : m))
    );
    if (user) await saveTargets(user.id, currentMonth.id, newTargets).catch(console.error);
  };

  const handleApplyTargetsToAllMonths = async (newTargets: CategoryTargets) => {
    setMonths((prev) => prev.map((m) => ({ ...m, targets: { ...newTargets } })));
    if (user) {
      await Promise.all(months.map((m) => saveTargets(user.id, m.id, newTargets))).catch(console.error);
    }
  };

  const handleDuplicateStructureFromMonth = async (sourceMonthId: string) => {
    const source = months.find((m) => m.id === sourceMonthId);
    if (source) {
      const newTargets = { ...source.targets };
      setMonths((prev) =>
        prev.map((m) => (m.id === currentMonth.id ? { ...m, targets: newTargets } : m))
      );
      if (user) await saveTargets(user.id, currentMonth.id, newTargets).catch(console.error);
    }
  };

  const handleGoToTransactionsWithCategory = (category?: CategoryId) => {
    setTxCategoryFilter(category || 'all');
    setActiveTab('transactions');
  };

  // ——— TELA DE LOADING ———
  if (authLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
      </div>
    );
  }

  // ——— TELA DE AUTH ———
  if (!user) {
    // O AuthContext detecta automaticamente a sessão via onAuthStateChange.
    // Para email/senha e OAuth (Google), não é necessário fazer reload —
    // o listener dispara e o React re-renderiza automaticamente.
    return <AuthPage onAuthenticated={() => {}} />;
  }

  // ——— LOADING DOS DADOS DO DB ———
  if (dbLoading || !currentMonth) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center gap-3">
        <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
        <p className="text-slate-400 text-sm">Carregando seus dados financeiros...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-blue-600 selection:text-white">
      <Header
        currentMonth={currentMonth}
        allMonths={months}
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        onSelectMonth={setActiveMonthId}
        onOpenNewMonthModal={() => setIsNewMonthModalOpen(true)}
        onOpenTransactionModal={() => {
          setEditingTransaction(null);
          setDefaultTxCategory('despesas');
          setIsTxModalOpen(true);
        }}
        onOpenIncomeModal={() => {
          setEditingIncome(null);
          setIsIncomeModalOpen(true);
        }}
        onExportJSON={() => exportDataAsJSON(months)}
        onExportCSV={() => exportMonthToCSV(currentMonth)}
        onResetDemo={() => {}}
        user={user}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {activeTab === 'dashboard' && monthSummary && (
          <DashboardView
            currentMonth={currentMonth}
            summary={monthSummary}
            onOpenTransactionModal={(cat) => {
              setEditingTransaction(null);
              setDefaultTxCategory(cat || 'despesas');
              setIsTxModalOpen(true);
            }}
            onOpenIncomeModal={() => {
              setEditingIncome(null);
              setIsIncomeModalOpen(true);
            }}
            onGoToTargets={() => setActiveTab('targets')}
            onGoToTransactions={handleGoToTransactionsWithCategory}
          />
        )}

        {activeTab === 'transactions' && (
          <TransactionsView
            currentMonth={currentMonth}
            initialFilterCategory={txCategoryFilter}
            onOpenAddTransaction={(cat) => {
              setEditingTransaction(null);
              setDefaultTxCategory(cat || 'despesas');
              setIsTxModalOpen(true);
            }}
            onOpenEditTransaction={(tx) => {
              setEditingTransaction(tx);
              setDefaultTxCategory(tx.categoryId);
              setIsTxModalOpen(true);
            }}
            onOpenDeleteTransaction={(tx) => setDeleteTarget({ type: 'transaction', item: tx })}
            onOpenAddIncome={() => {
              setEditingIncome(null);
              setIsIncomeModalOpen(true);
            }}
            onOpenEditIncome={(inc) => {
              setEditingIncome(inc);
              setIsIncomeModalOpen(true);
            }}
            onOpenDeleteIncome={(inc) => setDeleteTarget({ type: 'income', item: inc })}
          />
        )}

        {activeTab === 'history' && (
          <HistoryView
            allMonths={months}
            currentMonthId={activeMonthId}
            onSelectMonth={(id) => {
              setActiveMonthId(id);
              setActiveTab('dashboard');
            }}
          />
        )}

        {activeTab === 'targets' && (
          <TargetsView
            currentMonth={currentMonth}
            allMonths={months}
            onSaveTargetsForMonth={handleSaveTargetsForMonth}
            onApplyTargetsToAllMonths={handleApplyTargetsToAllMonths}
            onDuplicateStructureFromMonth={handleDuplicateStructureFromMonth}
          />
        )}

        {activeTab === 'annual' && (
          <AnnualView allMonths={months} />
        )}

        {activeTab === 'rewards' && user && (
          <RewardsView
            allMonths={months}
            rewards={rewards}
            userId={user.id}
            onRewardsChange={setRewards}
          />
        )}
      </main>

      {/* Toast */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2.5 px-4 py-3 bg-slate-900 border border-blue-500/40 text-slate-100 rounded-2xl shadow-2xl animate-in slide-in-from-bottom-3 duration-200">
          <CheckCircle2 className="w-4 h-4 text-blue-400 shrink-0" />
          <span className="text-xs font-medium">{toastMessage.text}</span>
        </div>
      )}

      {/* Modals */}
      <TransactionModal
        isOpen={isTxModalOpen}
        onClose={() => { setIsTxModalOpen(false); setEditingTransaction(null); }}
        onSave={handleSaveTransaction}
        initialData={editingTransaction}
        defaultCategoryId={defaultTxCategory}
        monthId={currentMonth.id}
      />

      <IncomeModal
        isOpen={isIncomeModalOpen}
        onClose={() => { setIsIncomeModalOpen(false); setEditingIncome(null); }}
        onSave={handleSaveIncome}
        initialData={editingIncome}
        monthId={currentMonth.id}
      />

      <NewMonthModal
        isOpen={isNewMonthModalOpen}
        onClose={() => setIsNewMonthModalOpen(false)}
        existingMonths={months}
        currentMonthId={currentMonth.id}
        onCreateMonth={handleCreateMonth}
      />

      <DeleteConfirmModal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDeleteConfirmed}
        title={deleteTarget?.type === 'transaction' ? 'Excluir Lançamento' : 'Excluir Fonte de Renda'}
        itemDescription={deleteTarget?.item.description || ''}
        itemAmount={deleteTarget?.item.amount}
        itemCategoryName={
          deleteTarget?.type === 'transaction'
            ? CATEGORIES_CONFIG[(deleteTarget.item as TransactionEntry).categoryId]?.name
            : 'Entrada de Renda'
        }
      />
    </div>
  );
}
