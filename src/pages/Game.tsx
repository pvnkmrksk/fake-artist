import React, { useState, useEffect } from 'react';
import GameSetup from '@/components/GameSetup';
import PlayerConfig from '@/components/PlayerConfig';
import WordReveal from '@/components/WordReveal';
import DrawingCanvas from '@/components/DrawingCanvas';
import Voting from '@/components/Voting';
import Results from '@/components/Results';
import { Player, GameConfig, GamePhase, Stroke } from '@/types/game';
import { getRandomWord } from '@/data/wordsList';
import { useToast } from "@/components/ui/use-toast";

const Game: React.FC = () => {
  const [gamePhase, setGamePhase] = useState<GamePhase>('setup');
  const [config, setConfig] = useState<GameConfig | null>(null);
  const [players, setPlayers] = useState<Player[]>([]);
  const [secretWord, setSecretWord] = useState<string>('');
  const [currentRound, setCurrentRound] = useState<number>(1);
  const [strokes, setStrokes] = useState<Stroke[]>([]);
  const [votes, setVotes] = useState<Record<number, number>>({});
  const { toast } = useToast();

  useEffect(() => {
    // Generate a new secret word when players are configured
    if (players.length > 0 && !secretWord) {
      setSecretWord(getRandomWord());
    }
  }, [players]);

  const handleConfigSubmit = (newConfig: GameConfig) => {
    setConfig(newConfig);
    setGamePhase('playerConfig');
  };

  const handlePlayersConfigured = (configuredPlayers: Player[]) => {
    setPlayers(configuredPlayers);
    setGamePhase('wordReveal');
    
    // Notify that the game is starting
    toast({
      title: "Game starting!",
      description: `${configuredPlayers.length} players ready to play.`,
    });
  };

  const handleWordRevealComplete = () => {
    setGamePhase('drawing');
  };

  const handleRoundComplete = (newStrokes: Stroke[]) => {
    setStrokes(newStrokes);
    
    if (config && currentRound < config.roundCount) {
      // Start next round
      setCurrentRound(currentRound + 1);
    } else {
      // All rounds complete, move to voting
      setGamePhase('voting');
    }
  };

  const handleVotingComplete = (finalVotes: Record<number, number>) => {
    setVotes(finalVotes);
    setGamePhase('results');
  };

  const handlePlayAgain = () => {
    // Keep the same players but reset everything else
    setSecretWord(getRandomWord());
    setCurrentRound(1);
    setStrokes([]);
    setVotes({});
    
    // Reassign the imposter role
    const imposterIndex = Math.floor(Math.random() * players.length);
    const updatedPlayers = players.map((player, index) => ({
      ...player,
      isImposter: index === imposterIndex
    }));
    
    setPlayers(updatedPlayers);
    setGamePhase('wordReveal');
    
    toast({
      title: "New game starting!",
      description: "Same players, new word and roles.",
    });
  };

  const handleReturnHome = () => {
    // Reset everything
    setConfig(null);
    setPlayers([]);
    setSecretWord('');
    setCurrentRound(1);
    setStrokes([]);
    setVotes({});
    setGamePhase('setup');
  };

  return (
    <div className="min-h-screen">
      {gamePhase === 'setup' && (
        <GameSetup onConfigSubmit={handleConfigSubmit} />
      )}
      
      {gamePhase === 'playerConfig' && config && (
        <PlayerConfig 
          config={config}
          onPlayersConfigured={handlePlayersConfigured} 
        />
      )}
      
      {gamePhase === 'wordReveal' && players.length > 0 && (
        <WordReveal 
          players={players}
          secretWord={secretWord}
          onComplete={handleWordRevealComplete}
        />
      )}
      
      {gamePhase === 'drawing' && config && (
        <DrawingCanvas
          players={players}
          currentRound={currentRound}
          totalRounds={config.roundCount}
          secretWord={secretWord}
          onRoundComplete={handleRoundComplete}
        />
      )}
      
      {gamePhase === 'voting' && (
        <Voting
          players={players}
          secretWord={secretWord}
          onVotingComplete={handleVotingComplete}
        />
      )}
      
      {gamePhase === 'results' && (
        <Results
          players={players}
          votes={votes}
          secretWord={secretWord}
          onPlayAgain={handlePlayAgain}
          onReturnHome={handleReturnHome}
        />
      )}
    </div>
  );
};

export default Game;
