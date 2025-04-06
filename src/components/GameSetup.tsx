
import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { GameConfig } from "@/types/game";
import { UserPlus, Users, Monitor } from 'lucide-react';
import MultiplayerModal from './MultiplayerModal';
import { useSocket } from '@/contexts/SocketContext';
import { useToast } from "@/components/ui/use-toast";

interface GameSetupProps {
  onConfigSubmit: (config: GameConfig) => void;
}

const GameSetup: React.FC<GameSetupProps> = ({ onConfigSubmit }) => {
  const [playerCount, setPlayerCount] = useState(3);
  const [roundCount, setRoundCount] = useState(2);
  const [showMultiplayerModal, setShowMultiplayerModal] = useState(false);
  const [isMultiplayerGame, setIsMultiplayerGame] = useState(false);
  const [isHost, setIsHost] = useState(false);
  const { toast } = useToast();
  const { roomId } = useSocket();

  // Check URL for room param on page load
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const roomParam = params.get('room');
    
    if (roomParam) {
      setShowMultiplayerModal(true);
    }
  }, []);

  const handleStartGame = () => {
    onConfigSubmit({
      playerCount,
      roundCount,
      isMultiplayer: isMultiplayerGame,
      isHost,
      roomId: roomId || undefined
    });
  };

  const handleMultiplayerGameStart = (isGameHost: boolean) => {
    setIsMultiplayerGame(true);
    setIsHost(isGameHost);
    setShowMultiplayerModal(false);
    
    toast({
      title: isGameHost ? "You're the host" : "You've joined the game",
      description: isGameHost 
        ? "Wait for players to join, then start the game" 
        : "Wait for the host to start the game"
    });
  };

  return (
    <div className="flex items-center justify-center min-h-screen p-4">
      <Card className="w-full max-w-md animate-fade-in">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-center">Stroke of Deception</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <div className="grid gap-2">
              <div className="flex justify-between">
                <Label htmlFor="players">Number of Players: {playerCount}</Label>
              </div>
              <Slider
                id="players"
                min={3}
                max={10}
                step={1}
                defaultValue={[playerCount]}
                onValueChange={(value) => setPlayerCount(value[0])}
                disabled={isMultiplayerGame && !isHost}
              />
            </div>
            
            <div className="grid gap-2">
              <div className="flex justify-between">
                <Label htmlFor="rounds">Number of Rounds: {roundCount}</Label>
              </div>
              <Slider
                id="rounds"
                min={1}
                max={5}
                step={1}
                defaultValue={[roundCount]}
                onValueChange={(value) => setRoundCount(value[0])}
                disabled={isMultiplayerGame && !isHost}
              />
            </div>

            <div className="flex gap-4 pt-2">
              <Button 
                variant="outline" 
                className="w-full" 
                onClick={() => setShowMultiplayerModal(true)}
              >
                <Users className="h-4 w-4 mr-2" />
                Multiplayer
              </Button>
              <Button 
                className="w-full" 
                onClick={handleStartGame}
                disabled={isMultiplayerGame && !isHost}
              >
                {isMultiplayerGame ? (
                  <>
                    <UserPlus className="h-4 w-4 mr-2" />
                    {isHost ? "Start Game" : "Waiting for host..."}
                  </>
                ) : (
                  <>
                    <Monitor className="h-4 w-4 mr-2" />
                    Play Locally
                  </>
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <MultiplayerModal
        isOpen={showMultiplayerModal}
        onClose={() => setShowMultiplayerModal(false)}
        onGameStart={handleMultiplayerGameStart}
      />
    </div>
  );
};

export default GameSetup;
