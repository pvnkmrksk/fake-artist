
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Player, Stroke } from '@/types/game';
import { useSocket } from '@/contexts/SocketContext';
import { Badge } from '@/components/ui/badge';
import { useToast } from "@/hooks/use-toast";
import { AspectRatio } from '@/components/ui/aspect-ratio';
import { useCanvasSize } from '@/hooks/use-canvas-size';

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
  const [votingPlayerId, setVotingPlayerId] = useState<number>(players[0]?.id || 0);
  const [playerVotes, setPlayerVotes] = useState<Map<number, number>>(new Map());
  const [playersWhoVoted, setPlayersWhoVoted] = useState<Set<number>>(new Set());
  const canvasRef = React.useRef<HTMLCanvasElement>(null);
  const containerRef = React.useRef<HTMLDivElement>(null);
  
  const { socket, roomId } = useSocket();
  const { toast } = useToast();
  
  // Use the canvas size hook for responsive canvas
  const canvasSize = useCanvasSize(containerRef, { width: 350, height: 350 });

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
  }, [strokes, canvasSize]);

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

  const handleVoteForLocalGame = () => {
    if (selectedPlayerId === null) {
      toast({
        title: "No selection",
        description: "Please select a player to vote for.",
        variant: "destructive"
      });
      return;
    }
    
    // Record this player's vote
    const newPlayerVotes = new Map(playerVotes);
    newPlayerVotes.set(votingPlayerId, selectedPlayerId);
    setPlayerVotes(newPlayerVotes);
    
    // Update vote counts
    const newVotes = { ...votes };
    newVotes[selectedPlayerId] = (newVotes[selectedPlayerId] || 0) + 1;
    setVotes(newVotes);
    
    // Add to players who voted
    setPlayersWhoVoted(current => {
      const updated = new Set(current);
      updated.add(votingPlayerId);
      return updated;
    });

    toast({
      title: "Vote recorded",
      description: `${players.find(p => p.id === votingPlayerId)?.name} voted for ${players.find(p => p.id === selectedPlayerId)?.name}`,
    });

    // Check if all players have voted (for local game)
    if (!isMultiplayer) {
      // If this was the last player to vote
      if (playersWhoVoted.size + 1 >= players.length) {
        setTimeout(() => {
          onVotingComplete(newVotes);
        }, 1000);
      } else {
        // Move to next player
        const nextPlayerIndex = players.findIndex(p => p.id === votingPlayerId) + 1;
        if (nextPlayerIndex < players.length) {
          setVotingPlayerId(players[nextPlayerIndex].id);
          setSelectedPlayerId(null);
        }
      }
    }
  };

  const handleVoteMultiplayer = () => {
    if (selectedPlayerId === null) {
      toast({
        title: "No selection",
        description: "Please select a player to vote for.",
        variant: "destructive"
      });
      return;
    }
    
    // Get the local player ID - for multiplayer this might be different
    const localPlayerId = players[0]?.id;
    
    // Check if already voted
    if (playersWhoVoted.has(localPlayerId)) {
      toast({
        title: "Already voted",
        description: "You've already cast your vote.",
        variant: "destructive"
      });
      return;
    }
    
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

    // Check if all players have voted in multiplayer
    if (playersWhoVoted.size + 1 >= players.length) {
      setTimeout(() => {
        onVotingComplete(updatedVotes);
      }, 1000);
    }
  };

  const handleVote = () => {
    if (isMultiplayer) {
      handleVoteMultiplayer();
    } else {
      handleVoteForLocalGame();
    }
  };

  // Get the name of the currently voting player for local game
  const currentVotingPlayerName = players.find(p => p.id === votingPlayerId)?.name || "Player";
  
  // Determine if the current player has already voted (different for local vs multiplayer)
  const hasCurrentPlayerVoted = isMultiplayer 
    ? playersWhoVoted.has(players[0]?.id) 
    : playerVotes.has(votingPlayerId);

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-center">Voting Time</CardTitle>
          {!isMultiplayer && (
            <div className="text-center text-sm text-muted-foreground">
              {currentVotingPlayerName}'s turn to vote
            </div>
          )}
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-lg text-center">
            Who do you think is the imposter?
          </p>
          
          {/* Display the final drawing */}
          <div className="mb-4">
            <p className="text-sm mb-2">The word was: <strong>{secretWord}</strong></p>
            <div className="bg-white border rounded-md overflow-hidden" ref={containerRef}>
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
                onClick={() => !hasCurrentPlayerVoted && setSelectedPlayerId(player.id)}
                disabled={hasCurrentPlayerVoted}
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
            disabled={selectedPlayerId === null || hasCurrentPlayerVoted} 
            className="w-full"
          >
            {hasCurrentPlayerVoted ? "Vote Recorded" : "Submit Vote"}
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
