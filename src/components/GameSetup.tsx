
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { GameConfig } from '@/types/game';
import { Users, RotateCw } from 'lucide-react';

interface GameSetupProps {
  onConfigSubmit: (config: GameConfig) => void;
}

const GameSetup: React.FC<GameSetupProps> = ({ onConfigSubmit }) => {
  const [playerCount, setPlayerCount] = useState<number>(4);
  const [roundCount, setRoundCount] = useState<number>(2);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onConfigSubmit({ playerCount, roundCount });
  };

  return (
    <div className="flex items-center justify-center min-h-screen p-4">
      <Card className="w-full max-w-md animate-fade-in">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl font-bold text-primary">Imposter Game</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label htmlFor="playerCount" className="text-sm font-medium">
                  Players <Users className="inline h-4 w-4 ml-1" />
                </label>
                <span className="font-bold text-lg text-primary">{playerCount}</span>
              </div>
              <Slider
                id="playerCount"
                value={[playerCount]}
                min={3}
                max={10}
                step={1}
                onValueChange={(value) => setPlayerCount(value[0])}
                className="py-4"
              />
              <p className="text-xs text-muted-foreground">Min: 3, Max: 10</p>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label htmlFor="roundCount" className="text-sm font-medium">
                  Rounds <RotateCw className="inline h-4 w-4 ml-1" />
                </label>
                <span className="font-bold text-lg text-primary">{roundCount}</span>
              </div>
              <Slider
                id="roundCount"
                value={[roundCount]}
                min={1}
                max={5}
                step={1}
                onValueChange={(value) => setRoundCount(value[0])}
                className="py-4"
              />
              <p className="text-xs text-muted-foreground">Min: 1, Max: 5</p>
            </div>

            <Button type="submit" className="w-full">
              Start Game
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default GameSetup;
