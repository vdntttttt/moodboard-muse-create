import React, { useRef, useEffect, useState } from 'react';
import { useMoodboardStore, MoodboardItem } from '@/store/moodboardStore';
import { Trash, Move, ZoomIn, ZoomOut, ImageOff } from 'lucide-react';
import { removeBackgroundFromImage } from '@/utils/backgroundRemoval';
import { toast } from 'sonner';

interface UploadedImageProps {
  item: MoodboardItem;
  isActive: boolean;
}

const UploadedImage: React.FC<UploadedImageProps> = ({ item, isActive }) => {
  const { updateItem, removeItem, setActiveItemId } = useMoodboardStore();
  const elementRef = useRef<HTMLDivElement>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  
  // Handle drag start
  const handleDragStart = (e: React.DragEvent<HTMLDivElement>) => {
    e.stopPropagation();
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
      offsetY,
      type: 'move-image' // Add type to identify move operation
    }));
  };

  // Handle drag over
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  // Handle drop for repositioning
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    try {
      const data = JSON.parse(e.dataTransfer.getData('text/plain'));
      const { id, offsetX, offsetY, type } = data;
      
      if (id === item.id && type === 'move-image') {
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

  // Handle image background removal
  const handleRemoveBackground = async () => {
    if (!item.originalImage) return;
    
    setIsProcessing(true);
    toast.info("Removing background... This might take a moment.");
    
    try {
      const img = new Image();
      img.crossOrigin = "Anonymous";
      img.src = item.originalImage;
      
      await new Promise((resolve) => {
        img.onload = resolve;
      });
      
      const result = await removeBackgroundFromImage(img);
      if (result) {
        const objectUrl = URL.createObjectURL(result);
        updateItem(item.id, { content: objectUrl });
        toast.success("Background removed successfully!");
      }
    } catch (error) {
      console.error('Error removing background:', error);
      toast.error("Failed to remove background. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  // Handle resizing
  const handleResize = (direction: 'larger' | 'smaller') => {
    if (!item.size) return;
    
    const scaleFactor = direction === 'larger' ? 1.1 : 0.9;
    const newWidth = Math.max(50, item.size.width * scaleFactor);
    const newHeight = Math.max(50, item.size.height * scaleFactor);
    
    updateItem(item.id, {
      size: {
        width: newWidth,
        height: newHeight
      }
    });
  };

  // Update position using transform for smoother movement
  useEffect(() => {
    const el = elementRef.current;
    if (!el) return;
    
    el.style.transform = `translate(${item.position.x}px, ${item.position.y}px) rotate(${item.style?.rotate || 0}deg)`;
    
    if (item.size) {
      el.style.width = `${item.size.width}px`;
      el.style.height = `${item.size.height}px`;
    }
  }, [item.position, item.size, item.style?.rotate]);

  return (
    <div
      ref={elementRef}
      className={`moodboard-item absolute left-0 top-0 transition-transform ${isActive ? 'ring-2 ring-primary z-50' : 'z-10'}`}
      style={{ 
        transform: `translate(${item.position.x}px, ${item.position.y}px) rotate(${item.style?.rotate || 0}deg)`,
        transition: 'transform 0.1s ease-out'
      }}
      onClick={handleClick}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      draggable={isActive && !isProcessing}
    >
      {/* The image display */}
      <div className="relative">
        {/* Decorative tape at top */}
        <div className="tape" />
        
        {/* Image */}
        <img 
          src={item.content} 
          alt="Moodboard item"
          className="max-w-full object-contain"
          style={{ 
            minWidth: '100px', 
            minHeight: '100px',
            filter: isProcessing ? 'blur(3px)' : 'none'
          }}
        />
        
        {/* Processing overlay */}
        {isProcessing && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/30 text-white">
            Processing...
          </div>
        )}
      </div>

      {/* Controls (only show when active) */}
      {isActive && (
        <div className="absolute -bottom-10 left-1/2 transform -translate-x-1/2 flex space-x-2">
          <button 
            className="p-2 bg-white rounded-full shadow-md hover:bg-gray-100"
            onClick={() => handleResize('larger')}
          >
            <ZoomIn size={16} />
          </button>
          <button 
            className="p-2 bg-white rounded-full shadow-md hover:bg-gray-100"
            onClick={() => handleResize('smaller')}
          >
            <ZoomOut size={16} />
          </button>
          <button 
            className="p-2 bg-white rounded-full shadow-md hover:bg-gray-100"
            onClick={handleRemoveBackground}
            disabled={isProcessing}
          >
            <ImageOff size={16} className={isProcessing ? 'text-gray-400' : ''} />
          </button>
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

export default UploadedImage;
