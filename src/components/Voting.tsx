
import React, { useState, useRef, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Player, Stroke } from '@/types/game';

interface VotingProps {
  players: Player[];
  secretWord: string;
  strokes: Stroke[];
  onVotingComplete: (votes: Record<number, number>) => void;
}

const Voting: React.FC<VotingProps> = ({ players, secretWord, strokes, onVotingComplete }) => {
  const [currentPlayerIndex, setCurrentPlayerIndex] = useState<number>(0);
  const [votes, setVotes] = useState<Record<number, number>>({});
  const [selectedPlayer, setSelectedPlayer] = useState<number | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  const currentPlayer = players[currentPlayerIndex];
  
  // Function to draw the final canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const context = canvas.getContext('2d');
    if (!context) return;
    
    // Clear canvas
    context.fillStyle = 'white';
    context.fillRect(0, 0, canvas.width, canvas.height);
    
    // Draw all strokes
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
  }, [strokes]);
  
  const handleVote = () => {
    if (selectedPlayer === null) return;
    
    // Add the vote
    const newVotes = { ...votes };
    newVotes[currentPlayer.id] = selectedPlayer;
    setVotes(newVotes);
    
    // Go to next player or complete voting
    if (currentPlayerIndex < players.length - 1) {
      setCurrentPlayerIndex(currentPlayerIndex + 1);
      setSelectedPlayer(null);
    } else {
      onVotingComplete(newVotes);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4">
      <div className="w-full max-w-md">
        <Card>
          <CardHeader>
            <CardTitle className="text-center">
              <div className="h-10 w-10 rounded-full mx-auto flex items-center justify-center text-white font-bold text-sm mb-2"
                style={{ backgroundColor: getPlayerColor(currentPlayer?.colorIndex) }}>
                {currentPlayerIndex + 1}
              </div>
              {currentPlayer?.name}'s Vote
            </CardTitle>
            <p className="text-center text-muted-foreground">The secret word was: <span className="font-medium">{secretWord}</span></p>
          </CardHeader>
          
          <CardContent>
            {/* Canvas Display */}
            <div className="mb-6">
              <p className="text-sm text-center mb-2">Final Drawing</p>
              <div className="bg-white rounded-lg shadow-md overflow-hidden mx-auto">
                <canvas
                  ref={canvasRef}
                  width={350}
                  height={350}
                  className="border border-gray-200 touch-none bg-white"
                />
              </div>
            </div>
            
            <p className="mb-4 text-sm text-center">Who do you think is the imposter?</p>
            
            <RadioGroup value={selectedPlayer?.toString()} onValueChange={(value) => setSelectedPlayer(Number(value))}>
              <div className="space-y-2">
                {players
                  .filter(player => player.id !== currentPlayer.id) // Can't vote for yourself
                  .map(player => (
                    <div key={player.id} className="flex items-center space-x-2 border p-3 rounded">
                      <RadioGroupItem value={player.id.toString()} id={`player-${player.id}`} />
                      <div 
                        className="h-6 w-6 rounded-full flex items-center justify-center text-white font-bold text-xs"
                        style={{ backgroundColor: getPlayerColor(player.colorIndex) }}
                      >
                        {player.id + 1}
                      </div>
                      <Label htmlFor={`player-${player.id}`} className="flex-1">
                        {player.name}
                      </Label>
                    </div>
                  ))
                }
              </div>
            </RadioGroup>
          </CardContent>
          
          <CardFooter>
            <Button 
              onClick={handleVote} 
              className="w-full"
              disabled={selectedPlayer === null}
            >
              {currentPlayerIndex < players.length - 1 ? 'Vote & Next Player' : 'Submit Vote'}
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
};

// Helper function to get player color
const getPlayerColor = (colorIndex: number = 0): string => {
  const colors = [
    "#FF5252", "#4CAF50", "#2196F3", "#FFC107", "#9C27B0",
    "#00BCD4", "#FF9800", "#795548", "#607D8B", "#E91E63"
  ];
  return colors[(colorIndex - 1) % colors.length];
};

export default Voting;
