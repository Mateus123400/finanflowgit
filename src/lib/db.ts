import { insforge } from './insforge';
import type {
  MonthData,
  IncomeEntry,
  TransactionEntry,
  CategoryTargets,
  CategoryId,
} from '../types';

// ============================================================
// MONTHS
// ============================================================

export async function fetchUserMonths(userId: string): Promise<MonthData[]> {
  const { data: monthRows, error: mErr } = await insforge.database
    .from('months')
    .select('*')
    .eq('user_id', userId)
    .order('year', { ascending: true })
    .order('month', { ascending: true });

  if (mErr) throw mErr;
  if (!monthRows || monthRows.length === 0) return [];

  const monthIds = (monthRows as any[]).map((m: any) => m.id);

  const [{ data: targetRows }, { data: incomeRows }, { data: txRows }] = await Promise.all([
    insforge.database.from('category_targets').select('*').in('month_id', monthIds).eq('user_id', userId),
    insforge.database.from('incomes').select('*').in('month_id', monthIds).eq('user_id', userId),
    insforge.database.from('transactions').select('*').in('month_id', monthIds).eq('user_id', userId),
  ]);

  return (monthRows as any[]).map((m: any) => {
    const targets: CategoryTargets = {
      despesas: 0,
      investimento: 0,
      conhecimento: 0,
      doacao: 0,
      poupanca: 0,
      negocios: 0,
    };

    ((targetRows as any[]) || [])
      .filter((t: any) => t.month_id === m.id)
      .forEach((t: any) => {
        targets[t.category_id as CategoryId] = parseFloat(t.target_percent);
      });

    const incomes: IncomeEntry[] = ((incomeRows as any[]) || [])
      .filter((i: any) => i.month_id === m.id)
      .map((i: any) => ({
        id: i.id,
        description: i.description,
        amount: parseFloat(i.amount),
        date: i.date,
        sourceType: i.source_type,
      }));

    const transactions: TransactionEntry[] = ((txRows as any[]) || [])
      .filter((t: any) => t.month_id === m.id)
      .map((t: any) => ({
        id: t.id,
        categoryId: t.category_id as CategoryId,
        description: t.description,
        amount: parseFloat(t.amount),
        date: t.date,
        paymentMethod: t.payment_method,
        notes: t.notes,
        isRecurring: t.is_recurring,
        investedAmount: t.invested_amount ? parseFloat(t.invested_amount) : undefined,
        returnAmount: t.return_amount ? parseFloat(t.return_amount) : undefined,
      }));

    return {
      id: m.id,
      year: m.year,
      month: m.month,
      targets,
      incomes,
      transactions,
      createdAt: m.created_at,
      updatedAt: m.updated_at,
    } as MonthData;
  });
}

export async function upsertMonth(userId: string, month: MonthData): Promise<void> {
  // Tenta update; se não encontrar, faz insert
  const { data: existing } = await insforge.database
    .from('months')
    .select('id')
    .eq('id', month.id)
    .eq('user_id', userId)
    .maybeSingle();

  if (existing) {
    const { error } = await insforge.database
      .from('months')
      .update({ updated_at: new Date().toISOString() })
      .eq('id', month.id)
      .eq('user_id', userId);
    if (error) throw error;
  } else {
    const { error } = await insforge.database.from('months').insert([{
      id: month.id,
      user_id: userId,
      year: month.year,
      month: month.month,
      updated_at: new Date().toISOString(),
    }]);
    if (error) throw error;
  }

  // Upsert targets usando delete+insert para simplicidade
  await saveTargets(userId, month.id, month.targets);
}

// ============================================================
// INCOMES
// ============================================================

export async function upsertIncome(userId: string, monthId: string, income: IncomeEntry): Promise<void> {
  const { data: existing } = await insforge.database
    .from('incomes')
    .select('id')
    .eq('id', income.id)
    .maybeSingle();

  const payload = {
    id: income.id,
    month_id: monthId,
    user_id: userId,
    description: income.description,
    amount: income.amount,
    date: income.date,
    source_type: income.sourceType ?? null,
    updated_at: new Date().toISOString(),
  };

  if (existing) {
    const { error } = await insforge.database
      .from('incomes')
      .update(payload)
      .eq('id', income.id);
    if (error) throw error;
  } else {
    const { error } = await insforge.database.from('incomes').insert([payload]);
    if (error) throw error;
  }
}

export async function deleteIncome(incomeId: string): Promise<void> {
  const { error } = await insforge.database.from('incomes').delete().eq('id', incomeId);
  if (error) throw error;
}

// ============================================================
// TRANSACTIONS
// ============================================================

export async function upsertTransaction(
  userId: string,
  monthId: string,
  tx: TransactionEntry
): Promise<void> {
  const { data: existing } = await insforge.database
    .from('transactions')
    .select('id')
    .eq('id', tx.id)
    .maybeSingle();

  const payload = {
    id: tx.id,
    month_id: monthId,
    user_id: userId,
    category_id: tx.categoryId,
    description: tx.description,
    amount: tx.amount,
    date: tx.date,
    payment_method: tx.paymentMethod ?? null,
    notes: tx.notes ?? null,
    is_recurring: tx.isRecurring ?? false,
    invested_amount: tx.investedAmount ?? null,
    return_amount: tx.returnAmount ?? null,
    updated_at: new Date().toISOString(),
  };

  if (existing) {
    const { error } = await insforge.database
      .from('transactions')
      .update(payload)
      .eq('id', tx.id);
    if (error) throw error;
  } else {
    const { error } = await insforge.database.from('transactions').insert([payload]);
    if (error) throw error;
  }
}

export async function deleteTransaction(txId: string): Promise<void> {
  const { error } = await insforge.database.from('transactions').delete().eq('id', txId);
  if (error) throw error;
}

// ============================================================
// TARGETS
// ============================================================

export async function saveTargets(
  userId: string,
  monthId: string,
  targets: CategoryTargets
): Promise<void> {
  // Apaga targets existentes para o mês e reinserir
  await insforge.database
    .from('category_targets')
    .delete()
    .eq('month_id', monthId)
    .eq('user_id', userId);

  const rows = Object.entries(targets).map(([catId, pct]) => ({
    month_id: monthId,
    user_id: userId,
    category_id: catId,
    target_percent: pct,
  }));

  const { error } = await insforge.database.from('category_targets').insert(rows);
  if (error) throw error;
}
