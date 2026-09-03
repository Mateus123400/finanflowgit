import {
  AssetItem,
  AssetType,
  CategoryCalculation,
  CategoryId,
  IncomeActivity,
  LiabilityItem,
  LiabilityType,
  MonthData,
  MonthSummary,
  NetWorthSummary,
  ActivityIncomeSummary,
  PatrimonioEvolutionSummary,
  PatrimonioMonthEvolution,
} from '../types';
import { CATEGORIES_CONFIG, CATEGORY_IDS, DEFAULT_TARGETS } from './constants';

export const calculateMonthSummary = (
  monthData: MonthData,
  activities: IncomeActivity[] = []
): MonthSummary => {
  const incomes = monthData.incomes || [];
  const transactions = monthData.transactions || [];

  // Renda Total e separação Ativa vs Passiva
  let activeIncome = 0;
  let passiveIncome = 0;

  incomes.forEach((inc) => {
    const amt = Number(inc.amount) || 0;
    // Se tiver natureza explícita ou deduzido da atividade ou sourceType
    const nature = inc.incomeNature || (inc.sourceType === 'dividendos' ? 'passive' : 'active');
    if (nature === 'passive') {
      passiveIncome += amt;
    } else {
      activeIncome += amt;
    }
  });

  const totalIncome = activeIncome + passiveIncome;
  const targets = { ...DEFAULT_TARGETS, ...(monthData.targets || {}) };
  let totalTargetPercent = 0;

  const categories: Record<CategoryId, CategoryCalculation> = {} as Record<CategoryId, CategoryCalculation>;
  let totalExpensesAndAllocations = 0;
  let totalOperationalExpenses = 0;
  let totalGrowthInvestments = 0;

  let businessTotalInvested = 0;
  let businessTotalReturned = 0;
  let businessNetProfit = 0;

  CATEGORY_IDS.forEach((catId) => {
    const categoryInfo = CATEGORIES_CONFIG[catId];
    const targetPercent = Number(targets[catId]) || 0;
    totalTargetPercent += targetPercent;

    const targetAmount = (targetPercent / 100) * totalIncome;
    const catTransactions = transactions.filter((t) => t.categoryId === catId);
    const actualAmount = catTransactions.reduce((acc, curr) => acc + (Number(curr.amount) || 0), 0);
    const count = catTransactions.length;

    totalExpensesAndAllocations += actualAmount;

    if (catId === 'despesas' || catId === 'conhecimento' || catId === 'doacao') {
      totalOperationalExpenses += actualAmount;
    } else if (catId === 'investimento' || catId === 'poupanca') {
      totalGrowthInvestments += actualAmount;
    }

    const difference = targetAmount - actualAmount;
    const progressPercent = targetAmount > 0 ? (actualAmount / targetAmount) * 100 : actualAmount > 0 ? 100 : 0;
    const shareOfIncome = totalIncome > 0 ? (actualAmount / totalIncome) * 100 : 0;

    let status: CategoryCalculation['status'] = 'safe';

    if (categoryInfo.nature === 'growth' || categoryInfo.nature === 'security') {
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
      if (targetAmount === 0 && actualAmount > 0) {
        status = 'danger';
      } else if (actualAmount > targetAmount) {
        status = 'danger';
      } else if (actualAmount >= targetAmount * 0.85) {
        status = 'warning';
      } else {
        status = 'safe';
      }
    }

    let catInvested = 0;
    let catReturned = 0;
    let catProfit = 0;
    let catRoi = 0;

    if (catId === 'negocios') {
      catTransactions.forEach((tx) => {
        const inv = tx.investedAmount !== undefined ? Number(tx.investedAmount) : Number(tx.amount) || 0;
        const ret = Number(tx.returnAmount) || 0;
        catInvested += inv;
        catReturned += ret;
      });

      catProfit = catReturned - catInvested;
      catRoi = catInvested > 0 ? (catProfit / catInvested) * 100 : 0;

      businessTotalInvested = catInvested;
      businessTotalReturned = catReturned;
      businessNetProfit = catProfit;
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
      totalInvested: catId === 'negocios' ? catInvested : undefined,
      totalReturned: catId === 'negocios' ? catReturned : undefined,
      netProfit: catId === 'negocios' ? catProfit : undefined,
      roiPercent: catId === 'negocios' ? catRoi : undefined,
    };
  });

  const businessRoiPercent = businessTotalInvested > 0 ? (businessNetProfit / businessTotalInvested) * 100 : 0;
  const unallocatedTargetPercent = Math.max(0, 100 - totalTargetPercent);
  const unallocatedTargetAmount = (unallocatedTargetPercent / 100) * totalIncome;
  const remainingBalance = totalIncome - totalExpensesAndAllocations;
  const availableCashBalance = totalIncome - totalOperationalExpenses - totalGrowthInvestments + businessTotalReturned;
  const investmentAndSavingsRate = totalIncome > 0 ? (totalGrowthInvestments / totalIncome) * 100 : 0;
  const growthTotal = totalGrowthInvestments;

  // Resumo por Atividade de Renda
  const activityMap = new Map<string, IncomeActivity>();
  activities.forEach((act) => activityMap.set(act.id, act));

  const activitySummariesMap: Record<string, ActivityIncomeSummary> = {};

  // Incomes por atividade
  incomes.forEach((inc) => {
    if (!inc.activityId) return;
    const act = activityMap.get(inc.activityId);
    const actName = act ? act.name : 'Atividade';
    const actNature = act ? act.defaultType : (inc.incomeNature || 'active');

    if (!activitySummariesMap[inc.activityId]) {
      activitySummariesMap[inc.activityId] = {
        activityId: inc.activityId,
        name: actName,
        nature: actNature,
        color: act?.color,
        totalIncome: 0,
        incomesCount: 0,
        businessCount: 0,
        totalInvested: 0,
        totalReturned: 0,
        netProfit: 0,
        roiPercent: 0,
      };
    }

    activitySummariesMap[inc.activityId].totalIncome += Number(inc.amount) || 0;
    activitySummariesMap[inc.activityId].incomesCount += 1;
  });

  // Negócios por atividade
  transactions.forEach((tx) => {
    if (tx.categoryId !== 'negocios' || !tx.activityId) return;
    const act = activityMap.get(tx.activityId);
    const actName = act ? act.name : 'Atividade';
    const actNature = act ? act.defaultType : 'active';

    if (!activitySummariesMap[tx.activityId]) {
      activitySummariesMap[tx.activityId] = {
        activityId: tx.activityId,
        name: actName,
        nature: actNature,
        color: act?.color,
        totalIncome: 0,
        incomesCount: 0,
        businessCount: 0,
        totalInvested: 0,
        totalReturned: 0,
        netProfit: 0,
        roiPercent: 0,
      };
    }

    const inv = tx.investedAmount !== undefined ? Number(tx.investedAmount) : Number(tx.amount) || 0;
    const ret = Number(tx.returnAmount) || 0;
    activitySummariesMap[tx.activityId].totalInvested += inv;
    activitySummariesMap[tx.activityId].totalReturned += ret;
    activitySummariesMap[tx.activityId].businessCount += 1;
  });

  // Calcular lucro e ROI por atividade
  const activitySummaries = Object.values(activitySummariesMap).map((summary) => {
    const profit = summary.totalReturned - summary.totalInvested;
    const roi = summary.totalInvested > 0 ? (profit / summary.totalInvested) * 100 : 0;
    return {
      ...summary,
      netProfit: profit,
      roiPercent: roi,
    };
  });

  return {
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
    totalTargetPercent,
    unallocatedTargetPercent,
    unallocatedTargetAmount,
    categories,
    investmentAndSavingsRate,
    growthTotal,
    activitySummaries,
  };
};

