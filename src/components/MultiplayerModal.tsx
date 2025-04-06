
import React, { useState } from 'react';
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
import { useToast } from "@/components/ui/use-toast";
import { useSocket } from "@/contexts/SocketContext";
import { Copy, Share2 } from "lucide-react";

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
  const { createRoom, joinRoom, roomId } = useSocket();
  const [joinRoomId, setJoinRoomId] = useState("");
  const [isCreatingRoom, setIsCreatingRoom] = useState(false);
  const [isJoiningRoom, setIsJoiningRoom] = useState(false);

  const handleCreateRoom = async () => {
    try {
      setIsCreatingRoom(true);
      const newRoomId = await createRoom();
      toast({
        title: "Room created!",
        description: `Your room code is: ${newRoomId}`,
      });
      onGameStart(true); // Start as host
    } catch (error) {
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
        
        <Tabs defaultValue="create" className="w-full">
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
                    <Share2 className="h-4 w-4 mr-2" />
                    Start Game
                  </Button>
                </>
              ) : (
                <Button 
                  onClick={handleCreateRoom} 
                  disabled={isCreatingRoom}
                  className="w-full"
                >
                  {isCreatingRoom ? "Creating..." : "Create New Room"}
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
                  disabled={isJoiningRoom || !joinRoomId.trim()}
                >
                  {isJoiningRoom ? "Joining..." : "Join"}
                </Button>
              </div>
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
