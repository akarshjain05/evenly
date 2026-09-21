import { create } from 'zustand';

export interface BeforeInstallPromptEvent extends Event {
  readonly platforms: Array<string>;
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed',
    platform: string
  }>;
  prompt(): Promise<void>;
}


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
  resolve: ((value: boolean | string | null | void) => void) | null;
}

interface UIState {
  isAddExpenseOpen: boolean;
  isSettleUpOpen: boolean;
  activeGroupId: string | null;
  dialog: DialogState;
  installPromptEvent: BeforeInstallPromptEvent | null;
  isDarkMode: boolean;
  
  openAddExpense: () => void;
  closeAddExpense: () => void;
  openSettleUp: () => void;
  closeSettleUp: () => void;
  setActiveGroup: (id: string | null) => void;
  setInstallPromptEvent: (event: BeforeInstallPromptEvent | null) => void;
  toggleDarkMode: () => void;
  initTheme: () => void;
  
  showAlert: (title: string, message?: string) => Promise<void>;
  showConfirm: (title: string, message?: string, options?: { confirmText?: string; danger?: boolean }) => Promise<boolean>;
  showPrompt: (title: string, defaultValue?: string) => Promise<string | null>;
  closeDialog: () => void;
}

export const useUIStore = create<UIState>((set, get) => ({
  isAddExpenseOpen: false,
  isSettleUpOpen: false,
  activeGroupId: null,
  dialog: { isOpen: false, config: null, resolve: null },
  installPromptEvent: null,
  isDarkMode: localStorage.getItem('theme') === 'dark',

  openAddExpense: () => set({ isAddExpenseOpen: true }),
  closeAddExpense: () => set({ isAddExpenseOpen: false }),
  openSettleUp: () => set({ isSettleUpOpen: true }),
  closeSettleUp: () => set({ isSettleUpOpen: false }),
  setActiveGroup: (id) => set({ activeGroupId: id }),
  setInstallPromptEvent: (event) => set({ installPromptEvent: event }),

  initTheme: () => {
    const isDark = localStorage.getItem('theme') === 'dark' || (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches);
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    set({ isDarkMode: isDark });
  },

  toggleDarkMode: () => {
    const isDark = !get().isDarkMode;
    set({ isDarkMode: isDark });
    if (isDark) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  },

  showAlert: (title, message) => {
    return new Promise((resolve) => {
      set({ dialog: { isOpen: true, config: { type: 'alert', title, message }, resolve: resolve as any } });
    });
  },
  
  showConfirm: (title, message, options) => {
    return new Promise((resolve) => {
      set({ 
        dialog: { 
          isOpen: true, 
          config: { type: 'confirm', title, message, ...options }, 
          resolve: resolve as any 
        } 
      });
    });
  },
  
  showPrompt: (title, defaultValue) => {
    return new Promise((resolve) => {
      set({ dialog: { isOpen: true, config: { type: 'prompt', title, defaultValue }, resolve: resolve as any } });
    });
  },
  
  closeDialog: () => {
    const dialog = get().dialog;
    if (dialog.resolve) {
      if (dialog.config?.type === 'confirm') dialog.resolve(false);
      else if (dialog.config?.type === 'prompt') dialog.resolve(null);
      else dialog.resolve();
    }
    set({ dialog: { isOpen: false, config: null, resolve: null } });
  },
}));
