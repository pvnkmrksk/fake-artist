
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

/**
 * Sogu (ಸೋಗು) - A social deduction drawing game
 * 
 * This component handles the main game flow for Sogu, coordinating between
 * different game phases: setup, player configuration, word reveal, drawing,
 * voting, and results. One player is secretly assigned as the "imposter" who
 * doesn't know the secret word but must pretend they do.
 * 
 * @returns {React.ReactElement} The game UI based on the current game phase
 */
const Game: React.FC = () => {
  // Game state management
  const [gamePhase, setGamePhase] = useState<GamePhase>('setup');
  const [config, setConfig] = useState<GameConfig | null>(null);
  const [players, setPlayers] = useState<Player[]>([]);
  const [secretWord, setSecretWord] = useState<string>('');
  const [currentRound, setCurrentRound] = useState<number>(1);
  const [strokes, setStrokes] = useState<Stroke[]>([]);
  const [votes, setVotes] = useState<Record<number, number>>({});
  const { toast } = useToast();

  /**
   * Generate a secret word once players are configured
   */
  useEffect(() => {
    // Generate a new secret word when players are configured
    if (players.length > 0 && !secretWord) {
      setSecretWord(getRandomWord());
    }
  }, [players]);

  /**
   * Handles initial game configuration submission
   * @param newConfig - The game configuration settings
   */
  const handleConfigSubmit = (newConfig: GameConfig) => {
    setConfig(newConfig);
    setGamePhase('playerConfig');
  };

  /**
   * Handles player configuration completion
   * @param configuredPlayers - Array of configured players
   */
  const handlePlayersConfigured = (configuredPlayers: Player[]) => {
    setPlayers(configuredPlayers);
    setGamePhase('wordReveal');
    
    // Notify that the game is starting
    toast({
      title: "Sogu (ಸೋಗು) is starting!",
      description: `${configuredPlayers.length} players ready to play.`,
    });
  };

  /**
   * Moves the game from word reveal to drawing phase
   */
  const handleWordRevealComplete = () => {
    setGamePhase('drawing');
  };

  /**
   * Handles completion of a drawing round
   * @param newStrokes - New drawing strokes from the completed round
   */
  const handleRoundComplete = (newStrokes: Stroke[]) => {
    // Save the complete round's strokes by combining with existing strokes
    const updatedStrokes = [...strokes, ...newStrokes];
    setStrokes(updatedStrokes); // Keep all strokes for all rounds
    
    if (config && currentRound < config.roundCount) {
      // Start next round
      setCurrentRound(currentRound + 1);
      
      toast({
        title: "Round complete!",
        description: `Starting round ${currentRound + 1} of ${config.roundCount}`,
      });
    } else {
      // All rounds complete, move to voting
      setGamePhase('voting');
    }
  };

  /**
   * Handles completion of voting phase
   * @param finalVotes - Vote counts for each player
   */
  const handleVotingComplete = (finalVotes: Record<number, number>) => {
    setVotes(finalVotes);
    setGamePhase('results');
  };

  /**
   * Resets the game to start a new game with the same players
   */
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

  /**
   * Resets everything and returns to the game setup screen
   */
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
          key={`drawing-round-${currentRound}`} // Force re-render with each round to reset player index
          players={players}
          currentRound={currentRound}
          totalRounds={config.roundCount}
          secretWord={secretWord}
          previousStrokes={strokes} // Pass previous strokes to maintain drawing history
          onRoundComplete={handleRoundComplete}
        />
      )}
      
      {gamePhase === 'voting' && (
        <Voting
          players={players}
          secretWord={secretWord}
          strokes={strokes}
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
