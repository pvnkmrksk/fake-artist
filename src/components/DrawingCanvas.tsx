import React, { useRef, useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Player, Stroke, DrawingAction } from '@/types/game';
import { Undo2, Check, ArrowRight } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import { useSocket } from "@/contexts/SocketContext";
import { useIsMobile } from "@/hooks/use-mobile";
import { Badge } from "@/components/ui/badge";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import { Separator } from "@/components/ui/separator";
import DrawingTimer from "@/components/DrawingTimer";
import { useCanvasSize } from "@/hooks/use-canvas-size";

interface DrawingCanvasProps {
  players: Player[];
  currentRound: number;
  totalRounds: number;
  secretWord: string;
  previousStrokes?: Stroke[];
  onRoundComplete: (strokes: Stroke[]) => void;
  isMultiplayer?: boolean;
  timerEnabled?: boolean;
  timerDuration?: number;
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
  previousStrokes = [],
  onRoundComplete,
  isMultiplayer = false,
  timerEnabled = false,
  timerDuration = 30
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentPlayerIndex, setCurrentPlayerIndex] = useState(0);
  const [strokes, setStrokes] = useState<Stroke[]>([]);
  const [currentStroke, setCurrentStroke] = useState<Stroke | null>(null);
  const [currentPlayerStrokes, setCurrentPlayerStrokes] = useState<Stroke[]>([]);
  const [isTimerActive, setIsTimerActive] = useState(false);
  
  const canvasSize = useCanvasSize(containerRef, { width: CANVAS_WIDTH, height: CANVAS_HEIGHT });
  
  const { socket, roomId } = useSocket();
  const { toast } = useToast();
  const isMobile = useIsMobile();
  
  const currentPlayer = players[currentPlayerIndex];
  const isCurrentPlayerImposter = currentPlayer?.isImposter || false;
  
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const context = canvas.getContext('2d');
    if (!context) return;
    
    context.fillStyle = 'white';
    context.fillRect(0, 0, canvas.width, canvas.height);

    if (previousStrokes && previousStrokes.length > 0) {
      drawStrokes(context, previousStrokes);
    }
    
    setCurrentPlayerIndex(0);
    
    setStrokes([]);
    setCurrentPlayerStrokes([]);
    setCurrentStroke(null);
    
    if (timerEnabled) {
      setIsTimerActive(true);
    }
  }, [currentRound, previousStrokes, timerEnabled]);

  useEffect(() => {
    if (!socket || !isMultiplayer) return;
    
    const handleRemoteDrawingAction = (action: DrawingAction) => {
      const playerObj = players.find(p => p.id === action.playerId);
      if (!playerObj) return;
      
      if (action.type === 'start' && action.point) {
        const newStroke: Stroke = {
          points: [action.point],
          color: action.color,
          width: STROKE_WIDTH,
          playerId: action.playerId
        };
        
        setStrokes(prev => [...prev, newStroke]);
        redrawCanvas([...strokes, newStroke]);
      } 
      else if (action.type === 'move' && action.point) {
        setStrokes(prev => {
          const playerStrokes = prev.filter(s => s.playerId === action.playerId);
          if (playerStrokes.length === 0) return prev;
          
          const lastStrokeIndex = prev.findIndex(s => 
            s.playerId === action.playerId && 
            prev.lastIndexOf(s) === prev.findIndex(s2 => 
              s2.playerId === action.playerId && 
              prev.lastIndexOf(s2) === prev.lastIndexOf(s)
            )
          );
          
          if (lastStrokeIndex === -1 || !action.point) return prev;
          
          const updatedStrokes = [...prev];
          updatedStrokes[lastStrokeIndex] = {
            ...updatedStrokes[lastStrokeIndex],
            points: [...updatedStrokes[lastStrokeIndex].points, action.point]
          };
          
          redrawCanvas(updatedStrokes);
          
          return updatedStrokes;
        });
      }
    };
    
    socket.on('drawing-action', handleRemoteDrawingAction);
    
    return () => {
      socket.off('drawing-action', handleRemoteDrawingAction);
    };
  }, [socket, isMultiplayer, players, strokes]);

  const redrawCanvas = (allStrokes: Stroke[]) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const context = canvas.getContext('2d');
    if (!context) return;
    
    context.fillStyle = 'white';
    context.fillRect(0, 0, canvas.width, canvas.height);
    
    if (previousStrokes && previousStrokes.length > 0) {
      drawStrokes(context, previousStrokes);
    }
    
    drawStrokes(context, allStrokes);
    
    drawStrokes(context, currentPlayerStrokes);
    
    if (currentStroke && currentStroke.points.length > 0) {
      drawStroke(context, currentStroke);
    }
  };
  
  const drawStrokes = (context: CanvasRenderingContext2D, strokesArray: Stroke[]) => {
    strokesArray.forEach(stroke => {
      if (stroke.points.length > 0) {
        drawStroke(context, stroke);
      }
    });
  };
  
  const drawStroke = (context: CanvasRenderingContext2D, stroke: Stroke) => {
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
  };

  const getCanvasCoordinates = (e: React.TouchEvent | React.MouseEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    
    const rect = canvas.getBoundingClientRect();
    
    if ('touches' in e) {
      return {
        x: e.touches[0].clientX - rect.left,
        y: e.touches[0].clientY - rect.top
      };
    } else {
      return {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
      };
    }
  };

  const startDrawing = (e: React.TouchEvent | React.MouseEvent) => {
    if (currentPlayerStrokes.length > 0) {
      return;
    }
    
    const point = getCanvasCoordinates(e);
    
    setIsDrawing(true);
    const newStroke: Stroke = {
      points: [point],
      color: getPlayerColor(currentPlayer.colorIndex),
      width: STROKE_WIDTH,
      playerId: currentPlayer.id
    };
    
    setCurrentStroke(newStroke);
    
    if (isMultiplayer && socket && roomId) {
      socket.emit('drawing-action', {
        type: 'start',
        point,
        playerId: currentPlayer.id,
        color: getPlayerColor(currentPlayer.colorIndex),
        roomId
      });
    }
  };

  const draw = (e: React.TouchEvent | React.MouseEvent) => {
    if (!isDrawing || !currentStroke) return;
    
    const point = getCanvasCoordinates(e);
    
    setCurrentStroke(prevStroke => {
      if (!prevStroke) return null;
      
      const updatedStroke = {
        ...prevStroke,
        points: [...prevStroke.points, point]
      };
      
      redrawCanvas(strokes);
      drawStroke(
        canvasRef.current?.getContext('2d') as CanvasRenderingContext2D, 
        updatedStroke
      );
      
      if (isMultiplayer && socket && roomId) {
        socket.emit('drawing-action', {
          type: 'move',
          point,
          playerId: currentPlayer.id,
          color: getPlayerColor(currentPlayer.colorIndex),
          roomId
        });
      }
      
      return updatedStroke;
    });
  };

  const endDrawing = () => {
    if (!isDrawing || !currentStroke) {
      setIsDrawing(false);
      return;
    }
    
    setIsDrawing(false);
    if (currentStroke.points.length > 1) {
      setCurrentPlayerStrokes(prevStrokes => [...prevStrokes, currentStroke]);
      
      redrawCanvas([...strokes, ...currentPlayerStrokes, currentStroke]);
    }
    
    if (isMultiplayer && socket && roomId) {
      socket.emit('drawing-action', {
        type: 'end',
        playerId: currentPlayer.id,
        roomId
      });
    }
    
    setCurrentStroke(null);
  };

  const handleUndo = () => {
    setCurrentPlayerStrokes([]);
    setCurrentStroke(null);
    setIsDrawing(false);
    
    redrawCanvas(strokes);
    
    toast({
      title: "Strokes removed",
      description: "Your drawing has been cleared"
    });
  };

  const handleConfirmStroke = () => {
    if (currentPlayerStrokes.length === 0) {
      toast({
        title: "Can't continue",
        description: "You need to draw something first!",
        variant: "destructive"
      });
      return;
    }
    
    setIsTimerActive(false);
    
    const updatedStrokes = [...strokes, ...currentPlayerStrokes];
    setStrokes(updatedStrokes);
    
    setCurrentPlayerStrokes([]);
    setCurrentStroke(null);
    
    if (isMultiplayer && socket && roomId) {
      socket.emit('player-turn-complete', {
        playerId: currentPlayer.id,
        strokes: currentPlayerStrokes,
        roomId
      });
    }
    
    if (currentPlayerIndex < players.length - 1) {
      const nextPlayerIndex = currentPlayerIndex + 1;
      setCurrentPlayerIndex(nextPlayerIndex);
      
      if (timerEnabled) {
        setTimeout(() => setIsTimerActive(true), 500);
      }
    } else {
      onRoundComplete(updatedStrokes);
    }
  };

  const handleTimeExpired = () => {
    toast({
      title: "Time's up!",
      description: "Your turn has ended."
    });
    
    if (currentPlayerStrokes.length > 0) {
      handleConfirmStroke();
    } else {
      const canvas = canvasRef.current;
      if (canvas) {
        const context = canvas.getContext('2d');
        if (context) {
          const centerX = canvas.width / 2;
          const centerY = canvas.height / 2;
          
          const dummyStroke: Stroke = {
            points: [
              { x: centerX, y: centerY },
              { x: centerX + 1, y: centerY + 1 }
            ],
            color: getPlayerColor(currentPlayer.colorIndex),
            width: STROKE_WIDTH,
            playerId: currentPlayer.id
          };
          
          setCurrentPlayerStrokes([dummyStroke]);
          setTimeout(() => handleConfirmStroke(), 100);
        }
      }
    }
  };

  const ColorLegend = () => (
    <div className="mt-4 p-3 bg-card rounded-md border shadow-sm">
      <h3 className="text-sm font-medium mb-2">Players</h3>
      <div className="flex flex-wrap gap-2">
        {players.map((player) => (
          <div key={player.id} className="flex items-center">
            <div 
              className="h-4 w-4 rounded-full mr-1"
              style={{ backgroundColor: getPlayerColor(player.colorIndex) }}
            />
            <span className="text-xs">
              {player.name}
              {player.id === currentPlayer.id && " (drawing)"}
            </span>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4">
      <div className="w-full max-w-2xl mx-auto">
        <div className="mb-4 flex justify-between items-center">
          <div>
            <span className="font-medium">Round {currentRound} of {totalRounds}</span>
          </div>
          <div className="flex items-center">
            <div 
              className="h-8 w-8 rounded-full flex items-center justify-center text-white font-bold text-xs"
              style={{ backgroundColor: getPlayerColor(currentPlayer.colorIndex) }}
            >
              {currentPlayerIndex + 1}
            </div>
            <span className="ml-2 font-medium">{currentPlayer.name}'s turn</span>
            {currentPlayer.isOnline && (
              <span className="ml-2 h-2 w-2 rounded-full bg-green-500" title="Online"></span>
            )}
          </div>
        </div>
        
        {timerEnabled && (
          <div className="mb-4">
            <DrawingTimer 
              durationSeconds={timerDuration}
              isActive={isTimerActive}
              onTimeExpired={handleTimeExpired}
            />
          </div>
        )}
        
        <div className="bg-white rounded-lg shadow-md overflow-hidden mx-auto" ref={containerRef}>
          <AspectRatio ratio={1 / 1} className="bg-white">
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
              style={{
                width: '100%',
                height: '100%'
              }}
            />
          </AspectRatio>
        </div>

        <ColorLegend />
        
        <div className="mt-4 flex justify-between">
          <Button
            variant="outline"
            onClick={handleUndo}
            disabled={currentPlayerStrokes.length === 0 && !currentStroke}
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
