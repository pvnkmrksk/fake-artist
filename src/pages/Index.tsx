
import Game from './Game';
import { SocketProvider } from '@/contexts/SocketContext';

const Index = () => {
  return (
    <div className="min-h-screen bg-secondary/20">
      <Game />
    </div>
  );
};

export default Index;
