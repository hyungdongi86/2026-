import React from 'react';
import { AlertTriangle, Trash2, Info, X } from 'lucide-react';

interface ConfirmModalProps {
  isOpen: boolean;
  title?: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'danger' | 'warning' | 'info';
  onConfirm: () => void;
  onClose: () => void;
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen,
  title = '확인',
  message,
  confirmLabel = '확인',
  cancelLabel = '취소',
  variant = 'danger',
  onConfirm,
  onClose,
}) => {
  if (!isOpen) return null;

  const handleConfirm = () => {
    onConfirm();
    onClose();
  };

  const getVariantStyles = () => {
    switch (variant) {
      case 'danger':
        return {
          iconBg: 'bg-red-100 text-red-600',
          confirmBtn: 'bg-red-600 hover:bg-red-700 text-white',
          Icon: Trash2,
        };
      case 'warning':
        return {
          iconBg: 'bg-amber-100 text-amber-600',
          confirmBtn: 'bg-amber-600 hover:bg-amber-700 text-white',
          Icon: AlertTriangle,
        };
      default:
        return {
          iconBg: 'bg-emerald-100 text-emerald-700',
          confirmBtn: 'bg-emerald-600 hover:bg-emerald-700 text-white',
          Icon: Info,
        };
    }
  };

  const { iconBg, confirmBtn, Icon } = getVariantStyles();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden relative p-6">
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-1 rounded-lg transition"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-start space-x-4">
          <div className={`p-3 rounded-2xl shrink-0 ${iconBg}`}>
            <Icon className="w-6 h-6" />
          </div>

          <div className="flex-1 pt-0.5">
            <h4 className="text-base font-bold text-slate-900 mb-1">{title}</h4>
            <p className="text-xs text-slate-600 leading-relaxed whitespace-pre-line">{message}</p>
          </div>
        </div>

        <div className="mt-6 flex items-center justify-end space-x-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition cursor-pointer"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            className={`px-4 py-2 text-xs font-bold rounded-xl shadow-xs transition cursor-pointer ${confirmBtn}`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
};
