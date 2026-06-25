import { createContext, useContext, useState, ReactNode } from 'react';

// Tracks which post is currently playing so only one plays at a time.
type PlaybackValue = {
  activeId: string | null;
  setActiveId: (id: string | null) => void;
};

const PlaybackContext = createContext<PlaybackValue>({
  activeId: null,
  setActiveId: () => {},
});

export function PlaybackProvider({ children }: { children: ReactNode }) {
  const [activeId, setActiveId] = useState<string | null>(null);
  return <PlaybackContext.Provider value={{ activeId, setActiveId }}>{children}</PlaybackContext.Provider>;
}

export function usePlayback() {
  return useContext(PlaybackContext);
}
