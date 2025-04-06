import React from 'react';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Player } from '@/types/game';
import { useSocket } from '@/contexts/SocketContext';
import { CheckCircle, XCircle, RotateCw, Home } from 'lucide-react';
import { motion } from 'framer-motion';

export interface ResultsProps {
  players: Player[];
  votes: Record<number, number>;
  secretWord: string;
  onPlayAgain: () => void;
  onReturnHome: () => void;
  isMultiplayer?: boolean;
}

const Results: React.FC<ResultsProps> = ({
  players,
  votes,
  secretWord,
  onPlayAgain,
  onReturnHome,
  isMultiplayer = false
}) => {
  // Find the imposter
  const imposter = players.find(player => player.isImposter);
  
  if (!imposter) return null;
  
  // Count votes for each player
  const voteCounts: Record<number, number> = {};
  players.forEach(player => {
    voteCounts[player.id] = 0;
  });
  
  Object.values(votes).forEach(votedId => {
    voteCounts[votedId] = (voteCounts[votedId] || 0) + 1;
  });
  
  // Find the player with the most votes
  let maxVotes = 0;
  let mostVotedId = -1;
  
  Object.entries(voteCounts).forEach(([playerId, count]) => {
    if (count > maxVotes) {
      maxVotes = count;
      mostVotedId = Number(playerId);
    }
  });
  
  const imposterCaught = mostVotedId === imposter.id;
  
  // Prepare results data
  const resultsData = players.map(player => {
    const voteCount = voteCounts[player.id] || 0;
    return {
      ...player,
      voteCount,
      isMainSuspect: player.id === mostVotedId
    };
  });
  
  // Sort by vote count, descending
  resultsData.sort((a, b) => b.voteCount - a.voteCount);

  return (
    <div className="flex items-center justify-center min-h-screen p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">
            {imposterCaught ? (
              <span className="text-green-500">Imposter Caught!</span>
            ) : (
              <span className="text-red-500">Imposter Got Away!</span>
            )}
          </CardTitle>
          <p className="text-center text-muted-foreground">The word was: <span className="font-medium">{secretWord}</span></p>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <motion.div 
              className={`p-4 rounded-lg ${imposterCaught ? 'bg-green-50' : 'bg-red-50'} mb-4`}
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
            >
              <div className="flex items-center">
                <div className={`h-10 w-10 rounded-full flex items-center justify-center text-white font-bold text-sm player-color-${imposter.colorIndex}`}>
                  {imposter.id + 1}
                </div>
                <div className="ml-3">
                  <p className="font-medium">{imposter.name} was the imposter!</p>
                  <p className="text-sm text-muted-foreground">
                    {imposterCaught ? 'Got caught!' : 'Got away!'}
                  </p>
                </div>
                {imposterCaught ? (
                  <CheckCircle className="ml-auto text-green-500 h-6 w-6" />
                ) : (
                  <XCircle className="ml-auto text-red-500 h-6 w-6" />
                )}
              </div>
            </motion.div>
            
            <h3 className="font-medium text-lg mb-2">Vote Results</h3>
            <div className="space-y-2">
              {resultsData.map((player, index) => (
                <motion.div 
                  key={player.id} 
                  className={`flex items-center border p-3 rounded ${
                    player.isMainSuspect ? 'border-primary' : ''
                  }`}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <div className={`h-8 w-8 rounded-full flex items-center justify-center text-white font-bold text-xs player-color-${player.colorIndex}`}>
                    {player.id + 1}
                  </div>
                  <div className="ml-3 flex-1">
                    <p className="font-medium">
                      {player.name}
                      {player.isImposter && <span className="text-xs ml-2 text-red-500">(Imposter)</span>}
                    </p>
                  </div>
                  <div className="text-right font-medium">
                    {player.voteCount} votes
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button variant="outline" onClick={onReturnHome} className="flex-1 mr-2">
            <Home className="h-4 w-4 mr-2" />
            New Game
          </Button>
          <Button onClick={onPlayAgain} className="flex-1">
            <RotateCw className="h-4 w-4 mr-2" />
            Play Again
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
};

export default Results;
