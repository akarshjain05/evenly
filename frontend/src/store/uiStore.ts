import { create } from 'zustand';

interface UIState {
  isAddExpenseOpen: boolean;
  isSettleUpOpen: boolean;
  activeGroupId: string | null;
  openAddExpense: () => void;
  closeAddExpense: () => void;
  openSettleUp: () => void;
  closeSettleUp: () => void;
  setActiveGroup: (id: string | null) => void;
}

export const useUIStore = create<UIState>((set) => ({
  isAddExpenseOpen: false,
  isSettleUpOpen: false,
  activeGroupId: null,
  openAddExpense: () => set({ isAddExpenseOpen: true }),
  closeAddExpense: () => set({ isAddExpenseOpen: false }),
  openSettleUp: () => set({ isSettleUpOpen: true }),
  closeSettleUp: () => set({ isSettleUpOpen: false }),
  setActiveGroup: (id) => set({ activeGroupId: id }),
}));
