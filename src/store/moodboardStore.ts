
import { create } from 'zustand';
import { toast } from 'sonner';

// Type definitions
export interface MoodboardItem {
  id: string;
  type: 'image' | 'note' | 'spotify';
  content: string;
  position: { x: number; y: number };
  originalImage?: string;
  size?: { width: number; height: number };
  style?: {
    color?: string;
    pattern?: 'plain' | 'lined' | 'grid';
    rotate?: number;
    [key: string]: any;
  };
}

interface MoodboardState {
  items: MoodboardItem[];
  activeItemId: string | null;
  filter: string;
  addItem: (item: MoodboardItem) => void;
  updateItem: (id: string, updates: Partial<MoodboardItem>) => void;
  removeItem: (id: string) => void;
  setActiveItemId: (id: string | null) => void;
  setFilter: (filter: string) => void;
  clearBoard: () => void;
  loadSavedBoard: (items: MoodboardItem[]) => void;
}

// Create the store
export const useMoodboardStore = create<MoodboardState>((set) => ({
  items: [],
  activeItemId: null,
  filter: 'filter-none',
  
  // Add a new item to the moodboard
  addItem: (item) => set((state) => ({
    items: [...state.items, item],
    activeItemId: item.id // Set as active when added
  })),
  
  // Update an existing item
  updateItem: (id, updates) => set((state) => ({
    items: state.items.map((item) => 
      item.id === id ? { ...item, ...updates } : item
    )
  })),
  
  // Remove an item from the moodboard
  removeItem: (id) => set((state) => ({
    items: state.items.filter((item) => item.id !== id),
    activeItemId: state.activeItemId === id ? null : state.activeItemId
  })),
  
  // Set the active item
  setActiveItemId: (id) => set({ activeItemId: id }),
  
  // Set the filter for the entire board
  setFilter: (filter) => set({ filter }),
  
  // Clear the entire board
  clearBoard: () => set({ items: [], activeItemId: null }),
  
  // Load a saved board from localStorage
  loadSavedBoard: (items) => {
    set({ items, activeItemId: null });
  }
}));

// Initialize with saved data if available
try {
  const savedData = localStorage.getItem('moodboard');
  if (savedData) {
    const parsedData = JSON.parse(savedData);
    if (Array.isArray(parsedData) && parsedData.length > 0) {
      useMoodboardStore.setState({ items: parsedData });
    }
  }
} catch (error) {
  console.error('Error loading saved moodboard data:', error);
}
