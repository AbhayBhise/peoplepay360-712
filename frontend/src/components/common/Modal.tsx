import React, { useEffect } from 'react';
import { X } from 'lucide-react';

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  children: React.ReactNode;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl';
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  description,
  children,
  maxWidth = 'md',
}) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const maxWidthStyles = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    '2xl': 'max-w-2xl',
    '3xl': 'max-w-3xl',
    '4xl': 'max-w-4xl',
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="min-h-screen px-4 text-center flex items-center justify-center">
        {/* Backdrop */}
        <div
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity animate-fade-in"
          onClick={onClose}
        />

        {/* Modal Dialog */}
        <div
          className={`inline-block w-full ${maxWidthStyles[maxWidth]} my-8 p-6 text-left align-middle transition-all transform bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 shadow-2xl rounded-2xl border border-slate-200 dark:border-slate-800 z-10 animate-scale-in`}
        >
          <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800 mb-5">
            <div>
              {title && <h3 className="text-lg font-bold text-slate-900 dark:text-white tracking-tight">{title}</h3>}
              {description && <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{description}</p>}
            </div>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 p-1.5 rounded-lg transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          <div>{children}</div>
        </div>
      </div>
    </div>
  );
};
