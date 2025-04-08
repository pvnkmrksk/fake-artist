
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { GameConfig } from '@/types/game';
import MultiplayerModal from '@/components/MultiplayerModal';
import { useNavigate } from 'react-router-dom';

interface GameSetupProps {
  onConfigSubmit: (config: GameConfig) => void;
  initialTimerDuration?: number;
  initialTimerEnabled?: boolean;
}

const GameSetup: React.FC<GameSetupProps> = ({ 
  onConfigSubmit,
  initialTimerDuration = 30,
  initialTimerEnabled = false
}) => {
  const [playerCount, setPlayerCount] = useState<number>(4);
  const [roundCount, setRoundCount] = useState<number>(3);
  const [isShowingMultiplayerModal, setIsShowingMultiplayerModal] = useState<boolean>(false);
  const [isTimerEnabled, setIsTimerEnabled] = useState<boolean>(initialTimerEnabled);
  const [timerDuration, setTimerDuration] = useState<number>(initialTimerDuration);
  const navigate = useNavigate();

  const handleLocalGame = () => {
    onConfigSubmit({
      playerCount,
      roundCount,
      isMultiplayer: false,
      timerEnabled: isTimerEnabled,
      timerDuration: isTimerEnabled ? timerDuration : undefined
    });
  };

  const handleShowMultiplayerModal = () => {
    setIsShowingMultiplayerModal(true);
  };

  const handleMultiplayerConfig = (roomConfig: { roomId: string, isHost: boolean }) => {
    onConfigSubmit({
      playerCount: 0, // We'll count as players join
      roundCount,
      isMultiplayer: true,
      isHost: roomConfig.isHost,
      roomId: roomConfig.roomId,
      timerEnabled: isTimerEnabled,
      timerDuration: isTimerEnabled ? timerDuration : undefined
    });
    setIsShowingMultiplayerModal(false);
  };

  const handleTimerToggle = (checked: boolean) => {
    setIsTimerEnabled(checked);
  };

  const handleTimerDurationChange = (value: number[]) => {
    setTimerDuration(value[0]);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-center">Fake Artist</CardTitle>
          <CardDescription className="text-center">
            One player doesn't know the prompt - can you guess who?
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="playerCount">Number of Players</Label>
            <Input
              id="playerCount"
              type="number"
              min="3"
              max="10"
              value={playerCount}
              onChange={(e) => setPlayerCount(parseInt(e.target.value) || 3)}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="roundCount">Number of Rounds</Label>
            <Input
              id="roundCount"
              type="number"
              min="1"
              max="5"
              value={roundCount}
              onChange={(e) => setRoundCount(parseInt(e.target.value) || 1)}
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="timer-toggle">Enable Turn Timer</Label>
              <Switch 
                id="timer-toggle"
                checked={isTimerEnabled}
                onCheckedChange={handleTimerToggle}
              />
            </div>
            
            {isTimerEnabled && (
              <div className="pt-4">
                <div className="flex justify-between mb-2">
                  <span>Timer: {timerDuration} seconds</span>
                </div>
                <Slider
                  min={10}
                  max={120}
                  step={5}
                  value={[timerDuration]}
                  onValueChange={handleTimerDurationChange}
                />
              </div>
            )}
          </div>
          
          <div className="space-y-2 pt-4">
            <Button 
              onClick={handleLocalGame} 
              className="w-full"
            >
              Start Local Game
            </Button>
            <Button 
              onClick={handleShowMultiplayerModal} 
              variant="outline" 
              className="w-full"
            >
              Play Multiplayer
            </Button>
          </div>
        </CardContent>
      </Card>
      
      <MultiplayerModal
        isOpen={isShowingMultiplayerModal}
        onClose={() => setIsShowingMultiplayerModal(false)}
        onJoinGame={handleMultiplayerConfig}
      />
    </div>
  );
};

export default GameSetup;
