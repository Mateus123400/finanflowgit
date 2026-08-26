import React, { useState, useMemo, useEffect } from 'react';
import {
  Trophy,
  Plus,
  Trash2,
  Edit3,
  X,
  CheckCircle2,
  Target,
  TrendingUp,
  BookOpen,
  DollarSign,
  PiggyBank,
  Star,
  Sparkles,
  Lock,
} from 'lucide-react';
import { MonthData, Reward, RewardConditionType } from '../types';
import { calculateMonthSummary } from '../utils/calculations';
import { upsertReward, deleteReward } from '../lib/db';

const fmt = (v: number) =>
  v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 0, maximumFractionDigits: 0 });

const CATEGORY_OPTIONS = [
  { id: 'despesas',     label: 'Despesas' },
  { id: 'investimento', label: 'Investimento' },
  { id: 'conhecimento', label: 'Conhecimento' },
  { id: 'doacao',       label: 'Doação' },
  { id: 'poupanca',     label: 'Poupança' },
  { id: 'negocios',     label: 'Negócios' },
];

const CONDITION_OPTIONS: { id: RewardConditionType; label: string; desc: string; icon: React.ReactNode }[] = [
  {
    id: 'renda_mensal',
    label: 'Renda Mensal',
    desc: 'Atingir X de renda em um único mês',
    icon: <DollarSign className="w-4 h-4" />,
  },
  {
    id: 'renda_anual',
    label: 'Renda Anual',
    desc: 'Atingir X de renda total em um ano',
    icon: <TrendingUp className="w-4 h-4" />,
  },
  {
    id: 'categoria_acumulada',
    label: 'Acumulado em Categoria',
    desc: 'Somar X em uma categoria ao longo de todos os meses',
    icon: <PiggyBank className="w-4 h-4" />,
  },
  {
    id: 'taxa_poupanca',
    label: 'Taxa de Poupança/Investimento',
    desc: 'Atingir X% de poupança+investimento em um mês',
    icon: <BookOpen className="w-4 h-4" />,
  },
];

const EMOJI_PRESETS = ['🏆','🚗','🏍️','✈️','🏖️','🏠','💻','📱','🎓','💰','🛥️','🎯','🌍','🏋️','🎁','⌚','🏡','📚','🚀','💎'];

// ─── Progress Calculation ───────────────────────────────────

interface Progress {
  current: number;
  percent: number;
  metAt?: string; // the month or year that first met the condition
}

function calcProgress(reward: Reward, allMonths: MonthData[]): Progress {
  const { conditionType, conditionValue, conditionCategory } = reward;

  if (conditionType === 'renda_mensal') {
    let best = 0;
    let bestId = '';
    allMonths.forEach((m) => {
      const inc = m.incomes.reduce((s, i) => s + (Number(i.amount) || 0), 0);
      if (inc > best) { best = inc; bestId = m.id; }
    });
    return { current: best, percent: Math.min(100, conditionValue > 0 ? (best / conditionValue) * 100 : 0), metAt: bestId };
  }

  if (conditionType === 'renda_anual') {
    const byYear: Record<number, number> = {};
    allMonths.forEach((m) => {
      const inc = m.incomes.reduce((s, i) => s + (Number(i.amount) || 0), 0);
      byYear[m.year] = (byYear[m.year] || 0) + inc;
    });
    const best = Math.max(...Object.values(byYear), 0);
    const bestYear = Object.entries(byYear).find(([, v]) => v === best)?.[0] || '';
    return { current: best, percent: Math.min(100, conditionValue > 0 ? (best / conditionValue) * 100 : 0), metAt: bestYear };
  }

  if (conditionType === 'categoria_acumulada' && conditionCategory) {
    let total = 0;
    allMonths.forEach((m) => {
      const summary = calculateMonthSummary(m);
      total += summary.categories[conditionCategory as keyof typeof summary.categories]?.actualAmount || 0;
    });
    return { current: total, percent: Math.min(100, conditionValue > 0 ? (total / conditionValue) * 100 : 0) };
  }

  if (conditionType === 'taxa_poupanca') {
    let best = 0;
    let bestId = '';
    allMonths.forEach((m) => {
      const summary = calculateMonthSummary(m);
      if (summary.investmentAndSavingsRate > best) {
        best = summary.investmentAndSavingsRate;
        bestId = m.id;
      }
    });
    return { current: best, percent: Math.min(100, conditionValue > 0 ? (best / conditionValue) * 100 : 0), metAt: bestId };
  }

  return { current: 0, percent: 0 };
}

