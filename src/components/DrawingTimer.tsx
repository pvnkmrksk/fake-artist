
import React, { useState, useEffect } from 'react';
import { Progress } from '@/components/ui/progress';

interface DrawingTimerProps {
  durationSeconds: number;
  isActive: boolean;
  onTimeExpired: () => void;
}

const DrawingTimer: React.FC<DrawingTimerProps> = ({ 
  durationSeconds, 
  isActive, 
  onTimeExpired 
}) => {
  const [timeRemaining, setTimeRemaining] = useState<number>(durationSeconds);
  const [progress, setProgress] = useState<number>(100);

  useEffect(() => {
    if (!isActive) {
      setTimeRemaining(durationSeconds);
      setProgress(100);
      return;
    }

    const timer = setInterval(() => {
      setTimeRemaining((prev) => {
        const newTime = prev - 1;
        
        // Calculate progress as a percentage
        const newProgress = (newTime / durationSeconds) * 100;
        setProgress(Math.max(0, newProgress));
        
        if (newTime <= 0) {
          clearInterval(timer);
          onTimeExpired();
          return 0;
        }
        return newTime;
      });
    }, 1000);

    return () => {
      clearInterval(timer);
    };
  }, [isActive, durationSeconds, onTimeExpired]);

  // Format time as MM:SS
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="w-full space-y-2">
      <div className="flex justify-between">
        <span className="text-sm">Time remaining</span>
        <span className="text-sm font-medium">{formatTime(timeRemaining)}</span>
      </div>
      <Progress 
        value={progress} 
        className={`h-2 ${progress < 25 ? 'bg-red-200' : ''}`}
      />
    </div>
  );
};

export default DrawingTimer;
