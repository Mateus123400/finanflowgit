import * as XLSX from 'xlsx';
import { AssetItem, LiabilityItem, MonthData, IncomeActivity } from '../types';
import { calculateMonthSummary, calculatePatrimonioEvolution, calculateNetWorthSummary } from './calculations';
import { CATEGORIES_CONFIG } from './constants';

const MONTH_NAMES_FULL = [
  'Janeiro',
  'Fevereiro',
  'Março',
  'Abril',
  'Maio',
  'Junho',
  'Julho',
  'Agosto',
  'Setembro',
  'Outubro',
  'Novembro',
  'Dezembro',
];

const ASSET_TYPE_LABELS: Record<string, string> = {
  conta: 'Dinheiro / Conta Corrente',
  poupanca: 'Poupança',
  investimento: 'Investimentos Gerais',
  acoes: 'Ações',
  fiis: 'FIIs (Fundos Imobiliários)',
  tesouro: 'Tesouro Direto / Renda Fixa',
  cripto: 'Criptomoedas',
  imovel: 'Imóvel',
  veiculo: 'Veículo',
  negocio: 'Negócio / Participação',
  outro: 'Outro Ativo',
};

const LIABILITY_TYPE_LABELS: Record<string, string> = {
  financiamento: 'Financiamento',
  emprestimo: 'Empréstimo',
  divida: 'Dívida / Pendência',
  parcelamento: 'Parcelamento',
  outro: 'Outro Passivo',
};

const PAYMENT_METHOD_LABELS: Record<string, string> = {
  pix: 'PIX',
  cartao_credito: 'Cartão de Crédito',
  cartao_debito: 'Cartão de Débito',
  boleto: 'Boleto Bancário',
  dinheiro: 'Dinheiro em Espécie',
};

interface ExportYearOptions {
  year: number;
  allMonths: MonthData[];
  assets: AssetItem[];
  liabilities: LiabilityItem[];
  activities?: IncomeActivity[];
}

