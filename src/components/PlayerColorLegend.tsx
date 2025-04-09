
import React from 'react';
import { Player } from '@/types/game';

interface PlayerColorLegendProps {
  players: Player[];
}

const PlayerColorLegend: React.FC<PlayerColorLegendProps> = ({ players }) => {
  return (
    <div className="flex flex-wrap justify-center gap-2 mb-4">
      {players.map((player) => (
        <div key={player.id} className="flex items-center space-x-1">
          <div className={`h-4 w-4 rounded-full player-color-${player.colorIndex}`}></div>
          <span className="text-xs font-medium">{player.name}</span>
        </div>
      ))}
    </div>
  );
};

export default PlayerColorLegend;
