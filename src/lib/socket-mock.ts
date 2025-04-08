
interface RoomData {
  id: string;
  clients: string[];
  host: string;
  gameState?: any;
}

class SocketServer {
  private rooms: Map<string, RoomData>;
  private clientRooms: Map<string, string>;
  private eventListeners: Map<string, Array<(data: any) => void>>;
  private callbackRegistry: Map<string, Map<string, (data: any) => void>>;
  
  constructor() {
    this.rooms = new Map();
    this.clientRooms = new Map();
    this.eventListeners = new Map();
    this.callbackRegistry = new Map();
    console.log("[MockSocketServer] Initialized");
    
    // Load any persistent rooms on initialization
    this.loadPersistentRooms();
  }
  
  // Generate a random 6-character room ID
  private generateRoomId(): string {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ123456789'; // No O, 0, I to avoid confusion
    let result = '';
    for (let i = 0; i < 6; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }
  
  // Create a new room
  public createRoom(clientId: string): string {
    const roomId = this.generateRoomId();
    
    this.rooms.set(roomId, {
      id: roomId,
      clients: [clientId],
      host: clientId
    });
    
    this.clientRooms.set(clientId, roomId);
    
    console.log(`[MockSocketServer] Room ${roomId} created by client ${clientId}`);
    
    // Save rooms to localStorage for persistence
    this.saveRoomsToStorage();
    
    return roomId;
  }
  
  // Join an existing room
  public joinRoom(clientId: string, roomId: string): boolean {
    // First check if the room exists
    if (!this.rooms.has(roomId)) {
      console.log(`[MockSocketServer] Room ${roomId} does not exist`);
      return false;
    }
    
    // Then check if the client is already in the room
    const room = this.rooms.get(roomId)!;
    
    if (room.clients.includes(clientId)) {
      console.log(`[MockSocketServer] Client ${clientId} is already in room ${roomId}`);
      return true;
    }
    
    // Check if the room is full (max 10 players)
    if (room.clients.length >= 10) {
      console.log(`[MockSocketServer] Room ${roomId} is full`);
      return false;
    }
    
    // Add the client to the room
    room.clients.push(clientId);
    this.clientRooms.set(clientId, roomId);
    
    console.log(`[MockSocketServer] Client ${clientId} joined room ${roomId}`);
    
    // Notify other clients in the room
    this.emit('player-joined', {
      roomId,
      clientId,
      totalPlayers: room.clients.length
    });
    
    // Save updated room state to localStorage
    this.saveRoomsToStorage();
    
    return true;
  }
  
  // Leave a room
  public leaveRoom(clientId: string): void {
    const roomId = this.clientRooms.get(clientId);
    
    if (!roomId || !this.rooms.has(roomId)) {
      return;
    }
    
    const room = this.rooms.get(roomId)!;
    
    // Remove the client from the room
    room.clients = room.clients.filter(id => id !== clientId);
    this.clientRooms.delete(clientId);
    
    console.log(`[MockSocketServer] Client ${clientId} left room ${roomId}`);
    
    // Notify other clients
    this.emit('player-left', {
      roomId,
      clientId,
      totalPlayers: room.clients.length
    });
    
    // If the room is now empty, remove it
    if (room.clients.length === 0) {
      this.rooms.delete(roomId);
      console.log(`[MockSocketServer] Room ${roomId} removed (empty)`);
    } 
    // If the host left, assign a new host
    else if (room.host === clientId && room.clients.length > 0) {
      room.host = room.clients[0];
      console.log(`[MockSocketServer] New host for room ${roomId}: ${room.host}`);
    }
    
    // Save updated room state to localStorage
    this.saveRoomsToStorage();
  }
  
  // Check if a room exists
  public roomExists(roomId: string): boolean {
    return this.rooms.has(roomId);
  }
  
  // Get the room ID for a client
  public getRoomForClient(clientId: string): string | undefined {
    return this.clientRooms.get(clientId);
  }
  
  // Get all clients in a room
  public getClientsInRoom(roomId: string): string[] {
    if (!this.rooms.has(roomId)) {
      return [];
    }
    
    return [...this.rooms.get(roomId)!.clients];
  }
  
  // Store callback for future execution
  public registerCallback(clientId: string, event: string, callback: (data: any) => void) {
    if (!this.callbackRegistry.has(clientId)) {
      this.callbackRegistry.set(clientId, new Map());
    }
    
    this.callbackRegistry.get(clientId)!.set(event, callback);
  }
  
  // Execute stored callback
  public executeCallback(clientId: string, event: string, data: any) {
    if (!this.callbackRegistry.has(clientId) || !this.callbackRegistry.get(clientId)!.has(event)) {
      return;
    }
    
    const callback = this.callbackRegistry.get(clientId)!.get(event)!;
    callback(data);
    
    // Remove the callback after execution
    this.callbackRegistry.get(clientId)!.delete(event);
  }
  
  // Broadcast to all clients in a room
  public broadcastToRoom(roomId: string, event: string, data: any) {
    if (!this.rooms.has(roomId)) {
      return;
    }
    
    console.log(`[MockSocketServer] Broadcasting ${event} to room ${roomId}`, data);
    
    // Also broadcast on the room-specific event channel
    this.emit(`room:${roomId}:${event}`, data);
  }
  
  // Register event listener
  public on(event: string, handler: (data: any) => void) {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, []);
    }
    
