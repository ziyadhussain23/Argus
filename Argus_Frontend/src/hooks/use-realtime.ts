import { useEffect, useState, useRef, useSyncExternalStore } from 'react';
import { Client, IMessage, StompSubscription } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import { getApiBaseUrl } from '@/lib/api';

// ── Shared singleton WebSocket client ──────────────────────────────
type WsStatus = 'connected' | 'disconnected' | 'connecting';
let sharedStatus: WsStatus = 'disconnected';
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

let sharedClient: Client | null = null;
let refCount = 0;

function getSharedClient(): Client {
  if (!sharedClient) {
    const apiBase = getApiBaseUrl();
    const serverBase = apiBase.replace(/\/api\/v1\/?$/, '');
    const socketUrl = `${serverBase}/ws`;

    sharedClient = new Client({
      webSocketFactory: () => new SockJS(socketUrl),
      reconnectDelay: 5000,
      onConnect: () => {
        setSharedStatus('connected');
      },
      onDisconnect: () => {
        setSharedStatus('disconnected');
      },
      onStompError: () => {
        setSharedStatus('disconnected');
      },
      onWebSocketError: () => {
        setSharedStatus('disconnected');
      },
    });

    setSharedStatus('connecting');
    sharedClient.activate();
  }
  return sharedClient;
}

function releaseSharedClient() {
  if (refCount <= 0 && sharedClient) {
    sharedClient.deactivate();
    sharedClient = null;
    setSharedStatus('disconnected');
  }
}

// ── Hook ───────────────────────────────────────────────────────────
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

    refCount++;
    const client = getSharedClient();
    let subs: StompSubscription[] = [];

    function doSubscribe() {
      subs = subscriptions.map((sub) =>
        client.subscribe(sub.topic, (message: IMessage) => {
          try {
            const payload = JSON.parse(message.body);
            sub.onMessage(payload);
          } catch {
            // Ignore malformed payloads
          }
        })
      );
      setConnected(true);
      setReconnecting(false);
      wasConnectedRef.current = true;
    }

    // If already connected, subscribe immediately
    if (client.connected) {
      doSubscribe();
    }

    // Also subscribe on future (re)connects
    const origOnConnect = client.onConnect;
    client.onConnect = (frame) => {
      origOnConnect?.(frame);
      // Clean old subs before re-subscribing
      subs.forEach((s) => { try { s.unsubscribe(); } catch {} });
      doSubscribe();
    };

    // Track disconnections for this component
    const origOnDisconnect = client.onDisconnect;
    client.onDisconnect = (frame) => {
      origOnDisconnect?.(frame);
      setConnected(false);
      if (wasConnectedRef.current) setReconnecting(true);
    };

    return () => {
      subs.forEach((s) => { try { s.unsubscribe(); } catch {} });
      setConnected(false);
      setReconnecting(false);
      wasConnectedRef.current = false;
      refCount--;
      // Don't kill the shared client — keep it alive for the status indicator
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

/**
 * Call once in a top-level component (e.g. App or MainLayout) to keep
 * the shared WebSocket alive across page navigations.
 */
export function useKeepWebSocketAlive(enabled = true) {
  useEffect(() => {
    if (!enabled) return;
    refCount++;
    getSharedClient();
    return () => {
      refCount--;
      releaseSharedClient();
    };
  }, [enabled]);
}
