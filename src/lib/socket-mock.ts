
/**
 * Socket.IO mock server for development/demo purposes
 * This simulates a socket server for testing multiplayer functionality
 */

// This file won't actually be used in production, but demonstrates 
// how we're handling the server-side socket logic

class MockSocketServer {
  private static instance: MockSocketServer;
  private rooms: Map<string, Set<string>> = new Map();
  private clientToRoom: Map<string, string> = new Map();

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
    return roomId;
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
    return true;
  }

  // Leave a room
  leaveRoom(clientId: string): void {
    const roomId = this.clientToRoom.get(clientId);
    if (!roomId) return;

    const room = this.rooms.get(roomId);
    if (room) {
      room.delete(clientId);
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

  // Debug info
  logServerState(): void {
    console.log(`[MockSocketServer] Active rooms: ${this.rooms.size}`);
    this.rooms.forEach((clients, roomId) => {
      console.log(`[MockSocketServer] Room ${roomId}: ${clients.size} clients`);
    });
  }
}

export default MockSocketServer.getInstance();
