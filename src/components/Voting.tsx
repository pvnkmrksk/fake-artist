
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Player } from '@/types/game';

interface VotingProps {
  players: Player[];
  secretWord: string;
  onVotingComplete: (votes: Record<number, number>) => void;
}

const Voting: React.FC<VotingProps> = ({ players, secretWord, onVotingComplete }) => {
  const [currentPlayerIndex, setCurrentPlayerIndex] = useState<number>(0);
  const [votes, setVotes] = useState<Record<number, number>>({});
  const [selectedPlayer, setSelectedPlayer] = useState<number | null>(null);
  
  const currentPlayer = players[currentPlayerIndex];
  
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
    <div className="flex items-center justify-center min-h-screen p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-center">
            <div className={`h-10 w-10 rounded-full mx-auto flex items-center justify-center text-white font-bold text-sm player-color-${currentPlayer?.colorIndex} mb-2`}>
              {currentPlayerIndex + 1}
            </div>
            {currentPlayer?.name}'s Vote
          </CardTitle>
          <p className="text-center text-muted-foreground">The secret word was: <span className="font-medium">{secretWord}</span></p>
        </CardHeader>
        <CardContent>
          <p className="mb-4 text-sm text-center">Who do you think is the imposter?</p>
          
          <RadioGroup value={selectedPlayer?.toString()} onValueChange={(value) => setSelectedPlayer(Number(value))}>
            <div className="space-y-2">
              {players
                .filter(player => player.id !== currentPlayer.id) // Can't vote for yourself
                .map(player => (
                  <div key={player.id} className="flex items-center space-x-2 border p-3 rounded">
                    <RadioGroupItem value={player.id.toString()} id={`player-${player.id}`} />
                    <div className={`h-6 w-6 rounded-full flex items-center justify-center text-white font-bold text-xs player-color-${player.colorIndex}`}>
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
  );
};

export default Voting;
