export type CategoryId =
  | 'despesas'
  | 'investimento'
  | 'conhecimento'
  | 'doacao'
  | 'poupanca'
  | 'negocios';

export interface CategoryInfo {
  id: CategoryId;
  name: string;
  defaultPercent: number;
  color: string;
  accentBg: string;
  borderColor: string;
  iconName: string;
  description: string;
  nature: 'expense' | 'growth' | 'purpose' | 'security' | 'business';
}

// ─── RENDA ATIVA / PASSIVA & ATIVIDADES ─────────────────────────

export type IncomeNature = 'active' | 'passive';

export interface IncomeActivity {
  id: string;
  userId?: string;
  name: string;
  defaultType: IncomeNature;
  isActive: boolean;
  color?: string;
  createdAt: string;
  updatedAt: string;
}

export interface IncomeEntry {
  id: string;
  description: string;
  amount: number;
  date: string; // YYYY-MM-DD
  sourceType?: 'salario' | 'freelance' | 'dividendos' | 'renda_extra' | 'outros';
  incomeNature?: IncomeNature;
  activityId?: string;
}

// ─── NEGÓCIOS & LANÇAMENTOS ────────────────────────────────────

export type BusinessStatus = 'in_progress' | 'completed' | 'cancelled';

export interface TransactionEntry {
  id: string;
  categoryId: CategoryId;
  description: string;
  amount: number;
  date: string; // YYYY-MM-DD
  paymentMethod?: 'pix' | 'cartao_credito' | 'cartao_debito' | 'boleto' | 'dinheiro';
  notes?: string;
  isRecurring?: boolean;
  // Negócios specific fields (Investimento vs Retorno do Negócio)
  investedAmount?: number;
  returnAmount?: number;
  activityId?: string;
  businessStatus?: BusinessStatus;
}

export type CategoryTargets = Record<CategoryId, number>;

export interface MonthData {
  id: string; // "YYYY-MM", e.g. "2026-01"
  year: number;
  month: number; // 1 - 12
  targets: CategoryTargets;
  incomes: IncomeEntry[];
  transactions: TransactionEntry[];
  createdAt: string;
  updatedAt: string;
}

export interface CategoryCalculation {
  category: CategoryInfo;
  targetPercent: number;
  targetAmount: number;
  actualAmount: number;
  difference: number; // targetAmount - actualAmount
  progressPercent: number; // (actual / target) * 100
  shareOfIncome: number; // (actual / totalIncome) * 100
  status: 'safe' | 'warning' | 'danger' | 'achieved' | 'on_track' | 'under';
  count: number;
  // Negócios metrics
  totalInvested?: number;
  totalReturned?: number;
  netProfit?: number;
  roiPercent?: number;
}

export interface ActivityIncomeSummary {
  activityId: string;
  name: string;
  nature: IncomeNature;
  color?: string;
  totalIncome: number;
  incomesCount: number;
  businessCount: number;
  totalInvested: number;
  totalReturned: number;
  netProfit: number;
  roiPercent: number;
}

export interface MonthSummary {
  // Fluxo de Renda
  totalIncome: number;
  activeIncome: number;
  passiveIncome: number;
  
  // Fluxo de Saída / Alocações
  totalExpensesAndAllocations: number;
  totalOperationalExpenses: number; // Apenas Despesas / Conhecimento / Doação
  totalGrowthInvestments: number; // Investimento + Poupança (sem chamar de gasto)
  
  // Negócios
  businessTotalInvested: number;
  businessTotalReturned: number;
  businessNetProfit: number;
  businessRoiPercent: number;
  
  // Saldos
  remainingBalance: number; // totalIncome - totalExpensesAndAllocations
  availableCashBalance: number; // totalIncome - totalOperationalExpenses - totalGrowthInvestments + businessNetProfit
  
  // Metas
  totalTargetPercent: number;
  unallocatedTargetPercent: number;
  unallocatedTargetAmount: number;
  categories: Record<CategoryId, CategoryCalculation>;
  
  // Taxa de crescimento
  investmentAndSavingsRate: number; // % of income going to investment + poupança
  growthTotal: number; // investimento + poupança in R$

  // Distribuição por atividade
  activitySummaries?: ActivityIncomeSummary[];
}

// ─── PATRIMÔNIO (ATIVOS E PASSIVOS) ───────────────────────────

export type AssetType =
  | 'conta'
  | 'poupanca'
  | 'investimento'
  | 'acoes'
  | 'fiis'
  | 'tesouro'
  | 'cripto'
  | 'imovel'
  | 'veiculo'
  | 'negocio'
  | 'outro';

export type LiabilityType =
  | 'financiamento'
  | 'emprestimo'
  | 'divida'
  | 'parcelamento'
  | 'outro';

export interface AssetItem {
  id: string;
  userId?: string;
  name: string;
  type: AssetType;
  currentValue: number;
  valuationDate: string; // YYYY-MM-DD
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface LiabilityItem {
  id: string;
  userId?: string;
  name: string;
  type: LiabilityType;
  currentValue: number;
  valuationDate: string; // YYYY-MM-DD
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AssetValuationHistory {
  id: string;
  userId?: string;
  itemId: string;
  itemType: 'asset' | 'liability';
  value: number;
  valuationDate: string; // YYYY-MM-DD
  notes?: string;
  createdAt: string;
}

export interface NetWorthSummary {
  totalAssets: number;
  totalLiabilities: number;
  netWorth: number;
  assetsByType: Record<AssetType, number>;
  liabilitiesByType: Record<LiabilityType, number>;
}

export interface PatrimonioMonthEvolution {
  monthId: string; // "YYYY-MM"
  label: string; // "Janeiro 2026"
  shortLabel: string; // "Jan/26"
  year: number;
  month: number;
  totalAssets: number;
  totalLiabilities: number;
  netWorth: number;
  monthlyVariation: number; // R$ vs previous month
  monthlyVariationPct: number; // % vs previous month
  totalInvestedCumulative: number;
  totalSavingsCumulative: number;
}

export interface PatrimonioEvolutionSummary {
  points: PatrimonioMonthEvolution[];
  initialNetWorth: number;
  finalNetWorth: number;
  currentNetWorth: number;
  totalVariation: number; // Final - Initial
  totalGrowthPercent: number; // ((Final - Initial) / Initial) * 100
  latestMonthlyVariation: number;
  latestMonthlyVariationPct: number;
}

// ─── NAVEGAÇÃO ─────────────────────────────────────────────────

export type ActiveTab =
  | 'dashboard'
  | 'transactions'
  | 'history'
  | 'targets'
  | 'annual'
  | 'rewards'
  | 'patrimonio';

export type RewardConditionType =
  | 'renda_mensal'
  | 'renda_anual'
  | 'categoria_acumulada'
  | 'taxa_poupanca';

export interface Reward {
  id: string;
  name: string;
  emoji: string;
  description?: string;
  conditionType: RewardConditionType;
  conditionValue: number;
  conditionCategory?: string;
  isAchieved: boolean;
  achievedAt?: string;
  createdAt: string;
  updatedAt: string;
}

