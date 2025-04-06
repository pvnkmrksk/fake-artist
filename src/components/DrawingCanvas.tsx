
import React, { useRef, useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Player, Stroke, DrawingAction } from '@/types/game';
import { Undo2, Check, ArrowRight } from 'lucide-react';
import { useToast } from "@/components/ui/use-toast";
import { useSocket } from "@/contexts/SocketContext";
import { useIsMobile } from "@/hooks/use-mobile";

interface DrawingCanvasProps {
  players: Player[];
  currentRound: number;
  totalRounds: number;
  secretWord: string;
  previousStrokes?: Stroke[];
  onRoundComplete: (strokes: Stroke[]) => void;
  isMultiplayer?: boolean;
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
  isMultiplayer = false
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentPlayerIndex, setCurrentPlayerIndex] = useState(0);
  const [strokes, setStrokes] = useState<Stroke[]>([]);
  const [currentStroke, setCurrentStroke] = useState<Stroke | null>(null);
  const [currentPlayerStrokes, setCurrentPlayerStrokes] = useState<Stroke[]>([]);
  const [canvasSize, setCanvasSize] = useState({ width: CANVAS_WIDTH, height: CANVAS_HEIGHT });
  const { socket, roomId } = useSocket();
  const { toast } = useToast();
  const isMobile = useIsMobile();
  
  const currentPlayer = players[currentPlayerIndex];
  
  // Set up responsiveness based on container size
  useEffect(() => {
    const updateCanvasSize = () => {
      const container = document.querySelector('.canvas-container');
      if (container) {
        // For desktop, use a max width
        // For mobile, use full width minus padding
        const width = isMobile 
          ? Math.min(window.innerWidth - 40, CANVAS_WIDTH)
          : Math.min(container.clientWidth - 20, CANVAS_WIDTH);
          
        setCanvasSize({
          width,
          height: width // Keep it square
        });
      }
    };

    updateCanvasSize();
    window.addEventListener('resize', updateCanvasSize);
    return () => window.removeEventListener('resize', updateCanvasSize);
  }, [isMobile]);

  // Reset canvas and state for new round
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const context = canvas.getContext('2d');
    if (!context) return;
    
    // Clear canvas first
    context.fillStyle = 'white';
    context.fillRect(0, 0, canvas.width, canvas.height);

    // Draw all previous strokes from past rounds
    if (previousStrokes && previousStrokes.length > 0) {
      drawStrokes(context, previousStrokes);
    }
    
    // Reset player index to start with first player in each round
    setCurrentPlayerIndex(0);
    
    // Reset current round's state but keep previous rounds' strokes
    setStrokes([]);
    setCurrentPlayerStrokes([]);
    setCurrentStroke(null);
  }, [currentRound, previousStrokes]);

  // Set up multiplayer drawing socket listeners
  useEffect(() => {
    if (!socket || !isMultiplayer) return;
    
    const handleRemoteDrawingAction = (action: DrawingAction) => {
      // Only process drawing actions if it's not from the current player
      const playerObj = players.find(p => p.id === action.playerId);
      if (!playerObj) return;
      
      if (action.type === 'start' && action.point) {
        // Start a new stroke for the remote player
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
        // Find the most recent stroke for this player and add a point
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
          
          // Redraw with updated strokes
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

  // Redraw the canvas with current state
  const redrawCanvas = (allStrokes: Stroke[]) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const context = canvas.getContext('2d');
    if (!context) return;
    
    // Clear canvas
    context.fillStyle = 'white';
    context.fillRect(0, 0, canvas.width, canvas.height);
    
    // Draw all previous strokes from past rounds
    if (previousStrokes && previousStrokes.length > 0) {
      drawStrokes(context, previousStrokes);
    }
    
    // Draw current round strokes
    drawStrokes(context, allStrokes);
    
    // Draw current player strokes
    drawStrokes(context, currentPlayerStrokes);
    
    // Draw current stroke being created
    if (currentStroke && currentStroke.points.length > 0) {
      drawStroke(context, currentStroke);
    }
  };
  
  // Helper to draw multiple strokes
  const drawStrokes = (context: CanvasRenderingContext2D, strokesArray: Stroke[]) => {
    strokesArray.forEach(stroke => {
      if (stroke.points.length > 0) {
        drawStroke(context, stroke);
      }
    });
  };
  
  // Helper to draw a single stroke
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

  // Event handlers for drawing
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
    if (currentPlayerStrokes.length > 0) {
      // Player has already drawn a stroke, don't allow starting a new one
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
    
    // Send drawing action to other players if in multiplayer mode
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
      
      // Redraw with updated stroke
      redrawCanvas(strokes);
      drawStroke(
        canvasRef.current?.getContext('2d') as CanvasRenderingContext2D, 
        updatedStroke
      );
      
      // Send drawing action to other players if in multiplayer mode
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
      // Only save if there are at least 2 points (a visible line)
      setCurrentPlayerStrokes([...currentPlayerStrokes, currentStroke]);
    }
    
    // Send drawing action to other players if in multiplayer mode
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
    // Clear all strokes for the current player
    setCurrentPlayerStrokes([]);
    setCurrentStroke(null);
    setIsDrawing(false);
    
    // Redraw canvas without current player's strokes
    redrawCanvas(strokes);
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
    
    // Add all of the current player's strokes to the main strokes array
    const updatedStrokes = [...strokes, ...currentPlayerStrokes];
    setStrokes(updatedStrokes);
    
    // Reset the current player's strokes
    setCurrentPlayerStrokes([]);
    setCurrentStroke(null);
    
    // Notify other players in multiplayer mode
    if (isMultiplayer && socket && roomId) {
      socket.emit('player-turn-complete', {
        playerId: currentPlayer.id,
        strokes: currentPlayerStrokes,
        roomId
      });
    }
    
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
            {!currentPlayer.isImposter && (
              <p className="text-sm text-muted-foreground">Word: {secretWord}</p>
            )}
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
            style={{
              width: `${canvasSize.width}px`,
              height: `${canvasSize.height}px`
            }}
          />
        </div>
        
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
