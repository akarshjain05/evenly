import { useState, useEffect } from 'react';
import { useUIStore } from '../../store/uiStore';

export default function DialogModal() {
  const { dialog, closeDialog } = useUIStore();
  const [inputValue, setInputValue] = useState('');

  useEffect(() => {
    if (dialog.isOpen && dialog.config?.type === 'prompt') {
      setInputValue(dialog.config.defaultValue || '');
    }
  }, [dialog.isOpen, dialog.config]);

  if (!dialog.isOpen || !dialog.config) return null;

  const { type, title, message, confirmText = 'OK', cancelText = 'Cancel', danger = false } = dialog.config;

  const handleConfirm = () => {
    if (type === 'prompt') {
      dialog.resolve?.(inputValue);
    } else {
      dialog.resolve?.(true);
    }
    closeDialog();
  };

  const handleCancel = () => {
    if (type === 'prompt') {
      dialog.resolve?.(null);
    } else {
      dialog.resolve?.(false);
    }
    closeDialog();
  };

  return (
    <div role="dialog" aria-modal="true" className="fixed inset-0 bg-black/40 z-[100] flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div 
        className="bg-paper w-full max-w-sm rounded-[20px] shadow-xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-200"
        onClick={e => e.stopPropagation()}
      >
        <div className="p-6">
          <h2 className="text-xl font-display font-semibold text-ink m-0 mb-2">{title}</h2>
          {message && <p className="text-[15px] text-ink-soft m-0 mb-4">{message}</p>}
          
          {type === 'prompt' && (
            <input
              type="text"
              autoFocus
              className="input-field mt-2"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleConfirm()}
            />
          )}
        </div>
        
        <div className="px-6 py-4 bg-paper-dim border-t border-line-dark flex justify-end gap-3">
          {type !== 'alert' && (
            <button 
              onClick={handleCancel}
              className="px-4 py-2 text-[14px] font-medium text-ink-soft hover:text-ink transition-colors cursor-pointer bg-transparent border-none"
            >
              {cancelText}
            </button>
          )}
          <button 
            onClick={handleConfirm}
            className={`px-5 py-2 text-[14px] font-medium text-white rounded-xl transition-colors cursor-pointer border-none ${
              danger ? 'bg-danger hover:bg-opacity-90' : 'bg-primary hover:bg-[#112F22]'
            }`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
