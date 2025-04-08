
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Player, Stroke } from '@/types/game';
import { useSocket } from '@/contexts/SocketContext';
import { Badge } from '@/components/ui/badge';
import { useToast } from "@/hooks/use-toast";

export interface VotingProps {
  players: Player[];
  secretWord: string;
  strokes: Stroke[];
  onVotingComplete: (votes: Record<number, number>) => void;
  isMultiplayer?: boolean;
}

const Voting: React.FC<VotingProps> = ({
  players,
  secretWord,
  strokes,
  onVotingComplete,
  isMultiplayer = false
}) => {
  const [selectedPlayerId, setSelectedPlayerId] = useState<number | null>(null);
  const [votes, setVotes] = useState<Record<number, number>>({});
  const [hasVoted, setHasVoted] = useState<boolean>(false);
  const [playersWhoVoted, setPlayersWhoVoted] = useState<Set<number>>(new Set());
  const { socket, roomId } = useSocket();
  const { toast } = useToast();

  // Setup vote collection for multiplayer
  React.useEffect(() => {
    if (!isMultiplayer || !socket) return;

    const handleVote = (data: { playerId: number, voteFor: number }) => {
      setVotes(currentVotes => {
        const newVotes = { ...currentVotes };
        newVotes[data.voteFor] = (newVotes[data.voteFor] || 0) + 1;
        return newVotes;
      });
      
      setPlayersWhoVoted(current => {
        const updated = new Set(current);
        updated.add(data.playerId);
        return updated;
      });

      // If all players have voted, complete voting
      if (playersWhoVoted.size + 1 >= players.length) {
        setTimeout(() => {
          onVotingComplete(votes);
        }, 1000);
      }
    };

    socket.on('player-vote', handleVote);

    return () => {
      socket.off('player-vote', handleVote);
    };
  }, [isMultiplayer, socket, players.length, votes, playersWhoVoted, onVotingComplete]);

  const handleVote = () => {
    if (selectedPlayerId !== null) {
      setHasVoted(true);
      
      // Update local votes state
      const updatedVotes = { ...votes };
      updatedVotes[selectedPlayerId] = (updatedVotes[selectedPlayerId] || 0) + 1;
      setVotes(updatedVotes);
      
      // Add self to players who voted
      setPlayersWhoVoted(current => {
        const updated = new Set(current);
        // Use first player ID as local player ID for demo
        updated.add(players[0].id);
        return updated;
      });

      toast({
        title: "Vote recorded",
        description: `You voted for ${players.find(p => p.id === selectedPlayerId)?.name}`,
      });

      // In multiplayer, emit vote to other players
      if (isMultiplayer && socket && roomId) {
        socket.emit('player-vote', { 
          roomId,
          playerId: players[0].id, // Using first player as local player for demo
          voteFor: selectedPlayerId
        });
      }

      // For single player or if all players have voted in multiplayer
      if (!isMultiplayer || playersWhoVoted.size + 1 >= players.length) {
        setTimeout(() => {
          onVotingComplete(updatedVotes);
        }, 1000);
      }
    } else {
      // Handle case where no player is selected
      toast({
        title: "No selection",
        description: "Please select a player to vote for.",
        variant: "destructive"
      });
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
                onClick={() => !hasVoted && setSelectedPlayerId(player.id)}
                disabled={hasVoted}
                className="flex justify-between items-center"
              >
                <span>{player.name}</span>
                {votes[player.id] > 0 && (
                  <Badge variant="secondary" className="ml-2">
                    {votes[player.id]} {votes[player.id] === 1 ? 'vote' : 'votes'}
                  </Badge>
                )}
              </Button>
            ))}
          </div>
          <Button 
            onClick={handleVote} 
            disabled={selectedPlayerId === null || hasVoted} 
            className="w-full"
          >
            {hasVoted ? "Vote Recorded" : "Submit Vote"}
          </Button>
          
          {playersWhoVoted.size > 0 && (
            <p className="text-sm text-center text-muted-foreground">
              {playersWhoVoted.size} of {players.length} players have voted
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Voting;