export const calculateNetWorthSummary = (
  assets: AssetItem[],
  liabilities: LiabilityItem[]
): NetWorthSummary => {
  const assetsByType: Record<AssetType, number> = {
    conta: 0,
    poupanca: 0,
    investimento: 0,
    acoes: 0,
    fiis: 0,
    tesouro: 0,
    cripto: 0,
    imovel: 0,
    veiculo: 0,
    negocio: 0,
    outro: 0,
  };

  const liabilitiesByType: Record<LiabilityType, number> = {
    financiamento: 0,
    emprestimo: 0,
    divida: 0,
    parcelamento: 0,
    outro: 0,
  };

  let totalAssets = 0;
  assets.forEach((a) => {
    const val = Number(a.currentValue) || 0;
    totalAssets += val;
    assetsByType[a.type] = (assetsByType[a.type] || 0) + val;
  });

  let totalLiabilities = 0;
  liabilities.forEach((l) => {
    const val = Number(l.currentValue) || 0;
    totalLiabilities += val;
    liabilitiesByType[l.type] = (liabilitiesByType[l.type] || 0) + val;
  });

  const netWorth = totalAssets - totalLiabilities;

  return {
    totalAssets,
    totalLiabilities,
    netWorth,
    assetsByType,
    liabilitiesByType,
  };
};

