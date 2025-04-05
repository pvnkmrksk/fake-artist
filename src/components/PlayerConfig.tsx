
import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Player, GameConfig } from '@/types/game';
import { UserPlus } from 'lucide-react';

interface PlayerConfigProps {
  config: GameConfig;
  onPlayersConfigured: (players: Player[]) => void;
}

const PlayerConfig: React.FC<PlayerConfigProps> = ({ config, onPlayersConfigured }) => {
  const [players, setPlayers] = useState<Player[]>([]);
  const [currentPlayerIndex, setCurrentPlayerIndex] = useState<number>(0);
  const [currentPlayerName, setCurrentPlayerName] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  // Initialize player array with empty players
  useEffect(() => {
    const initialPlayers = Array.from({ length: config.playerCount }, (_, i) => ({
      id: i,
      name: '',
      colorIndex: i % 10 + 1, // Assigns colors 1-10 based on index
    }));
    setPlayers(initialPlayers);
  }, [config.playerCount]);

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCurrentPlayerName(e.target.value);
    setError(null);
  };

  const handleAddPlayer = () => {
    if (!currentPlayerName.trim()) {
      setError("Please enter a name");
      return;
    }

    // Check for duplicate names
    if (players.some(p => p.name === currentPlayerName.trim())) {
      setError("This name is already taken");
      return;
    }

    const updatedPlayers = [...players];
    updatedPlayers[currentPlayerIndex] = {
      ...updatedPlayers[currentPlayerIndex],
      name: currentPlayerName.trim(),
    };

    setPlayers(updatedPlayers);
    
    // Move to next player or finish
    if (currentPlayerIndex < config.playerCount - 1) {
      setCurrentPlayerIndex(currentPlayerIndex + 1);
      setCurrentPlayerName('');
    } else {
      // Designate a random player as the imposter
      const imposterIndex = Math.floor(Math.random() * config.playerCount);
      const finalPlayers = updatedPlayers.map((player, index) => ({
        ...player,
        isImposter: index === imposterIndex
      }));
      
      onPlayersConfigured(finalPlayers);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen p-4">
      <Card className="w-full max-w-md animate-fade-in">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-center">
            Player {currentPlayerIndex + 1} of {config.playerCount}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-4">
            <div className={`h-12 w-12 rounded-full flex items-center justify-center text-white font-bold player-color-${players[currentPlayerIndex]?.colorIndex}`}>
              {currentPlayerIndex + 1}
            </div>
            <div className="flex-1">
              <Input
                placeholder="Enter your name"
                value={currentPlayerName}
                onChange={handleNameChange}
                className={error ? "border-red-500" : ""}
                autoFocus
              />
              {error && <p className="text-red-500 text-sm mt-1">{error}</p>}
            </div>
          </div>
        </CardContent>
        <CardFooter>
          <Button 
            onClick={handleAddPlayer} 
            className="w-full"
          >
            {currentPlayerIndex < config.playerCount - 1 ? (
              <>Next Player</>
            ) : (
              <>Start Game</>
            )}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
};

export default PlayerConfig;
