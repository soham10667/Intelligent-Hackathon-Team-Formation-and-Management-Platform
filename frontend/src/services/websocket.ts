type WebSocketHandler = (data: any) => void;

class WebSocketService {
  private socket: WebSocket | null = null;
  private listeners: Map<string, Set<WebSocketHandler>> = new Map();
  private reconnectTimeout: any = null;
  private token: string | null = null;

  connect(token?: string | null) {
    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      return;
    }

    this.token = token || localStorage.getItem('token');
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = window.location.hostname === 'localhost' ? 'localhost:8000' : window.location.host;
    const wsUrl = `${protocol}//${host}/ws${this.token ? `?token=${this.token}` : ''}`;

    try {
      this.socket = new WebSocket(wsUrl);

      this.socket.onopen = () => {
        console.log('⚡ Connected to real-time WebSocket hub');
      };

      this.socket.onmessage = (event) => {
        try {
          const payload = JSON.parse(event.data);
          const eventType = payload.event;
          if (eventType && this.listeners.has(eventType)) {
            this.listeners.get(eventType)?.forEach((handler) => handler(payload));
          }
          // Global wildcards
          if (this.listeners.has('*')) {
            this.listeners.get('*')?.forEach((handler) => handler(payload));
          }
        } catch (err) {
          console.warn('Malformed WS message', event.data);
        }
      };

      this.socket.onclose = () => {
        this.socket = null;
        this.reconnectTimeout = setTimeout(() => this.connect(this.token), 3000);
      };

      this.socket.onerror = (err) => {
        console.warn('WebSocket error', err);
        this.socket?.close();
      };
    } catch (e) {
      console.warn('Failed to initialize WebSocket', e);
    }
  }

  on(event: string, handler: WebSocketHandler) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)?.add(handler);
    return () => this.off(event, handler);
  }

  off(event: string, handler: WebSocketHandler) {
    this.listeners.get(event)?.delete(handler);
  }

  disconnect() {
    clearTimeout(this.reconnectTimeout);
    if (this.socket) {
      this.socket.close();
      this.socket = null;
    }
  }
}

export const wsService = new WebSocketService();
