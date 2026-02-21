import { create } from 'zustand';

interface EditState {
    activeAccordion: string | null;
    setActiveAccordion: (activeAccordion: string | null) => void;
}

export const useEditStore = create<EditState>((set, get) => ({
  // Initial state
  activeAccordion: null,

  // State updates
  setActiveAccordion: (activeAccordion: string | null) => set({ activeAccordion }),
}));
