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
      onStompError: (frame) => {
        console.error('STOMP error:', frame.headers?.message || frame);
        setSharedStatus('disconnected');
      },
      onWebSocketError: (event) => {
        console.error('WebSocket error:', event);
        setSharedStatus('disconnected');
      },
    });

    (sharedClient as any).__connectHandlers = [];
    (sharedClient as any).__disconnectHandlers = [];

    sharedClient.onConnect = () => {
      setSharedStatus('connected');
      ((sharedClient as any).__connectHandlers || []).forEach((fn: () => void) => fn());
    };
    sharedClient.onDisconnect = () => {
      setSharedStatus('disconnected');
      ((sharedClient as any).__disconnectHandlers || []).forEach((fn: () => void) => fn());
    };

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
  const subsRef = useRef(subscriptions);
  subsRef.current = subscriptions;

  // Serialize topics so the effect only re-runs when the actual topic list changes
  const topicsKey = subscriptions.map(s => s.topic).join('\0');

  useEffect(() => {
    if (!enabled || subsRef.current.length === 0) return;

    refCount++;
    const client = getSharedClient();
    let subs: StompSubscription[] = [];

    function doSubscribe() {
      subs = subsRef.current.map((sub) =>
        client.subscribe(sub.topic, (message: IMessage) => {
          try {
            const payload = JSON.parse(message.body);
            const currentSub = subsRef.current.find(s => s.topic === sub.topic);
            if (currentSub) currentSub.onMessage(payload);
          } catch (err) {
            console.error('Failed to parse WebSocket message:', err);
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

    const handleConnect = () => {
      subs.forEach((s) => { try { s.unsubscribe(); } catch {} });
      doSubscribe();
    };

    const handleDisconnect = () => {
      setConnected(false);
      if (wasConnectedRef.current) setReconnecting(true);
    };

    (client as any).__connectHandlers.push(handleConnect);
    (client as any).__disconnectHandlers.push(handleDisconnect);

    return () => {
      subs.forEach((s) => { try { s.unsubscribe(); } catch {} });
      setConnected(false);
      setReconnecting(false);
      wasConnectedRef.current = false;
      const ch = (client as any).__connectHandlers as Function[];
      const dh = (client as any).__disconnectHandlers as Function[];
      if (ch) { const idx = ch.indexOf(handleConnect); if (idx >= 0) ch.splice(idx, 1); }
      if (dh) { const idx = dh.indexOf(handleDisconnect); if (idx >= 0) dh.splice(idx, 1); }
      refCount--;
      releaseSharedClient();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, topicsKey]);

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
