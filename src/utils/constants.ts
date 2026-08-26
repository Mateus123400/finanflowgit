import { CategoryId, CategoryInfo, CategoryTargets } from '../types';

export const CATEGORIES_CONFIG: Record<CategoryId, CategoryInfo> = {
  despesas: {
    id: 'despesas',
    name: 'Despesas',
    defaultPercent: 20,
    color: '#3b82f6', // Electric Blue
    accentBg: 'rgba(59, 130, 246, 0.12)',
    borderColor: 'rgba(59, 130, 246, 0.3)',
    iconName: 'Receipt',
    description: 'Moradia, alimentação, contas fixas e essenciais',
    nature: 'expense',
  },
  investimento: {
    id: 'investimento',
    name: 'Investimento',
    defaultPercent: 20,
    color: '#60a5fa', // Bright Sky Blue
    accentBg: 'rgba(96, 165, 250, 0.12)',
    borderColor: 'rgba(96, 165, 250, 0.3)',
    iconName: 'TrendingUp',
    description: 'Ações, FIIs, Tesouro, Cripto e previdência',
    nature: 'growth',
  },
  conhecimento: {
    id: 'conhecimento',
    name: 'Conhecimento',
    defaultPercent: 10,
    color: '#818cf8', // Indigo Blue
    accentBg: 'rgba(129, 140, 248, 0.12)',
    borderColor: 'rgba(129, 140, 248, 0.3)',
    iconName: 'GraduationCap',
    description: 'Livros, cursos, mentorias, certificações',
    nature: 'purpose',
  },
  doacao: {
    id: 'doacao',
    name: 'Doação',
    defaultPercent: 10,
    color: '#38bdf8', // Cyan Blue
    accentBg: 'rgba(56, 189, 248, 0.12)',
    borderColor: 'rgba(56, 189, 248, 0.3)',
    iconName: 'HeartHandshake',
    description: 'Dízimos, ONGs, ajuda a familiares e caridade',
    nature: 'purpose',
  },
  poupanca: {
    id: 'poupanca',
    name: 'Poupança',
    defaultPercent: 10,
    color: '#2dd4bf', // Teal Cyan
    accentBg: 'rgba(45, 212, 191, 0.12)',
    borderColor: 'rgba(45, 212, 191, 0.3)',
    iconName: 'PiggyBank',
    description: 'Reserva de emergência e objetivos de curto prazo',
    nature: 'security',
  },
  negocios: {
    id: 'negocios',
    name: 'Negócios',
    defaultPercent: 10,
    color: '#f59e0b', // Amber / Gold
    accentBg: 'rgba(245, 158, 11, 0.12)',
    borderColor: 'rgba(245, 158, 11, 0.3)',
    iconName: 'Briefcase',
    description: 'Aporte em negócios/projetos, faturamento e retorno',
    nature: 'business',
  },
};

export const CATEGORY_IDS: CategoryId[] = [
  'despesas',
  'investimento',
  'conhecimento',
  'doacao',
  'poupanca',
  'negocios',
];

export const DEFAULT_TARGETS: CategoryTargets = {
  despesas: 20,
  investimento: 20,
  conhecimento: 10,
  doacao: 10,
  poupanca: 10,
  negocios: 10,
};

export const MONTH_NAMES = [
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

export const MONTH_NAMES_SHORT = [
  'Jan',
  'Fev',
  'Mar',
  'Abr',
  'Mai',
  'Jun',
  'Jul',
  'Ago',
  'Set',
  'Out',
  'Nov',
  'Dez',
];
