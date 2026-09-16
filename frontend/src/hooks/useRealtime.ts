import { useState, useEffect, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { getRelativeTimeString } from '../utils/formatters';

export function useRealtime(intervalSeconds = 30) {
  const queryClient = useQueryClient();

  const [autoRefresh, setAutoRefresh] = useState<boolean>(() => {
    const saved = localStorage.getItem('retailpulse_auto_refresh');
    return saved !== null ? saved === 'true' : true;
  });

  const [lastUpdatedDate, setLastUpdatedDate] = useState<Date>(new Date());
  const [relativeTime, setRelativeTime] = useState<string>('Just now');
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [wsConnected, setWsConnected] = useState<boolean>(false);

  // Update relative time string every 3 seconds
  useEffect(() => {
    const timer = setInterval(() => {
      setRelativeTime(getRelativeTimeString(lastUpdatedDate.toISOString()));
    }, 3000);
    return () => clearInterval(timer);
  }, [lastUpdatedDate]);

  // Handle manual refresh
  const manualRefresh = useCallback(async () => {
    setIsRefreshing(true);
    await queryClient.invalidateQueries();
    setLastUpdatedDate(new Date());
    setRelativeTime('Just now');
    setTimeout(() => setIsRefreshing(false), 500);
  }, [queryClient]);

  // Connect to native WebSocket hub for instantaneous event streaming
  useEffect(() => {
    const token = localStorage.getItem('retailpulse_token');
    if (!token) return;

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = window.location.host || 'localhost:8000';
    const wsUrl = `${protocol}//${host}/ws/1?token=${encodeURIComponent(token)}`;

    let socket: WebSocket | null = null;
    let reconnectTimeout: any = null;

    const connectWebSocket = () => {
      try {
        socket = new WebSocket(wsUrl);
        socket.onopen = () => {
          setWsConnected(true);
        };
        socket.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            if (['TASK_COMPLETED', 'STOCK_ALERT', 'TASK_PROGRESS'].includes(data.event)) {
              queryClient.invalidateQueries();
              setLastUpdatedDate(new Date());
              setRelativeTime('Just now');
            }
          } catch (err) {
            // Ignore non-json heartbeats
          }
        };
        socket.onclose = () => {
          setWsConnected(false);
          // Reconnect with backoff
          reconnectTimeout = setTimeout(connectWebSocket, 5000);
        };
        socket.onerror = () => {
          setWsConnected(false);
        };
      } catch (err) {
        setWsConnected(false);
      }
    };

    connectWebSocket();

    return () => {
      if (reconnectTimeout) clearTimeout(reconnectTimeout);
      if (socket && (socket.readyState === WebSocket.OPEN || socket.readyState === WebSocket.CONNECTING)) {
        socket.close();
      }
    };
  }, [queryClient]);

  // Fallback Polling Interval if WebSocket disconnected or background sync enabled
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      queryClient.invalidateQueries();
      setLastUpdatedDate(new Date());
      setRelativeTime('Just now');
    }, intervalSeconds * 1000);

    return () => clearInterval(interval);
  }, [autoRefresh, intervalSeconds, queryClient]);

  const toggleAutoRefresh = (enabled?: boolean) => {
    const nextVal = enabled !== undefined ? enabled : !autoRefresh;
    setAutoRefresh(nextVal);
    localStorage.setItem('retailpulse_auto_refresh', nextVal ? 'true' : 'false');
  };

  return {
    autoRefresh,
    toggleAutoRefresh,
    relativeTime,
    lastUpdatedDate,
    manualRefresh,
    isRefreshing,
    wsConnected
  };
}
