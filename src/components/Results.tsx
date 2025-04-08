
import React, { useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Player, Stroke } from '@/types/game';
import { AspectRatio } from '@/components/ui/aspect-ratio';

interface ResultsProps {
  players: Player[];
  votes: Record<number, number>;
  secretWord: string;
  onPlayAgain: () => void;
  onReturnHome: () => void;
  isMultiplayer?: boolean;
  strokes?: Stroke[];
}

const getPlayerColor = (colorIndex: number): string => {
  const colors = [
    "#FF5252", "#4CAF50", "#2196F3", "#FFC107", "#9C27B0",
    "#00BCD4", "#FF9800", "#795548", "#607D8B", "#E91E63"
  ];
  return colors[(colorIndex - 1) % colors.length];
};

const Results: React.FC<ResultsProps> = ({
  players,
  votes,
  secretWord,
  onPlayAgain,
  onReturnHome,
  isMultiplayer = false,
  strokes = []
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [canvasSize, setCanvasSize] = React.useState({ width: 350, height: 350 });
  
  // Find the player with the most votes
  const mostVotedPlayerId = Object.entries(votes).reduce(
    (maxEntry, entry) => {
      const [playerId, voteCount] = entry;
      return voteCount > maxEntry[1] ? [playerId, voteCount] : maxEntry;
    },
    ['0', 0]
  )[0];

  const mostVotedPlayer = players.find(p => p.id === parseInt(mostVotedPlayerId));
  
  // Find the actual imposter
  const imposter = players.find(p => p.isImposter);
  const imposterCorrectlyIdentified = mostVotedPlayer?.isImposter;

  // Draw the final image when component loads
  useEffect(() => {
    if (!canvasRef.current || strokes.length === 0) return;
    
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');
    if (!context) return;

    // Set white background
    context.fillStyle = 'white';
    context.fillRect(0, 0, canvas.width, canvas.height);
    
    // Draw all strokes
    strokes.forEach(stroke => {
      if (stroke.points.length < 1) return;
      
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
    });
  }, [strokes]);

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold">Game Results</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex justify-center flex-col items-center">
            <p className="text-xl font-medium mb-2">
              The word was: <span className="font-bold">{secretWord}</span>
            </p>
            
            {/* Display the final drawing */}
            <div className="mt-4 mb-4 w-full max-w-xs">
              <div className="bg-white border rounded-md overflow-hidden">
                <AspectRatio ratio={1/1}>
                  <canvas
                    ref={canvasRef}
                    width={canvasSize.width}
                    height={canvasSize.height}
                    className="w-full h-full"
                  />
                </AspectRatio>
              </div>
            </div>
            
            {/* Color legend */}
            <div className="mt-2 p-3 bg-secondary/20 rounded-md w-full">
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
                      {player.isImposter && " (Imposter)"}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
          
          {imposter && (
            <div className="flex flex-col items-center bg-card p-4 rounded-lg border">
              <p className="mb-1">The imposter was:</p>
              <div className="flex items-center gap-2">
                <div 
                  className="h-6 w-6 rounded-full"
                  style={{ backgroundColor: getPlayerColor(imposter.colorIndex) }}
                />
                <span className="font-bold text-lg">{imposter.name}</span>
              </div>
            </div>
          )}

          {mostVotedPlayer && (
            <div className="flex flex-col items-center">
              <p>Most voted player:</p>
              <div className="flex items-center gap-2">
                <div 
                  className="h-6 w-6 rounded-full"
                  style={{ backgroundColor: getPlayerColor(mostVotedPlayer.colorIndex) }}
                />
                <span className="font-bold">{mostVotedPlayer.name}</span>
                <span>({votes[mostVotedPlayer.id]} votes)</span>
              </div>
              <p className="mt-2 text-lg">
                {imposterCorrectlyIdentified 
                  ? "The imposter was correctly identified! 🎉" 
                  : "The imposter fooled everyone! 😈"}
              </p>
            </div>
          )}
        </CardContent>
        <CardFooter className="flex gap-4 justify-center">
          <Button onClick={onPlayAgain}>
            Play Again
          </Button>
          <Button variant="outline" onClick={onReturnHome}>
            Return Home
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
};

export default Results;
