import { MonthData, CategoryTargets } from '../types';
import { DEFAULT_TARGETS } from './constants';

const STORAGE_KEY = 'finanflow_months_data_v1';
const ACTIVE_MONTH_KEY = 'finanflow_active_month_v1';

export const INITIAL_SEED_MONTHS: MonthData[] = [
  {
    id: '2026-01',
    year: 2026,
    month: 1,
    targets: { ...DEFAULT_TARGETS },
    incomes: [
      { id: 'inc-1-1', description: 'Salário CLT (Empresa Tech)', amount: 9500, date: '2026-01-05', sourceType: 'salario' },
      { id: 'inc-1-2', description: 'Freelance Design & Landing Page', amount: 2800, date: '2026-01-18', sourceType: 'freelance' },
      { id: 'inc-1-3', description: 'Dividendos FIIs & Ações', amount: 420, date: '2026-01-15', sourceType: 'dividendos' },
    ],
    transactions: [
      // Despesas (Meta: 20% de 12720 = 2544)
      { id: 'tx-1-1', categoryId: 'despesas', description: 'Aluguel + Condomínio', amount: 1650, date: '2026-01-07', paymentMethod: 'pix', isRecurring: true },
      { id: 'tx-1-2', categoryId: 'despesas', description: 'Energia Elétrica e Internet Fibra', amount: 380, date: '2026-01-10', paymentMethod: 'boleto', isRecurring: true },
      { id: 'tx-1-3', categoryId: 'despesas', description: 'Supermercado e Feira', amount: 490, date: '2026-01-14', paymentMethod: 'cartao_credito' },
      // Investimento (Meta: 20% = 2544)
      { id: 'tx-1-4', categoryId: 'investimento', description: 'Aporte Tesouro IPCA+ 2035', amount: 1500, date: '2026-01-08', paymentMethod: 'pix' },
      { id: 'tx-1-5', categoryId: 'investimento', description: 'Aporte Carteira FIIs (HGLG11 / XPML11)', amount: 1100, date: '2026-01-12', paymentMethod: 'pix' },
      // Conhecimento (Meta: 10% = 1272)
      { id: 'tx-1-6', categoryId: 'conhecimento', description: 'Livros de Finanças & Arquitetura de Software', amount: 260, date: '2026-01-11', paymentMethod: 'cartao_credito' },
      { id: 'tx-1-7', categoryId: 'conhecimento', description: 'Assinatura Plataforma de Cursos Alura', amount: 950, date: '2026-01-16', paymentMethod: 'cartao_credito' },
      // Doação (Meta: 10% = 1272)
      { id: 'tx-1-8', categoryId: 'doacao', description: 'Doação Médicos Sem Fronteiras + Cesta Solidária', amount: 1200, date: '2026-01-20', paymentMethod: 'pix' },
      // Poupança (Meta: 10% = 1272)
      { id: 'tx-1-9', categoryId: 'poupanca', description: 'Reserva de Emergência CDB 110% CDI', amount: 1300, date: '2026-01-06', paymentMethod: 'pix' },
      // Negócios (Meta: 10% = 1272)
      { id: 'tx-1-10', categoryId: 'negocios', description: 'Loja Virtual de Acessórios', amount: 1000, investedAmount: 1000, returnAmount: 1450, date: '2026-01-10', paymentMethod: 'pix' },
    ],
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-28T00:00:00.000Z',
  },
  {
    id: '2026-02',
    year: 2026,
    month: 2,
    targets: { ...DEFAULT_TARGETS },
    incomes: [
      { id: 'inc-2-1', description: 'Salário CLT (Empresa Tech)', amount: 9500, date: '2026-02-05', sourceType: 'salario' },
      { id: 'inc-2-2', description: 'Consultoria Web App', amount: 3500, date: '2026-02-14', sourceType: 'freelance' },
      { id: 'inc-2-3', description: 'Rendimentos e Dividendos', amount: 480, date: '2026-02-15', sourceType: 'dividendos' },
    ],
    transactions: [
      // Despesas (Meta: 20% de 13480 = 2696)
      { id: 'tx-2-1', categoryId: 'despesas', description: 'Aluguel + Condomínio', amount: 1650, date: '2026-02-05', paymentMethod: 'pix', isRecurring: true },
      { id: 'tx-2-2', categoryId: 'despesas', description: 'Energia, Água e Internet', amount: 410, date: '2026-02-10', paymentMethod: 'boleto', isRecurring: true },
      { id: 'tx-2-3', categoryId: 'despesas', description: 'Supermercado e Alimentação', amount: 590, date: '2026-02-18', paymentMethod: 'cartao_credito' },
      // Investimento (Meta: 20% = 2696)
      { id: 'tx-2-4', categoryId: 'investimento', description: 'Compra ETF IVVB11 (S&P 500)', amount: 1800, date: '2026-02-08', paymentMethod: 'pix' },
      { id: 'tx-2-5', categoryId: 'investimento', description: 'Aporte Bitcoin & Ethereum', amount: 950, date: '2026-02-16', paymentMethod: 'pix' },
      // Conhecimento (Meta: 10% = 1348)
      { id: 'tx-2-6', categoryId: 'conhecimento', description: 'Curso de Inteligência Artificial & LLMs', amount: 1100, date: '2026-02-12', paymentMethod: 'cartao_credito' },
      { id: 'tx-2-7', categoryId: 'conhecimento', description: 'Kindle Unlimited & Livros Técnicos', amount: 180, date: '2026-02-22', paymentMethod: 'cartao_credito' },
      // Doação (Meta: 10% = 1348)
      { id: 'tx-2-8', categoryId: 'doacao', description: 'Apoio Projeto Educação Comunitária', amount: 1300, date: '2026-02-20', paymentMethod: 'pix' },
      // Poupança (Meta: 10% = 1348)
      { id: 'tx-2-9', categoryId: 'poupanca', description: 'Depósito Poupança / Reserva CDB', amount: 1400, date: '2026-02-06', paymentMethod: 'pix' },
      // Negócios (Meta: 10% = 1348)
      { id: 'tx-2-10', categoryId: 'negocios', description: 'Consultoria de Tráfego Pago PJ', amount: 1200, investedAmount: 1200, returnAmount: 2100, date: '2026-02-12', paymentMethod: 'pix' },
    ],
    createdAt: '2026-02-01T00:00:00.000Z',
    updatedAt: '2026-02-25T00:00:00.000Z',
  },
  {
    id: '2026-03',
    year: 2026,
    month: 3,
    targets: { ...DEFAULT_TARGETS },
    incomes: [
      { id: 'inc-3-1', description: 'Salário CLT (Empresa Tech)', amount: 9500, date: '2026-03-05', sourceType: 'salario' },
      { id: 'inc-3-2', description: 'Projeto Freelance Next.js', amount: 4200, date: '2026-03-12', sourceType: 'freelance' },
      { id: 'inc-3-3', description: 'Proventos FIIs e Dividendos', amount: 510, date: '2026-03-15', sourceType: 'dividendos' },
    ],
    transactions: [
      // Despesas (Meta: 20% de 14210 = 2842)
      { id: 'tx-3-1', categoryId: 'despesas', description: 'Aluguel + Condomínio', amount: 1650, date: '2026-03-05', paymentMethod: 'pix', isRecurring: true },
      { id: 'tx-3-2', categoryId: 'despesas', description: 'Conta de Luz, Água e Banda Larga', amount: 420, date: '2026-03-10', paymentMethod: 'boleto', isRecurring: true },
      { id: 'tx-3-3', categoryId: 'despesas', description: 'Supermercado e Hortifruti', amount: 620, date: '2026-03-16', paymentMethod: 'cartao_credito' },
      // Investimento (Meta: 20% = 2842)
      { id: 'tx-3-4', categoryId: 'investimento', description: 'Aporte Ações Dividendos (BBAS3, ITUB4)', amount: 1900, date: '2026-03-09', paymentMethod: 'pix' },
      { id: 'tx-3-5', categoryId: 'investimento', description: 'Aporte Criptoativos & Tesouro Selic', amount: 1000, date: '2026-03-18', paymentMethod: 'pix' },
      // Conhecimento (Meta: 10% = 1421)
      { id: 'tx-3-6', categoryId: 'conhecimento', description: 'Mentoria de Engenharia de Software', amount: 1200, date: '2026-03-08', paymentMethod: 'cartao_credito' },
      { id: 'tx-3-7', categoryId: 'conhecimento', description: 'Livros O\'Reilly e Artigos', amount: 150, date: '2026-03-19', paymentMethod: 'cartao_credito' },
      // Doação (Meta: 10% = 1421)
      { id: 'tx-3-8', categoryId: 'doacao', description: 'Doação Mensal Projeto Acolher + Abrigo', amount: 1400, date: '2026-03-20', paymentMethod: 'pix' },
      // Poupança (Meta: 10% = 1421)
      { id: 'tx-3-9', categoryId: 'poupanca', description: 'Aporte Reserva Liquidez Imediata', amount: 1500, date: '2026-03-06', paymentMethod: 'pix' },
      // Negócios (Meta: 10% = 1421)
      { id: 'tx-3-10', categoryId: 'negocios', description: 'Lançamento de Infoproduto', amount: 1400, investedAmount: 1400, returnAmount: 2600, date: '2026-03-14', paymentMethod: 'pix' },
    ],
    createdAt: '2026-03-01T00:00:00.000Z',
    updatedAt: '2026-03-24T00:00:00.000Z',
  },
];