export const calculatePatrimonioEvolution = (
  months: MonthData[],
  assets: AssetItem[],
  liabilities: LiabilityItem[],
  activities: IncomeActivity[] = []
): PatrimonioEvolutionSummary => {
  const netWorthSummary = calculateNetWorthSummary(assets, liabilities);
  const currentNetWorth = netWorthSummary.netWorth;
  const currentTotalAssets = netWorthSummary.totalAssets;
  const currentTotalLiabilities = netWorthSummary.totalLiabilities;

  const sortedMonths = [...months].sort((a, b) => a.id.localeCompare(b.id));

  if (sortedMonths.length === 0) {
    const now = new Date();
    const MONTHS_FULL = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
    const MONTHS_SHORT = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
    const curMonthIdx = now.getMonth();
    const monthId = `${now.getFullYear()}-${String(curMonthIdx + 1).padStart(2, '0')}`;

    const singlePoint: PatrimonioMonthEvolution = {
      monthId,
      label: `${MONTHS_FULL[curMonthIdx]} ${now.getFullYear()}`,
      shortLabel: `${MONTHS_SHORT[curMonthIdx]}/${String(now.getFullYear()).slice(2)}`,
      year: now.getFullYear(),
      month: curMonthIdx + 1,
      totalAssets: currentTotalAssets,
      totalLiabilities: currentTotalLiabilities,
      netWorth: currentNetWorth,
      monthlyVariation: 0,
      monthlyVariationPct: 0,
      totalInvestedCumulative: 0,
      totalSavingsCumulative: 0,
    };

    return {
      points: [singlePoint],
      initialNetWorth: currentNetWorth,
      finalNetWorth: currentNetWorth,
      currentNetWorth,
      totalVariation: 0,
      totalGrowthPercent: 0,
      latestMonthlyVariation: 0,
      latestMonthlyVariationPct: 0,
    };
  }

  // Calculate monthly financial accumulation (investment + savings + balance generated)
  const monthDeltas = sortedMonths.map((m) => {
    const summary = calculateMonthSummary(m, activities);
    const growth = summary.growthTotal; // investimento + poupanca
    const balance = summary.remainingBalance;
    const netProfit = summary.businessNetProfit;
    // Total wealth added in this month = growth + remaining positive balance
    const netAdded = growth + Math.max(0, balance) + (netProfit > 0 ? netProfit : 0);
    return {
      monthId: m.id,
      year: m.year,
      month: m.month,
      growth,
      netAdded,
    };
  });

  // Calculate cumulative additions up to each month
  const totalNetAdded = monthDeltas.reduce((acc, curr) => acc + curr.netAdded, 0);

  // If we have registered assets/liabilities, align initial net worth before the recorded sequence
  const initialBase = Math.max(0, currentNetWorth - totalNetAdded);

  let runningNetWorth = initialBase;
  let runningInvested = 0;
  let runningSavings = 0;

  const MONTHS_FULL = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
  const MONTHS_SHORT = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

  const points: PatrimonioMonthEvolution[] = sortedMonths.map((m, idx) => {
    const summary = calculateMonthSummary(m, activities);
    const invAmount = summary.categories.investimento?.actualAmount || 0;
    const poupAmount = summary.categories.poupanca?.actualAmount || 0;
    const delta = monthDeltas[idx].netAdded;

    const previousNetWorth = runningNetWorth;
    runningNetWorth += delta;
    runningInvested += invAmount;
    runningSavings += poupAmount;

    // In the final month, snap to currentNetWorth if assets exist
    if (idx === sortedMonths.length - 1 && currentTotalAssets > 0) {
      runningNetWorth = currentNetWorth;
    }

    const monthlyVariation = runningNetWorth - previousNetWorth;
    const monthlyVariationPct = previousNetWorth > 0 ? (monthlyVariation / previousNetWorth) * 100 : 0;

    return {
      monthId: m.id,
      label: `${MONTHS_FULL[m.month - 1]} ${m.year}`,
      shortLabel: `${MONTHS_SHORT[m.month - 1]}/${String(m.year).slice(2)}`,
      year: m.year,
      month: m.month,
      totalAssets: runningNetWorth + currentTotalLiabilities,
      totalLiabilities: currentTotalLiabilities,
      netWorth: runningNetWorth,
      monthlyVariation,
      monthlyVariationPct,
      totalInvestedCumulative: runningInvested,
      totalSavingsCumulative: runningSavings,
    };
  });

  const initialNetWorth = points[0]?.netWorth || currentNetWorth;
  const finalNetWorth = points[points.length - 1]?.netWorth || currentNetWorth;
  const totalVariation = finalNetWorth - initialNetWorth;
  const totalGrowthPercent = initialNetWorth > 0 ? (totalVariation / initialNetWorth) * 100 : 0;
  const latestPoint = points[points.length - 1];

  return {
    points,
    initialNetWorth,
    finalNetWorth,
    currentNetWorth,
    totalVariation,
    totalGrowthPercent,
    latestMonthlyVariation: latestPoint?.monthlyVariation || 0,
    latestMonthlyVariationPct: latestPoint?.monthlyVariationPct || 0,
  };
};

