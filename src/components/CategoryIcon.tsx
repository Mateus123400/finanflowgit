import React from 'react';
import {
  Receipt,
  TrendingUp,
  GraduationCap,
  HeartHandshake,
  PiggyBank,
  Briefcase,
  Wallet,
  DollarSign,
  PieChart,
  HelpCircle,
} from 'lucide-react';
import { CategoryId } from '../types';

interface CategoryIconProps {
  categoryId?: CategoryId | string;
  className?: string;
  size?: number;
}

export const CategoryIcon: React.FC<CategoryIconProps> = ({
  categoryId,
  className = 'w-5 h-5',
  size,
}) => {
  switch (categoryId) {
    case 'despesas':
      return <Receipt className={className} size={size} />;
    case 'investimento':
      return <TrendingUp className={className} size={size} />;
    case 'conhecimento':
      return <GraduationCap className={className} size={size} />;
    case 'doacao':
      return <HeartHandshake className={className} size={size} />;
    case 'poupanca':
      return <PiggyBank className={className} size={size} />;
    case 'negocios':
      return <Briefcase className={className} size={size} />;
    case 'renda':
      return <DollarSign className={className} size={size} />;
    case 'income':
      return <DollarSign className={className} size={size} />;
    case 'wallet':
      return <Wallet className={className} size={size} />;
    case 'summary':
      return <PieChart className={className} size={size} />;
    default:
      return <HelpCircle className={className} size={size} />;
  }
};
