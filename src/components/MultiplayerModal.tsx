
import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { useSocket } from "@/contexts/SocketContext";
import { Copy, Share2, Loader2, RefreshCw, UserPlus } from "lucide-react";

interface MultiplayerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onGameStart: (isHost: boolean) => void;
}

const MultiplayerModal: React.FC<MultiplayerModalProps> = ({ 
  isOpen, 
  onClose,
  onGameStart 
}) => {
  const { toast } = useToast();
  const { createRoom, joinRoom, roomId, isConnecting, isConnected } = useSocket();
  const [joinRoomId, setJoinRoomId] = useState("");
  const [isCreatingRoom, setIsCreatingRoom] = useState(false);
  const [isJoiningRoom, setIsJoiningRoom] = useState(false);
  const [activeTab, setActiveTab] = useState('create');

  // Check URL for room parameter on mount
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const roomParam = params.get('room');
    
    if (roomParam) {
      setJoinRoomId(roomParam);
      setActiveTab('join');
    }
  }, []);

  const handleCreateRoom = async () => {
    try {
      setIsCreatingRoom(true);
      const newRoomId = await createRoom();
      toast({
        title: "Room created!",
        description: `Your room code is: ${newRoomId}`,
      });
    } catch (error) {
      console.error("Error creating room:", error);
      toast({
        title: "Error creating room",
        description: "Please try again later",
        variant: "destructive"
      });
    } finally {
      setIsCreatingRoom(false);
    }
  };

  const handleJoinRoom = async () => {
    if (!joinRoomId.trim()) {
      toast({
        title: "Room code required",
        description: "Please enter a valid room code",
        variant: "destructive"
      });
      return;
    }

    try {
      setIsJoiningRoom(true);
      const success = await joinRoom(joinRoomId.trim());
      
      if (success) {
        toast({
          title: "Joined successfully!",
          description: `You've joined room: ${joinRoomId}`,
        });
        onGameStart(false); // Start as player (not host)
      } else {
        toast({
          title: "Could not join room",
          description: "Room may not exist or is full",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error("Error joining room:", error);
      toast({
        title: "Error joining room",
        description: "Please try again later",
        variant: "destructive"
      });
    } finally {
      setIsJoiningRoom(false);
    }
  };

  const copyRoomLink = () => {
    if (roomId) {
      const roomLink = `${window.location.origin}/?room=${roomId}`;
      navigator.clipboard.writeText(roomLink);
      toast({
        title: "Link copied",
        description: "Share this link with friends to join your game",
      });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Play Multiplayer</DialogTitle>
          <DialogDescription>
            Create a new room or join an existing game.
          </DialogDescription>
        </DialogHeader>
        
        <Tabs 
          value={activeTab} 
          onValueChange={setActiveTab}
          className="w-full"
        >
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="create">Create Room</TabsTrigger>
            <TabsTrigger value="join">Join Room</TabsTrigger>
          </TabsList>
          
          <TabsContent value="create" className="pt-4 pb-2">
            <div className="flex flex-col gap-4">
              <p className="text-sm text-muted-foreground">
                Create a new room and invite friends to play together.
              </p>
              {roomId ? (
                <>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 p-2 border rounded bg-muted font-mono text-center">
                      {roomId}
                    </div>
                    <Button variant="outline" size="icon" onClick={copyRoomLink}>
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                  <Button className="w-full" onClick={() => onGameStart(true)}>
                    <UserPlus className="h-4 w-4 mr-2" />
                    Start Game as Host
                  </Button>
                </>
              ) : (
                <Button 
                  onClick={handleCreateRoom} 
                  disabled={isCreatingRoom || isConnecting || !isConnected}
                  className="w-full"
                >
                  {(isCreatingRoom || isConnecting) ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      {isCreatingRoom ? "Creating..." : "Connecting..."}
                    </>
                  ) : !isConnected ? (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Connecting to server...
                    </>
                  ) : (
                    "Create New Room"
                  )}
                </Button>
              )}
            </div>
          </TabsContent>
          
          <TabsContent value="join" className="pt-4 pb-2">
            <div className="flex flex-col gap-4">
              <p className="text-sm text-muted-foreground">
                Enter a room code to join an existing game.
              </p>
              <div className="flex gap-2">
                <Input 
                  placeholder="Enter room code" 
                  value={joinRoomId}
                  onChange={(e) => setJoinRoomId(e.target.value)}
                />
                <Button 
                  onClick={handleJoinRoom}
                  disabled={isJoiningRoom || isConnecting || !isConnected || !joinRoomId.trim()}
                >
                  {(isJoiningRoom || isConnecting) ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      {isJoiningRoom ? "Joining..." : "Connecting..."}
                    </>
                  ) : (
                    "Join"
                  )}
                </Button>
              </div>
              {!isConnected && (
                <p className="text-xs text-muted-foreground mt-1">
                  Waiting for server connection...
                </p>
              )}
            </div>
          </TabsContent>
        </Tabs>
        
        <DialogFooter className="sm:justify-start">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default MultiplayerModal;
