
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
import { useSocket } from '@/contexts/SocketContext';
import { useNavigate } from 'react-router-dom';

const Game: React.FC = () => {
  const [gamePhase, setGamePhase] = useState<GamePhase>('setup');
  const [config, setConfig] = useState<GameConfig | null>(null);
  const [players, setPlayers] = useState<Player[]>([]);
  const [secretWord, setSecretWord] = useState<string>('');
  const [currentRound, setCurrentRound] = useState<number>(1);
  const [strokes, setStrokes] = useState<Stroke[]>([]);
  const [votes, setVotes] = useState<Record<number, number>>({});
  const { toast } = useToast();
  const { socket, roomId, leaveRoom } = useSocket();
  const navigate = useNavigate();

  // Handle room parameter in URL on component mount
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const roomParam = params.get('room');
    
    if (roomParam) {
      // Clear the room parameter from URL
      navigate('/', { replace: true });
    }
  }, [navigate]);

  // Set up socket event listeners for multiplayer game
  useEffect(() => {
    if (!socket || !config?.isMultiplayer) return;

    // Listen for game state updates
    const handleGameStateUpdate = (gameState: any) => {
      // Update local game state based on server data
      if (gameState.players) setPlayers(gameState.players);
      if (gameState.gamePhase) setGamePhase(gameState.gamePhase);
      if (gameState.secretWord) setSecretWord(gameState.secretWord);
      if (gameState.currentRound) setCurrentRound(gameState.currentRound);
      if (gameState.strokes) setStrokes(gameState.strokes);
      if (gameState.votes) setVotes(gameState.votes);
    };

    // Listen for new player joining
    const handlePlayerJoined = (newPlayer: Player) => {
      toast({
        title: "Player joined",
        description: `${newPlayer.name} has joined the game`
      });
      
      setPlayers(current => [...current, newPlayer]);
    };

    // Listen for player leaving
    const handlePlayerLeft = (playerId: number) => {
      const leavingPlayer = players.find(p => p.id === playerId);
      if (leavingPlayer) {
        toast({
          title: "Player left",
          description: `${leavingPlayer.name} has left the game`
        });
        
        setPlayers(current => current.filter(p => p.id !== playerId));
      }
    };

    socket.on('game-state-update', handleGameStateUpdate);
    socket.on('player-joined', handlePlayerJoined);
    socket.on('player-left', handlePlayerLeft);

    return () => {
      socket.off('game-state-update', handleGameStateUpdate);
      socket.off('player-joined', handlePlayerJoined);
      socket.off('player-left', handlePlayerLeft);
    };
  }, [socket, config?.isMultiplayer, players, toast]);

  // Generate a new secret word when players are configured
  useEffect(() => {
    // Generate a new secret word when players are configured
    if (players.length > 0 && !secretWord) {
      const word = getRandomWord();
      setSecretWord(word);
      
      // Broadcast the word to other players in multiplayer mode
      if (config?.isMultiplayer && socket && config.isHost && roomId) {
        socket.emit('set-secret-word', { roomId, secretWord: word });
      }
    }
  }, [players, secretWord, config, socket, roomId]);

  const handleConfigSubmit = (newConfig: GameConfig) => {
    setConfig(newConfig);
    
    if (newConfig.isMultiplayer) {
      // In multiplayer mode, host configures the game and broadcasts settings
      if (newConfig.isHost && socket && roomId) {
        socket.emit('game-config', { 
          roomId, 
          config: newConfig 
        });
      }
    }
    
    setGamePhase('playerConfig');
  };

  const handlePlayersConfigured = (configuredPlayers: Player[]) => {
    // Mark online players
    const onlinePlayers = configuredPlayers.map(player => ({
      ...player,
      isOnline: config?.isMultiplayer || false
    }));
    
    setPlayers(onlinePlayers);
    setGamePhase('wordReveal');
    
    // In multiplayer mode, broadcast player configuration
    if (config?.isMultiplayer && socket && roomId && config.isHost) {
      socket.emit('players-configured', { 
        roomId, 
        players: onlinePlayers 
      });
    }
    
    toast({
      title: "Game starting!",
      description: `${configuredPlayers.length} players ready to play.`,
    });
  };

  const handleWordRevealComplete = () => {
    setGamePhase('drawing');
    
    // In multiplayer mode, broadcast game phase change
    if (config?.isMultiplayer && socket && roomId && config.isHost) {
      socket.emit('phase-change', { 
        roomId, 
        phase: 'drawing' 
      });
    }
  };

  const handleRoundComplete = (newStrokes: Stroke[]) => {
    // Save the complete round's strokes by combining with existing strokes
    const updatedStrokes = [...strokes, ...newStrokes];
    setStrokes(updatedStrokes); // Keep all strokes for all rounds
    
    // In multiplayer mode, broadcast strokes
    if (config?.isMultiplayer && socket && roomId && config.isHost) {
      socket.emit('round-complete', { 
        roomId, 
        strokes: updatedStrokes,
        currentRound
      });
    }
    
    if (config && currentRound < config.roundCount) {
      // Start next round
      setCurrentRound(currentRound + 1);
      
      toast({
        title: "Round complete!",
        description: `Starting round ${currentRound + 1} of ${config.roundCount}`,
      });
      
      // In multiplayer mode, broadcast next round
      if (config?.isMultiplayer && socket && roomId && config.isHost) {
        socket.emit('next-round', { 
          roomId, 
          round: currentRound + 1 
        });
      }
    } else {
      // All rounds complete, move to voting
      setGamePhase('voting');
      
      // In multiplayer mode, broadcast phase change
      if (config?.isMultiplayer && socket && roomId && config.isHost) {
        socket.emit('phase-change', { 
          roomId, 
          phase: 'voting' 
        });
      }
    }
  };

  const handleVotingComplete = (finalVotes: Record<number, number>) => {
    setVotes(finalVotes);
    setGamePhase('results');
    
    // In multiplayer mode, broadcast votes and phase change
    if (config?.isMultiplayer && socket && roomId && config.isHost) {
      socket.emit('voting-complete', { 
        roomId, 
        votes: finalVotes 
      });
      socket.emit('phase-change', { 
        roomId, 
        phase: 'results' 
      });
    }
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
    
    // In multiplayer mode, broadcast play again
    if (config?.isMultiplayer && socket && roomId && config.isHost) {
      socket.emit('play-again', { 
        roomId, 
        players: updatedPlayers,
        secretWord: getRandomWord()
      });
    }
    
    toast({
      title: "New game starting!",
      description: "Same players, new word and roles.",
    });
  };

  const handleReturnHome = () => {
    // Leave the room if in multiplayer mode
    if (config?.isMultiplayer) {
      leaveRoom();
    }
    
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
          isMultiplayer={config.isMultiplayer}
        />
      )}
      
      {gamePhase === 'wordReveal' && players.length > 0 && (
        <WordReveal 
          players={players}
          secretWord={secretWord}
          onComplete={handleWordRevealComplete}
          isMultiplayer={config?.isMultiplayer}
        />
      )}
      
      {gamePhase === 'drawing' && config && (
        <DrawingCanvas
          key={`drawing-round-${currentRound}`} // Force re-render with each round
          players={players}
          currentRound={currentRound}
          totalRounds={config.roundCount}
          secretWord={secretWord}
          previousStrokes={strokes} // Pass previous strokes to maintain drawing history
          onRoundComplete={handleRoundComplete}
          isMultiplayer={config.isMultiplayer}
        />
      )}
      
      {gamePhase === 'voting' && (
        <Voting
          players={players}
          secretWord={secretWord}
          strokes={strokes}
          onVotingComplete={handleVotingComplete}
          isMultiplayer={config?.isMultiplayer}
        />
      )}
      
      {gamePhase === 'results' && (
        <Results
          players={players}
          votes={votes}
          secretWord={secretWord}
          onPlayAgain={handlePlayAgain}
          onReturnHome={handleReturnHome}
          isMultiplayer={config?.isMultiplayer}
        />
      )}
    </div>
  );
};

export default Game;
