
import React, { useRef, useEffect, useState } from 'react';
import { useMoodboardStore, MoodboardItem } from '@/store/moodboardStore';
import { Trash, ZoomIn, ZoomOut, ImageOff } from 'lucide-react';
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
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  
  // Handle mouse down to start dragging
  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    e.stopPropagation();
    e.preventDefault();
    
    if (!isActive) setActiveItemId(item.id);
    
    // Calculate offset from mouse to element top-left corner
    const rect = e.currentTarget.getBoundingClientRect();
    const offsetX = e.clientX - rect.left;
    const offsetY = e.clientY - rect.top;
    setDragOffset({ x: offsetX, y: offsetY });
    
    setIsDragging(true);
  };

  // Handle mouse move for dragging
  const handleMouseMove = (e: MouseEvent) => {
    if (!isDragging || !elementRef.current) return;
    
    // Get the parent canvas coordinates
    const canvas = elementRef.current.closest('[class*="absolute inset-0"]');
    if (canvas) {
      const canvasRect = canvas.getBoundingClientRect();
      const newX = e.clientX - canvasRect.left - dragOffset.x;
      const newY = e.clientY - canvasRect.top - dragOffset.y;
      
      updateItem(item.id, {
        position: { x: newX, y: newY }
      });
    }
  };

  // Handle mouse up to stop dragging
  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Set up event listeners for mouse move and mouse up
  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    } else {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    }
    
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, dragOffset]);

  // Handle click to activate
  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isDragging) {
      setActiveItemId(item.id);
    }
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
      className={`moodboard-item absolute left-0 top-0 cursor-move ${isActive ? 'ring-2 ring-primary z-50' : 'z-10'} ${isDragging ? 'opacity-80' : ''}`}
      style={{ 
        transform: `translate(${item.position.x}px, ${item.position.y}px) rotate(${item.style?.rotate || 0}deg)`,
        transition: isDragging ? 'none' : 'transform 0.1s ease-out'
      }}
      onClick={handleClick}
      onMouseDown={handleMouseDown}
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
          draggable={false} // Prevent browser's default dragging
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