export interface HistoricalMonthPoint {
  id: string;
  label: string;
  shortLabel: string;
  year: number;
  month: number;
  totalIncome: number;
  activeIncome: number;
  passiveIncome: number;
  totalSpent: number;
  despesas: number;
  investimento: number;
  conhecimento: number;
  doacao: number;
  poupanca: number;
  negocios: number;
  negociosInvested: number;
  negociosReturn: number;
  negociosProfit: number;
  remainingBalance: number;
  savingsRate: number;
  growthTotal: number;
}

export const getHistoricalData = (
  months: MonthData[],
  activities: IncomeActivity[] = []
): HistoricalMonthPoint[] => {
  const sortedMonths = [...months].sort((a, b) => a.id.localeCompare(b.id));

  return sortedMonths.map((m) => {
    const summary = calculateMonthSummary(m, activities);
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
      activeIncome: summary.activeIncome,
      passiveIncome: summary.passiveIncome,
      totalSpent: summary.totalExpensesAndAllocations,
      despesas: summary.categories.despesas?.actualAmount || 0,
      investimento: summary.categories.investimento?.actualAmount || 0,
      conhecimento: summary.categories.conhecimento?.actualAmount || 0,
      doacao: summary.categories.doacao?.actualAmount || 0,
      poupanca: summary.categories.poupanca?.actualAmount || 0,
      negocios: summary.categories.negocios?.actualAmount || 0,
      negociosInvested: summary.businessTotalInvested,
      negociosReturn: summary.businessTotalReturned,
      negociosProfit: summary.businessNetProfit,
      remainingBalance: summary.remainingBalance,
      savingsRate: summary.investmentAndSavingsRate,
      growthTotal: summary.growthTotal,
    };
  });
};

