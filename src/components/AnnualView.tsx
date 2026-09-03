import React, { useState, useMemo } from 'react';
import {
  CalendarDays,
  TrendingUp,
  Download,
  ChevronLeft,
  ChevronRight,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
  BarChart2,
  DollarSign,
  PiggyBank,
  Wallet,
  FileText,
  FileSpreadsheet,
  Landmark,
  CheckCircle2,
  Building2,
  Sparkles,
} from 'lucide-react';
import { MonthData, AssetItem, LiabilityItem, IncomeActivity } from '../types';
import { calculateMonthSummary, calculatePatrimonioEvolution, calculateNetWorthSummary } from '../utils/calculations';
import { exportAnnualReportToExcel } from '../utils/excelExport';

const MONTH_NAMES_SHORT = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
const MONTH_NAMES_FULL = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];

const CATEGORY_LABELS: Record<string, { label: string; color: string }> = {
  despesas:     { label: 'Despesas',     color: '#f87171' },
  investimento: { label: 'Investimento', color: '#60a5fa' },
  conhecimento: { label: 'Conhecimento', color: '#a78bfa' },
  doacao:       { label: 'Doação',       color: '#34d399' },
  poupanca:     { label: 'Poupança',     color: '#fbbf24' },
  negocios:     { label: 'Negócios',     color: '#fb923c' },
};

const fmt = (v: number) =>
  v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 2 });

const pct = (v: number) => `${v >= 0 ? '+' : ''}${v.toFixed(1)}%`;

interface AnnualViewProps {
  allMonths: MonthData[];
  assets?: AssetItem[];
  liabilities?: LiabilityItem[];
  activities?: IncomeActivity[];
}

interface YearStats {
  year: number;
  months: {
    monthNum: number;
    label: string;
    totalIncome: number;
    activeIncome: number;
    passiveIncome: number;
    totalSpent: number;
    balance: number;
    savingsRate: number;
    categories: Record<string, number>;
  }[];
  totalIncome: number;
  activeIncome: number;
  passiveIncome: number;
  totalSpent: number;
  totalDespesas: number;
  totalInvestimento: number;
  totalPoupanca: number;
  totalAportes: number;
  totalConhecimento: number;
  totalDoacao: number;
  totalNegocios: number;
  totalNegociosProfit: number;
  totalBalance: number;
  avgSavingsRate: number;
}

function buildYearStats(year: number, allMonths: MonthData[], activities: IncomeActivity[] = []): YearStats {
  const yearMonths = allMonths
    .filter((m) => m.year === year)
    .sort((a, b) => a.month - b.month);

  let totalIncome = 0;
  let activeIncome = 0;
  let passiveIncome = 0;
  let totalSpent = 0;
  let totalDespesas = 0;
  let totalInvestimento = 0;
  let totalPoupanca = 0;
  let totalConhecimento = 0;
  let totalDoacao = 0;
  let totalNegocios = 0;
  let totalNegociosProfit = 0;
  let totalBalance = 0;
  let savingsRateSum = 0;

  const months = yearMonths.map((m) => {
    const summary = calculateMonthSummary(m, activities);
    totalIncome += summary.totalIncome;
    activeIncome += summary.activeIncome;
    passiveIncome += summary.passiveIncome;
    totalSpent += summary.totalExpensesAndAllocations;
    totalDespesas += summary.categories.despesas?.actualAmount || 0;
    totalInvestimento += summary.categories.investimento?.actualAmount || 0;
    totalPoupanca += summary.categories.poupanca?.actualAmount || 0;
    totalConhecimento += summary.categories.conhecimento?.actualAmount || 0;
    totalDoacao += summary.categories.doacao?.actualAmount || 0;
    totalNegocios += summary.categories.negocios?.actualAmount || 0;
    totalNegociosProfit += summary.businessNetProfit;
    totalBalance += summary.remainingBalance;
    savingsRateSum += summary.investmentAndSavingsRate;

    const categories: Record<string, number> = {};
    Object.entries(summary.categories).forEach(([catId, calc]) => {
      categories[catId] = calc.actualAmount;
    });

    return {
      monthNum: m.month,
      label: MONTH_NAMES_FULL[m.month - 1],
      totalIncome: summary.totalIncome,
      activeIncome: summary.activeIncome,
      passiveIncome: summary.passiveIncome,
      totalSpent: summary.totalExpensesAndAllocations,
      balance: summary.remainingBalance,
      savingsRate: summary.investmentAndSavingsRate,
      categories,
    };
  });

  const totalAportes = totalInvestimento + totalPoupanca;

  return {
    year,
    months,
    totalIncome,
    activeIncome,
    passiveIncome,
    totalSpent,
    totalDespesas,
    totalInvestimento,
    totalPoupanca,
    totalAportes,
    totalConhecimento,
    totalDoacao,
    totalNegocios,
    totalNegociosProfit,
    totalBalance,
    avgSavingsRate: yearMonths.length > 0 ? savingsRateSum / yearMonths.length : 0,
  };
}

