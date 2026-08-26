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

export interface IncomeEntry {
  id: string;
  description: string;
  amount: number;
  date: string; // YYYY-MM-DD
  sourceType?: 'salario' | 'freelance' | 'dividendos' | 'renda_extra' | 'outros';
}

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
  // Optional business metrics
  totalInvested?: number;
  totalReturned?: number;
  netProfit?: number;
  roiPercent?: number;
}

export interface MonthSummary {
  totalIncome: number;
  totalExpensesAndAllocations: number;
  remainingBalance: number; // totalIncome - totalExpensesAndAllocations
  totalTargetPercent: number;
  unallocatedTargetPercent: number; // 100 - sum(targets)
  unallocatedTargetAmount: number;
  categories: Record<CategoryId, CategoryCalculation>;
  investmentAndSavingsRate: number; // % of income going to investment + poupança
  growthTotal: number; // investimento + poupança in R$
}

export type ActiveTab = 'dashboard' | 'transactions' | 'history' | 'targets' | 'annual' | 'rewards';

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
