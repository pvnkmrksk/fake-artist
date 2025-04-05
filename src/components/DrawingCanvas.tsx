
import React, { useRef, useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Player, Stroke } from '@/types/game';
import { Undo2, Check, ArrowRight } from 'lucide-react';
import { useToast } from "@/components/ui/use-toast";

interface DrawingCanvasProps {
  players: Player[];
  currentRound: number;
  totalRounds: number;
  secretWord: string;
  onRoundComplete: (strokes: Stroke[]) => void;
}

const STROKE_WIDTH = 4;
const CANVAS_WIDTH = 350;
const CANVAS_HEIGHT = 350;

const getPlayerColor = (colorIndex: number): string => {
  const colors = [
    "#FF5252", "#4CAF50", "#2196F3", "#FFC107", "#9C27B0",
    "#00BCD4", "#FF9800", "#795548", "#607D8B", "#E91E63"
  ];
  return colors[(colorIndex - 1) % colors.length];
};

const DrawingCanvas: React.FC<DrawingCanvasProps> = ({ 
  players, 
  currentRound, 
  totalRounds,
  secretWord, 
  onRoundComplete 
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentPlayerIndex, setCurrentPlayerIndex] = useState(0);
  const [strokes, setStrokes] = useState<Stroke[]>([]);
  const [currentStroke, setCurrentStroke] = useState<Stroke | null>(null);
  const [canvasSize, setCanvasSize] = useState({ width: CANVAS_WIDTH, height: CANVAS_HEIGHT });
  const { toast } = useToast();

  const currentPlayer = players[currentPlayerIndex];

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const context = canvas.getContext('2d');
    if (!context) return;
    
    // Clear canvas
    context.fillStyle = 'white';
    context.fillRect(0, 0, canvas.width, canvas.height);
    
    // Draw all previous strokes
    strokes.forEach(stroke => {
      if (stroke.points.length > 0) {
        context.beginPath();
        context.moveTo(stroke.points[0].x, stroke.points[0].y);
        
        stroke.points.forEach((point, i) => {
          if (i > 0) context.lineTo(point.x, point.y);
        });
        
        context.strokeStyle = stroke.color;
        context.lineWidth = stroke.width;
        context.lineCap = 'round';
        context.lineJoin = 'round';
        context.stroke();
      }
    });

    // If there's a current stroke being drawn, draw it too
    if (currentStroke && currentStroke.points.length > 0) {
      context.beginPath();
      context.moveTo(currentStroke.points[0].x, currentStroke.points[0].y);
      
      currentStroke.points.forEach((point, i) => {
        if (i > 0) context.lineTo(point.x, point.y);
      });
      
      context.strokeStyle = currentStroke.color;
      context.lineWidth = currentStroke.width;
      context.lineCap = 'round';
      context.lineJoin = 'round';
      context.stroke();
    }
  }, [strokes, currentStroke, canvasSize]);

  // Handle resizing
  useEffect(() => {
    const updateCanvasSize = () => {
      const container = document.querySelector('.canvas-container');
      if (container) {
        const width = Math.min(container.clientWidth - 20, CANVAS_WIDTH);
        setCanvasSize({
          width,
          height: width // Keep it square
        });
      }
    };

    updateCanvasSize();
    window.addEventListener('resize', updateCanvasSize);
    return () => window.removeEventListener('resize', updateCanvasSize);
  }, []);

  const getCanvasCoordinates = (e: React.TouchEvent | React.MouseEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    
    const rect = canvas.getBoundingClientRect();
    
    if ('touches' in e) {
      // Touch event
      return {
        x: e.touches[0].clientX - rect.left,
        y: e.touches[0].clientY - rect.top
      };
    } else {
      // Mouse event
      return {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
      };
    }
  };

  const startDrawing = (e: React.TouchEvent | React.MouseEvent) => {
    const point = getCanvasCoordinates(e);
    
    setIsDrawing(true);
    setCurrentStroke({
      points: [point],
      color: getPlayerColor(currentPlayer.colorIndex),
      width: STROKE_WIDTH,
      playerId: currentPlayer.id
    });
  };

  const draw = (e: React.TouchEvent | React.MouseEvent) => {
    if (!isDrawing || !currentStroke) return;
    
    const point = getCanvasCoordinates(e);
    
    setCurrentStroke({
      ...currentStroke,
      points: [...currentStroke.points, point]
    });
  };

  const endDrawing = () => {
    setIsDrawing(false);
    if (currentStroke && currentStroke.points.length > 1) {
      // Only save if there are at least 2 points (a visible line)
      setStrokes([...strokes, currentStroke]);
    }
    setCurrentStroke(null);
  };

  const handleUndo = () => {
    setCurrentStroke(null);
  };

  const handleConfirmStroke = () => {
    if (!currentStroke || currentStroke.points.length <= 1) {
      toast({
        title: "Can't continue",
        description: "You need to draw something first!",
        variant: "destructive"
      });
      return;
    }
    
    const updatedStrokes = [...strokes, currentStroke];
    setStrokes(updatedStrokes);
    setCurrentStroke(null);
    
    // Advance to the next player or end the round
    if (currentPlayerIndex < players.length - 1) {
      setCurrentPlayerIndex(currentPlayerIndex + 1);
    } else {
      // All players have drawn, end the round
      onRoundComplete(updatedStrokes);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen p-4">
      <div className="w-full max-w-md">
        <div className="mb-4 flex justify-between items-center">
          <div>
            <span className="font-medium">Round {currentRound} of {totalRounds}</span>
            <p className="text-sm text-muted-foreground">Word: {secretWord}</p>
          </div>
          <div className="flex items-center">
            <div className={`h-8 w-8 rounded-full flex items-center justify-center text-white font-bold text-xs player-color-${currentPlayer.colorIndex}`}>
              {currentPlayerIndex + 1}
            </div>
            <span className="ml-2 font-medium">{currentPlayer.name}'s turn</span>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-md overflow-hidden canvas-container">
          <canvas
            ref={canvasRef}
            width={canvasSize.width}
            height={canvasSize.height}
            className="drawing-canvas border border-gray-200 touch-none bg-white"
            onMouseDown={startDrawing}
            onMouseMove={draw}
            onMouseUp={endDrawing}
            onMouseLeave={endDrawing}
            onTouchStart={startDrawing}
            onTouchMove={draw}
            onTouchEnd={endDrawing}
          />
        </div>
        
        <div className="mt-4 flex justify-between">
          <Button
            variant="outline"
            onClick={handleUndo}
            disabled={!currentStroke || currentStroke.points.length <= 1}
          >
            <Undo2 className="h-4 w-4 mr-2" />
            Undo
          </Button>
          
          <Button onClick={handleConfirmStroke}>
            {currentPlayerIndex < players.length - 1 ? (
              <>
                Next Player
                <ArrowRight className="h-4 w-4 ml-2" />
              </>
            ) : (
              <>
                Finish Round
                <Check className="h-4 w-4 ml-2" />
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default DrawingCanvas;
