import { create } from 'zustand';

interface UIState {
  isAddExpenseOpen: boolean;
  isSettleUpOpen: boolean;
  isSettingsOpen: boolean;
  activeGroupId: string | null;
  openAddExpense: () => void;
  closeAddExpense: () => void;
  openSettleUp: () => void;
  closeSettleUp: () => void;
  openSettings: () => void;
  closeSettings: () => void;
  setActiveGroup: (id: string | null) => void;
}

export const useUIStore = create<UIState>((set) => ({
  isAddExpenseOpen: false,
  isSettleUpOpen: false,
  isSettingsOpen: false,
  activeGroupId: null,
  openAddExpense: () => set({ isAddExpenseOpen: true }),
  closeAddExpense: () => set({ isAddExpenseOpen: false }),
  openSettleUp: () => set({ isSettleUpOpen: true }),
  closeSettleUp: () => set({ isSettleUpOpen: false }),
  openSettings: () => set({ isSettingsOpen: true }),
  closeSettings: () => set({ isSettingsOpen: false }),
  setActiveGroup: (id) => set({ activeGroupId: id }),
}));