export const loadStoredMonths = (): MonthData[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      saveStoredMonths(INITIAL_SEED_MONTHS);
      return INITIAL_SEED_MONTHS;
    }
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      // Ensure all categories in targets exist
      return parsed.map((m: MonthData) => ({
        ...m,
        targets: {
          ...DEFAULT_TARGETS,
          ...(m.targets || {}),
        },
      }));
    }
    return INITIAL_SEED_MONTHS;
  } catch {
    return INITIAL_SEED_MONTHS;
  }
};

export const saveStoredMonths = (months: MonthData[]) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(months));
  } catch (err) {
    console.error('Failed to save to localStorage:', err);
  }
};

export const loadActiveMonthId = (availableMonths: MonthData[]): string => {
  try {
    const saved = localStorage.getItem(ACTIVE_MONTH_KEY);
    if (saved && availableMonths.some((m) => m.id === saved)) {
      return saved;
    }
    return availableMonths[availableMonths.length - 1]?.id || '2026-03';
  } catch {
    return availableMonths[availableMonths.length - 1]?.id || '2026-03';
  }
};

export const saveActiveMonthId = (monthId: string) => {
  try {
    localStorage.setItem(ACTIVE_MONTH_KEY, monthId);
  } catch (err) {
    console.error('Failed to save active month:', err);
  }
};

