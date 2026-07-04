import { createContext, useCallback, useContext, useRef, useState, ReactNode } from 'react';
import { connectToRoom, disconnectRoom, Room as LKRoom } from './livekit';
import { getRoom, joinRoom, leaveRoom, setMuted as setMutedDb } from './rooms';

// Holds the ONE active voice room so it survives navigating away (minimize).
type Active = { roomId: string; title: string };
type Value = {
  active: Active | null;
  muted: boolean;
  enter: (roomId: string) => Promise<void>;
  exit: () => Promise<void>;
  toggleMute: () => Promise<void>;
};

const RoomSessionContext = createContext<Value>({
  active: null,
  muted: false,
  enter: async () => {},
  exit: async () => {},
  toggleMute: async () => {},
});

export function RoomSessionProvider({ children }: { children: ReactNode }) {
  const [active, setActive] = useState<Active | null>(null);
  const [muted, setMutedState] = useState(false);
  const lkRoom = useRef<LKRoom | null>(null);
  const busy = useRef(false);

  const enter = useCallback(
    async (roomId: string) => {
      if (active?.roomId === roomId || busy.current) return;
      busy.current = true;
      try {
        const info = await getRoom(roomId);
        await joinRoom(roomId);
        try {
          lkRoom.current = await connectToRoom(roomId, true);
          setMutedState(false);
        } catch {
          lkRoom.current = null;
        }
        setActive({ roomId, title: info?.title ?? 'Live room' });
      } finally {
        busy.current = false;
      }
    },
    [active],
  );

  const exit = useCallback(async () => {
    const cur = active;
    await disconnectRoom(lkRoom.current);
    lkRoom.current = null;
    if (cur) await leaveRoom(cur.roomId).catch(() => {});
    setActive(null);
  }, [active]);

  const toggleMute = useCallback(async () => {
    const next = !muted;
    setMutedState(next);
    try {
      await lkRoom.current?.localParticipant?.setMicrophoneEnabled(!next);
    } catch {
      /* ignore */
    }
    if (active) await setMutedDb(active.roomId, next).catch(() => {});
  }, [muted, active]);

  return (
    <RoomSessionContext.Provider value={{ active, muted, enter, exit, toggleMute }}>
      {children}
    </RoomSessionContext.Provider>
  );
}

export const useRoomSession = () => useContext(RoomSessionContext);
