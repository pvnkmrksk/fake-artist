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
  // Add shared storage for persistent room info across browser sessions
  private static persistentRooms: Set<string> = new Set();

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
    // Add to persistent rooms for cross-browser access
    MockSocketServer.persistentRooms.add(roomId);
    
    console.log(`[MockSocketServer] Room ${roomId} created by ${clientId}`);
    console.log(`[MockSocketServer] Persistent rooms: ${Array.from(MockSocketServer.persistentRooms)}`);
    
    // Save to localStorage for cross-browser persistence
    try {
      localStorage.setItem('mock_socket_rooms', JSON.stringify(Array.from(MockSocketServer.persistentRooms)));
    } catch (e) {
      console.error("[MockSocketServer] Failed to save rooms to localStorage:", e);
    }
    
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

  // Try to load persistent rooms from localStorage
  loadPersistentRooms(): void {
    try {
      const storedRooms = localStorage.getItem('mock_socket_rooms');
      if (storedRooms) {
        const roomsArray = JSON.parse(storedRooms);
        MockSocketServer.persistentRooms = new Set(roomsArray);
        console.log(`[MockSocketServer] Loaded persistent rooms: ${Array.from(MockSocketServer.persistentRooms)}`);
      }
    } catch (e) {
      console.error("[MockSocketServer] Failed to load rooms from localStorage:", e);
    }
  }

  // Join an existing room
  joinRoom(clientId: string, roomId: string): boolean {
    // Load rooms from localStorage first to catch any newly created rooms
    this.loadPersistentRooms();
    
    console.log(`[MockSocketServer] Attempting to join room ${roomId} by client ${clientId}`);
    console.log(`[MockSocketServer] Available rooms: ${Array.from(this.rooms.keys())}`);
    console.log(`[MockSocketServer] Persistent rooms: ${Array.from(MockSocketServer.persistentRooms)}`);
    
    // Room must exist in our persistent store
    if (!MockSocketServer.persistentRooms.has(roomId)) {
      console.log(`[MockSocketServer] Room ${roomId} doesn't exist in persistent storage`);
      return false;
    }

    // If room exists in persistent storage but not in memory, recreate it
    if (!this.rooms.has(roomId)) {
      console.log(`[MockSocketServer] Recreating room ${roomId} from persistent storage`);
      this.rooms.set(roomId, new Set());
    }

    const room = this.rooms.get(roomId)!;
    
    // Check if client is already in a room, if so, leave it
    this.leaveCurrentRoom(clientId);
    
    // Add client to room
    room.add(clientId);
    this.clientToRoom.set(clientId, roomId);
    console.log(`[MockSocketServer] Client ${clientId} joined room ${roomId}`);
    console.log(`[MockSocketServer] Room ${roomId} now has ${room.size} clients`);
    
    // Trigger a game event to notify clients
    this.triggerEvent('player-joined', { roomId, clientId });
    
    return true;
  }

  // Leave current room if client is in one
  leaveCurrentRoom(clientId: string): void {
    const currentRoomId = this.clientToRoom.get(clientId);
    if (currentRoomId) {
      this.leaveRoom(clientId);
    }
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
        console.log(`[MockSocketServer] Room ${roomId} deleted from memory (empty)`);
        // Note: We're keeping it in persistentRooms to allow rejoining
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
    console.log(`[MockSocketServer] Persistent rooms: ${Array.from(MockSocketServer.persistentRooms)}`);
  }
  
  // Get room ID for a client (public accessor method)
  getRoomForClient(clientId: string): string | undefined {
    return this.clientToRoom.get(clientId);
  }
  
  // Check if a room exists
  roomExists(roomId: string): boolean {
    // First try to load from localStorage
    this.loadPersistentRooms();
    // Check both in-memory rooms and persistent rooms
    return this.rooms.has(roomId) || MockSocketServer.persistentRooms.has(roomId);
  }
  
  // For testing only: clear all room data
  clearAllRooms(): void {
    this.rooms.clear();
    this.clientToRoom.clear();
    MockSocketServer.persistentRooms.clear();
    
    // Also clear from localStorage
    try {
      localStorage.removeItem('mock_socket_rooms');
    } catch (e) {
      console.error("[MockSocketServer] Failed to clear rooms from localStorage:", e);
    }
    
    console.log("[MockSocketServer] All rooms cleared");
  }
}

// Load persistent rooms on initial import
const server = MockSocketServer.getInstance();
server.loadPersistentRooms();

export default server;