function DeltaBadge({ current, previous }: { current: number; previous: number }) {
  if (previous === 0) return null;
  const delta = ((current - previous) / Math.abs(previous)) * 100;
  if (Math.abs(delta) < 0.1) return <span className="text-slate-500 text-[10px] flex items-center gap-0.5"><Minus className="w-2.5 h-2.5" />0%</span>;
  const up = delta > 0;
  return (
    <span className={`text-[10px] flex items-center gap-0.5 font-medium ${up ? 'text-emerald-400' : 'text-rose-400'}`}>
      {up ? <ArrowUpRight className="w-2.5 h-2.5" /> : <ArrowDownRight className="w-2.5 h-2.5" />}
      {pct(delta)}
    </span>
  );
}

export function AnnualView({
  allMonths,
  assets = [],
  liabilities = [],
  activities = [],
}: AnnualViewProps) {
  const availableYears = useMemo(() => {
    const yrs = [...new Set(allMonths.map((m) => m.year))].sort();
    return yrs.length > 0 ? yrs : [new Date().getFullYear()];
  }, [allMonths]);

  const [selectedYear, setSelectedYear] = useState<number>(
    availableYears[availableYears.length - 1]
  );

  const curStats = useMemo(() => buildYearStats(selectedYear, allMonths, activities), [selectedYear, allMonths, activities]);
  const prevStats = useMemo(() => buildYearStats(selectedYear - 1, allMonths, activities), [selectedYear, allMonths, activities]);

  // Evolução Patrimonial
  const patrimonioEvol = useMemo(() => {
    return calculatePatrimonioEvolution(allMonths, assets, liabilities, activities);
  }, [allMonths, assets, liabilities, activities]);

  const netWorthSummary = useMemo(() => {
    return calculateNetWorthSummary(assets, liabilities);
  }, [assets, liabilities]);

  const hasPrev = availableYears.includes(selectedYear - 1);
  const hasNext = availableYears.includes(selectedYear + 1);

  // ---------- Excel / Google Sheets XLSX Export ----------
  const handleExportXLSX = () => {
    exportAnnualReportToExcel({
      year: selectedYear,
      allMonths,
      assets,
      liabilities,
      activities,
    });
  };

  // ---------- CSV Export ----------
  const handleExportCSV = () => {
    const headers = [
      'Mês', 'Renda Ativa (R$)', 'Renda Passiva (R$)', 'Renda Total (R$)', 'Total Alocado (R$)', 'Saldo (R$)', 'Taxa Poupança/Invest (%)',
      'Despesas (R$)', 'Investimento (R$)', 'Conhecimento (R$)', 'Doação (R$)', 'Poupança (R$)', 'Negócios (R$)',
    ];
    const rows = curStats.months.map((m) => [
      m.label,
      m.activeIncome.toFixed(2), m.passiveIncome.toFixed(2),
      m.totalIncome.toFixed(2), m.totalSpent.toFixed(2), m.balance.toFixed(2), m.savingsRate.toFixed(1),
      (m.categories.despesas||0).toFixed(2),(m.categories.investimento||0).toFixed(2),
      (m.categories.conhecimento||0).toFixed(2),(m.categories.doacao||0).toFixed(2),
      (m.categories.poupanca||0).toFixed(2),(m.categories.negocios||0).toFixed(2),
    ]);
    rows.push([
      `TOTAL ${selectedYear}`,
      curStats.activeIncome.toFixed(2), curStats.passiveIncome.toFixed(2),
      curStats.totalIncome.toFixed(2),curStats.totalSpent.toFixed(2),curStats.totalBalance.toFixed(2),curStats.avgSavingsRate.toFixed(1),
      curStats.totalDespesas.toFixed(2),
      curStats.totalInvestimento.toFixed(2),
      curStats.totalConhecimento.toFixed(2),
      curStats.totalDoacao.toFixed(2),
      curStats.totalPoupanca.toFixed(2),
      curStats.totalNegocios.toFixed(2),
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers,...rows].map(r=>r.join(';')).join('\n');
    const link = document.createElement('a');
    link.setAttribute('href', encodeURI(csvContent));
    link.setAttribute('download', `FinanFlow-Relatorio-Anual-${selectedYear}.csv`);
    document.body.appendChild(link); link.click(); document.body.removeChild(link);
  };

  // ---------- PDF Export ----------
  const handleExportPDF = () => {
    const MONTHS_PT = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'];
    const MONTHS_FULL = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];

    const rows = MONTHS_FULL.map((name, idx) => {
      const m = curStats.months.find(x => x.monthNum === idx + 1);
      if (!m) return `<tr><td style="color:#666">${MONTHS_PT[idx]}</td><td colspan="10" style="color:#666;text-align:center;font-style:italic">— sem dados —</td></tr>`;
      const bal = m.balance >= 0 ? `<span style="color:#059669">${fmt(m.balance)}</span>` : `<span style="color:#dc2626">${fmt(m.balance)}</span>`;
      return `<tr>
        <td><strong>${name}</strong></td>
        <td style="color:#16a34a">${fmt(m.totalIncome)}</td>
        <td style="color:#2563eb">${fmt(m.totalSpent)}</td>
        <td style="color:#dc2626">${fmt(m.categories.despesas||0)}</td>
        <td style="color:#0ea5e9">${fmt(m.categories.investimento||0)}</td>
        <td style="color:#7c3aed">${fmt(m.categories.conhecimento||0)}</td>
        <td style="color:#0d9488">${fmt(m.categories.doacao||0)}</td>
        <td style="color:#d97706">${fmt(m.categories.poupanca||0)}</td>
        <td style="color:#ea580c">${fmt(m.categories.negocios||0)}</td>
        <td>${bal}</td>
        <td style="color:#7c3aed">${m.savingsRate.toFixed(1)}%</td>
      </tr>`;
    }).join('');

    const totalsRow = `<tr style="background:#f1f5f9;font-weight:bold;font-size:13px">
      <td>TOTAL ${selectedYear}</td>
      <td style="color:#16a34a">${fmt(curStats.totalIncome)}</td>
      <td style="color:#2563eb">${fmt(curStats.totalSpent)}</td>
      <td style="color:#dc2626">${fmt(curStats.totalDespesas)}</td>
      <td style="color:#0ea5e9">${fmt(curStats.totalInvestimento)}</td>
      <td style="color:#7c3aed">${fmt(curStats.totalConhecimento)}</td>
      <td style="color:#0d9488">${fmt(curStats.totalDoacao)}</td>
      <td style="color:#d97706">${fmt(curStats.totalPoupanca)}</td>
      <td style="color:#ea580c">${fmt(curStats.totalNegocios)}</td>
      <td style="color:${curStats.totalBalance>=0?'#059669':'#dc2626'}">${fmt(curStats.totalBalance)}</td>
      <td style="color:#7c3aed">${curStats.avgSavingsRate.toFixed(1)}%</td>
    </tr>`;

    const html = `<!DOCTYPE html><html lang="pt-BR"><head>
      <meta charset="UTF-8">
      <title>FinanFlow – Relatório Anual ${selectedYear}</title>
      <style>
        * { margin:0; padding:0; box-sizing:border-box; }
        body { font-family: 'Segoe UI', Arial, sans-serif; font-size: 11px; color: #1e293b; background: #fff; padding: 24px; }
        h1 { font-size: 22px; color: #1e3a8a; margin-bottom: 4px; }
        .subtitle { color: #64748b; font-size: 12px; margin-bottom: 20px; }
        .cards { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin-bottom: 20px; }
        .card { border: 1px solid #e2e8f0; border-radius: 8px; padding: 12px; }
        .card-label { font-size: 10px; color: #64748b; margin-bottom: 4px; }
        .card-value { font-size: 16px; font-weight: 700; }
        table { width: 100%; border-collapse: collapse; font-size: 10.5px; }
        th { background: #1e3a8a; color: white; padding: 7px 8px; text-align: left; white-space: nowrap; }
        td { padding: 6px 8px; border-bottom: 1px solid #e2e8f0; white-space: nowrap; }
        tr:nth-child(even) td { background: #f8fafc; }
        @media print {
          body { padding: 12px; }
          .card { page-break-inside: avoid; }
          table { page-break-inside: auto; }
          tr { page-break-inside: avoid; }
        }
      </style>
    </head><body>
      <h1>FinanFlow – Relatório Anual ${selectedYear}</h1>
      <p class="subtitle">Gerado em ${new Date().toLocaleDateString('pt-BR', {day:'2-digit',month:'long',year:'numeric'})} às ${new Date().toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit'})}</p>
      <div class="cards">
        <div class="card"><div class="card-label">Renda Total Anual</div><div class="card-value" style="color:#16a34a">${fmt(curStats.totalIncome)}</div></div>
        <div class="card"><div class="card-label">Total Alocado</div><div class="card-value" style="color:#2563eb">${fmt(curStats.totalSpent)}</div></div>
        <div class="card"><div class="card-label">Saldo Acumulado</div><div class="card-value" style="color:${curStats.totalBalance>=0?'#16a34a':'#dc2626'}">${fmt(curStats.totalBalance)}</div></div>
        <div class="card"><div class="card-label">Taxa Inv+Poup Média</div><div class="card-value" style="color:#7c3aed">${curStats.avgSavingsRate.toFixed(1)}%</div></div>
      </div>
      <table>
        <thead><tr>
          <th>Mês</th><th>Renda</th><th>Alocado</th><th>Despesas</th>
          <th>Invest.</th><th>Conhec.</th><th>Doação</th><th>Poupança</th><th>Negócios</th><th>Saldo</th><th>Inv+Poup%</th>
        </tr></thead>
        <tbody>${rows}</tbody>
        <tfoot>${totalsRow}</tfoot>
      </table>
    </body></html>`;

    const w = window.open('', '_blank', 'width=1100,height=800');
    if (!w) return;
    w.document.write(html);
    w.document.close();
    w.onload = () => { w.focus(); w.print(); };
  };

  const maxIncome = Math.max(...curStats.months.map((m) => m.totalIncome), 1);

  if (allMonths.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-slate-500 gap-3">
        <CalendarDays className="w-10 h-10 opacity-30" />
        <p className="text-sm">Nenhum dado disponível. Crie seu primeiro mês para ver o relatório anual.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-300">
      {/* ─── Header ─── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <BarChart2 className="w-5 h-5 text-blue-400" />
            Relatório Anual & Fechamento Consolidado
          </h2>
          <p className="text-sm text-slate-400 mt-0.5">
            Visão consolidada de receitas, despesas, aportes e evolução patrimonial de {selectedYear}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          {/* Year navigator */}
          <div className="flex items-center gap-1 bg-slate-900 border border-slate-800 rounded-xl px-1 py-1">
            <button
              id="annual-prev-year-btn"
              onClick={() => hasPrev && setSelectedYear(selectedYear - 1)}
              disabled={!hasPrev}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 disabled:opacity-30 transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="px-3 text-sm font-bold text-white min-w-[60px] text-center">
              {selectedYear}
            </span>
            <button
              id="annual-next-year-btn"
              onClick={() => hasNext && setSelectedYear(selectedYear + 1)}
              disabled={!hasNext}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 disabled:opacity-30 transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Botão de Exportação XLSX Multi-Abas */}
          <button
            id="annual-export-xlsx-btn"
            onClick={handleExportXLSX}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-emerald-300 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 rounded-xl shadow-lg shadow-emerald-950/20 transition-all group"
            title="Exportar pasta de trabalho XLSX com Resumo Anual, Despesas Detalhadas linha a linha e Patrimônio (100% compatível com Google Sheets)"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-400 group-hover:scale-110 transition-transform" />
            <span>Exportar XLSX (Google Sheets)</span>
          </button>

          <button
            id="annual-export-csv-btn"
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-300 bg-slate-800/80 hover:bg-slate-750 border border-slate-700 rounded-xl transition-all"
            title="Exportar dados resumidos em CSV"
          >
            <Download className="w-3.5 h-3.5" />
            CSV
          </button>

          <button
            id="annual-export-pdf-btn"
            onClick={handleExportPDF}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-white bg-blue-600 hover:bg-blue-500 rounded-xl shadow-md shadow-blue-600/20 transition-all"
          >
            <FileText className="w-3.5 h-3.5" />
            Salvar PDF
          </button>
        </div>
      </div>

      {/* ─── Summary Cards (Top KPIs) ─── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          {
            label: 'Renda Total Anual',
            value: curStats.totalIncome,
            prev: prevStats.totalIncome,
            sub: `${fmt(curStats.activeIncome)} ativa · ${fmt(curStats.passiveIncome)} passiva`,
            icon: <DollarSign className="w-4 h-4" />,
            color: 'text-emerald-400',
            bg: 'bg-emerald-500/10 border-emerald-500/20',
          },
          {
            label: 'Total de Despesas',
            value: curStats.totalDespesas,
            prev: prevStats.totalDespesas,
            sub: 'Gastos operacionais e estilo de vida',
            icon: <Wallet className="w-4 h-4" />,
            color: 'text-rose-400',
            bg: 'bg-rose-500/10 border-rose-500/20',
          },
          {
            label: 'Aportes & Investimentos',
            value: curStats.totalAportes,
            prev: prevStats.totalAportes,
            sub: `${fmt(curStats.totalInvestimento)} inv. · ${fmt(curStats.totalPoupanca)} poup.`,
            icon: <PiggyBank className="w-4 h-4" />,
            color: 'text-sky-400',
            bg: 'bg-sky-500/10 border-sky-500/20',
          },
          {
            label: 'Patrimônio Líquido Final',
            value: patrimonioEvol.finalNetWorth,
            prev: patrimonioEvol.initialNetWorth,
            sub: `Variação: ${patrimonioEvol.totalVariation >= 0 ? '+' : ''}${fmt(patrimonioEvol.totalVariation)} (${patrimonioEvol.totalGrowthPercent.toFixed(1)}%)`,
            icon: <Landmark className="w-4 h-4" />,
            color: patrimonioEvol.finalNetWorth >= 0 ? 'text-emerald-400' : 'text-rose-400',
            bg: 'bg-emerald-500/10 border-emerald-500/20',
          },
        ].map((card) => (
          <div
            key={card.label}
            className={`bg-slate-900 border rounded-2xl p-4.5 ${card.bg}`}
          >
            <div className={`flex items-center gap-2 mb-2 ${card.color}`}>
              {card.icon}
              <span className="text-[11px] font-medium text-slate-400">{card.label}</span>
            </div>
            <div className={`text-xl font-bold ${card.color}`}>
              {fmt(card.value)}
            </div>
            <div className="text-[11px] text-slate-400 mt-1 line-clamp-1">
              {card.sub}
            </div>
            {hasPrev && (
              <div className="flex items-center gap-1.5 mt-1 pt-1 border-t border-slate-800/60">
                <span className="text-[10px] text-slate-500">vs {selectedYear - 1}:</span>
                <DeltaBadge current={card.value} previous={card.prev} />
              </div>
            )}
          </div>
        ))}
      </div>

      {curStats.months.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-slate-500 gap-3 bg-slate-900/50 rounded-2xl border border-slate-800">
          <CalendarDays className="w-8 h-8 opacity-30" />
          <p className="text-sm">Nenhum mês registrado em {selectedYear}.</p>
        </div>
      ) : (
        <>
          {/* ─── Bar Chart Visual: Renda vs Alocado ─── */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg">
            <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-blue-400" />
              Fluxo Mensal: Renda Total vs Total Alocado — {selectedYear}
            </h3>
            <div className="flex items-end gap-2 h-44 overflow-x-auto pb-2">
              {MONTH_NAMES_SHORT.map((shortName, idx) => {
                const monthNum = idx + 1;
                const m = curStats.months.find((x) => x.monthNum === monthNum);
                const prevM = prevStats.months.find((x) => x.monthNum === monthNum);
                if (!m) {
                  return (
                    <div key={monthNum} className="flex flex-col items-center gap-1 flex-1 min-w-[40px]">
                      <div className="w-full h-1 rounded-sm bg-slate-800/40" />
                      <span className="text-[9px] text-slate-600">{shortName}</span>
                    </div>
                  );
                }
                const incomeH = Math.round((m.totalIncome / maxIncome) * 130);
                const spentH = Math.round((m.totalSpent / maxIncome) * 130);
                return (
                  <div key={monthNum} className="flex flex-col items-center gap-1 flex-1 min-w-[40px] group relative">
                    {/* Tooltip */}
                    <div className="absolute bottom-full mb-2 hidden group-hover:flex flex-col gap-0.5 bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-[10px] z-10 whitespace-nowrap shadow-xl left-1/2 -translate-x-1/2">
                      <span className="font-semibold text-white">{m.label} {selectedYear}</span>
                      <span className="text-emerald-400">Renda: {fmt(m.totalIncome)}</span>
                      <span className="text-blue-400">Alocado: {fmt(m.totalSpent)}</span>
                      <span className={m.balance >= 0 ? 'text-cyan-400' : 'text-rose-400'}>
                        Saldo: {fmt(m.balance)}
                      </span>
                      {prevM && (
                        <span className="text-slate-400 border-t border-slate-700 pt-1 mt-1">
                          Renda {selectedYear - 1}: {fmt(prevM.totalIncome)}
                        </span>
                      )}
                    </div>
                    <div className="flex items-end gap-0.5 w-full justify-center">
                      <div
                        className="w-3.5 rounded-t bg-emerald-500/80 transition-all"
                        style={{ height: `${incomeH}px` }}
                      />
                      <div
                        className="w-3.5 rounded-t bg-blue-500/80 transition-all"
                        style={{ height: `${spentH}px` }}
                      />
                    </div>
                    <span className="text-[9px] text-slate-400 mt-1">{shortName}</span>
                  </div>
                );
              })}
            </div>
            <div className="flex items-center gap-4 mt-3 pt-3 border-t border-slate-800">
              <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-sm bg-emerald-500/80" /><span className="text-[11px] text-slate-400">Renda Total</span></div>
              <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-sm bg-blue-500/80" /><span className="text-[11px] text-slate-400">Total Alocado</span></div>
            </div>
          </div>

          {/* ─── Monthly Detail Table ─── */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-lg">
            <div className="px-5 py-4 border-b border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                <CalendarDays className="w-4 h-4 text-blue-400" />
                Detalhamento Mensal Completo — {selectedYear}
              </h3>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleExportXLSX}
                  className="text-xs text-emerald-400 hover:text-emerald-300 flex items-center gap-1 font-semibold"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5" /> Baixar Planilha Completa
                </button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs" id="annual-detail-table">
                <thead>
                  <tr className="bg-slate-800/60">
                    <th className="text-left px-4 py-3 text-slate-400 font-medium whitespace-nowrap">Mês</th>
                    <th className="text-right px-4 py-3 text-emerald-400 font-medium whitespace-nowrap">Renda</th>
                    <th className="text-right px-4 py-3 text-blue-400 font-medium whitespace-nowrap">Alocado</th>
                    <th className="text-right px-4 py-3 text-rose-400 font-medium whitespace-nowrap">Despesas</th>
                    <th className="text-right px-4 py-3 text-sky-400 font-medium whitespace-nowrap">Invest.</th>
                    <th className="text-right px-4 py-3 text-violet-400 font-medium whitespace-nowrap">Conhec.</th>
                    <th className="text-right px-4 py-3 text-teal-400 font-medium whitespace-nowrap">Doação</th>
                    <th className="text-right px-4 py-3 text-amber-400 font-medium whitespace-nowrap">Poupança</th>
                    <th className="text-right px-4 py-3 text-orange-400 font-medium whitespace-nowrap">Negócios</th>
                    <th className="text-right px-4 py-3 text-cyan-400 font-medium whitespace-nowrap">Saldo</th>
                    <th className="text-right px-4 py-3 text-purple-400 font-medium whitespace-nowrap">Inv+Poup%</th>
                  </tr>
                </thead>
                <tbody>
                  {MONTH_NAMES_FULL.map((fullName, idx) => {
                    const monthNum = idx + 1;
                    const m = curStats.months.find((x) => x.monthNum === monthNum);
                    const prevM = prevStats.months.find((x) => x.monthNum === monthNum);

                    if (!m) {
                      return (
                        <tr key={monthNum} className="border-t border-slate-800/50">
                          <td className="px-4 py-3 text-slate-600 font-medium">{MONTH_NAMES_SHORT[idx]}</td>
                          <td colSpan={10} className="px-4 py-3 text-slate-700 text-center italic">— sem dados —</td>
                        </tr>
                      );
                    }

                    return (
                      <tr key={monthNum} className="border-t border-slate-800/50 hover:bg-slate-800/30 transition-colors">
                        <td className="px-4 py-3 font-semibold text-white whitespace-nowrap">
                          {MONTH_NAMES_SHORT[idx]}
                          {hasPrev && prevM && (
                            <DeltaBadge current={m.totalIncome} previous={prevM.totalIncome} />
                          )}
                        </td>
                        <td className="px-4 py-3 text-right text-emerald-300 font-medium whitespace-nowrap">{fmt(m.totalIncome)}</td>
                        <td className="px-4 py-3 text-right text-blue-300 whitespace-nowrap">{fmt(m.totalSpent)}</td>
                        <td className="px-4 py-3 text-right text-rose-300 whitespace-nowrap">{fmt(m.categories.despesas || 0)}</td>
                        <td className="px-4 py-3 text-right text-sky-300 whitespace-nowrap">{fmt(m.categories.investimento || 0)}</td>
                        <td className="px-4 py-3 text-right text-violet-300 whitespace-nowrap">{fmt(m.categories.conhecimento || 0)}</td>
                        <td className="px-4 py-3 text-right text-teal-300 whitespace-nowrap">{fmt(m.categories.doacao || 0)}</td>
                        <td className="px-4 py-3 text-right text-amber-300 whitespace-nowrap">{fmt(m.categories.poupanca || 0)}</td>
                        <td className="px-4 py-3 text-right text-orange-300 whitespace-nowrap">{fmt(m.categories.negocios || 0)}</td>
                        <td className={`px-4 py-3 text-right font-semibold whitespace-nowrap ${m.balance >= 0 ? 'text-cyan-300' : 'text-rose-400'}`}>
                          {fmt(m.balance)}
                        </td>
                        <td className="px-4 py-3 text-right text-purple-300 whitespace-nowrap">
                          {m.savingsRate.toFixed(1)}%
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                {/* Totals Row */}
                <tfoot>
                  <tr className="border-t-2 border-slate-700 bg-slate-800/60 font-bold">
                    <td className="px-4 py-3 text-white text-sm">TOTAL</td>
                    <td className="px-4 py-3 text-right text-emerald-300 text-sm whitespace-nowrap">{fmt(curStats.totalIncome)}</td>
                    <td className="px-4 py-3 text-right text-blue-300 text-sm whitespace-nowrap">{fmt(curStats.totalSpent)}</td>
                    <td className="px-4 py-3 text-right text-rose-300 text-sm whitespace-nowrap">{fmt(curStats.totalDespesas)}</td>
                    <td className="px-4 py-3 text-right text-sky-300 text-sm whitespace-nowrap">{fmt(curStats.totalInvestimento)}</td>
                    <td className="px-4 py-3 text-right text-violet-300 text-sm whitespace-nowrap">{fmt(curStats.totalConhecimento)}</td>
                    <td className="px-4 py-3 text-right text-teal-300 text-sm whitespace-nowrap">{fmt(curStats.totalDoacao)}</td>
                    <td className="px-4 py-3 text-right text-amber-300 text-sm whitespace-nowrap">{fmt(curStats.totalPoupanca)}</td>
                    <td className="px-4 py-3 text-right text-orange-300 text-sm whitespace-nowrap">{fmt(curStats.totalNegocios)}</td>
                    <td className={`px-4 py-3 text-right text-sm whitespace-nowrap ${curStats.totalBalance >= 0 ? 'text-cyan-300' : 'text-rose-400'}`}>
                      {fmt(curStats.totalBalance)}
                    </td>
                    <td className="px-4 py-3 text-right text-purple-300 text-sm whitespace-nowrap">
                      {curStats.avgSavingsRate.toFixed(1)}%
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          {/* ─── Year-over-Year Comparison ─── */}
          {hasPrev && prevStats.months.length > 0 && (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg">
              <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-violet-400" />
                Comparativo Anual: {selectedYear} vs {selectedYear - 1}
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {[
                  { label: 'Renda Total', cur: curStats.totalIncome, prev: prevStats.totalIncome, color: 'text-emerald-400' },
                  { label: 'Total Alocado', cur: curStats.totalSpent, prev: prevStats.totalSpent, color: 'text-blue-400' },
                  { label: 'Total de Despesas', cur: curStats.totalDespesas, prev: prevStats.totalDespesas, color: 'text-rose-400' },
                  { label: 'Total Aportes & Inv.', cur: curStats.totalAportes, prev: prevStats.totalAportes, color: 'text-sky-400' },
                  { label: 'Saldo Acumulado', cur: curStats.totalBalance, prev: prevStats.totalBalance, color: 'text-cyan-400' },
                  { label: 'Taxa Inv+Poup Média', cur: curStats.avgSavingsRate, prev: prevStats.avgSavingsRate, color: 'text-purple-400', isPct: true },
                ].map((row) => {
                  const delta = row.prev > 0 ? ((row.cur - row.prev) / Math.abs(row.prev)) * 100 : 0;
                  const up = delta > 0;
                  return (
                    <div key={row.label} className="flex items-center justify-between gap-3 py-2.5 px-3 bg-slate-800/40 rounded-xl border border-slate-800">
                      <span className="text-xs text-slate-400 font-medium">{row.label}</span>
                      <div className="flex items-center gap-3 text-right">
                        <div>
                          <div className={`text-xs font-bold ${row.color}`}>
                            {row.isPct ? `${row.cur.toFixed(1)}%` : fmt(row.cur)}
                          </div>
                          <div className="text-[10px] text-slate-600">
                            {row.isPct ? `${row.prev.toFixed(1)}%` : fmt(row.prev)}
                          </div>
                        </div>
                        {row.prev > 0 && (
                          <span className={`text-[11px] font-semibold flex items-center gap-0.5 ${Math.abs(delta) < 0.1 ? 'text-slate-500' : up ? 'text-emerald-400' : 'text-rose-400'}`}>
                            {Math.abs(delta) < 0.1
                              ? <><Minus className="w-3 h-3" />0%</>
                              : up
                              ? <><ArrowUpRight className="w-3 h-3" />{pct(delta)}</>
                              : <><ArrowDownRight className="w-3 h-3" />{pct(delta)}</>
                            }
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
