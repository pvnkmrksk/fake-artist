import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Player, Stroke } from '@/types/game';
import { useSocket } from '@/contexts/SocketContext';

export interface VotingProps {
  players: Player[];
  secretWord: string;
  strokes: Stroke[];
  onVotingComplete: (votes: Record<number, number>) => void;
  isMultiplayer?: boolean; // Added the missing prop
}

const Voting: React.FC<VotingProps> = ({
  players,
  secretWord,
  strokes,
  onVotingComplete,
  isMultiplayer = false // Default value
}) => {
  const [selectedPlayerId, setSelectedPlayerId] = useState<number | null>(null);

  const handleVote = () => {
    if (selectedPlayerId !== null) {
      // Record the vote for the selected player
      const votes: Record<number, number> = {};
      votes[selectedPlayerId] = 1; // Each vote is worth 1 point
      onVotingComplete(votes);
    } else {
      // Handle case where no player is selected
      alert("Please select a player to vote for.");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-center">Voting Time</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-lg text-center">
            Who do you think is the imposter?
          </p>
          <div className="flex flex-col gap-2">
            {players.map((player) => (
              <Button
                key={player.id}
                variant={selectedPlayerId === player.id ? "default" : "outline"}
                onClick={() => setSelectedPlayerId(player.id)}
              >
                {player.name}
              </Button>
            ))}
          </div>
          <Button onClick={handleVote} disabled={selectedPlayerId === null} className="w-full">
            Submit Vote
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default Voting;
