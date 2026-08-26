import React from 'react';
import { AlertTriangle, Trash2, X } from 'lucide-react';
import { formatCurrency } from '../utils/formatters';

interface DeleteConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  itemDescription: string;
  itemAmount?: number;
  itemCategoryName?: string;
}

export const DeleteConfirmModal: React.FC<DeleteConfirmModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  itemDescription,
  itemAmount,
  itemCategoryName,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        id="delete-confirm-modal-container"
        className="bg-slate-900 border border-slate-800 text-slate-100 w-full max-w-md rounded-2xl shadow-2xl overflow-hidden p-6 space-y-4"
      >
        <div className="flex items-start gap-4">
          <div className="p-3 rounded-2xl bg-rose-500/10 text-rose-400 border border-rose-500/20 shrink-0">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-base font-semibold text-white">{title}</h3>
            <p className="text-xs text-slate-400 mt-1">
              Esta ação removerá o registro permanentemente do mês. Deseja continuar?
            </p>
          </div>
          <button
            id="close-delete-modal-btn"
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Item Summary Box */}
        <div className="p-3.5 bg-slate-950/60 rounded-xl border border-slate-800 space-y-1 text-xs">
          <div className="flex justify-between items-center text-slate-300 font-medium">
            <span className="truncate max-w-[200px]">{itemDescription}</span>
            {itemAmount !== undefined && (
              <span className="text-rose-400 font-semibold">{formatCurrency(itemAmount)}</span>
            )}
          </div>
          {itemCategoryName && (
            <div className="text-[11px] text-slate-500">
              Categoria: <span className="text-slate-400">{itemCategoryName}</span>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            id="cancel-delete-btn"
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-slate-300 hover:text-white hover:bg-slate-800 rounded-xl transition-colors"
          >
            Cancelar
          </button>
          <button
            id="confirm-delete-btn"
            type="button"
            onClick={() => {
              onConfirm();
              onClose();
            }}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-rose-600 hover:bg-rose-500 active:bg-rose-700 rounded-xl shadow-lg shadow-rose-600/20 transition-all"
          >
            <Trash2 className="w-4 h-4" />
            Excluir Definitivamente
          </button>
        </div>
      </div>
    </div>
  );
};
