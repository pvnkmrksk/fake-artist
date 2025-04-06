
import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import { io, Socket } from 'socket.io-client';

// Using a mock URL - this would be your actual Socket.IO server in production
const SOCKET_SERVER_URL = 'https://mock-socket-server.lovable.dev';

interface SocketContextType {
  socket: Socket | null;
  isConnected: boolean;
  roomId: string | null;
  createRoom: () => Promise<string>;
  joinRoom: (roomId: string) => Promise<boolean>;
  leaveRoom: () => void;
}

export const SocketContext = createContext<SocketContextType>({
  socket: null,
  isConnected: false,
  roomId: null,
  createRoom: async () => '',
  joinRoom: async () => false,
  leaveRoom: () => {},
});

export const useSocket = () => useContext(SocketContext);

export const SocketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [roomId, setRoomId] = useState<string | null>(null);
  
  // Initialize socket connection
  useEffect(() => {
    // Connect to Socket.IO server
    const socketInstance = io(SOCKET_SERVER_URL, {
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      transports: ['websocket'],
    });

    socketInstance.on('connect', () => {
      console.log('Socket connected');
      setIsConnected(true);
    });

    socketInstance.on('disconnect', () => {
      console.log('Socket disconnected');
      setIsConnected(false);
      setRoomId(null);
    });

    setSocket(socketInstance);

    // Cleanup on unmount
    return () => {
      console.log('Disconnecting socket');
      socketInstance.disconnect();
    };
  }, []);
  
  // Room creation function
  const createRoom = async (): Promise<string> => {
    if (!socket) throw new Error('Socket not connected');
    
    return new Promise((resolve) => {
      socket.emit('create-room', (newRoomId: string) => {
        setRoomId(newRoomId);
        resolve(newRoomId);
      });
    });
  };

  // Room joining function
  const joinRoom = async (roomToJoin: string): Promise<boolean> => {
    if (!socket) throw new Error('Socket not connected');
    
    return new Promise((resolve) => {
      socket.emit('join-room', roomToJoin, (success: boolean) => {
        if (success) {
          setRoomId(roomToJoin);
        }
        resolve(success);
      });
    });
  };

  // Leave room function
  const leaveRoom = () => {
    if (socket && roomId) {
      socket.emit('leave-room', roomId);
      setRoomId(null);
    }
  };
  
  const value = {
    socket,
    isConnected,
    roomId,
    createRoom,
    joinRoom,
    leaveRoom
  };

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  );
};