    this.eventListeners.get(event)!.push(handler);
    return this;
  }
  
  // Emit event to all listeners
  public emit(event: string, data: any) {
    // Handle wildcards for room-specific events
    if (event.includes('*')) {
      const prefix = event.split('*')[0];
      const suffix = event.split('*')[1];
      
      for (const [listenerEvent, handlers] of this.eventListeners.entries()) {
        if (listenerEvent.startsWith(prefix) && listenerEvent.endsWith(suffix)) {
          handlers.forEach(handler => handler(data));
        }
      }
    } else if (this.eventListeners.has(event)) {
      this.eventListeners.get(event)!.forEach(handler => handler(data));
    }
  }
  
  // Save rooms to localStorage for persistence between page reloads
  private saveRoomsToStorage() {
    try {
      const roomsData = Array.from(this.rooms.entries()).map(([id, room]) => ({
        id,
        clients: room.clients,
        host: room.host,
        gameState: room.gameState
      }));
      
      localStorage.setItem('mockSocketRooms', JSON.stringify(roomsData));
      console.log(`[MockSocketServer] Saved ${roomsData.length} rooms to localStorage`);
    } catch (err) {
      console.error('[MockSocketServer] Error saving rooms to localStorage', err);
    }
  }
  
  // Load rooms from localStorage
  public loadPersistentRooms() {
    try {
      const storedRooms = localStorage.getItem('mockSocketRooms');
      
      if (storedRooms) {
        const roomsData = JSON.parse(storedRooms);
        
        // Clear existing rooms first
        this.rooms.clear();
        
        // Add stored rooms
        for (const room of roomsData) {
          this.rooms.set(room.id, {
            id: room.id,
            clients: room.clients,
            host: room.host,
            gameState: room.gameState
          });
          
          // Update client room mappings
          for (const clientId of room.clients) {
            this.clientRooms.set(clientId, room.id);
          }
        }
        
        console.log(`[MockSocketServer] Loaded persistent rooms: ${Array.from(this.rooms.keys()).join(', ')}`);
      }
    } catch (err) {
      console.error('[MockSocketServer] Error loading rooms from localStorage', err);
    }
  }
  
  // Debug method to clear all rooms
  public clearAllRooms() {
    this.rooms.clear();
    this.clientRooms.clear();
    localStorage.removeItem('mockSocketRooms');
    console.log('[MockSocketServer] All rooms cleared');
  }
}

// Create a single instance of the server
const mockSocketServer = new SocketServer();

export default mockSocketServer;
