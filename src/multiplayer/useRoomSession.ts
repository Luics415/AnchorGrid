import { useCallback, useEffect, useRef, useState } from 'react';
import { firebaseConfigured, getFirebase } from './firebase';
import {
  attachRoomPresence,
  attemptHostMigration,
  createRoom,
  joinRoom,
  leaveRoom,
  restartRoom,
  resumeRoom,
  startRoom,
  submitAction,
  subscribeConnectionState,
  subscribeRoom,
  subscribeServerOffset
} from './roomService';
import type { GameAction, GameMode, ThemeId } from '../game';
import type { RoomRecord } from './types';

export function useRoomSession() {
  const [room, setRoom] = useState<RoomRecord | null>(null);
  const [busy, setBusy] = useState(false);
  const [resuming, setResuming] = useState(false);
  const [error, setError] = useState('');
  const [serverOffsetMs, setServerOffsetMs] = useState(0);
  const [firebaseConnected, setFirebaseConnected] = useState(false);
  const [uid, setUid] = useState<string | null>(null);
  const [lastSyncAt, setLastSyncAt] = useState<number | null>(null);
  const roomRef = useRef<RoomRecord | null>(null);
  const offsetRef = useRef(0);

  useEffect(() => {
    roomRef.current = room;
  }, [room]);

  useEffect(() => {
    offsetRef.current = serverOffsetMs;
  }, [serverOffsetMs]);

  useEffect(() => {
    if (!firebaseConfigured) return;
    const unsubscribeOffset = subscribeServerOffset(setServerOffsetMs);
    const unsubscribeConnection = subscribeConnectionState(setFirebaseConnected);
    return () => {
      unsubscribeOffset();
      unsubscribeConnection();
    };
  }, []);

  const isHost = Boolean(room && uid && room.authority.hostUid === uid);
  const serverNow = useCallback(() => Date.now() + offsetRef.current, []);

  const attach = useCallback((code: string) => {
    return subscribeRoom(code, (nextRoom) => {
      setRoom(nextRoom);
      setLastSyncAt(Date.now());
    });
  }, []);

  const refreshUid = useCallback(() => {
    if (!firebaseConfigured) return null;
    const currentUid = getFirebase().auth.currentUser?.uid ?? null;
    setUid(currentUid);
    return currentUid;
  }, []);

  const create = useCallback(async (input: { name: string; mode: GameMode; themeId: ThemeId }) => {
    setBusy(true);
    setError('');
    try {
      const created = await createRoom(input);
      refreshUid();
      setRoom(created);
      setLastSyncAt(Date.now());
      return created.code;
    } catch (cause) {
      const message = cause instanceof Error ? cause.message : 'No se pudo crear la sala.';
      setError(message);
      throw cause;
    } finally {
      setBusy(false);
    }
  }, [refreshUid]);

  const join = useCallback(async (code: string, name: string) => {
    setBusy(true);
    setError('');
    try {
      const joined = await joinRoom(code, name);
      refreshUid();
      setRoom(joined);
      setLastSyncAt(Date.now());
      return joined.code;
    } catch (cause) {
      const message = cause instanceof Error ? cause.message : 'No se pudo unir a la sala.';
      setError(message);
      throw cause;
    } finally {
      setBusy(false);
    }
  }, [refreshUid]);

  const resume = useCallback(async (code: string) => {
    if (!firebaseConfigured || code.length !== 4 || roomRef.current) return false;
    setResuming(true);
    setError('');
    try {
      const resumed = await resumeRoom(code);
      refreshUid();
      if (!resumed) return false;
      setRoom(resumed);
      setLastSyncAt(Date.now());
      return true;
    } catch {
      return false;
    } finally {
      setResuming(false);
    }
  }, [refreshUid]);

  const start = useCallback(async () => {
    if (!room) return;
    setError('');
    try {
      await startRoom(room.code, serverNow());
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'No se pudo iniciar.');
    }
  }, [room, serverNow]);

  const rematch = useCallback(async () => {
    if (!room) return;
    setError('');
    try {
      await restartRoom(room.code, serverNow());
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'No se pudo iniciar la revancha.');
    }
  }, [room, serverNow]);

  const act = useCallback(async (action: GameAction) => {
    const current = roomRef.current;
    if (!current?.game) return;
    try {
      await submitAction(current.code, current, action, serverNow());
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'No se pudo enviar la jugada.');
    }
  }, [serverNow]);

  const leave = useCallback(async () => {
    const current = roomRef.current;
    if (current) {
      try { await leaveRoom(current.code); } catch { /* no-op */ }
    }
    setRoom(null);
    setLastSyncAt(null);
  }, []);

  useEffect(() => {
    if (!room?.code) return;
    return attach(room.code);
  }, [room?.code, attach]);

  // Presence is re-armed after every network reconnect.
  useEffect(() => {
    if (!room?.code || !uid) return;
    return attachRoomPresence(room.code, uid);
  }, [room?.code, uid]);

  useEffect(() => {
    if (!room || !uid) return;
    const hostPlayer = room.players[room.authority.hostUid];
    if (hostPlayer?.connected !== false) return;
    attemptHostMigration(room, serverNow()).catch(() => undefined);
  }, [room, uid, serverNow]);

  return {
    firebaseConfigured,
    firebaseConnected,
    room,
    busy,
    resuming,
    error,
    uid,
    isHost,
    serverOffsetMs,
    lastSyncAt,
    serverNow,
    create,
    join,
    resume,
    start,
    rematch,
    act,
    leave,
    setError
  };
}