export const createNewMonthData = (
  year: number,
  month: number,
  sourceTargets?: CategoryTargets,
  copyRecurringStructure = false,
  previousMonth?: MonthData
): MonthData => {
  const id = `${year}-${String(month).padStart(2, '0')}`;
  const now = new Date().toISOString();

  // If duplicating recurring transactions structure without values (or with empty amounts)
  let initialTransactions = [];
  if (copyRecurringStructure && previousMonth) {
    // Only copy descriptions with zero/clean amount if requested
    initialTransactions = (previousMonth.transactions || [])
      .filter((t) => t.isRecurring)
      .map((t, idx) => ({
        id: `tx-${id}-dup-${idx + 1}`,
        categoryId: t.categoryId,
        description: t.description,
        amount: 0,
        date: `${id}-05`,
        paymentMethod: t.paymentMethod,
        isRecurring: true,
      }));
  }

  return {
    id,
    year,
    month,
    targets: sourceTargets ? { ...sourceTargets } : { ...DEFAULT_TARGETS },
    incomes: [],
    transactions: initialTransactions,
    createdAt: now,
    updatedAt: now,
  };
};

export const exportDataAsJSON = (months: MonthData[]) => {
  const dataStr = JSON.stringify(months, null, 2);
  const blob = new Blob([dataStr], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `finanflow-backup-${new Date().toISOString().slice(0, 10)}.json`;
  link.click();
  URL.revokeObjectURL(url);
};

export const exportMonthToCSV = (month: MonthData) => {
  const rows = [
    ['Tipo', 'Categoria', 'Descrição', 'Valor (R$)', 'Data', 'Meio de Pagamento', 'Recorrente'],
  ];

  month.incomes.forEach((inc) => {
    rows.push(['Renda', 'Entrada', `"${inc.description.replace(/"/g, '""')}"`, inc.amount.toFixed(2), inc.date || '', inc.sourceType || '', '']);
  });

  month.transactions.forEach((tx) => {
    rows.push([
      'Lançamento',
      tx.categoryId,
      `"${tx.description.replace(/"/g, '""')}"`,
      tx.amount.toFixed(2),
      tx.date || '',
      tx.paymentMethod || '',
      tx.isRecurring ? 'Sim' : 'Não',
    ]);
  });

  const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + rows.map((e) => e.join(';')).join('\n');
  const encodedUri = encodeURI(csvContent);
  const link = document.createElement('a');
  link.setAttribute('href', encodedUri);
  link.setAttribute('download', `finanflow-${month.id}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};
