import { create } from 'zustand';
import { persist } from 'zustand/middleware';

type UserState = {
  username: string | null;
visitorId: string | null;
  setUsername: (username: string) => void;
  setUser: (username: string, visitorId: string) => void;
  clearUser: () => void;
};

const isClient = typeof window !== 'undefined';

const createStore = isClient
  ? create(
      persist<UserState>(
        (set) => ({
          username: null,
          visitorId: null,
          setUsername: (username) => set({ username }),
          setUser: (username, visitorId) => set({ username, visitorId }),
          clearUser: () => set({ username: null, visitorId: null }),
        }),
        {
          name: 'gais-qa-user',
        }
      )
    )
  : create<UserState>((set) => ({
      username: null,
      visitorId: null,
      setUsername: (username) => set({ username }),
      setUser: (username, visitorId) => set({ username, visitorId }),
      clearUser: () => set({ username: null, visitorId: null }),
    }));

export const useUserStore = createStore;
