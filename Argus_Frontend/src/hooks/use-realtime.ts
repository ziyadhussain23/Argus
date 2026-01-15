import { useEffect, useState } from 'react';
import { Client, IMessage, StompSubscription } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import { getApiBaseUrl } from '@/lib/api';

export type RealtimeSubscription<T = unknown> = {
  topic: string;
  onMessage: (payload: T) => void;
};

export function useRealtime(
  subscriptions: RealtimeSubscription[],
  enabled = true
) {
  const [connected, setConnected] = useState(false);

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
        };
      },
      onStompError: () => setConnected(false),
      onWebSocketError: () => setConnected(false),
    });

    client.activate();

    return () => {
      client.deactivate();
      setConnected(false);
    };
  }, [enabled, subscriptions]);

  return { connected };
}
