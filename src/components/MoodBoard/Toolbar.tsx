
import React, { useState } from 'react';
import { useMoodboardStore } from '@/store/moodboardStore';
import { Download, Image, StickyNote, Music, Palette, Save, Trash, Upload } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';

interface ToolbarProps {
  onExport: () => void;
}

const Toolbar: React.FC<ToolbarProps> = ({ onExport }) => {
  const { addItem, setFilter, clearBoard, items } = useMoodboardStore();
  const [isAddNoteOpen, setIsAddNoteOpen] = useState(false);
  const [isAddSpotifyOpen, setIsAddSpotifyOpen] = useState(false);
  const [spotifyUrl, setSpotifyUrl] = useState('');
  const [noteColor, setNoteColor] = useState('yellow');
  const [notePattern, setNotePattern] = useState('plain');

  // Add a new sticky note
  const addNote = () => {
    const centerX = window.innerWidth / 2 - 100;
    const centerY = window.innerHeight / 2 - 100;
    
    addItem({
      id: `note-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type: 'note',
      content: 'Double click to edit this note',
      position: { x: centerX, y: centerY },
      style: { 
        color: noteColor, 
        pattern: notePattern,
        rotate: Math.floor(Math.random() * 6) - 3 // Random slight rotation
      }
    });
    
    setIsAddNoteOpen(false);
    toast.success('Sticky note added!');
  };

  // Add a Spotify embed
  const addSpotifyEmbed = () => {
    // Validate and convert spotify URL
    let spotifyEmbedUrl = '';
    
    try {
      // Handle different spotify URL formats
      if (spotifyUrl.includes('spotify.com')) {
        // Extract the URI components
        const parts = spotifyUrl.split('/');
        const typeIndex = parts.findIndex(p => p === 'track' || p === 'playlist' || p === 'album');
        
        if (typeIndex !== -1 && typeIndex < parts.length - 1) {
          const type = parts[typeIndex];
          const id = parts[typeIndex + 1].split('?')[0];
          
          spotifyEmbedUrl = `https://open.spotify.com/embed/${type}/${id}`;
        }
      }
      
      if (!spotifyEmbedUrl) {
        toast.error('Invalid Spotify URL. Please use a link from spotify.com');
        return;
      }
      
      const centerX = window.innerWidth / 2 - 150;
      const centerY = window.innerHeight / 2 - 40;
      
      addItem({
        id: `spotify-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        type: 'spotify',
        content: spotifyEmbedUrl,
        position: { x: centerX, y: centerY },
        style: { 
          rotate: Math.floor(Math.random() * 4) - 2 // Random slight rotation
        }
      });
      
      setIsAddSpotifyOpen(false);
      setSpotifyUrl('');
      toast.success('Spotify player added!');
    } catch (error) {
      console.error('Error adding spotify embed:', error);
      toast.error('Failed to add Spotify player. Please check the URL.');
    }
  };

  // Save board to localStorage
  const saveBoard = () => {
    try {
      localStorage.setItem('moodboard', JSON.stringify(items));
      toast.success('Moodboard saved successfully!');
    } catch (error) {
      console.error('Error saving board:', error);
      toast.error('Failed to save moodboard.');
    }
  };

  // Load board from localStorage
  const loadBoard = () => {
    try {
      const savedBoard = localStorage.getItem('moodboard');
      if (savedBoard) {
        const savedItems = JSON.parse(savedBoard);
        if (savedItems.length > 0) {
          // Clear the board first and then load the saved items
          // This is handled in the store directly
          useMoodboardStore.getState().loadSavedBoard(savedItems);
          toast.success('Moodboard loaded successfully!');
        } else {
          toast.info('No saved moodboard found.');
        }
      } else {
        toast.info('No saved moodboard found.');
      }
    } catch (error) {
      console.error('Error loading board:', error);
      toast.error('Failed to load moodboard.');
    }
  };

  // Handle file input change for direct upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    
    Array.from(files).forEach(file => {
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (event) => {
          const imageUrl = event.target?.result as string;
          
          // Add image to the center of the board
          const centerX = window.innerWidth / 2 - 125;
          const centerY = window.innerHeight / 2 - 125;
          
          addItem({
            id: `image-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            type: 'image',
            content: imageUrl,
            originalImage: imageUrl,
            position: { x: centerX, y: centerY },
            size: { width: 250, height: 250 },
            style: {
              rotate: Math.floor(Math.random() * 6) - 3 // Random slight rotation
            }
          });
        };
        reader.readAsDataURL(file);
      }
    });
    
    // Reset the file input
    e.target.value = '';
  };

  return (
    <>
      {/* Main toolbar */}
      <div className="fixed bottom-8 left-1/2 transform -translate-x-1/2 flex items-center space-x-4 p-3 bg-white/90 backdrop-blur-sm rounded-full shadow-lg">
        {/* Add image */}
        <label className="toolbar-button cursor-pointer">
          <input 
            type="file" 
            accept="image/*" 
            className="hidden" 
            onChange={handleFileUpload}
            multiple
          />
          <Image size={20} className="text-gray-700" />
        </label>
        
        {/* Add note */}
        <button className="toolbar-button" onClick={() => setIsAddNoteOpen(true)}>
          <StickyNote size={20} className="text-gray-700" />
        </button>
        
        {/* Add Spotify */}
        <button className="toolbar-button" onClick={() => setIsAddSpotifyOpen(true)}>
          <Music size={20} className="text-gray-700" />
        </button>
        
        {/* Filters button */}
        <div className="group relative">
          <button className="toolbar-button">
            <Palette size={20} className="text-gray-700" />
          </button>
          
          {/* Filter dropdown */}
          <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 bg-white/90 backdrop-blur-sm p-3 rounded-lg shadow-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none group-hover:pointer-events-auto">
            <div className="flex flex-col space-y-2">
              <button 
                className="filter-button"
                onClick={() => setFilter('filter-none')}
              >
                Default
              </button>
              <button 
                className="filter-button"
                onClick={() => setFilter('filter-vintage')}
              >
                Vintage
              </button>
              <button 
                className="filter-button"
                onClick={() => setFilter('filter-cozy')}
              >
                Cozy
              </button>
              <button 
                className="filter-button"
                onClick={() => setFilter('filter-pastel')}
              >
                Pastel
              </button>
              <button 
                className="filter-button"
                onClick={() => setFilter('filter-mono')}
              >
                Monochrome
              </button>
            </div>
          </div>
        </div>
        
        {/* Save */}
        <button className="toolbar-button" onClick={saveBoard}>
          <Save size={20} className="text-gray-700" />
        </button>
        
        {/* Load */}
        <button className="toolbar-button" onClick={loadBoard}>
          <Upload size={20} className="text-gray-700" />
        </button>
        
        {/* Export */}
        <button className="toolbar-button" onClick={onExport}>
          <Download size={20} className="text-gray-700" />
        </button>
        
        {/* Clear board */}
        <button className="toolbar-button" onClick={() => {
          if (confirm('Are you sure you want to clear the board? This cannot be undone.')) {
            clearBoard();
            toast.info('Moodboard cleared.');
          }
        }}>
          <Trash size={20} className="text-gray-700" />
        </button>
      </div>
      
      {/* Add Note Dialog */}
      <Dialog open={isAddNoteOpen} onOpenChange={setIsAddNoteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Sticky Note</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            {/* Note color selection */}
            <div>
              <label className="text-sm font-medium mb-2 block">Choose color</label>
              <div className="flex space-x-2">
                {['yellow', 'blue', 'pink', 'green', 'purple', 'peach'].map(color => (
                  <button
                    key={color}
                    className={`w-8 h-8 rounded-full bg-note-${color} ${noteColor === color ? 'ring-2 ring-primary ring-offset-2' : ''}`}
                    onClick={() => setNoteColor(color)}
                  />
                ))}
              </div>
            </div>
            
            {/* Note pattern selection */}
            <div>
              <label className="text-sm font-medium mb-2 block">Choose pattern</label>
              <div className="flex space-x-2">
                <button
                  className={`p-2 border rounded ${notePattern === 'plain' ? 'bg-secondary' : 'bg-white'}`}
                  onClick={() => setNotePattern('plain')}
                >
                  Plain
                </button>
                <button
                  className={`p-2 border rounded ${notePattern === 'lined' ? 'bg-secondary' : 'bg-white'}`}
                  onClick={() => setNotePattern('lined')}
                >
                  Lined
                </button>
                <button
                  className={`p-2 border rounded ${notePattern === 'grid' ? 'bg-secondary' : 'bg-white'}`}
                  onClick={() => setNotePattern('grid')}
                >
                  Grid
                </button>
              </div>
            </div>
            
            <Button onClick={addNote}>Add Note</Button>
          </div>
        </DialogContent>
      </Dialog>
      
      {/* Add Spotify Dialog */}
      <Dialog open={isAddSpotifyOpen} onOpenChange={setIsAddSpotifyOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Spotify Track</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div>
              <label className="text-sm font-medium mb-2 block">
                Paste a Spotify URL (track, album, or playlist)
              </label>
              <Input
                placeholder="https://open.spotify.com/track/..."
                value={spotifyUrl}
                onChange={(e) => setSpotifyUrl(e.target.value)}
              />
            </div>
            <Button onClick={addSpotifyEmbed}>Add Spotify Player</Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default Toolbar;
