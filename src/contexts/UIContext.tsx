'use client';

/**
 * UI Context — React Context for UI state
 * Manages theme, panel visibility, modals, and other UI concerns
 */

import { createContext, useContext, useState, useCallback, ReactNode } from 'react';

// ============================================================================
// Types
// ============================================================================

type Panel = 'agents' | 'behaviors' | 'environment' | 'parameters';

interface UIState {
  // Panel visibility
  leftPanelOpen: boolean;
  rightPanelOpen: boolean;
  activePanel: Panel;

  // Modals
  activeModal: string | null;
  modalData: any;

  // Theme
  theme: 'light' | 'dark';
}

interface UIActions {
  // Panels
  toggleLeftPanel: () => void;
  toggleRightPanel: () => void;
  setActivePanel: (panel: Panel) => void;

  // Modals
  openModal: (modal: string, data?: any) => void;
  closeModal: () => void;

  // Theme
  toggleTheme: () => void;
  setTheme: (theme: 'light' | 'dark') => void;
}

type UIContextValue = UIState & UIActions;

// ============================================================================
// Context
// ============================================================================

const UIContext = createContext<UIContextValue | null>(null);

// ============================================================================
// Provider
// ============================================================================

interface UIProviderProps {
  children: ReactNode;
}

export function UIProvider({ children }: UIProviderProps) {
  // Panel state
  const [leftPanelOpen, setLeftPanelOpen] = useState(true);
  const [rightPanelOpen, setRightPanelOpen] = useState(true);
  const [activePanel, setActivePanel] = useState<Panel>('agents');

  // Modal state
  const [activeModal, setActiveModal] = useState<string | null>(null);
  const [modalData, setModalData] = useState<any>(null);

  // Theme state
  const [theme, setTheme] = useState<'light' | 'dark'>('dark');

  // Panel actions
  const toggleLeftPanel = useCallback(() => setLeftPanelOpen((v) => !v), []);
  const toggleRightPanel = useCallback(() => setRightPanelOpen((v) => !v), []);

  // Modal actions
  const openModal = useCallback((modal: string, data?: any) => {
    setActiveModal(modal);
    setModalData(data ?? null);
  }, []);

  const closeModal = useCallback(() => {
    setActiveModal(null);
    setModalData(null);
  }, []);

  // Theme actions
  const toggleTheme = useCallback(() => {
    setTheme((t) => (t === 'light' ? 'dark' : 'light'));
  }, []);

  const value: UIContextValue = {
    // State
    leftPanelOpen,
    rightPanelOpen,
    activePanel,
    activeModal,
    modalData,
    theme,

    // Actions
    toggleLeftPanel,
    toggleRightPanel,
    setActivePanel,
    openModal,
    closeModal,
    toggleTheme,
    setTheme,
  };

  return <UIContext.Provider value={value}>{children}</UIContext.Provider>;
}

// ============================================================================
// Hook
// ============================================================================

export function useUI(): UIContextValue {
  const context = useContext(UIContext);
  if (!context) {
    throw new Error('useUI must be used within a UIProvider');
  }
  return context;
}
