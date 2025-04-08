
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';
import { useSocket } from '@/contexts/SocketContext';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';

export interface MultiplayerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfigSubmit: (roomConfig: { roomId: string; isHost: boolean }) => void;
}

const MultiplayerModal: React.FC<MultiplayerModalProps> = ({
  isOpen,
  onClose,
  onConfigSubmit
}) => {
  const [activeTab, setActiveTab] = useState<'join' | 'create'>('join');
  const [roomCode, setRoomCode] = useState<string>('');
  const { createRoom, joinRoom, isConnecting } = useSocket();
  const { toast } = useToast();

  const handleCreateRoom = async () => {
    try {
      const roomId = await createRoom();
      onConfigSubmit({ roomId, isHost: true });
    } catch (err) {
      console.error("Failed to create room:", err);
      toast({
        title: "Room Creation Failed",
        description: "Could not create a room. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleJoinRoom = async () => {
    if (roomCode.length !== 6) {
      toast({
        title: "Invalid Room Code",
        description: "Room code must be 6 characters",
        variant: "destructive",
      });
      return;
    }

    try {
      const success = await joinRoom(roomCode);
      if (success) {
        onConfigSubmit({ roomId: roomCode, isHost: false });
      }
    } catch (err) {
      console.error("Failed to join room:", err);
      toast({
        title: "Join Failed",
        description: "Could not join the room. Please check the code and try again.",
        variant: "destructive",
      });
    }
  };

  const handleRoomCodeChange = (value: string) => {
    setRoomCode(value);
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Multiplayer Game</DialogTitle>
          <DialogDescription>
            Join an existing game or create a new room
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col space-y-6 pt-4">
          <div className="flex w-full rounded-lg overflow-hidden">
            <Button
              variant={activeTab === 'join' ? "default" : "outline"}
              className="flex-1 rounded-none"
              onClick={() => setActiveTab('join')}
            >
              Join Room
            </Button>
            <Button
              variant={activeTab === 'create' ? "default" : "outline"}
              className="flex-1 rounded-none"
              onClick={() => setActiveTab('create')}
            >
              Create Room
            </Button>
          </div>

          {activeTab === 'join' ? (
            <div className="space-y-4">
              <div className="flex flex-col items-center justify-center text-center space-y-3">
                <div className="text-sm font-medium">
                  Enter the 6-character room code
                </div>
                <InputOTP
                  maxLength={6}
                  value={roomCode}
                  onChange={handleRoomCodeChange}
                  className="w-full"
                  containerClassName="flex justify-center gap-1"
                >
                  <InputOTPGroup>
                    <InputOTPSlot index={0} />
                    <InputOTPSlot index={1} />
                    <InputOTPSlot index={2} />
                    <InputOTPSlot index={3} />
                    <InputOTPSlot index={4} />
                    <InputOTPSlot index={5} />
                  </InputOTPGroup>
                </InputOTP>
              </div>
              
              <Button 
                className="w-full" 
                onClick={handleJoinRoom}
                disabled={roomCode.length !== 6 || isConnecting}
              >
                {isConnecting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Joining Room...
                  </>
                ) : (
                  "Join Room"
                )}
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="text-center">
                <p>Create a new room and invite friends to join</p>
              </div>
              <Button 
                className="w-full" 
                onClick={handleCreateRoom}
                disabled={isConnecting}
              >
                {isConnecting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Creating Room...
                  </>
                ) : (
                  "Create New Room"
                )}
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default MultiplayerModal;
