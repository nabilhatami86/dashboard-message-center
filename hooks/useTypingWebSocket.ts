"use client";

import { useEffect, useRef, useState, useCallback } from "react";

// Derive WS URL from API URL (http→ws, https→wss)
function getWsBase(): string {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
  return apiUrl.replace(/^http/, "ws");
}

interface UseTypingWebSocketResult {
  customerTyping: boolean;
  botTyping: boolean;
  sendAgentTyping: (isTyping: boolean) => void;
  wsConnected: boolean;
}

export function useTypingWebSocket(
  chatId: number | undefined,
  onNewMessage?: () => void,
): UseTypingWebSocketResult {
  const [customerTyping, setCustomerTyping] = useState(false);
  const [botTyping, setBotTyping] = useState(false);
  const [wsConnected, setWsConnected] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isTypingRef = useRef(false);
  const destroyedRef = useRef(false);

  const onNewMessageRef = useRef(onNewMessage);
  useEffect(() => { onNewMessageRef.current = onNewMessage; }, [onNewMessage]);

  useEffect(() => {
    if (!chatId) return;
    destroyedRef.current = false;

    const connect = () => {
      if (destroyedRef.current) return;

      const ws = new WebSocket(`${getWsBase()}/ws/${chatId}`);
      wsRef.current = ws;

      ws.onopen = () => {
        setWsConnected(true);
        isTypingRef.current = false;
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.type === "typing" && data.sender === "customer") {
            if (timerRef.current) clearTimeout(timerRef.current);
            if (data.is_typing) {
              setCustomerTyping(true);
              timerRef.current = setTimeout(() => setCustomerTyping(false), 3000);
            } else {
              setCustomerTyping(false);
            }
          } else if (data.type === "typing" && data.sender === "bot") {
            setBotTyping(data.is_typing === true);
          } else if (data.type === "new_message") {
            setBotTyping(false);
            onNewMessageRef.current?.();
          }
        } catch {
          // ignore malformed events
        }
      };

      ws.onclose = () => {
        setWsConnected(false);
        setCustomerTyping(false);
        setBotTyping(false);
        wsRef.current = null;
        // Auto-reconnect after 3s unless the effect is cleaning up
        if (!destroyedRef.current) {
          reconnectTimerRef.current = setTimeout(connect, 3000);
        }
      };

      ws.onerror = () => {
        ws.close();
      };
    };

    connect();

    return () => {
      destroyedRef.current = true;
      if (timerRef.current) clearTimeout(timerRef.current);
      if (reconnectTimerRef.current) clearTimeout(reconnectTimerRef.current);
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
    };
  }, [chatId]);

  const sendAgentTyping = useCallback((isTyping: boolean) => {
    if (wsRef.current?.readyState !== WebSocket.OPEN) return;
    if (isTypingRef.current === isTyping) return;
    isTypingRef.current = isTyping;
    wsRef.current.send(JSON.stringify({ type: "typing", is_typing: isTyping }));
  }, []);

  return { customerTyping, botTyping, sendAgentTyping, wsConnected };
}