// ─── Modal ───────────────────────────────────────────────────

interface RewardModalProps {
  reward?: Reward | null;
  onSave: (r: Reward) => void;
  onClose: () => void;
}

const EMPTY_FORM = {
  name: '',
  emoji: '🏆',
  description: '',
  conditionType: 'renda_mensal' as RewardConditionType,
  conditionValue: '',
  conditionCategory: 'investimento',
};

function RewardModal({ reward, onSave, onClose }: RewardModalProps) {
  const [form, setForm] = useState({
    name: reward?.name ?? EMPTY_FORM.name,
    emoji: reward?.emoji ?? EMPTY_FORM.emoji,
    description: reward?.description ?? '',
    conditionType: reward?.conditionType ?? EMPTY_FORM.conditionType,
    conditionValue: reward ? String(reward.conditionValue) : '',
    conditionCategory: reward?.conditionCategory ?? EMPTY_FORM.conditionCategory,
  });
  const [error, setError] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) { setError('Dê um nome à recompensa.'); return; }
    const val = parseFloat(form.conditionValue);
    if (!form.conditionValue || isNaN(val) || val <= 0) { setError('Defina um valor alvo válido.'); return; }

    const now = new Date().toISOString();
    onSave({
      id: reward?.id ?? `reward-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      name: form.name.trim(),
      emoji: form.emoji,
      description: form.description.trim() || undefined,
      conditionType: form.conditionType,
      conditionValue: val,
      conditionCategory: form.conditionType === 'categoria_acumulada' ? form.conditionCategory : undefined,
      isAchieved: reward?.isAchieved ?? false,
      achievedAt: reward?.achievedAt,
      createdAt: reward?.createdAt ?? now,
      updatedAt: now,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-800 text-slate-100 w-full max-w-md rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/90">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <Trophy className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-white">
                {reward ? 'Editar Recompensa' : 'Nova Recompensa'}
              </h2>
              <p className="text-xs text-slate-400">Defina sua meta e ganhe a recompensa</p>
            </div>
          </div>
          <button id="close-reward-modal-btn" onClick={onClose} className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto max-h-[80vh]">
          {error && <div className="p-3 text-xs text-rose-300 bg-rose-950/40 border border-rose-800/50 rounded-xl">{error}</div>}

          {/* Emoji + Name */}
          <div className="flex gap-3">
            <div className="relative">
              <button
                type="button"
                id="reward-emoji-btn"
                onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                className="w-14 h-14 text-2xl flex items-center justify-center bg-slate-800 border border-slate-700 rounded-xl hover:border-amber-500/50 transition-colors"
              >
                {form.emoji}
              </button>
              {showEmojiPicker && (
                <div className="absolute top-16 left-0 z-20 bg-slate-800 border border-slate-700 rounded-xl p-3 grid grid-cols-5 gap-2 shadow-2xl w-52">
                  {EMOJI_PRESETS.map((e) => (
                    <button
                      key={e} type="button"
                      onClick={() => { setForm(f => ({...f, emoji: e})); setShowEmojiPicker(false); }}
                      className="text-xl hover:bg-slate-700 rounded-lg p-1 transition-colors"
                    >{e}</button>
                  ))}
                  <input
                    type="text"
                    maxLength={2}
                    placeholder="✏️"
                    className="col-span-5 text-center text-sm bg-slate-700 border border-slate-600 rounded-lg p-1 text-white focus:outline-none"
                    onChange={(e) => e.target.value && setForm(f => ({...f, emoji: e.target.value}))}
                  />
                </div>
              )}
            </div>
            <div className="flex-1">
              <label className="block text-xs font-medium text-slate-300 mb-1.5">Nome da Recompensa</label>
              <input
                id="reward-name-input"
                type="text"
                value={form.name}
                onChange={(e) => { setForm(f => ({...f, name: e.target.value})); setError(''); }}
                placeholder="Ex: Minha moto nova, Viagem para Europa..."
                className="w-full px-3 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-500/60 transition-colors"
              />
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">Descrição (opcional)</label>
            <textarea
              id="reward-desc-input"
              value={form.description}
              onChange={(e) => setForm(f => ({...f, description: e.target.value}))}
              placeholder="Detalhes sobre a recompensa..."
              rows={2}
              className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-500/60 transition-colors resize-none"
            />
          </div>

          {/* Condition Type */}
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-2">Tipo de Condição</label>
            <div className="space-y-2">
              {CONDITION_OPTIONS.map((opt) => (
                <label
                  key={opt.id}
                  className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                    form.conditionType === opt.id
                      ? 'bg-amber-500/10 border-amber-500/40 text-amber-300'
                      : 'bg-slate-800/40 border-slate-800 hover:border-slate-700 text-slate-400'
                  }`}
                >
                  <input
                    type="radio"
                    name="conditionType"
                    value={opt.id}
                    checked={form.conditionType === opt.id}
                    onChange={() => setForm(f => ({...f, conditionType: opt.id}))}
                    className="mt-0.5 accent-amber-500"
                  />
                  <div className="flex items-start gap-2">
                    <span className="mt-0.5">{opt.icon}</span>
                    <div>
                      <div className="text-xs font-medium">{opt.label}</div>
                      <div className="text-[11px] opacity-70">{opt.desc}</div>
                    </div>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Category selector if applicable */}
          {form.conditionType === 'categoria_acumulada' && (
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">Categoria</label>
              <select
                id="reward-category-select"
                value={form.conditionCategory}
                onChange={(e) => setForm(f => ({...f, conditionCategory: e.target.value}))}
                className="w-full px-3 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-sm text-white focus:outline-none focus:border-amber-500/60 [color-scheme:dark]"
              >
                {CATEGORY_OPTIONS.map((c) => (
                  <option key={c.id} value={c.id}>{c.label}</option>
                ))}
              </select>
            </div>
          )}

          {/* Target Value */}
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">
              {form.conditionType === 'taxa_poupanca' ? 'Meta (%)' : 'Meta (R$)'}
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm font-medium">
                {form.conditionType === 'taxa_poupanca' ? '%' : 'R$'}
              </span>
              <input
                id="reward-value-input"
                type="number"
                min="0.01"
                step="0.01"
                value={form.conditionValue}
                onChange={(e) => { setForm(f => ({...f, conditionValue: e.target.value})); setError(''); }}
                placeholder={form.conditionType === 'taxa_poupanca' ? '30' : '5000'}
                className="w-full pl-10 pr-4 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-500/60 [color-scheme:dark]"
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-slate-300 hover:text-white hover:bg-slate-800 rounded-xl transition-colors">
              Cancelar
            </button>
            <button
              id="save-reward-btn"
              type="submit"
              className="flex items-center gap-2 px-5 py-2 text-sm font-medium text-white bg-amber-600 hover:bg-amber-500 active:bg-amber-700 rounded-xl shadow-lg shadow-amber-600/20 transition-all"
            >
              <Star className="w-4 h-4" />
              {reward ? 'Salvar Alterações' : 'Criar Recompensa'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Reward Card ─────────────────────────────────────────────

function conditionLabel(reward: Reward): string {
  switch (reward.conditionType) {
    case 'renda_mensal': return `Renda mensal ≥ ${fmt(reward.conditionValue)}`;
    case 'renda_anual':  return `Renda anual ≥ ${fmt(reward.conditionValue)}`;
    case 'categoria_acumulada': {
      const cat = CATEGORY_OPTIONS.find(c => c.id === reward.conditionCategory);
      return `Acumular ${fmt(reward.conditionValue)} em ${cat?.label ?? reward.conditionCategory}`;
    }
    case 'taxa_poupanca': return `Taxa Inv+Poup ≥ ${reward.conditionValue.toFixed(0)}%`;
    default: return '';
  }
}

function currentLabel(reward: Reward, current: number): string {
  if (reward.conditionType === 'taxa_poupanca') return `${current.toFixed(1)}%`;
  return fmt(current);
}

function targetLabel(reward: Reward): string {
  if (reward.conditionType === 'taxa_poupanca') return `${reward.conditionValue.toFixed(0)}%`;
  return fmt(reward.conditionValue);
}

interface RewardCardProps {
  key?: string;
  reward: Reward;
  progress: Progress;
  onEdit: () => void;
  onDelete: () => void;
}

function RewardCard({ reward, progress, onEdit, onDelete }: RewardCardProps) {
  const isAchieved = reward.isAchieved || progress.percent >= 100;
  const pctDisplay = Math.min(100, Math.round(progress.percent));

  return (
    <div className={`relative overflow-hidden rounded-2xl border transition-all group ${
      isAchieved
        ? 'bg-gradient-to-br from-amber-950/40 via-slate-900 to-slate-900 border-amber-500/40 shadow-lg shadow-amber-500/10'
        : 'bg-slate-900 border-slate-800 hover:border-slate-700'
    }`}>
      {/* Achieved glow overlay */}
      {isAchieved && (
        <div className="absolute inset-0 pointer-events-none bg-gradient-to-br from-amber-400/5 via-transparent to-transparent" />
      )}

      <div className="p-5">
        {/* Top row */}
        <div className="flex items-start justify-between gap-3 mb-4">
          <div className="flex items-center gap-3">
            <div className={`text-3xl flex items-center justify-center w-14 h-14 rounded-xl border transition-all ${
              isAchieved ? 'bg-amber-500/15 border-amber-500/30' : 'bg-slate-800 border-slate-700'
            }`}>
              {reward.emoji}
            </div>
            <div>
              <h3 className={`font-bold text-sm ${isAchieved ? 'text-amber-300' : 'text-white'}`}>
                {reward.name}
              </h3>
              {reward.description && (
                <p className="text-[11px] text-slate-500 mt-0.5 line-clamp-1">{reward.description}</p>
              )}
              <p className="text-[11px] text-slate-400 mt-1">{conditionLabel(reward)}</p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-1">
            <button
              id={`edit-reward-${reward.id}`}
              onClick={onEdit}
              className="p-1.5 text-slate-500 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
              title="Editar recompensa"
            >
              <Edit3 className="w-3.5 h-3.5" />
            </button>
            <button
              id={`delete-reward-${reward.id}`}
              onClick={onDelete}
              className="p-1.5 text-slate-500 hover:text-rose-400 hover:bg-rose-950/30 rounded-lg transition-colors"
              title="Excluir recompensa"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Progress */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-[11px]">
            <span className={isAchieved ? 'text-amber-400 font-medium' : 'text-slate-400'}>
              {isAchieved
                ? '🎉 Meta alcançada!'
                : `${currentLabel(reward, progress.current)} de ${targetLabel(reward)}`
              }
            </span>
            <span className={`font-bold ${isAchieved ? 'text-amber-400' : pctDisplay >= 80 ? 'text-emerald-400' : 'text-slate-300'}`}>
              {pctDisplay}%
            </span>
          </div>

          {/* Progress bar */}
          <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-700 ${
                isAchieved
                  ? 'bg-gradient-to-r from-amber-500 to-yellow-400'
                  : pctDisplay >= 80
                  ? 'bg-gradient-to-r from-emerald-500 to-teal-400'
                  : pctDisplay >= 50
                  ? 'bg-gradient-to-r from-blue-500 to-cyan-400'
                  : 'bg-gradient-to-r from-slate-600 to-slate-500'
              }`}
              style={{ width: `${pctDisplay}%` }}
            />
          </div>
        </div>

        {/* Achievement badge */}
        {isAchieved && (
          <div className="mt-3 flex items-center gap-2 px-3 py-2 bg-amber-500/10 border border-amber-500/20 rounded-xl">
            <CheckCircle2 className="w-4 h-4 text-amber-400 flex-shrink-0" />
            <span className="text-[11px] text-amber-300 font-medium">
              {reward.achievedAt
                ? `Conquistada em ${new Date(reward.achievedAt).toLocaleDateString('pt-BR')}`
                : 'Conquista desbloqueada!'
              }
            </span>
          </div>
        )}

        {/* Locked */}
        {!isAchieved && pctDisplay < 10 && (
          <div className="mt-3 flex items-center gap-2">
            <Lock className="w-3.5 h-3.5 text-slate-600" />
            <span className="text-[11px] text-slate-600">Continue investindo para desbloquear</span>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Main Component ──────────────────────────────────────────

export interface RewardsViewProps {
  allMonths: MonthData[];
  rewards: Reward[];
  userId: string;
  onRewardsChange: (rewards: Reward[]) => void;
}

export function RewardsView({ allMonths, rewards, userId, onRewardsChange }: RewardsViewProps) {
  const [modalOpen, setModalOpen] = useState(false);
  const [editingReward, setEditingReward] = useState<Reward | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  // Auto-detect achievements whenever allMonths changes
  useEffect(() => {
    if (!allMonths.length || !rewards.length) return;

    const now = new Date().toISOString();
    let changed = false;
    const updated = rewards.map((r) => {
      if (r.isAchieved) return r;
      const p = calcProgress(r, allMonths);
      if (p.percent >= 100) {
        changed = true;
        return { ...r, isAchieved: true, achievedAt: now, updatedAt: now };
      }
      return r;
    });

    if (changed) {
      onRewardsChange(updated);
      updated.forEach((r) => {
        if (r.isAchieved && !rewards.find((old) => old.id === r.id && old.isAchieved)) {
          upsertReward(userId, r).catch(console.error);
        }
      });
    }
  }, [allMonths]);

  const progressMap = useMemo(() => {
    const map: Record<string, Progress> = {};
    rewards.forEach((r) => { map[r.id] = calcProgress(r, allMonths); });
    return map;
  }, [rewards, allMonths]);

  const achieved = rewards.filter((r) => r.isAchieved || (progressMap[r.id]?.percent ?? 0) >= 100);
  const inProgress = rewards.filter((r) => !r.isAchieved && (progressMap[r.id]?.percent ?? 0) < 100);

  const handleSave = async (reward: Reward) => {
    setSaving(true);
    try {
      await upsertReward(userId, reward);
      const exists = rewards.find((r) => r.id === reward.id);
      const next = exists
        ? rewards.map((r) => (r.id === reward.id ? reward : r))
        : [...rewards, reward];
      onRewardsChange(next);
      setModalOpen(false);
      setEditingReward(null);
    } catch (e) {
      console.error('Erro ao salvar recompensa:', e);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteReward(id);
      onRewardsChange(rewards.filter((r) => r.id !== id));
    } catch (e) {
      console.error('Erro ao deletar recompensa:', e);
    }
    setDeleteConfirm(null);
  };

  return (
    <div className="space-y-6 pb-10">
      {/* ─── Header ─── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Trophy className="w-5 h-5 text-amber-400" />
            Recompensas
          </h2>
          <p className="text-sm text-slate-400 mt-0.5">
            Vincule metas financeiras a prêmios e celebre suas conquistas
          </p>
        </div>
        <button
          id="new-reward-btn"
          onClick={() => { setEditingReward(null); setModalOpen(true); }}
          className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-white bg-amber-600 hover:bg-amber-500 active:bg-amber-700 rounded-xl shadow-md shadow-amber-600/20 transition-all"
        >
          <Plus className="w-4 h-4" />
          Nova Recompensa
        </button>
      </div>

      {/* ─── Stats bar ─── */}
      {rewards.length > 0 && (
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: 'Total de Metas', value: rewards.length, icon: <Target className="w-4 h-4" />, color: 'text-blue-400', bg: 'bg-blue-500/10 border-blue-500/20' },
            { label: 'Conquistadas', value: achieved.length, icon: <CheckCircle2 className="w-4 h-4" />, color: 'text-amber-400', bg: 'bg-amber-500/10 border-amber-500/20' },
            { label: 'Em Progresso', value: inProgress.length, icon: <Sparkles className="w-4 h-4" />, color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/20' },
          ].map((stat) => (
            <div key={stat.label} className={`bg-slate-900 border rounded-2xl p-4 ${stat.bg}`}>
              <div className={`flex items-center gap-2 mb-1 ${stat.color}`}>
                {stat.icon}
                <span className="text-[11px] text-slate-400">{stat.label}</span>
              </div>
              <div className={`text-2xl font-bold ${stat.color}`}>{stat.value}</div>
            </div>
          ))}
        </div>
      )}

      {/* ─── Empty State ─── */}
      {rewards.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 gap-5 bg-slate-900/40 border border-slate-800 rounded-2xl">
          <div className="text-6xl">🏆</div>
          <div className="text-center">
            <h3 className="text-lg font-bold text-white mb-1">Nenhuma recompensa ainda</h3>
            <p className="text-sm text-slate-400 max-w-xs">
              Defina metas financeiras e vincule prêmios — um carro, viagem, gadget — para se motivar a alcançá-las.
            </p>
          </div>
          <button
            id="new-reward-empty-btn"
            onClick={() => { setEditingReward(null); setModalOpen(true); }}
            className="flex items-center gap-2 px-6 py-3 text-sm font-medium text-white bg-amber-600 hover:bg-amber-500 rounded-xl shadow-lg transition-all"
          >
            <Plus className="w-4 h-4" />
            Criar Primeira Recompensa
          </button>
        </div>
      )}

      {/* ─── Achieved ─── */}
      {achieved.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-amber-400 flex items-center gap-2">
            <Star className="w-4 h-4 fill-amber-400" />
            Conquistadas ({achieved.length})
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {achieved.map((r) => (
              <RewardCard
                key={r.id}
                reward={r}
                progress={progressMap[r.id] ?? { current: 0, percent: 100 }}
                onEdit={() => { setEditingReward(r); setModalOpen(true); }}
                onDelete={() => setDeleteConfirm(r.id)}
              />
            ))}
          </div>
        </div>
      )}

      {/* ─── In Progress ─── */}
      {inProgress.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-slate-300 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-blue-400" />
            Em Progresso ({inProgress.length})
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {inProgress
              .sort((a, b) => (progressMap[b.id]?.percent ?? 0) - (progressMap[a.id]?.percent ?? 0))
              .map((r) => (
                <RewardCard
                  key={r.id}
                  reward={r}
                  progress={progressMap[r.id] ?? { current: 0, percent: 0 }}
                  onEdit={() => { setEditingReward(r); setModalOpen(true); }}
                  onDelete={() => setDeleteConfirm(r.id)}
                />
              ))}
          </div>
        </div>
      )}

      {/* ─── Modal ─── */}
      {modalOpen && (
        <RewardModal
          reward={editingReward}
          onSave={handleSave}
          onClose={() => { setModalOpen(false); setEditingReward(null); }}
        />
      )}

      {/* ─── Delete Confirm ─── */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-sm w-full shadow-2xl">
            <h3 className="text-base font-bold text-white mb-2">Excluir Recompensa?</h3>
            <p className="text-sm text-slate-400 mb-5">Esta ação não pode ser desfeita.</p>
            <div className="flex items-center justify-end gap-3">
              <button onClick={() => setDeleteConfirm(null)} className="px-4 py-2 text-sm text-slate-300 hover:text-white hover:bg-slate-800 rounded-xl transition-colors">
                Cancelar
              </button>
              <button
                id="confirm-delete-reward-btn"
                onClick={() => handleDelete(deleteConfirm)}
                className="px-4 py-2 text-sm font-medium text-white bg-rose-600 hover:bg-rose-500 rounded-xl transition-colors"
              >
                Excluir
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
