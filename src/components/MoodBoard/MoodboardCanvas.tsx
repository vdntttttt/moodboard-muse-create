
import React, { useState, useRef, useCallback, useEffect } from 'react';
import { useMoodboardStore } from '@/store/moodboardStore';
import StickyNote from './StickyNote';
import UploadedImage from './UploadedImage';
import SpotifyEmbed from './SpotifyEmbed';
import html2canvas from 'html2canvas';
import Toolbar from './Toolbar';

const MoodboardCanvas: React.FC = () => {
  const { items, addItem, filter, setActiveItemId, activeItemId } = useMoodboardStore();
  const canvasRef = useRef<HTMLDivElement>(null);
  const [isDraggingOver, setIsDraggingOver] = useState(false);

  // Handle drag and drop file upload
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingOver(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingOver(false);
    
    // Get the files from the drop event
    const files = Array.from(e.dataTransfer.files);
    
    // Filter for image files only
    const imageFiles = files.filter(file => file.type.startsWith('image/'));
    
    // Process each image file
    imageFiles.forEach(file => {
      const reader = new FileReader();
      reader.onload = (event) => {
        const imageUrl = event.target?.result as string;
        
        // Add image to the board at the drop position
        const rect = canvasRef.current?.getBoundingClientRect();
        if (rect) {
          const x = e.clientX - rect.left;
          const y = e.clientY - rect.top;
          
          addItem({
            id: `image-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            type: 'image',
            content: imageUrl,
            position: { x, y },
            originalImage: imageUrl,
            size: { width: 250, height: 250 },
            style: {}
          });
        }
      };
      reader.readAsDataURL(file);
    });
  }, [addItem]);

  // Handle canvas click (deselect items)
  const handleCanvasClick = useCallback((e: React.MouseEvent) => {
    // Only deselect if clicking directly on the canvas, not on items
    if (e.target === e.currentTarget) {
      setActiveItemId(null);
    }
  }, [setActiveItemId]);

  // Export the moodboard as an image
  const exportMoodboard = useCallback(async () => {
    if (canvasRef.current) {
      try {
        // Remove any active item styling temporarily
        setActiveItemId(null);
        
        // Small delay to ensure active styles are removed
        await new Promise(resolve => setTimeout(resolve, 100));
        
        const canvas = await html2canvas(canvasRef.current, {
          backgroundColor: null,
          scale: 2, // Higher quality
          useCORS: true, // Allow cross-origin images
          allowTaint: true,
        });
        
        // Create a download link for the image
        const image = canvas.toDataURL('image/png');
        const link = document.createElement('a');
        link.href = image;
        link.download = `moodboard-${new Date().toISOString().split('T')[0]}.png`;
        link.click();
      } catch (error) {
        console.error('Error exporting moodboard:', error);
      }
    }
  }, [setActiveItemId]);

  // Render items based on their types
  const renderItems = useCallback(() => {
    return items.map(item => {
      const isActive = activeItemId === item.id;
      
      switch (item.type) {
        case 'note':
          return <StickyNote key={item.id} item={item} isActive={isActive} />;
        case 'image':
          return <UploadedImage key={item.id} item={item} isActive={isActive} />;
        case 'spotify':
          return <SpotifyEmbed key={item.id} item={item} isActive={isActive} />;
        default:
          return null;
      }
    });
  }, [items, activeItemId]);

  return (
    <div className="relative w-full h-screen overflow-hidden">
      {/* Background */}
      <div 
        className={`absolute inset-0 bg-corkboard bg-repeat ${filter}`}
      />
      
      {/* Canvas area */}
      <div
        ref={canvasRef}
        className={`absolute inset-0 ${isDraggingOver ? 'ring-4 ring-primary ring-opacity-50' : ''}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={handleCanvasClick}
      >
        {/* Drop overlay */}
        {isDraggingOver && (
          <div className="absolute inset-0 bg-primary bg-opacity-10 flex items-center justify-center">
            <div className="bg-white bg-opacity-90 p-6 rounded-lg shadow-lg">
              <p className="text-lg font-medium text-gray-800">Drop images here</p>
            </div>
          </div>
        )}
        
        {/* Render all moodboard items */}
        {renderItems()}
      </div>
      
      {/* Toolbar */}
      <Toolbar onExport={exportMoodboard} />
    </div>
  );
};

export default MoodboardCanvas;
