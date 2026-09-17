import { create } from 'zustand';

type DialogType = 'alert' | 'confirm' | 'prompt';

interface DialogConfig {
  type: DialogType;
  title: string;
  message?: string;
  defaultValue?: string;
  confirmText?: string;
  cancelText?: string;
  danger?: boolean;
}

interface DialogState {
  isOpen: boolean;
  config: DialogConfig | null;
  resolve: ((value: any) => void) | null;
}

interface UIState {
  isAddExpenseOpen: boolean;
  isSettleUpOpen: boolean;
  isSettingsOpen: boolean;
  activeGroupId: string | null;
  dialog: DialogState;
  
  openAddExpense: () => void;
  closeAddExpense: () => void;
  openSettleUp: () => void;
  closeSettleUp: () => void;
  openSettings: () => void;
  closeSettings: () => void;
  setActiveGroup: (id: string | null) => void;
  
  showAlert: (title: string, message?: string) => Promise<void>;
  showConfirm: (title: string, message?: string, options?: { confirmText?: string; danger?: boolean }) => Promise<boolean>;
  showPrompt: (title: string, defaultValue?: string) => Promise<string | null>;
  closeDialog: () => void;
}

export const useUIStore = create<UIState>((set) => ({
  isAddExpenseOpen: false,
  isSettleUpOpen: false,
  isSettingsOpen: false,
  activeGroupId: null,
  dialog: { isOpen: false, config: null, resolve: null },

  openAddExpense: () => set({ isAddExpenseOpen: true }),
  closeAddExpense: () => set({ isAddExpenseOpen: false }),
  openSettleUp: () => set({ isSettleUpOpen: true }),
  closeSettleUp: () => set({ isSettleUpOpen: false }),
  openSettings: () => set({ isSettingsOpen: true }),
  closeSettings: () => set({ isSettingsOpen: false }),
  setActiveGroup: (id) => set({ activeGroupId: id }),

  showAlert: (title, message) => {
    return new Promise((resolve) => {
      set({ dialog: { isOpen: true, config: { type: 'alert', title, message }, resolve } });
    });
  },
  
  showConfirm: (title, message, options) => {
    return new Promise((resolve) => {
      set({ 
        dialog: { 
          isOpen: true, 
          config: { type: 'confirm', title, message, ...options }, 
          resolve 
        } 
      });
    });
  },
  
  showPrompt: (title, defaultValue) => {
    return new Promise((resolve) => {
      set({ dialog: { isOpen: true, config: { type: 'prompt', title, defaultValue }, resolve } });
    });
  },
  
  closeDialog: () => set({ dialog: { isOpen: false, config: null, resolve: null } }),
}));
