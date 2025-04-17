
import React, { useState, useRef, useEffect } from 'react';
import { PushPin, Move, Trash } from 'lucide-react';
import { useMoodboardStore } from '@/store/moodboardStore';

interface StickyNoteProps {
  item: MoodboardItem;
  isActive: boolean;
}

const StickyNote: React.FC<StickyNoteProps> = ({ item, isActive }) => {
  const { updateItem, removeItem, setActiveItemId } = useMoodboardStore();
  const [isEditing, setIsEditing] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);
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

  // Handle content edit
  const handleContentEdit = () => {
    if (isActive && !isEditing) {
      setIsEditing(true);
    }
  };

  // Save content when blurring the editable div
  const handleBlur = () => {
    if (isEditing && contentRef.current) {
      setIsEditing(false);
      updateItem(item.id, {
        content: contentRef.current.innerHTML
      });
    }
  };

  // handle click to activate
  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setActiveItemId(item.id);
  };

  // Note style based on color
  const getNoteStyle = () => {
    const color = item.style?.color || 'yellow';
    const pattern = item.style?.pattern || 'plain';
    
    let patternClass = '';
    if (pattern === 'lined') patternClass = 'note-lined';
    if (pattern === 'grid') patternClass = 'note-grid';
    
    return `sticky-note bg-note-${color} ${patternClass}`;
  };

  // Update position when dragging
  useEffect(() => {
    const el = elementRef.current;
    if (!el) return;
    
    el.style.left = `${item.position.x}px`;
    el.style.top = `${item.position.y}px`;
    
    if (item.size) {
      el.style.width = `${item.size.width}px`;
      el.style.height = `${item.size.height}px`;
    }
  }, [item.position, item.size]);

  return (
    <div
      ref={elementRef}
      className={`moodboard-item ${getNoteStyle()} ${isActive ? 'ring-2 ring-primary' : ''} rotate-${item.style?.rotate || '0'}`}
      style={{ 
        zIndex: isActive ? 100 : 10,
        transform: `rotate(${item.style?.rotate || 0}deg)`
      }}
      onClick={handleClick}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      draggable={isActive && !isEditing}
    >
      {/* Pin on top */}
      <div className="pin animate-pin-wobble">
        <PushPin size={24} className="text-red-500 drop-shadow-md" />
      </div>
      
      {/* Content area */}
      <div
        ref={contentRef}
        className={`w-full h-full pt-2 overflow-auto ${isEditing ? 'focus:outline-none' : ''}`}
        contentEditable={isActive && isEditing}
        suppressContentEditableWarning={true}
        onDoubleClick={handleContentEdit}
        onBlur={handleBlur}
        dangerouslySetInnerHTML={{ __html: item.content }}
      />

      {/* Controls (only show when active) */}
      {isActive && (
        <div className="absolute -bottom-10 left-1/2 transform -translate-x-1/2 flex space-x-2">
          <button 
            className="p-2 bg-white rounded-full shadow-md hover:bg-gray-100"
            onClick={() => setIsEditing(true)}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" className="bi bi-pencil" viewBox="0 0 16 16">
              <path d="M12.146.146a.5.5 0 0 1 .708 0l3 3a.5.5 0 0 1 0 .708l-10 10a.5.5 0 0 1-.168.11l-5 2a.5.5 0 0 1-.65-.65l2-5a.5.5 0 0 1 .11-.168l10-10zM11.207 2.5 13.5 4.793 14.793 3.5 12.5 1.207 11.207 2.5zm1.586 3L10.5 3.207 4 9.707V10h.5a.5.5 0 0 1 .5.5v.5h.5a.5.5 0 0 1 .5.5v.5h.293l6.5-6.5zm-9.761 5.175-.106.106-1.528 3.821 3.821-1.528.106-.106A.5.5 0 0 1 5 12.5V12h-.5a.5.5 0 0 1-.5-.5V11h-.5a.5.5 0 0 1-.468-.325z"/>
            </svg>
          </button>
          <button 
            className="p-2 bg-white rounded-full shadow-md hover:bg-gray-100"
            onClick={() => removeItem(item.id)}
          >
            <Trash size={16} className="text-red-500" />
          </button>
        </div>
      )}
    </div>
  );
};

export default StickyNote;
