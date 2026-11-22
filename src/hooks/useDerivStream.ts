import { useEffect, useRef, useState, useCallback } from 'react';
import { ConnectionStatus, TickDirection, TickRecord, VOLATILITY_MARKETS } from '../types/trading';

const DERIV_WS_URL = 'wss://api.derivws.com/trading/v1/options/ws/public';

type TickListener = (tick: TickRecord) => void;
type HistoryListener = (symbol: string, ticks: TickRecord[]) => void;

function getMarketPipSize(symbol: string, apiPipSize?: number): number {
  if (typeof apiPipSize === 'number' && Number.isFinite(apiPipSize)) {
    return apiPipSize;
  }
  const found = VOLATILITY_MARKETS.find((m) => m.symbol === symbol);
  return found ? found.pipSize : 2;
}

export function useDerivStream(onTick: TickListener, onHistory?: HistoryListener) {
  const [status, setStatus] = useState<ConnectionStatus>('connecting');
  const [lastError, setLastError] = useState<string | null>(null);

  const wsRef = useRef<WebSocket | null>(null);
  const subscribedRef = useRef<Set<string>>(new Set());
  const inFlightSubRef = useRef<Set<string>>(new Set());
  const subscriptionIdsRef = useRef<Map<string, string>>(new Map());
  const lastDigitRef = useRef<Map<string, number>>(new Map());
  const reconnectTimerRef = useRef<number | null>(null);
  const resyncTimerRef = useRef<number | null>(null);
  const keepAliveTimerRef = useRef<number | null>(null);
  const reconnectAttemptRef = useRef(0);
  const reqIdRef = useRef(1);
  const tickSeqRef = useRef(1);
  const onTickRef = useRef<TickListener>(onTick);
  const onHistoryRef = useRef<HistoryListener | undefined>(onHistory);
  const unmountedRef = useRef(false);

  useEffect(() => {
    onTickRef.current = onTick;
  }, [onTick]);

  useEffect(() => {
    onHistoryRef.current = onHistory;
  }, [onHistory]);

  const stopKeepAlive = useCallback(() => {
    if (keepAliveTimerRef.current !== null) {
      window.clearInterval(keepAliveTimerRef.current);
      keepAliveTimerRef.current = null;
    }
  }, []);

  const sendSubscribe = useCallback((symbol: string) => {
    const ws = wsRef.current;
    if (!ws || ws.readyState !== WebSocket.OPEN) return;
    if (inFlightSubRef.current.has(symbol)) return;
    inFlightSubRef.current.add(symbol);
    try {
      ws.send(
        JSON.stringify({
          ticks_history: symbol,
          count: 25,
          end: 'latest',
          style: 'ticks',
          subscribe: 1,
          req_id: reqIdRef.current++,
        })
      );
    } catch {
      inFlightSubRef.current.delete(symbol);
    }
  }, []);

  const connect = useCallback(() => {
    if (unmountedRef.current) return;
    if (
      wsRef.current &&
      (wsRef.current.readyState === WebSocket.OPEN || wsRef.current.readyState === WebSocket.CONNECTING)
    ) {
      return;
    }

    setStatus('connecting');
    setLastError(null);

    let ws: WebSocket;
    try {
      ws = new WebSocket(DERIV_WS_URL);
      wsRef.current = ws;
    } catch (err) {
      setStatus('disconnected');
      setLastError(err instanceof Error ? err.message : 'WebSocket initialization failed');
      return;
    }

    ws.onopen = () => {
      if (unmountedRef.current) {
        ws.close();
        return;
      }
      setStatus('connected');
      setLastError(null);
      reconnectAttemptRef.current = 0;
      inFlightSubRef.current.clear();

      stopKeepAlive();
      keepAliveTimerRef.current = window.setInterval(() => {
        if (ws.readyState === WebSocket.OPEN) {
          try {
            ws.send(JSON.stringify({ ping: 1, req_id: reqIdRef.current++ }));
          } catch {
            // ignore
          }
        }
      }, 25000);

      subscribedRef.current.forEach((symbol) => {
        sendSubscribe(symbol);
      });
    };

    ws.onmessage = (event) => {
      let data: any;
      try {
        data = JSON.parse(event.data);
      } catch {
        return;
      }

      if (data.error) {
        const errSymbol = data.echo_req?.ticks_history || data.echo_req?.ticks;
        if (errSymbol) {
          inFlightSubRef.current.delete(errSymbol);
        }
        setLastError(data.error.message || 'Deriv API returned an error');
        return;
      }

      if (data.msg_type === 'history' && data.history) {
        const symbol: string | undefined = data.echo_req?.ticks_history;
        if (!symbol) return;

        if (!subscribedRef.current.has(symbol)) {
          if (data.subscription?.id && ws.readyState === WebSocket.OPEN) {
            try {
              ws.send(JSON.stringify({ forget: data.subscription.id, req_id: reqIdRef.current++ }));
            } catch {
              // ignore
            }
          }
          return;
        }

        if (data.subscription?.id) {
          subscriptionIdsRef.current.set(symbol, data.subscription.id);
        }

        const prices: number[] = Array.isArray(data.history.prices) ? data.history.prices : [];
        const times: number[] = Array.isArray(data.history.times) ? data.history.times : [];
        const pipSize = getMarketPipSize(symbol, data.pip_size);

        const records: TickRecord[] = [];
        let prevD: number | undefined;
        for (let i = 0; i < prices.length; i++) {
          const quote = Number(prices[i]);
          if (Number.isNaN(quote)) continue;
          const quoteFormatted = quote.toFixed(pipSize);
          const digit = parseInt(quoteFormatted.charAt(quoteFormatted.length - 1), 10);
          if (Number.isNaN(digit)) continue;

          let direction: TickDirection = 'neutral';
          if (prevD !== undefined) {
            if (digit > prevD) direction = 'up';
            else if (digit < prevD) direction = 'down';
          }
          prevD = digit;

          records.push({
            id: tickSeqRef.current++,
            symbol,
            quote,
            quoteFormatted,
            digit,
            direction,
            timestamp: (times[i] ? times[i] * 1000 : Date.now()),
          });
        }

        if (prevD !== undefined) {
          lastDigitRef.current.set(symbol, prevD);
        }

        // Newest tick first
        const newestFirst = records.reverse();
        if (onHistoryRef.current) {
          onHistoryRef.current(symbol, newestFirst);
        }
        return;
      }

      if (data.msg_type === 'tick' && data.tick) {
        const symbol: string = data.tick.symbol || data.tick.underlying_symbol;
        const quote = parseFloat(data.tick.quote);
        if (!symbol || Number.isNaN(quote)) return;

        if (!subscribedRef.current.has(symbol)) {
          if (data.subscription?.id && ws.readyState === WebSocket.OPEN) {
            try {
              ws.send(JSON.stringify({ forget: data.subscription.id, req_id: reqIdRef.current++ }));
            } catch {
              // ignore
            }
          }
          return;
        }

        if (data.subscription?.id) {
          subscriptionIdsRef.current.set(symbol, data.subscription.id);
        }

        const pipSize = getMarketPipSize(symbol, data.tick.pip_size);
        const quoteFormatted = quote.toFixed(pipSize);
        const digit = parseInt(quoteFormatted.charAt(quoteFormatted.length - 1), 10);
        if (Number.isNaN(digit)) return;

        const prevDigit = lastDigitRef.current.get(symbol);
        let direction: TickDirection = 'neutral';
        if (prevDigit !== undefined) {
          if (digit > prevDigit) direction = 'up';
          else if (digit < prevDigit) direction = 'down';
        }
        lastDigitRef.current.set(symbol, digit);

        onTickRef.current({
          id: tickSeqRef.current++,
          symbol,
          quote,
          quoteFormatted,
          digit,
          direction,
          timestamp: (data.tick.epoch ? data.tick.epoch * 1000 : Date.now()),
        });
      }
    };

    ws.onerror = () => {
      setLastError('Connection interrupted. Retrying...');
    };

    ws.onclose = () => {
      stopKeepAlive();
      inFlightSubRef.current.clear();
      subscriptionIdsRef.current.clear();
      if (wsRef.current === ws) {
        wsRef.current = null;
      }
      if (unmountedRef.current) return;
      setStatus('disconnected');

      if (reconnectTimerRef.current !== null) {
        window.clearTimeout(reconnectTimerRef.current);
      }
      reconnectAttemptRef.current += 1;
      const delay = Math.min(10000, 1500 * reconnectAttemptRef.current);
      reconnectTimerRef.current = window.setTimeout(() => {
        reconnectTimerRef.current = null;
        connect();
      }, delay);
    };
  }, [sendSubscribe, stopKeepAlive]);

  useEffect(() => {
    unmountedRef.current = false;
    connect();
    return () => {
      unmountedRef.current = true;
      stopKeepAlive();
      if (reconnectTimerRef.current !== null) {
        window.clearTimeout(reconnectTimerRef.current);
      }
      if (resyncTimerRef.current !== null) {
        window.clearTimeout(resyncTimerRef.current);
      }
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
    };
  }, [connect, stopKeepAlive]);

  const subscribe = useCallback(
    (symbol: string) => {
      if (!subscribedRef.current.has(symbol)) {
        subscribedRef.current.add(symbol);
        sendSubscribe(symbol);
      }
      if (!wsRef.current || wsRef.current.readyState === WebSocket.CLOSED) {
        connect();
      }
    },
    [connect, sendSubscribe]
  );

  const unsubscribe = useCallback((symbol: string) => {
    subscribedRef.current.delete(symbol);
    inFlightSubRef.current.delete(symbol);
    const ws = wsRef.current;
    const subId = subscriptionIdsRef.current.get(symbol);
    subscriptionIdsRef.current.delete(symbol);

    if (ws && ws.readyState === WebSocket.OPEN && subId) {
      try {
        ws.send(JSON.stringify({ forget: subId, req_id: reqIdRef.current++ }));
      } catch {
        // ignore
      }
    }
  }, []);

  const resync = useCallback(
    (symbol: string) => {
      if (resyncTimerRef.current !== null) {
        window.clearTimeout(resyncTimerRef.current);
      }
      unsubscribe(symbol);
      resyncTimerRef.current = window.setTimeout(() => {
        resyncTimerRef.current = null;
        if (!unmountedRef.current) {
          subscribe(symbol);
        }
      }, 250);
    },
    [subscribe, unsubscribe]
  );

  return {
    status,
    lastError,
    subscribe,
    unsubscribe,
    resync,
    reconnect: connect,
  };
}
