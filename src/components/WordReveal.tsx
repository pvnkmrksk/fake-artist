
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Player } from '@/types/game';
import { Eye, EyeOff, UserCheck } from 'lucide-react';
import { useSocket } from '@/contexts/SocketContext';

export interface WordRevealProps {
  players: Player[];
  secretWord: string;
  onComplete: () => void;
  isMultiplayer?: boolean; // Added the missing prop
}

const WordReveal: React.FC<WordRevealProps> = ({ 
  players, 
  secretWord, 
  onComplete,
  isMultiplayer = false // Default value
}) => {
  const [currentPlayerIndex, setCurrentPlayerIndex] = useState<number>(0);
  const [isRevealed, setIsRevealed] = useState<boolean>(false);
  const [showPass, setShowPass] = useState<boolean>(false);

  const currentPlayer = players[currentPlayerIndex];
  const isImposter = currentPlayer?.isImposter;

  const handleReveal = () => {
    setIsRevealed(true);
  };

  const handleContinue = () => {
    setIsRevealed(false);
    setShowPass(true);
  };

  const handlePass = () => {
    setShowPass(false);
    if (currentPlayerIndex < players.length - 1) {
      setCurrentPlayerIndex(currentPlayerIndex + 1);
    } else {
      onComplete();
    }
  };

  useEffect(() => {
    if (isRevealed) {
      const timer = setTimeout(() => {
        setIsRevealed(false);
        setShowPass(true);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [isRevealed]);

  const renderPassScreen = () => (
    <Card className="w-full max-w-md animate-fade-in">
      <CardHeader>
        <CardTitle className="text-center">Pass the device</CardTitle>
      </CardHeader>
      <CardContent className="text-center">
        <div className="mb-6">
          <div className={`h-16 w-16 rounded-full mx-auto flex items-center justify-center text-white font-bold player-color-${currentPlayer?.colorIndex}`}>
            {currentPlayerIndex + 1}
          </div>
          <p className="text-xl font-medium mt-2">{currentPlayer?.name}</p>
        </div>
        
        <p className="text-muted-foreground">Please pass the device to the next player</p>
      </CardContent>
      <CardFooter className="justify-center">
        <Button onClick={handlePass} className="px-8" size="lg">
          <UserCheck className="w-4 h-4 mr-2" />
          I'm {players[(currentPlayerIndex + 1) % players.length]?.name}
        </Button>
      </CardFooter>
    </Card>
  );

  const renderRevealScreen = () => (
    <Card className="w-full max-w-md animate-fade-in">
      <CardHeader>
        <CardTitle className="text-center">
          <div className={`h-12 w-12 rounded-full mx-auto flex items-center justify-center text-white font-bold player-color-${currentPlayer?.colorIndex}`}>
            {currentPlayerIndex + 1}
          </div>
          <span className="mt-2 block">{currentPlayer?.name}'s Turn</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="text-center">
        {!isRevealed ? (
          <div className="bg-muted rounded-lg p-8 my-4 select-none">
            <p className="text-muted-foreground">Tap to reveal your role</p>
            <Button 
              onClick={handleReveal}
              variant="outline" 
              size="lg" 
              className="mt-4"
            >
              <Eye className="mr-2 h-4 w-4" /> Reveal
            </Button>
          </div>
        ) : (
          <div 
            className="bg-secondary rounded-lg p-8 my-4 select-none transition-all duration-200 opacity-100 scale-100"
          >
            {isImposter ? (
              <div className="space-y-2">
                <p className="text-xl font-bold text-destructive">You are the IMPOSTER!</p>
                <p>Try to blend in without knowing the word</p>
              </div>
            ) : (
              <div className="space-y-2">
                <p className="text-muted-foreground text-sm">The secret word is:</p>
                <p className="text-3xl font-bold text-primary">{secretWord}</p>
                <p className="text-sm mt-2">Remember it but don't be obvious!</p>
              </div>
            )}
            <Button 
              onClick={handleContinue}
              className="mt-6"
            >
              <EyeOff className="mr-2 h-4 w-4" /> Hide
            </Button>
          </div>
        )}
      </CardContent>
      
      {isRevealed && (
        <CardFooter className="justify-center pb-6">
          <p className="text-sm text-muted-foreground animate-pulse">
            Auto-hiding in a few seconds...
          </p>
        </CardFooter>
      )}
    </Card>
  );

  return (
    <div className="flex items-center justify-center min-h-screen p-4">
      {showPass ? renderPassScreen() : renderRevealScreen()}
    </div>
  );
};

export default WordReveal;
