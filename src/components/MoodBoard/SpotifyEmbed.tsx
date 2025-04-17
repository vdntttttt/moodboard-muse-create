
import React, { useRef, useEffect } from 'react';
import { useMoodboardStore, MoodboardItem } from '@/store/moodboardStore';
import { Trash } from 'lucide-react';

interface SpotifyEmbedProps {
  item: MoodboardItem;
  isActive: boolean;
}

const SpotifyEmbed: React.FC<SpotifyEmbedProps> = ({ item, isActive }) => {
  const { updateItem, removeItem, setActiveItemId } = useMoodboardStore();
  const elementRef = useRef<HTMLDivElement>(null);
  
  // Handle drag start
  const handleDragStart = (e: React.DragEvent<HTMLDivElement>) => {
    if (!isActive) setActiveItemId(item.id);
    
    // Store initial mouse position and element position
    const rect = e.currentTarget.getBoundingClientRect();
    const offsetX = e.clientX - rect.left;
    const offsetY = e.clientY - rect.top;
    
    e.dataTransfer.setDragImage(new Image(), 0, 0); // Hide default drag image
    
    // Store offset in data transfer
    e.dataTransfer.setData('text/plain', JSON.stringify({ 
      id: item.id,
      offsetX, 
      offsetY 
    }));
  };

  // Handle drag over
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  // Handle drop for repositioning
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    
    try {
      const data = JSON.parse(e.dataTransfer.getData('text/plain'));
      const { id, offsetX, offsetY } = data;
      
      if (id === item.id) {
        // Get the parent canvas coordinates
        const canvas = e.currentTarget.closest('[class*="absolute inset-0"]');
        if (canvas) {
          const canvasRect = canvas.getBoundingClientRect();
          const newX = e.clientX - canvasRect.left - offsetX;
          const newY = e.clientY - canvasRect.top - offsetY;
          
          updateItem(item.id, {
            position: { x: newX, y: newY }
          });
        }
      }
    } catch (error) {
      console.error('Error handling drop:', error);
    }
  };

  // Handle click to activate
  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setActiveItemId(item.id);
  };

  // Update position when dragging
  useEffect(() => {
    const el = elementRef.current;
    if (!el) return;
    
    el.style.left = `${item.position.x}px`;
    el.style.top = `${item.position.y}px`;
  }, [item.position]);

  return (
    <div
      ref={elementRef}
      className={`moodboard-item ${isActive ? 'ring-2 ring-primary' : ''}`}
      style={{ 
        zIndex: isActive ? 100 : 10,
        transform: `rotate(${item.style?.rotate || 0}deg)`
      }}
      onClick={handleClick}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      draggable={isActive}
    >
      <div className="relative">
        {/* Decorative tape at top */}
        <div className="tape" />
        
        {/* Spotify iframe */}
        <div className="spotify-embed">
          <iframe 
            src={item.content}
            width="300" 
            height="80" 
            frameBorder="0" 
            allowTransparency={true} 
            allow="encrypted-media"
            title="Spotify player"
          ></iframe>
        </div>
      </div>

      {/* Controls (only show when active) */}
      {isActive && (
        <div className="absolute -bottom-10 left-1/2 transform -translate-x-1/2 flex space-x-2">
          <button 
            className="p-2 bg-white rounded-full shadow-md hover:bg-gray-100 hover:bg-red-100"
            onClick={() => removeItem(item.id)}
          >
            <Trash size={16} className="text-red-500" />
          </button>
        </div>
      )}
    </div>
  );
};

export default SpotifyEmbed;
