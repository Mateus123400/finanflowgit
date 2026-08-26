import { insforge } from './insforge';
import type {
  MonthData,
  IncomeEntry,
  TransactionEntry,
  CategoryTargets,
  CategoryId,
  Reward,
  IncomeActivity,
  AssetItem,
  LiabilityItem,
  AssetValuationHistory,
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
      .filter((t: any) => t.month_id === m.id && t.user_id === userId)
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
        incomeNature: i.income_nature || (i.source_type === 'dividendos' ? 'passive' : 'active'),
        activityId: i.activity_id || undefined,
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
        investedAmount: t.invested_amount !== null && t.invested_amount !== undefined ? parseFloat(t.invested_amount) : undefined,
        returnAmount: t.return_amount !== null && t.return_amount !== undefined ? parseFloat(t.return_amount) : undefined,
        activityId: t.activity_id || undefined,
        businessStatus: t.business_status || 'completed',
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
  const { error } = await insforge.database
    .from('months')
    .upsert(
      [{
        id: month.id,
        user_id: userId,
        year: month.year,
        month: month.month,
        updated_at: new Date().toISOString(),
      }],
      { onConflict: 'id,user_id' }
    );

  if (error) throw error;

  await saveTargets(userId, month.id, month.targets);
}

// ============================================================
// INCOMES
// ============================================================

export async function upsertIncome(userId: string, monthId: string, income: IncomeEntry): Promise<void> {
  const payload = {
    id: income.id,
    month_id: monthId,
    user_id: userId,
    description: income.description,
    amount: income.amount,
    date: income.date,
    source_type: income.sourceType ?? null,
    income_nature: income.incomeNature ?? 'active',
    activity_id: income.activityId ?? null,
    updated_at: new Date().toISOString(),
  };

  const { error } = await insforge.database
    .from('incomes')
    .upsert([payload], { onConflict: 'id' });

  if (error) throw error;
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
    invested_amount: tx.investedAmount !== undefined ? tx.investedAmount : null,
    return_amount: tx.returnAmount !== undefined ? tx.returnAmount : null,
    activity_id: tx.activityId ?? null,
    business_status: tx.businessStatus ?? 'completed',
    updated_at: new Date().toISOString(),
  };

  const { error } = await insforge.database
    .from('transactions')
    .upsert([payload], { onConflict: 'id' });

  if (error) throw error;
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

// ============================================================
// ATIVIDADES DE RENDA (INCOME ACTIVITIES)
// ============================================================

export async function fetchIncomeActivities(userId: string): Promise<IncomeActivity[]> {
  const { data, error } = await insforge.database
    .from('income_activities')
    .select('*')
    .eq('user_id', userId)
    .order('name', { ascending: true });

  if (error) throw error;
  if (!data) return [];

  return (data as any[]).map((r: any) => ({
    id: r.id,
    userId: r.user_id,
    name: r.name,
    defaultType: r.default_type || 'active',
    isActive: r.is_active !== false,
    color: r.color || undefined,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  }));
}

export async function upsertIncomeActivity(userId: string, activity: IncomeActivity): Promise<void> {
  const payload = {
    id: activity.id,
    user_id: userId,
    name: activity.name,
    default_type: activity.defaultType,
    is_active: activity.isActive,
    color: activity.color || null,
    updated_at: new Date().toISOString(),
  };

  const { error } = await insforge.database
    .from('income_activities')
    .upsert([payload], { onConflict: 'id' });

  if (error) throw error;
}

export async function toggleArchiveIncomeActivity(activityId: string, isActive: boolean): Promise<void> {
  const { error } = await insforge.database
    .from('income_activities')
    .update({ is_active: isActive, updated_at: new Date().toISOString() })
    .eq('id', activityId);

  if (error) throw error;
}

// ============================================================
// PATRIMÔNIO: ATIVOS (ASSETS)
// ============================================================

export async function fetchAssets(userId: string): Promise<AssetItem[]> {
  const { data, error } = await insforge.database
    .from('assets')
    .select('*')
    .eq('user_id', userId)
    .order('current_value', { ascending: false });

  if (error) throw error;
  if (!data) return [];

  return (data as any[]).map((r: any) => ({
    id: r.id,
    userId: r.user_id,
    name: r.name,
    type: r.type,
    currentValue: parseFloat(r.current_value) || 0,
    valuationDate: r.valuation_date,
    notes: r.notes || undefined,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  }));
}

