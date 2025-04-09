import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { GameConfig } from '@/types/game';
import MultiplayerModal from '@/components/MultiplayerModal';
import Footer from '@/components/Footer';

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

  const handlePlayerCountChange = (value: number[]) => {
    setPlayerCount(value[0]);
  };

  const handleRoundCountChange = (value: number[]) => {
    setRoundCount(value[0]);
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-background">
      <div className="w-full max-w-md flex flex-col items-center justify-center mb-6 space-y-2">
        <img 
          src="/lovable-uploads/f54fa397-4d76-460c-9cef-ac9ab7fa9f8b.png" 
          alt="Kaun Artist Logo" 
          className="h-40 object-contain" 
        />
        <div className="flex flex-col items-center">
          <h1 className="text-5xl font-samarkand text-primary">Kaun</h1>
          <h1 className="text-5xl font-samarkand text-black dark:text-white">Artist</h1>
        </div>
      </div>

      <Card className="w-full max-w-md">
        <CardHeader>
          <CardDescription className="text-center">
            Kaun you guess who doesn't know the prompt?
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <div className="flex justify-between mb-2">
              <Label htmlFor="playerCount">Number of Players: {playerCount}</Label>
            </div>
            <Slider
              id="playerCount"
              min={3}
              max={10}
              step={1}
              value={[playerCount]}
              onValueChange={handlePlayerCountChange}
            />
          </div>
          
          <div className="space-y-2">
            <div className="flex justify-between mb-2">
              <Label htmlFor="roundCount">Number of Rounds: {roundCount}</Label>
            </div>
            <Slider
              id="roundCount"
              min={1}
              max={5}
              step={1}
              value={[roundCount]}
              onValueChange={handleRoundCountChange}
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
      
      <div className="mt-6">
        <Footer />
      </div>
      
      <MultiplayerModal
        isOpen={isShowingMultiplayerModal}
        onClose={() => setIsShowingMultiplayerModal(false)}
        onConfigSubmit={handleMultiplayerConfig}
      />
    </div>
  );
};

export default GameSetup;
