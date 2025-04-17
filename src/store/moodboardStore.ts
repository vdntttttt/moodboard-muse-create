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

interface SavedMoodboard {
  name: string;
  items: MoodboardItem[];
  createdAt: number;
}

interface MoodboardState {
  items: MoodboardItem[];
  activeItemId: string | null;
  filter: string;
  currentBoardName: string;
  savedBoards: SavedMoodboard[];
  addItem: (item: MoodboardItem) => void;
  updateItem: (id: string, updates: Partial<MoodboardItem>) => void;
  removeItem: (id: string) => void;
  setActiveItemId: (id: string | null) => void;
  setFilter: (filter: string) => void;
  clearBoard: () => void;
  saveBoard: (name: string) => void;
  loadBoard: (name: string) => void;
  setCurrentBoardName: (name: string) => void;
  deleteSavedBoard: (name: string) => void;
}

export const useMoodboardStore = create<MoodboardState>((set, get) => ({
  items: [],
  activeItemId: null,
  filter: 'filter-none',
  currentBoardName: 'Untitled Board',
  savedBoards: [],
  
  addItem: (item) => set((state) => ({
    items: [...state.items, item],
    activeItemId: item.id
  })),
  
  updateItem: (id, updates) => set((state) => ({
    items: state.items.map((item) => 
      item.id === id ? { ...item, ...updates } : item
    )
  })),
  
  removeItem: (id) => set((state) => ({
    items: state.items.filter((item) => item.id !== id),
    activeItemId: state.activeItemId === id ? null : state.activeItemId
  })),
  
  setActiveItemId: (id) => set({ activeItemId: id }),
  
  setFilter: (filter) => set({ filter }),
  
  clearBoard: () => set({ 
    items: [], 
    activeItemId: null,
    currentBoardName: 'Untitled Board'
  }),
  
  saveBoard: (name) => {
    const state = get();
    const board: SavedMoodboard = {
      name,
      items: state.items,
      createdAt: Date.now()
    };

    let savedBoards = [];
    try {
      const savedData = localStorage.getItem('moodboards');
      if (savedData) {
        savedBoards = JSON.parse(savedData);
      }

      const existingIndex = savedBoards.findIndex((b: SavedMoodboard) => b.name === name);
      if (existingIndex >= 0) {
        savedBoards[existingIndex] = board;
      } else {
        savedBoards.push(board);
      }

      localStorage.setItem('moodboards', JSON.stringify(savedBoards));
      set({ 
        savedBoards,
        currentBoardName: name
      });
      toast.success(`Saved board: ${name}`);
    } catch (error) {
      console.error('Error saving board:', error);
      toast.error('Failed to save board');
    }
  },
  
  loadBoard: (name) => {
    try {
      const savedData = localStorage.getItem('moodboards');
      if (savedData) {
        const boards = JSON.parse(savedData);
        const board = boards.find((b: SavedMoodboard) => b.name === name);
        if (board) {
          set({ 
            items: board.items,
            activeItemId: null,
            currentBoardName: name
          });
          toast.success(`Loaded board: ${name}`);
        }
      }
    } catch (error) {
      console.error('Error loading board:', error);
      toast.error('Failed to load board');
    }
  },
  
  setCurrentBoardName: (name) => set({ currentBoardName: name }),
  
  deleteSavedBoard: (name) => {
    try {
      const savedData = localStorage.getItem('moodboards');
      if (savedData) {
        let boards = JSON.parse(savedData);
        boards = boards.filter((b: SavedMoodboard) => b.name !== name);
        localStorage.setItem('moodboards', JSON.stringify(boards));
        set({ savedBoards: boards });
        toast.success(`Deleted board: ${name}`);
      }
    } catch (error) {
      console.error('Error deleting board:', error);
      toast.error('Failed to delete board');
    }
  }
}));

try {
  const savedData = localStorage.getItem('moodboards');
  if (savedData) {
    const savedBoards = JSON.parse(savedData);
    useMoodboardStore.setState({ savedBoards });
  }
} catch (error) {
  console.error('Error loading saved moodboards:', error);
}
