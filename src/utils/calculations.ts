import { CategoryCalculation, CategoryId, MonthData, MonthSummary } from '../types';
import { CATEGORIES_CONFIG, CATEGORY_IDS, DEFAULT_TARGETS } from './constants';

export const calculateMonthSummary = (monthData: MonthData): MonthSummary => {
  const totalIncome = (monthData.incomes || []).reduce((acc, curr) => acc + (Number(curr.amount) || 0), 0);
  
  const targets = { ...DEFAULT_TARGETS, ...(monthData.targets || {}) };
  let totalTargetPercent = 0;
  
  const categories: Record<CategoryId, CategoryCalculation> = {} as Record<CategoryId, CategoryCalculation>;
  let totalExpensesAndAllocations = 0;
  let investimentoActual = 0;
  let poupancaActual = 0;

  CATEGORY_IDS.forEach((catId) => {
    const categoryInfo = CATEGORIES_CONFIG[catId];
    const targetPercent = Number(targets[catId]) || 0;
    totalTargetPercent += targetPercent;

    const targetAmount = (targetPercent / 100) * totalIncome;

    const catTransactions = (monthData.transactions || []).filter((t) => t.categoryId === catId);
    const actualAmount = catTransactions.reduce((acc, curr) => acc + (Number(curr.amount) || 0), 0);
    const count = catTransactions.length;

    totalExpensesAndAllocations += actualAmount;
    if (catId === 'investimento') investimentoActual = actualAmount;
    if (catId === 'poupanca') poupancaActual = actualAmount;

    const difference = targetAmount - actualAmount; // Positive = within limit or room left; Negative = exceeded
    const progressPercent = targetAmount > 0 ? (actualAmount / targetAmount) * 100 : actualAmount > 0 ? 100 : 0;
    const shareOfIncome = totalIncome > 0 ? (actualAmount / totalIncome) * 100 : 0;

    let status: CategoryCalculation['status'] = 'safe';

    if (categoryInfo.nature === 'growth' || categoryInfo.nature === 'security') {
      // For investments/savings: higher or equal is great!
      if (targetAmount === 0 && actualAmount === 0) {
        status = 'on_track';
      } else if (actualAmount >= targetAmount) {
        status = 'achieved';
      } else if (actualAmount >= targetAmount * 0.7) {
        status = 'on_track';
      } else {
        status = 'under';
      }
    } else {
      // For expenses/spending:
      if (targetAmount === 0 && actualAmount > 0) {
        status = 'danger';
      } else if (actualAmount > targetAmount) {
        status = 'danger'; // Exceeded target budget
      } else if (actualAmount >= targetAmount * 0.85) {
        status = 'warning'; // Near limit (85%-100%)
      } else {
        status = 'safe'; // Well within budget
      }
    }

    let totalInvested = 0;
    let totalReturned = 0;
    let netProfit = 0;
    let roiPercent = 0;

    if (catId === 'negocios') {
      totalInvested = catTransactions.reduce((acc, curr) => acc + (curr.investedAmount !== undefined ? Number(curr.investedAmount) : Number(curr.amount) || 0), 0);
      totalReturned = catTransactions.reduce((acc, curr) => acc + (Number(curr.returnAmount) || 0), 0);
      netProfit = totalReturned - totalInvested;
      roiPercent = totalInvested > 0 ? (netProfit / totalInvested) * 100 : 0;
    }

    categories[catId] = {
      category: categoryInfo,
      targetPercent,
      targetAmount,
      actualAmount,
      difference,
      progressPercent,
      shareOfIncome,
      status,
      count,
      totalInvested: catId === 'negocios' ? totalInvested : undefined,
      totalReturned: catId === 'negocios' ? totalReturned : undefined,
      netProfit: catId === 'negocios' ? netProfit : undefined,
      roiPercent: catId === 'negocios' ? roiPercent : undefined,
    };
  });

  const unallocatedTargetPercent = Math.max(0, 100 - totalTargetPercent);
  const unallocatedTargetAmount = (unallocatedTargetPercent / 100) * totalIncome;
  const remainingBalance = totalIncome - totalExpensesAndAllocations;
  const investmentAndSavingsRate = totalIncome > 0 ? ((investimentoActual + poupancaActual) / totalIncome) * 100 : 0;
  const growthTotal = investimentoActual + poupancaActual;

  return {
    totalIncome,
    totalExpensesAndAllocations,
    remainingBalance,
    totalTargetPercent,
    unallocatedTargetPercent,
    unallocatedTargetAmount,
    categories,
    investmentAndSavingsRate,
    growthTotal,
  };
};

export interface HistoricalMonthPoint {
  id: string;
  label: string;
  shortLabel: string;
  year: number;
  month: number;
  totalIncome: number;
  totalSpent: number;
  despesas: number;
  investimento: number;
  conhecimento: number;
  doacao: number;
  poupanca: number;
  negocios: number;
  negociosReturn: number;
  remainingBalance: number;
  savingsRate: number;
  growthTotal: number;
}

export const getHistoricalData = (months: MonthData[]): HistoricalMonthPoint[] => {
  const sortedMonths = [...months].sort((a, b) => a.id.localeCompare(b.id));

  return sortedMonths.map((m) => {
    const summary = calculateMonthSummary(m);
    const [yearStr, monthStr] = m.id.split('-');
    const year = parseInt(yearStr, 10);
    const month = parseInt(monthStr, 10);
    const MONTHS = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
    const shortLabel = `${MONTHS[month - 1]}/${String(year).slice(2)}`;
    const FULL_MONTHS = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
    const label = `${FULL_MONTHS[month - 1]} ${year}`;

    return {
      id: m.id,
      label,
      shortLabel,
      year,
      month,
      totalIncome: summary.totalIncome,
      totalSpent: summary.totalExpensesAndAllocations,
      despesas: summary.categories.despesas.actualAmount,
      investimento: summary.categories.investimento.actualAmount,
      conhecimento: summary.categories.conhecimento.actualAmount,
      doacao: summary.categories.doacao.actualAmount,
      poupanca: summary.categories.poupanca.actualAmount,
      negocios: summary.categories.negocios?.actualAmount || 0,
      negociosReturn: summary.categories.negocios?.totalReturned || 0,
      remainingBalance: summary.remainingBalance,
      savingsRate: summary.investmentAndSavingsRate,
      growthTotal: summary.growthTotal,
    };
  });
};