export async function upsertAsset(userId: string, asset: AssetItem): Promise<void> {
  const payload = {
    id: asset.id,
    user_id: userId,
    name: asset.name,
    type: asset.type,
    current_value: asset.currentValue,
    valuation_date: asset.valuationDate,
    notes: asset.notes || null,
    updated_at: new Date().toISOString(),
  };

  const { error } = await insforge.database
    .from('assets')
    .upsert([payload], { onConflict: 'id' });

  if (error) throw error;
}

export async function deleteAsset(assetId: string): Promise<void> {
  const { error } = await insforge.database
    .from('assets')
    .delete()
    .eq('id', assetId);

  if (error) throw error;
}

// ============================================================
// PATRIMÔNIO: PASSIVOS (LIABILITIES)
// ============================================================

export async function fetchLiabilities(userId: string): Promise<LiabilityItem[]> {
  const { data, error } = await insforge.database
    .from('liabilities')
    .select('*')
    .eq('user_id', userId)
    .order('current_value', { ascending: false });

  if (error) throw error;
  if (!data) return [];

  return (data as any[]).map((r: any) => ({
    id: r.id,
    userId: r.user_id,
    name: r.name,
    type: r.type,
    currentValue: parseFloat(r.current_value) || 0,
    valuationDate: r.valuation_date,
    notes: r.notes || undefined,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  }));
}

export async function upsertLiability(userId: string, liability: LiabilityItem): Promise<void> {
  const payload = {
    id: liability.id,
    user_id: userId,
    name: liability.name,
    type: liability.type,
    current_value: liability.currentValue,
    valuation_date: liability.valuationDate,
    notes: liability.notes || null,
    updated_at: new Date().toISOString(),
  };

  const { error } = await insforge.database
    .from('liabilities')
    .upsert([payload], { onConflict: 'id' });

  if (error) throw error;
}

export async function deleteLiability(liabilityId: string): Promise<void> {
  const { error } = await insforge.database
    .from('liabilities')
    .delete()
    .eq('id', liabilityId);

  if (error) throw error;
}

// ============================================================
// REWARDS
// ============================================================

export async function fetchRewards(userId: string): Promise<Reward[]> {
  const { data, error } = await insforge.database
    .from('rewards')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: true });

  if (error) throw error;
  if (!data) return [];

  return (data as any[]).map((r: any) => ({
    id: r.id,
    name: r.name,
    emoji: r.emoji,
    description: r.description ?? undefined,
    conditionType: r.condition_type,
    conditionValue: parseFloat(r.condition_value),
    conditionCategory: r.condition_category ?? undefined,
    isAchieved: r.is_achieved,
    achievedAt: r.achieved_at ?? undefined,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  }));
}

export async function upsertReward(userId: string, reward: Reward): Promise<void> {
  const { error } = await insforge.database
    .from('rewards')
    .upsert(
      [{
        id: reward.id,
        user_id: userId,
        name: reward.name,
        emoji: reward.emoji,
        description: reward.description ?? null,
        condition_type: reward.conditionType,
        condition_value: reward.conditionValue,
        condition_category: reward.conditionCategory ?? null,
        is_achieved: reward.isAchieved,
        achieved_at: reward.achievedAt ?? null,
        updated_at: new Date().toISOString(),
      }],
      { onConflict: 'id' }
    );
  if (error) throw error;
}

export async function deleteReward(rewardId: string): Promise<void> {
  const { error } = await insforge.database
    .from('rewards')
    .delete()
    .eq('id', rewardId);
  if (error) throw error;
}

// ============================================================
// DELETE MONTH (cascade manual)
// ============================================================

export async function deleteMonth(userId: string, monthId: string): Promise<void> {
  // 1. Apagar transações do mês
  const { error: txErr } = await insforge.database
    .from('transactions')
    .delete()
    .eq('month_id', monthId)
    .eq('user_id', userId);
  if (txErr) throw txErr;

  // 2. Apagar rendas do mês
  const { error: incErr } = await insforge.database
    .from('incomes')
    .delete()
    .eq('month_id', monthId)
    .eq('user_id', userId);
  if (incErr) throw incErr;

  // 3. Apagar metas do mês
  const { error: tgtErr } = await insforge.database
    .from('category_targets')
    .delete()
    .eq('month_id', monthId)
    .eq('user_id', userId);
  if (tgtErr) throw tgtErr;

  // 4. Apagar o mês em si
  const { error: mErr } = await insforge.database
    .from('months')
    .delete()
    .eq('id', monthId)
    .eq('user_id', userId);
  if (mErr) throw mErr;
}

