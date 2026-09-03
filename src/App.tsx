import React, { useState, useEffect, useMemo } from 'react';
import {
  ActiveTab,
  CategoryId,
  CategoryTargets,
  IncomeEntry,
  MonthData,
  TransactionEntry,
  Reward,
  IncomeActivity,
  AssetItem,
  LiabilityItem,
} from './types';
import { createNewMonthData, exportDataAsJSON, exportMonthToCSV } from './utils/storage';
import { calculateMonthSummary, calculateNetWorthSummary } from './utils/calculations';
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
import { PatrimonioView } from './components/PatrimonioView';
import { IncomeActivitiesModal } from './components/IncomeActivitiesModal';
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
  deleteMonth,
  fetchIncomeActivities,
  upsertIncomeActivity,
  toggleArchiveIncomeActivity,
  fetchAssets,
  upsertAsset,
  deleteAsset,
  fetchLiabilities,
  upsertLiability,
  deleteLiability,
} from './lib/db';

export default function App() {
  const { user, loading: authLoading } = useAuth();

  // ——— Auth: detectar OAuth callback ———
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.has('insforge_code') || params.has('insforge_status')) {
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);

  // ——— Estado principal ———
  const [months, setMonths] = useState<MonthData[]>([]);
  const [rewards, setRewards] = useState<Reward[]>([]);
  const [activities, setActivities] = useState<IncomeActivity[]>([]);
  const [assets, setAssets] = useState<AssetItem[]>([]);
  const [liabilities, setLiabilities] = useState<LiabilityItem[]>([]);
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
  const [isActivitiesModalOpen, setIsActivitiesModalOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{
    type: 'transaction' | 'income';
    item: TransactionEntry | IncomeEntry;
  } | null>(null);
  const [deleteMonthTarget, setDeleteMonthTarget] = useState<MonthData | null>(null);
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'info' } | null>(null);

  const showToast = (text: string, type: 'success' | 'info' = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 3500);
  };

  // ——— Carregar dados do InsForge ao logar / limpar ao sair ———
  useEffect(() => {
    if (!user) {
      setMonths([]);
      setRewards([]);
      setActivities([]);
      setAssets([]);
      setLiabilities([]);
      setActiveMonthId('');
      return;
    }

    setMonths([]);
    setRewards([]);
    setActivities([]);
    setAssets([]);
    setLiabilities([]);
    setActiveMonthId('');
    setDbLoading(true);

    Promise.all([
      fetchUserMonths(user.id),
      fetchRewards(user.id),
      fetchIncomeActivities(user.id),
      fetchAssets(user.id),
      fetchLiabilities(user.id),
    ])
      .then(([monthsData, rewardsData, activitiesData, assetsData, liabilitiesData]) => {
        setRewards(rewardsData);
        setActivities(activitiesData);
        setAssets(assetsData);
        setLiabilities(liabilitiesData);

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
  }, [user?.id]);

  // Current active month object
  const currentMonth = useMemo(() => {
    const found = months.find((m) => m.id === activeMonthId);
    return found || months[months.length - 1];
  }, [months, activeMonthId]);

  const monthSummary = useMemo(() => {
    if (!currentMonth) return null;
    return calculateMonthSummary(currentMonth, activities);
  }, [currentMonth, activities]);

  const netWorthSummary = useMemo(() => {
    return calculateNetWorthSummary(assets, liabilities);
  }, [assets, liabilities]);

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
    showToast(editId ? 'Lançamento atualizado com sucesso!' : 'Lançamento adicionado!');
  };

  // ——— CRUD: Income ———
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
    showToast(editId ? 'Renda atualizada com sucesso!' : 'Fonte de renda adicionada!');
  };

  // ——— CRUD: Atividades de Renda ———
  const handleSaveActivity = async (activity: IncomeActivity) => {
    const exists = activities.some((a) => a.id === activity.id);
    const updatedList = exists
      ? activities.map((a) => (a.id === activity.id ? activity : a))
      : [...activities, activity];

    setActivities(updatedList);

    if (user) {
      await upsertIncomeActivity(user.id, activity).catch(console.error);
    }
    showToast(exists ? 'Atividade atualizada com sucesso!' : 'Nova atividade cadastrada!');
  };

  const handleToggleArchiveActivity = async (activityId: string, isActive: boolean) => {
    setActivities((prev) =>
      prev.map((a) => (a.id === activityId ? { ...a, isActive } : a))
    );

    await toggleArchiveIncomeActivity(activityId, isActive).catch(console.error);
    showToast(isActive ? 'Atividade reativada!' : 'Atividade arquivada com sucesso!');
  };

  // ——— CRUD: Ativos ———
  const handleSaveAsset = async (asset: AssetItem) => {
    const exists = assets.some((a) => a.id === asset.id);
    const updatedList = exists
      ? assets.map((a) => (a.id === asset.id ? asset : a))
      : [...assets, asset];

    setAssets(updatedList);

    if (user) {
      await upsertAsset(user.id, asset).catch(console.error);
    }
    showToast(exists ? 'Ativo atualizado com sucesso!' : 'Ativo patrimonial adicionado!');
  };

  const handleDeleteAsset = async (assetId: string) => {
    setAssets((prev) => prev.filter((a) => a.id !== assetId));
    await deleteAsset(assetId).catch(console.error);
    showToast('Ativo removido com sucesso!');
  };

  // ——— CRUD: Passivos ———
  const handleSaveLiability = async (liability: LiabilityItem) => {
    const exists = liabilities.some((l) => l.id === liability.id);
    const updatedList = exists
      ? liabilities.map((l) => (l.id === liability.id ? liability : l))
      : [...liabilities, liability];

    setLiabilities(updatedList);

    if (user) {
      await upsertLiability(user.id, liability).catch(console.error);
    }
    showToast(exists ? 'Passivo atualizado com sucesso!' : 'Passivo/Dívida adicionada!');
  };

  const handleDeleteLiability = async (liabilityId: string) => {
    setLiabilities((prev) => prev.filter((l) => l.id !== liabilityId));
    await deleteLiability(liabilityId).catch(console.error);
    showToast('Passivo removido com sucesso!');
  };

  // ——— Exclusões confirmadas (lançamentos / rendas) ———
  const handleDeleteConfirmed = async () => {
    if (!deleteTarget) return;

    if (deleteTarget.type === 'transaction') {
      const txId = deleteTarget.item.id;
      setMonths((prevMonths) =>
        prevMonths.map((m) => {
          if (m.id !== currentMonth.id) return m;
          return {
            ...m,
            transactions: (m.transactions || []).filter((t) => t.id !== txId),
            updatedAt: new Date().toISOString(),
          };
        })
      );
      await deleteTransaction(txId).catch(console.error);
      showToast('Lançamento excluído com sucesso.');
    } else {
      const incomeId = deleteTarget.item.id;
      setMonths((prevMonths) =>
        prevMonths.map((m) => {
          if (m.id !== currentMonth.id) return m;
          return {
            ...m,
            incomes: (m.incomes || []).filter((i) => i.id !== incomeId),
            updatedAt: new Date().toISOString(),
          };
        })
      );
      await deleteIncome(incomeId).catch(console.error);
      showToast('Fonte de renda excluída com sucesso.');
    }

    setDeleteTarget(null);
  };

  // ——— Criar Novo Mês ———
  const handleCreateMonth = async (
    year: number,
    month: number,
    duplicateFromMonthId?: string,
    copyRecurringStructure?: boolean
  ) => {
    let sourceMonth: MonthData | undefined;
    if (duplicateFromMonthId) {
      sourceMonth = months.find((m) => m.id === duplicateFromMonthId);
    }

    const newMonth = createNewMonthData(
      year,
      month,
      sourceMonth ? sourceMonth.targets : DEFAULT_TARGETS,
      !!copyRecurringStructure,
      sourceMonth
    );

    const updatedMonths = [...months, newMonth].sort((a, b) => a.id.localeCompare(b.id));
    setMonths(updatedMonths);
    setActiveMonthId(newMonth.id);
    setActiveTab('dashboard');

    if (user) {
      await upsertMonth(user.id, newMonth).catch(console.error);
    }
    showToast(`Mês criado com sucesso!`);
  };

  // ——— Salvar Metas do Mês ———
  const handleSaveTargetsForMonth = async (monthId: string, targets: CategoryTargets) => {
    setMonths((prevMonths) =>
      prevMonths.map((m) => {
        if (m.id !== monthId) return m;
        return { ...m, targets, updatedAt: new Date().toISOString() };
      })
    );

    if (user) {
      await saveTargets(user.id, monthId, targets).catch(console.error);
    }
    showToast('Metas do mês atualizadas!');
  };

  // ——— Aplicar Metas a Todos os Meses ———
  const handleApplyTargetsToAllMonths = async (targets: CategoryTargets) => {
    setMonths((prevMonths) =>
      prevMonths.map((m) => ({
        ...m,
        targets,
        updatedAt: new Date().toISOString(),
      }))
    );

    if (user) {
      await Promise.all(
        months.map((m) => saveTargets(user.id, m.id, targets))
      ).catch(console.error);
    }
    showToast('Metas aplicadas a todos os meses com sucesso!');
  };

  // ——— Duplicar Estrutura de Metas ———
  const handleDuplicateStructureFromMonth = async (sourceMonthId: string, targetMonthId: string) => {
    const sourceMonth = months.find((m) => m.id === sourceMonthId);
    if (!sourceMonth) return;

    await handleSaveTargetsForMonth(targetMonthId, sourceMonth.targets);
    showToast(`Estrutura duplicada com sucesso!`);
  };

  const handleGoToTransactionsWithCategory = (category?: CategoryId) => {
    setTxCategoryFilter(category || 'all');
    setActiveTab('transactions');
  };

  // ——— Deletar Mês ———
  const handleDeleteMonth = async (monthToDelete: MonthData) => {
    if (months.length <= 1) {
      showToast('Não é possível apagar o único mês existente.', 'info');
      setDeleteMonthTarget(null);
      return;
    }

    const remaining = months.filter((m) => m.id !== monthToDelete.id);
    setMonths(remaining);

    if (activeMonthId === monthToDelete.id) {
      setActiveMonthId(remaining[remaining.length - 1].id);
      setActiveTab('dashboard');
    }

    if (user) {
      await deleteMonth(user.id, monthToDelete.id).catch(console.error);
    }

    setDeleteMonthTarget(null);
    showToast(`Mês excluído com sucesso.`);
  };

  // ——— TELA DE LOADING ———
  if (authLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center gap-3">
        <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
        <p className="text-slate-400 text-sm font-medium">Carregando FinanFlow...</p>
      </div>
    );
  }

  // ——— TELA DE AUTENTICAÇÃO ———
  if (!user) {
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
        onDeleteMonth={(month) => setDeleteMonthTarget(month)}
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
        onOpenActivitiesModal={() => setIsActivitiesModalOpen(true)}
        user={user}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {activeTab === 'dashboard' && monthSummary && (
          <DashboardView
            currentMonth={currentMonth}
            summary={monthSummary}
            activities={activities}
            netWorthSummary={netWorthSummary}
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
            onGoToPatrimonio={() => setActiveTab('patrimonio')}
            onOpenActivitiesModal={() => setIsActivitiesModalOpen(true)}
          />
        )}

        {activeTab === 'transactions' && (
          <TransactionsView
            currentMonth={currentMonth}
            activities={activities}
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
            onOpenActivitiesModal={() => setIsActivitiesModalOpen(true)}
          />
        )}

        {activeTab === 'patrimonio' && (
          <PatrimonioView
            assets={assets}
            liabilities={liabilities}
            allMonths={months}
            activities={activities}
            onSaveAsset={handleSaveAsset}
            onDeleteAsset={handleDeleteAsset}
            onSaveLiability={handleSaveLiability}
            onDeleteLiability={handleDeleteLiability}
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
          <AnnualView
            allMonths={months}
            assets={assets}
            liabilities={liabilities}
            activities={activities}
          />
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
        activities={activities}
        onOpenActivitiesModal={() => setIsActivitiesModalOpen(true)}
      />

      <IncomeModal
        isOpen={isIncomeModalOpen}
        onClose={() => { setIsIncomeModalOpen(false); setEditingIncome(null); }}
        onSave={handleSaveIncome}
        initialData={editingIncome}
        monthId={currentMonth.id}
        activities={activities}
        onOpenActivitiesModal={() => setIsActivitiesModalOpen(true)}
      />

      <IncomeActivitiesModal
        isOpen={isActivitiesModalOpen}
        onClose={() => setIsActivitiesModalOpen(false)}
        activities={activities}
        onSaveActivity={handleSaveActivity}
        onToggleArchive={handleToggleArchiveActivity}
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
        itemDescription={deleteTarget?.item?.description || ''}
        itemAmount={deleteTarget?.item?.amount}
        itemCategoryName={
          deleteTarget
            ? deleteTarget.type === 'transaction'
              ? CATEGORIES_CONFIG[(deleteTarget.item as TransactionEntry).categoryId]?.name
              : 'Entrada de Renda'
            : ''
        }
      />

      {/* Modal de confirmação: Excluir Mês */}
      <DeleteConfirmModal
        isOpen={!!deleteMonthTarget}
        onClose={() => setDeleteMonthTarget(null)}
        onConfirm={() => deleteMonthTarget && handleDeleteMonth(deleteMonthTarget)}
        title="Excluir Mês"
        itemDescription={deleteMonthTarget ? `${['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'][deleteMonthTarget.month - 1]} / ${deleteMonthTarget.year}` : ''}
        itemCategoryName="Todos os lançamentos e rendas deste mês serão excluídos"
      />
    </div>
  );
}
