import SockJS from 'sockjs-client';
import Stomp from 'stompjs';

const WS_URL = 'http://localhost:8080/api/ws-game';

class WebSocketService {
  private stompClient: any = null;
  private connected: boolean = false;
  private reconnectAttempts: number = 0;
  private maxReconnectAttempts: number = 5;
  private reconnectDelay: number = 3000;

  connect(token: string, onConnected: () => void, onDisconnected: () => void) {
    const sock = new SockJS(WS_URL);
    this.stompClient = Stomp.over(sock);

    this.stompClient.connect(
      { Authorization: `Bearer ${token}` },
      (frame: any) => {
        console.log('WebSocket Connected:', frame);
        this.connected = true;
        this.reconnectAttempts = 0;
        onConnected();
      },
      (error: any) => {
        console.error('WebSocket Error:', error);
        this.connected = false;
        onDisconnected();
        this.handleReconnect(onConnected, onDisconnected);
      }
    );
  }

  private handleReconnect(onConnected: () => void, onDisconnected: () => void) {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      console.log(`Reconnecting... Attempt ${this.reconnectAttempts}`);
      setTimeout(() => {
        this.connect(
          localStorage.getItem('token') || '',
          onConnected,
          onDisconnected
        );
      }, this.reconnectDelay);
    }
  }

  subscribe(destination: string, callback: (message: any) => void) {
    if (!this.stompClient || !this.connected) {
      console.warn('WebSocket not connected, cannot subscribe');
      return;
    }

    this.stompClient.subscribe(destination, (message: any) => {
      try {
        const data = JSON.parse(message.body);
        callback(data);
      } catch (error) {
        console.error('Error parsing WebSocket message:', error);
        callback(message.body);
      }
    });
  }

  send(destination: string, body: any) {
    if (!this.stompClient || !this.connected) {
      console.warn('WebSocket not connected, cannot send message');
      return;
    }

    this.stompClient.send(destination, {}, JSON.stringify(body));
  }

  disconnect() {
    if (this.stompClient && this.connected) {
      this.stompClient.disconnect(() => {
        console.log('WebSocket Disconnected');
        this.connected = false;
      });
    }
  }

  isConnected(): boolean {
    return this.connected;
  }
}

export const websocketService = new WebSocketService();
