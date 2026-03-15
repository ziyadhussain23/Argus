import { useEffect, useState, useRef, useSyncExternalStore } from 'react';
import { Client, IMessage, StompSubscription } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import { getApiBaseUrl } from '@/lib/api';

// Shared WebSocket status so only one connection is needed
type WsStatus = 'connected' | 'disconnected' | 'connecting';
let sharedStatus: WsStatus = 'connecting';
const statusListeners = new Set<() => void>();

function setSharedStatus(s: WsStatus) {
  if (sharedStatus !== s) {
    sharedStatus = s;
    statusListeners.forEach((l) => l());
  }
}

function subscribeStatus(listener: () => void) {
  statusListeners.add(listener);
  return () => { statusListeners.delete(listener); };
}

function getStatusSnapshot() {
  return sharedStatus;
}

export type RealtimeSubscription<T = unknown> = {
  topic: string;
  onMessage: (payload: T) => void;
};

export function useRealtime(
  subscriptions: RealtimeSubscription[],
  enabled = true
) {
  const [connected, setConnected] = useState(false);
  const [reconnecting, setReconnecting] = useState(false);
  const wasConnectedRef = useRef(false);

  useEffect(() => {
    if (!enabled || subscriptions.length === 0) return;

    const apiBase = getApiBaseUrl();
    const serverBase = apiBase.replace(/\/api\/v1\/?$/, '');
    const socketUrl = `${serverBase}/ws`;

    const client = new Client({
      webSocketFactory: () => new SockJS(socketUrl),
      reconnectDelay: 5000,
      onConnect: () => {
        setConnected(true);
        setReconnecting(false);
        setSharedStatus('connected');
        wasConnectedRef.current = true;
        const subs: StompSubscription[] = [];

        subscriptions.forEach((sub) => {
          subs.push(
            client.subscribe(sub.topic, (message: IMessage) => {
              try {
                const payload = JSON.parse(message.body);
                sub.onMessage(payload);
              } catch {
                // Ignore malformed payloads
              }
            })
          );
        });

        client.onDisconnect = () => {
          subs.forEach((s) => s.unsubscribe());
          setConnected(false);
          setSharedStatus('disconnected');
          if (wasConnectedRef.current) setReconnecting(true);
        };
      },
      onStompError: () => {
        setConnected(false);
        setSharedStatus('disconnected');
        if (wasConnectedRef.current) setReconnecting(true);
      },
      onWebSocketError: () => {
        setConnected(false);
        setSharedStatus('disconnected');
        if (wasConnectedRef.current) setReconnecting(true);
      },
    });

    client.activate();

    return () => {
      client.deactivate();
      setConnected(false);
      setReconnecting(false);
      setSharedStatus('disconnected');
      wasConnectedRef.current = false;
    };
  }, [enabled, subscriptions]);

  return { connected, reconnecting };
}

/**
 * Lightweight hook to monitor WebSocket connection status.
 * Reads the shared status published by useRealtime — no extra connection.
 */
export function useWebSocketStatus() {
  return useSyncExternalStore(subscribeStatus, getStatusSnapshot);
}
