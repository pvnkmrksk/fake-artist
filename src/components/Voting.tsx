
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Player, Stroke } from '@/types/game';
import { useSocket } from '@/contexts/SocketContext';
import { Badge } from '@/components/ui/badge';
import { useToast } from "@/hooks/use-toast";
import { AspectRatio } from '@/components/ui/aspect-ratio';

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
  const [votedPlayerIds, setVotedPlayerIds] = useState<Set<number>>(new Set());
  const [playersWhoVoted, setPlayersWhoVoted] = useState<Set<number>>(new Set());
  const [canvasSize, setCanvasSize] = useState({ width: 350, height: 350 });
  const canvasRef = React.useRef<HTMLCanvasElement>(null);
  
  const { socket, roomId } = useSocket();
  const { toast } = useToast();
  
  // Get local player ID - in a real app you'd get this from authentication
  // For now we can use the first player or socket ID if available
  const localPlayerId = players[0]?.id;

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

  // Setup vote collection for multiplayer
  useEffect(() => {
    if (!isMultiplayer || !socket) return;

    const handleVote = (data: { playerId: number, voteFor: number }) => {
      console.log(`Player ${data.playerId} voted for ${data.voteFor}`);
      
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
      
      // Check if all players have voted
      if (playersWhoVoted.size + 1 >= players.length) {
        setTimeout(() => {
          onVotingComplete({ ...votes, [data.voteFor]: (votes[data.voteFor] || 0) + 1 });
        }, 1000);
      }
    };

    socket.on('player-vote', handleVote);

    return () => {
      socket.off('player-vote', handleVote);
    };
  }, [isMultiplayer, socket, players.length, votes, playersWhoVoted, onVotingComplete]);

  const handleVote = () => {
    if (selectedPlayerId === null) {
      toast({
        title: "No selection",
        description: "Please select a player to vote for.",
        variant: "destructive"
      });
      return;
    }
    
    if (votedPlayerIds.has(localPlayerId)) {
      toast({
        title: "Already voted",
        description: "You've already cast your vote.",
        variant: "destructive"
      });
      return;
    }

    // Mark this player as having voted
    setVotedPlayerIds(current => {
      const updated = new Set(current);
      updated.add(localPlayerId);
      return updated;
    });
    
    // Update local votes state
    const updatedVotes = { ...votes };
    updatedVotes[selectedPlayerId] = (updatedVotes[selectedPlayerId] || 0) + 1;
    setVotes(updatedVotes);
    
    // Add self to players who voted
    setPlayersWhoVoted(current => {
      const updated = new Set(current);
      updated.add(localPlayerId);
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
        playerId: localPlayerId,
        voteFor: selectedPlayerId
      });
    }

    // For single player or if all players have voted in multiplayer
    if (!isMultiplayer || playersWhoVoted.size + 1 >= players.length) {
      setTimeout(() => {
        onVotingComplete(updatedVotes);
      }, 1000);
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
          
          {/* Display the final drawing */}
          <div className="mb-4">
            <p className="text-sm mb-2">The word was: <strong>{secretWord}</strong></p>
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
          
          <div className="flex flex-col gap-2">
            {players.map((player) => (
              <Button
                key={player.id}
                variant={selectedPlayerId === player.id ? "default" : "outline"}
                onClick={() => !votedPlayerIds.has(localPlayerId) && setSelectedPlayerId(player.id)}
                disabled={votedPlayerIds.has(localPlayerId)}
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
            disabled={selectedPlayerId === null || votedPlayerIds.has(localPlayerId)} 
            className="w-full"
          >
            {votedPlayerIds.has(localPlayerId) ? "Vote Recorded" : "Submit Vote"}
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
