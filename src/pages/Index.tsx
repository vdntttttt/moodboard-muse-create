
import React, { useEffect } from 'react';
import MoodboardCanvas from '@/components/MoodBoard/MoodboardCanvas';
import { useMoodboardStore } from '@/store/moodboardStore';
import { toast } from 'sonner';

const Index = () => {
  useEffect(() => {
    // Welcome message
    toast.info(
      "Welcome to MoodBoard Muse! Drag & drop images or use the toolbar to add elements.", 
      { duration: 5000 }
    );
  }, []);

  return (
    <div className="h-screen w-full overflow-hidden">
      <MoodboardCanvas />
    </div>
  );
};

export default Index;
