import { create } from 'zustand';

export type Page =
  | 'login'
  | 'dashboard'
  | 'clients'
  | 'new-client'
  | 'loans'
  | 'new-loan'
  | 'loan-detail'
  | 'register-payment'
  | 'notifications';

interface User {
  id: string;
  email: string;
  name: string;
  role: string;
}

interface AppState {
  // Auth
  user: User | null;
  isAuthenticated: boolean;
  login: (user: User) => void;
  logout: () => void;

  // Navigation
  currentPage: Page;
  setCurrentPage: (page: Page) => void;

  // Selected entities
  selectedLoanId: string | null;
  setSelectedLoanId: (id: string | null) => void;
  selectedClientId: string | null;
  setSelectedClientId: (id: string | null) => void;

  // Sidebar
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  toggleSidebar: () => void;

  // Refresh triggers
  refreshKey: number;
  triggerRefresh: () => void;
}

export const useAppStore = create<AppState>((set) => ({
  // Auth
  user: null,
  isAuthenticated: false,
  login: (user) => set({ user, isAuthenticated: true, currentPage: 'dashboard' }),
  logout: () => set({ user: null, isAuthenticated: false, currentPage: 'login' }),

  // Navigation
  currentPage: 'login',
  setCurrentPage: (page) => set({ currentPage: page }),

  // Selected entities
  selectedLoanId: null,
  setSelectedLoanId: (id) => set({ selectedLoanId: id }),
  selectedClientId: null,
  setSelectedClientId: (id) => set({ selectedClientId: id }),

  // Sidebar
  sidebarOpen: true,
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
  toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),

  // Refresh
  refreshKey: 0,
  triggerRefresh: () => set((s) => ({ refreshKey: s.refreshKey + 1 })),
}));
