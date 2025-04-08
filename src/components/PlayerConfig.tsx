
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Player, GameConfig } from '@/types/game';
import { useToast } from "@/hooks/use-toast";
import { useSocket } from '@/contexts/SocketContext';
import { getRandomName } from '@/data/wordsList';

const PLAYER_COLORS = [
  '#FF5733', '#33FF57', '#3357FF', '#F433FF', 
  '#FF33A8', '#33FFF6', '#FFD633', '#A833FF',
  '#FF8C33', '#33FFB8'
];

export interface PlayerConfigProps {
  config: GameConfig;
  onPlayersConfigured: (players: Player[]) => void;
  isMultiplayer?: boolean;
}

const PlayerConfig: React.FC<PlayerConfigProps> = ({ 
  config, 
  onPlayersConfigured,
  isMultiplayer = false
}) => {
  const [players, setPlayers] = useState<Player[]>([]);
  const [currentPlayerIndex, setCurrentPlayerIndex] = useState<number>(0);
  const [currentPlayerName, setCurrentPlayerName] = useState<string>(getRandomName());
  const [isEditingName, setIsEditingName] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

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

  const handleNameFocus = () => {
    // Clear the placeholder name only on first focus
    if (!isEditingName) {
      setCurrentPlayerName('');
      setIsEditingName(true);
    }
  };

  const handleAddPlayer = () => {
    if (!currentPlayerName.trim()) {
      setError("Please enter a name");
      return;
    }

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
    
    if (currentPlayerIndex < config.playerCount - 1) {
      setCurrentPlayerIndex(currentPlayerIndex + 1);
      setCurrentPlayerName(getRandomName());
      setIsEditingName(false);
    } else {
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
                placeholder={getRandomName()}
                value={currentPlayerName}
                onChange={handleNameChange}
                onFocus={handleNameFocus}
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
