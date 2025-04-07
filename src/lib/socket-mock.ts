
/**
 * Socket.IO mock server for development/demo purposes
 * This simulates a socket server for testing multiplayer functionality
 */

class MockSocketServer {
  private static instance: MockSocketServer;
  private rooms: Map<string, Set<string>> = new Map();
  private clientToRoom: Map<string, string> = new Map();
  private events: Map<string, Set<Function>> = new Map();
  private clientCallbacks: Map<string, Function> = new Map();

  private constructor() {
    console.log("[MockSocketServer] Initialized");
  }

  public static getInstance(): MockSocketServer {
    if (!MockSocketServer.instance) {
      MockSocketServer.instance = new MockSocketServer();
    }
    return MockSocketServer.instance;
  }

  // Generate a random room ID
  generateRoomId(): string {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
  }

  // Create a new room
  createRoom(clientId: string): string {
    const roomId = this.generateRoomId();
    this.rooms.set(roomId, new Set([clientId]));
    this.clientToRoom.set(clientId, roomId);
    console.log(`[MockSocketServer] Room ${roomId} created by ${clientId}`);
    
    // Trigger a game event to notify clients
    this.triggerEvent('room-created', { roomId, clientId });
    
    return roomId;
  }

  // Register a client callback for later execution
  registerCallback(clientId: string, event: string, callback: Function): void {
    const key = `${clientId}:${event}`;
    this.clientCallbacks.set(key, callback);
  }
  
  // Execute a registered callback for a client
  executeCallback(clientId: string, event: string, ...args: any[]): void {
    const key = `${clientId}:${event}`;
    const callback = this.clientCallbacks.get(key);
    if (callback) {
      console.log(`[MockSocketServer] Executing callback for ${clientId} on ${event}`);
      setTimeout(() => {
        try {
          callback(...args);
        } catch (error) {
          console.error(`[MockSocketServer] Error executing callback:`, error);
        }
      }, 100); // Small delay to simulate network latency
      this.clientCallbacks.delete(key);
    }
  }

  // Join an existing room
  joinRoom(clientId: string, roomId: string): boolean {
    if (!this.rooms.has(roomId)) {
      console.log(`[MockSocketServer] Room ${roomId} doesn't exist`);
      return false;
    }

    const room = this.rooms.get(roomId)!;
    room.add(clientId);
    this.clientToRoom.set(clientId, roomId);
    console.log(`[MockSocketServer] Client ${clientId} joined room ${roomId}`);
    
    // Trigger a game event to notify clients
    this.triggerEvent('player-joined', { roomId, clientId });
    
    return true;
  }

  // Leave a room
  leaveRoom(clientId: string): void {
    const roomId = this.clientToRoom.get(clientId);
    if (!roomId) return;

    const room = this.rooms.get(roomId);
    if (room) {
      room.delete(clientId);
      
      // Trigger event before potentially deleting the room
      this.triggerEvent('player-left', { roomId, clientId });
      
      if (room.size === 0) {
        this.rooms.delete(roomId);
        console.log(`[MockSocketServer] Room ${roomId} deleted (empty)`);
      }
    }
    this.clientToRoom.delete(clientId);
    console.log(`[MockSocketServer] Client ${clientId} left room ${roomId}`);
  }

  // Get all clients in a room
  getClientsInRoom(roomId: string): string[] {
    const room = this.rooms.get(roomId);
    if (!room) return [];
    return Array.from(room);
  }
  
  // Broadcast a message to all clients in a room
  broadcastToRoom(roomId: string, eventName: string, data: any): void {
    const clients = this.getClientsInRoom(roomId);
    if (clients.length === 0) return;
    
    console.log(`[MockSocketServer] Broadcasting ${eventName} to room ${roomId}`);
    this.triggerEvent(`room:${roomId}:${eventName}`, data);
  }
  
  // Register for server events
  on(eventName: string, callback: Function): void {
    if (!this.events.has(eventName)) {
      this.events.set(eventName, new Set());
    }
    this.events.get(eventName)!.add(callback);
  }
  
  // Trigger a server event
  triggerEvent(eventName: string, data: any): void {
    const callbacks = this.events.get(eventName);
    if (!callbacks) return;
    
    callbacks.forEach(callback => {
      try {
        callback(data);
      } catch (error) {
        console.error(`[MockSocketServer] Error in event handler for ${eventName}:`, error);
      }
    });
  }

  // Debug info
  logServerState(): void {
    console.log(`[MockSocketServer] Active rooms: ${this.rooms.size}`);
    this.rooms.forEach((clients, roomId) => {
      console.log(`[MockSocketServer] Room ${roomId}: ${clients.size} clients`);
    });
  }
}

export default MockSocketServer.getInstance();
