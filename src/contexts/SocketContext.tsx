
import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { useToast } from "@/hooks/use-toast";

// Using a mock URL - this would be your actual Socket.IO server in production
const SOCKET_SERVER_URL = 'https://mock-socket-server.lovable.dev';

interface SocketContextType {
  socket: Socket | null;
  isConnected: boolean;
  roomId: string | null;
  createRoom: () => Promise<string>;
  joinRoom: (roomId: string) => Promise<boolean>;
  leaveRoom: () => void;
  isConnecting: boolean; // Added to track connection state
}

export const SocketContext = createContext<SocketContextType>({
  socket: null,
  isConnected: false,
  roomId: null,
  createRoom: async () => '',
  joinRoom: async () => false,
  leaveRoom: () => {},
  isConnecting: false, // Default value
});

export const useSocket = () => useContext(SocketContext);

export const SocketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [roomId, setRoomId] = useState<string | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const { toast } = useToast();
  
  // Initialize socket connection
  useEffect(() => {
    // Connect to Socket.IO server
    const socketInstance = io(SOCKET_SERVER_URL, {
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      transports: ['websocket'],
      autoConnect: true,
      timeout: 10000,
    });

    socketInstance.on('connect', () => {
      console.log('Socket connected');
      setIsConnected(true);
      setIsConnecting(false);
      toast({
        title: "Connected to server",
        description: "Ready for multiplayer gameplay",
      });
    });

    socketInstance.on('connect_error', (err) => {
      console.error('Socket connection error:', err);
      setIsConnecting(false);
      toast({
        title: "Connection error",
        description: "Could not connect to game server",
        variant: "destructive"
      });
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
  }, [toast]);
  
  // Room creation function
  const createRoom = async (): Promise<string> => {
    if (!socket) throw new Error('Socket not connected');
    setIsConnecting(true);
    
    return new Promise((resolve, reject) => {
      // Add timeout to prevent infinite waiting
      const timeout = setTimeout(() => {
        setIsConnecting(false);
        reject(new Error('Room creation timeout'));
        toast({
          title: "Room creation failed",
          description: "Server took too long to respond",
          variant: "destructive"
        });
      }, 5000);
      
      socket.emit('create-room', (newRoomId: string) => {
        clearTimeout(timeout);
        setIsConnecting(false);
        console.log('Room created:', newRoomId);
        setRoomId(newRoomId);
        resolve(newRoomId);
      });
    });
  };

  // Room joining function
  const joinRoom = async (roomToJoin: string): Promise<boolean> => {
    if (!socket) throw new Error('Socket not connected');
    setIsConnecting(true);
    
    return new Promise((resolve, reject) => {
      // Add timeout to prevent infinite waiting
      const timeout = setTimeout(() => {
        setIsConnecting(false);
        reject(new Error('Join room timeout'));
        toast({
          title: "Joining room failed",
          description: "Server took too long to respond",
          variant: "destructive"
        });
      }, 5000);
      
      socket.emit('join-room', roomToJoin, (success: boolean) => {
        clearTimeout(timeout);
        setIsConnecting(false);
        if (success) {
          console.log('Joined room:', roomToJoin);
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
    leaveRoom,
    isConnecting
  };

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  );
};