export function exportAnnualReportToExcel({
  year,
  allMonths,
  assets,
  liabilities,
  activities = [],
}: ExportYearOptions) {
  const yearMonths = allMonths
    .filter((m) => m.year === year)
    .sort((a, b) => a.month - b.month);

  const wb = XLSX.utils.book_new();

  // ─────────────────────────────────────────────────────────────
  // 1. ABA 1 — RESUMO ANUAL
  // ─────────────────────────────────────────────────────────────
  let totalIncomeAnual = 0;
  let activeIncomeAnual = 0;
  let passiveIncomeAnual = 0;
  let totalSpentAnual = 0;
  let totalDespesasAnual = 0;
  let totalInvestimentoAnual = 0;
  let totalPoupancaAnual = 0;
  let totalConhecimentoAnual = 0;
  let totalDoacaoAnual = 0;
  let totalNegociosAnual = 0;
  let totalNegociosProfitAnual = 0;
  let totalBalanceAnual = 0;

  const monthlySummaries = yearMonths.map((m) => {
    const summary = calculateMonthSummary(m, activities);
    totalIncomeAnual += summary.totalIncome;
    activeIncomeAnual += summary.activeIncome;
    passiveIncomeAnual += summary.passiveIncome;
    totalSpentAnual += summary.totalExpensesAndAllocations;
    totalDespesasAnual += summary.categories.despesas?.actualAmount || 0;
    totalInvestimentoAnual += summary.categories.investimento?.actualAmount || 0;
    totalPoupancaAnual += summary.categories.poupanca?.actualAmount || 0;
    totalConhecimentoAnual += summary.categories.conhecimento?.actualAmount || 0;
    totalDoacaoAnual += summary.categories.doacao?.actualAmount || 0;
    totalNegociosAnual += summary.categories.negocios?.actualAmount || 0;
    totalNegociosProfitAnual += summary.businessNetProfit;
    totalBalanceAnual += summary.remainingBalance;

    return {
      monthNum: m.month,
      monthName: MONTH_NAMES_FULL[m.month - 1],
      summary,
    };
  });

  const totalAportesAnual = totalInvestimentoAnual + totalPoupancaAnual;
  const avgSavingsRate = totalIncomeAnual > 0 ? (totalAportesAnual / totalIncomeAnual) * 100 : 0;

  // Evolução Patrimonial
  const patrimonioEvol = calculatePatrimonioEvolution(allMonths, assets, liabilities, activities);
  const netWorthSummary = calculateNetWorthSummary(assets, liabilities);

  const sheet1Data: (string | number)[][] = [
    ['FINANFLOW — RELATÓRIO ANUAL CONSOLIDADO', '', '', '', '', '', '', '', '', '', '', '', ''],
    [`Ano Base: ${year}`, `Exportado em: ${new Date().toLocaleDateString('pt-BR')} às ${new Date().toLocaleTimeString('pt-BR')}`, '', '', '', '', '', '', '', '', '', '', ''],
    [],
    ['=== INDICADORES CHAVE DO ANO ===', 'VALOR (R$)', 'OBSERVAÇÃO / COMPOSIÇÃO'],
    ['Renda Total Anual', totalIncomeAnual, '100% da receita recebida'],
    ['  ├── Renda Ativa (Salários, Projetos, Freelance)', activeIncomeAnual, `${totalIncomeAnual > 0 ? ((activeIncomeAnual / totalIncomeAnual) * 100).toFixed(1) : 0}% da renda`],
    ['  └── Renda Passiva (Dividendos, Rendimentos)', passiveIncomeAnual, `${totalIncomeAnual > 0 ? ((passiveIncomeAnual / totalIncomeAnual) * 100).toFixed(1) : 0}% da renda`],
    ['Total de Despesas Operacionais', totalDespesasAnual, `${totalIncomeAnual > 0 ? ((totalDespesasAnual / totalIncomeAnual) * 100).toFixed(1) : 0}% da renda`],
    ['Total de Aportes & Investimentos (Crescimento)', totalAportesAnual, `${totalIncomeAnual > 0 ? ((totalAportesAnual / totalIncomeAnual) * 100).toFixed(1) : 0}% da renda (Investimento + Poupança)`],
    ['  ├── Aportes em Investimentos', totalInvestimentoAnual, 'Ações, FIIs, Tesouro, Cripto'],
    ['  └── Aportes em Poupança / Reserva', totalPoupancaAnual, 'Reserva de Emergência / Liquidez'],
    ['Total em Conhecimento & Educação', totalConhecimentoAnual, `${totalIncomeAnual > 0 ? ((totalConhecimentoAnual / totalIncomeAnual) * 100).toFixed(1) : 0}% da renda`],
    ['Total em Doações & Impacto', totalDoacaoAnual, `${totalIncomeAnual > 0 ? ((totalDoacaoAnual / totalIncomeAnual) * 100).toFixed(1) : 0}% da renda`],
    ['Alocação em Negócios / Empreendimentos', totalNegociosAnual, 'Capital alocado'],
    ['Resultado Líquido dos Negócios (Lucro/Retorno)', totalNegociosProfitAnual, 'Retornos − Investimentos em negócios'],
    ['Saldo Acumulado no Período', totalBalanceAnual, 'Renda Total − Total Alocado'],
    ['Taxa Média de Crescimento (Inv + Poupança)', `${avgSavingsRate.toFixed(1)}%`, 'Percentual médio poupado/investido da renda'],
    ['Patrimônio Inicial Registrado', patrimonioEvol.initialNetWorth, 'Base inicial da série histórica'],
    ['Patrimônio Final / Atual', patrimonioEvol.finalNetWorth, 'Ativos Totais − Passivos Totais'],
    ['Evolução Patrimonial Total (R$)', patrimonioEvol.totalVariation, `Crescimento de ${patrimonioEvol.totalGrowthPercent.toFixed(1)}% no período`],
    [],
    ['=== DETALHAMENTO MENSAL ===', '', '', '', '', '', '', '', '', '', '', '', ''],
    [
      'Mês',
      'Renda Ativa (R$)',
      'Renda Passiva (R$)',
      'Renda Total (R$)',
      'Despesas (R$)',
      'Investimento (R$)',
      'Poupança (R$)',
      'Conhecimento (R$)',
      'Doação (R$)',
      'Negócios (R$)',
      'Total Alocado (R$)',
      'Saldo do Mês (R$)',
      'Taxa Inv+Poup (%)',
    ],
  ];

  // Fill all 12 months
  for (let mIdx = 1; mIdx <= 12; mIdx++) {
    const monthName = MONTH_NAMES_FULL[mIdx - 1];
    const item = monthlySummaries.find((s) => s.monthNum === mIdx);

    if (item) {
      const s = item.summary;
      sheet1Data.push([
        monthName,
        s.activeIncome,
        s.passiveIncome,
        s.totalIncome,
        s.categories.despesas?.actualAmount || 0,
        s.categories.investimento?.actualAmount || 0,
        s.categories.poupanca?.actualAmount || 0,
        s.categories.conhecimento?.actualAmount || 0,
        s.categories.doacao?.actualAmount || 0,
        s.categories.negocios?.actualAmount || 0,
        s.totalExpensesAndAllocations,
        s.remainingBalance,
        `${s.investmentAndSavingsRate.toFixed(1)}%`,
      ]);
    } else {
      sheet1Data.push([
        monthName,
        0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, '0.0%',
      ]);
    }
  }

  // Totals row
  sheet1Data.push([
    `TOTAL ANUAL ${year}`,
    activeIncomeAnual,
    passiveIncomeAnual,
    totalIncomeAnual,
    totalDespesasAnual,
    totalInvestimentoAnual,
    totalPoupancaAnual,
    totalConhecimentoAnual,
    totalDoacaoAnual,
    totalNegociosAnual,
    totalSpentAnual,
    totalBalanceAnual,
    `${avgSavingsRate.toFixed(1)}%`,
  ]);

  const ws1 = XLSX.utils.aoa_to_sheet(sheet1Data);

  ws1['!cols'] = [
    { wch: 20 },
    { wch: 18 },
    { wch: 18 },
    { wch: 18 },
    { wch: 16 },
    { wch: 18 },
    { wch: 16 },
    { wch: 18 },
    { wch: 16 },
    { wch: 16 },
    { wch: 18 },
    { wch: 18 },
    { wch: 18 },
  ];

  XLSX.utils.book_append_sheet(wb, ws1, 'Resumo Anual');

  // ─────────────────────────────────────────────────────────────
  // 2. ABA 2 — DESPESAS DETALHADAS
  // ─────────────────────────────────────────────────────────────
  interface ExpenseRow {
    date: string;
    monthName: string;
    description: string;
    category: string;
    categoryKey: string;
    subcategory: string;
    amount: number;
    paymentMethod: string;
    notes: string;
  }

  const allExpenses: ExpenseRow[] = [];
  const categoryTotals: Record<string, { label: string; amount: number; count: number }> = {
    despesas: { label: 'Despesas Essenciais & Estilo de Vida', amount: 0, count: 0 },
    conhecimento: { label: 'Conhecimento & Educação', amount: 0, count: 0 },
    doacao: { label: 'Doação & Impacto', amount: 0, count: 0 },
    investimento: { label: 'Investimentos & Aportes', amount: 0, count: 0 },
    poupanca: { label: 'Poupança & Reserva', amount: 0, count: 0 },
    negocios: { label: 'Negócios & Projetos', amount: 0, count: 0 },
  };

  yearMonths.forEach((m) => {
    const monthName = MONTH_NAMES_FULL[m.month - 1];
    (m.transactions || []).forEach((tx) => {
      const catConfig = CATEGORIES_CONFIG[tx.categoryId];
      const catLabel = catConfig ? catConfig.name : tx.categoryId;
      const amt = Number(tx.amount) || 0;

      if (!categoryTotals[tx.categoryId]) {
        categoryTotals[tx.categoryId] = { label: catLabel, amount: 0, count: 0 };
      }
      categoryTotals[tx.categoryId].amount += amt;
      categoryTotals[tx.categoryId].count += 1;

      let subcategory = '';
      if (tx.activityId) {
        const act = activities.find((a) => a.id === tx.activityId);
        if (act) subcategory = act.name;
      }

      allExpenses.push({
        date: tx.date || `${m.id}-01`,
        monthName,
        description: tx.description,
        category: catLabel,
        categoryKey: tx.categoryId,
        subcategory: subcategory || (tx.notes ? tx.notes.slice(0, 30) : 'Geral'),
        amount: amt,
        paymentMethod: tx.paymentMethod ? (PAYMENT_METHOD_LABELS[tx.paymentMethod] || tx.paymentMethod) : 'Não informado',
        notes: tx.notes || '',
      });
    });
  });

  allExpenses.sort((a, b) => a.date.localeCompare(b.date));

  const totalGeralDespesas = allExpenses.reduce((acc, curr) => acc + curr.amount, 0);

  let maxExpense: ExpenseRow | null = null;
  allExpenses.forEach((exp) => {
    if (!maxExpense || exp.amount > maxExpense.amount) {
      maxExpense = exp;
    }
  });

  let topCategoryName = '';
  let topCategoryAmount = 0;
  Object.values(categoryTotals).forEach((c) => {
    if (c.amount > topCategoryAmount) {
      topCategoryAmount = c.amount;
      topCategoryName = c.label;
    }
  });

  let topMonthName = '';
  let topMonthAmount = 0;
  monthlySummaries.forEach((ms) => {
    if (ms.summary.totalExpensesAndAllocations > topMonthAmount) {
      topMonthAmount = ms.summary.totalExpensesAndAllocations;
      topMonthName = ms.monthName;
    }
  });

  const avgMonthlySpending = yearMonths.length > 0 ? totalGeralDespesas / yearMonths.length : 0;

  const sheet2Data: (string | number)[][] = [
    ['FINANFLOW — DESPESAS DETALHADAS LINHA A LINHA', '', '', '', '', '', '', ''],
    [`Ano: ${year}`, `Total de Lançamentos: ${allExpenses.length}`, `Total Geral Gasto: R$ ${totalGeralDespesas.toFixed(2)}`, '', '', '', '', ''],
    [],
    ['=== RESPOSTAS RÁPIDAS & ANÁLISE DE GASTOS ===', '', '', '', '', '', '', ''],
    ['Quanto gastei no ano no total?', totalGeralDespesas, 'Soma de todos os lançamentos do ano'],
    ['Qual foi minha maior despesa individual?', maxExpense ? maxExpense.amount : 0, maxExpense ? `${maxExpense.description} (${maxExpense.date})` : '—'],
    ['Em qual categoria gastei mais?', topCategoryAmount, `${topCategoryName} (${totalGeralDespesas > 0 ? ((topCategoryAmount / totalGeralDespesas) * 100).toFixed(1) : 0}% do total)`],
    ['Qual a média mensal de gastos?', avgMonthlySpending, 'Média por mês com movimentação'],
    ['Qual mês teve maior volume de gastos?', topMonthAmount, `${topMonthName} (${year})`],
    [],
    ['=== RESUMO DE DESPESAS POR CATEGORIA ===', 'VALOR TOTAL (R$)', '% DO TOTAL', 'QTD LANÇAMENTOS'],
  ];

  Object.entries(categoryTotals).forEach(([, catData]) => {
    const pctShare = totalGeralDespesas > 0 ? (catData.amount / totalGeralDespesas) * 100 : 0;
    sheet2Data.push([
      catData.label,
      catData.amount,
      `${pctShare.toFixed(1)}%`,
      catData.count,
    ]);
  });

  sheet2Data.push([
    'TOTAL GERAL CONSOLIDADO',
    totalGeralDespesas,
    '100.0%',
    allExpenses.length,
  ]);

  sheet2Data.push([]);
  sheet2Data.push(['=== REGISTRO DETALHADO DE TODAS AS DESPESAS (LINHA A LINHA) ===', '', '', '', '', '', '', '']);
  sheet2Data.push([
    'Data',
    'Mês de Referência',
    'Descrição',
    'Categoria',
    'Subcategoria / Detalhe',
    'Valor (R$)',
    'Forma de Pagamento',
    'Observações',
  ]);

  if (allExpenses.length === 0) {
    sheet2Data.push(['—', '—', 'Nenhum lançamento registrado neste ano', '—', '—', 0, '—', '—']);
  } else {
    allExpenses.forEach((exp) => {
      sheet2Data.push([
        exp.date,
        exp.monthName,
        exp.description,
        exp.category,
        exp.subcategory,
        exp.amount,
        exp.paymentMethod,
        exp.notes,
      ]);
    });
  }

  sheet2Data.push([]);
  sheet2Data.push([
    'TOTAL DE DESPESAS',
    '',
    '',
    '',
    '',
    totalGeralDespesas,
    '',
    `${allExpenses.length} lançamento(s) no ano`,
  ]);

  const ws2 = XLSX.utils.aoa_to_sheet(sheet2Data);

  ws2['!cols'] = [
    { wch: 12 },
    { wch: 18 },
    { wch: 35 },
    { wch: 25 },
    { wch: 22 },
    { wch: 16 },
    { wch: 20 },
    { wch: 35 },
  ];

  XLSX.utils.book_append_sheet(wb, ws2, 'Despesas Detalhadas');

  // ─────────────────────────────────────────────────────────────
  // 3. ABA 3 — PATRIMÔNIO & ATIVOS
  // ─────────────────────────────────────────────────────────────
  const sheet3Data: (string | number)[][] = [
    ['FINANFLOW — BALANÇO PATRIMONIAL & EVOLUÇÃO DE RIQUEZA', '', '', '', ''],
    [`Posição Atual em: ${new Date().toLocaleDateString('pt-BR')}`, '', '', '', ''],
    [],
    ['=== RESUMO PATRIMONIAL ATUAL ===', 'VALOR (R$)', 'PROPORÇÃO (%)'],
    ['Total de Ativos (Bens & Direitos)', netWorthSummary.totalAssets, '100% da base ativa'],
    ['Total de Passivos (Dívidas & Obrigações)', netWorthSummary.totalLiabilities, `${netWorthSummary.totalAssets > 0 ? ((netWorthSummary.totalLiabilities / netWorthSummary.totalAssets) * 100).toFixed(1) : 0}% dos ativos`],
    ['Patrimônio Líquido Real (Ativos − Passivos)', netWorthSummary.netWorth, 'Riqueza líquida consolidada'],
    [],
    ['=== ATIVOS PATRIMONIAIS CADASTRADOS ===', '', '', '', ''],
    ['Nome do Ativo', 'Tipo / Categoria', 'Valor Atual (R$)', 'Data Avaliação', 'Observações'],
  ];

  if (assets.length === 0) {
    sheet3Data.push(['Nenhum ativo cadastrado', '—', 0, '—', '—']);
  } else {
    assets.forEach((a) => {
      sheet3Data.push([
        a.name,
        ASSET_TYPE_LABELS[a.type] || a.type,
        a.currentValue,
        a.valuationDate,
        a.notes || '',
      ]);
    });
  }

  sheet3Data.push([
    'TOTAL DE ATIVOS',
    '',
    netWorthSummary.totalAssets,
    '',
    `${assets.length} item(ns) cadastrado(s)`,
  ]);

  sheet3Data.push([]);
  sheet3Data.push(['=== PASSIVOS & DÍVIDAS CADASTRADAS ===', '', '', '', '']);
  sheet3Data.push(['Nome da Obrigação', 'Tipo / Categoria', 'Saldo Devedor (R$)', 'Data Avaliação', 'Observações']);

  if (liabilities.length === 0) {
    sheet3Data.push(['Nenhum passivo ou dívida cadastrada', '—', 0, '—', 'Livre de dívidas']);
  } else {
    liabilities.forEach((l) => {
      sheet3Data.push([
        l.name,
        LIABILITY_TYPE_LABELS[l.type] || l.type,
        l.currentValue,
        l.valuationDate,
        l.notes || '',
      ]);
    });
  }

  sheet3Data.push([
    'TOTAL DE PASSIVOS',
    '',
    netWorthSummary.totalLiabilities,
    '',
    `${liabilities.length} compromisso(s)`,
  ]);

  sheet3Data.push([]);
  sheet3Data.push(['=== EVOLUÇÃO HISTÓRICA DO PATRIMÔNIO LÍQUIDO MÊS A MÊS ===', '', '', '', '']);
  sheet3Data.push([
    'Mês / Ano',
    'Patrimônio Líquido (R$)',
    'Variação Mensal (R$)',
    'Variação (%)',
    'Aportes Acumulados (R$)',
  ]);

  patrimonioEvol.points.forEach((pt) => {
    sheet3Data.push([
      pt.label,
      pt.netWorth,
      pt.monthlyVariation,
      `${pt.monthlyVariationPct >= 0 ? '+' : ''}${pt.monthlyVariationPct.toFixed(1)}%`,
      pt.totalInvestedCumulative + pt.totalSavingsCumulative,
    ]);
  });

  sheet3Data.push([
    'VARIAÇÃO TOTAL ACUMULADA',
    patrimonioEvol.finalNetWorth,
    patrimonioEvol.totalVariation,
    `${patrimonioEvol.totalGrowthPercent >= 0 ? '+' : ''}${patrimonioEvol.totalGrowthPercent.toFixed(1)}%`,
    '',
  ]);

  const ws3 = XLSX.utils.aoa_to_sheet(sheet3Data);

  ws3['!cols'] = [
    { wch: 30 },
    { wch: 25 },
    { wch: 20 },
    { wch: 15 },
    { wch: 35 },
  ];

  XLSX.utils.book_append_sheet(wb, ws3, 'Patrimônio & Ativos');

  const fileName = `FinanFlow-Relatorio-Anual-${year}.xlsx`;
  XLSX.writeFile(wb, fileName, { bookType: 'xlsx', type: 'binary' });
}
