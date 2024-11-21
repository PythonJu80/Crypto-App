class MockSocket {
  constructor() {
    this.listeners = new Map();
    this.connected = true;
  }

  on(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event).add(callback);
  }

  off(event, callback) {
    if (this.listeners.has(event)) {
      this.listeners.get(event).delete(callback);
    }
  }

  emit(event, data) {
    if (this.listeners.has(event)) {
      this.listeners.get(event).forEach(callback => callback(data));
    }
  }

  disconnect() {
    this.connected = false;
    this.emit('disconnect');
  }

  connect() {
    this.connected = true;
    this.emit('connect');
  }

  isConnected() {
    return this.connected;
  }
}

export const mockSocket = new MockSocket();