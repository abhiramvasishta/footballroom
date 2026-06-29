import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface UserState {
  entryId: string | null;
  name: string | null;
  avatar: string | null;
  recoveryCode: string | null;
  isRegistered: boolean;
  hasSubmitted: boolean;
  setRegistration: (name: string, avatar: string | null, entryId: string, recoveryCode: string) => void;
  setEntryId: (id: string) => void;
  setHasSubmitted: (status: boolean) => void;
  resetDevice: () => void;
}

export const useUserStore = create<UserState>()(
  persist(
    (set) => ({
      entryId: null,
      name: null,
      avatar: null,
      recoveryCode: null,
      isRegistered: false,
      hasSubmitted: false,
      setRegistration: (name, avatar, entryId, recoveryCode) => {
        set({ name, avatar, entryId, recoveryCode, isRegistered: true, hasSubmitted: false });
      },
      setEntryId: (entryId) => set({ entryId, isRegistered: true }),
      setHasSubmitted: (status) => set({ hasSubmitted: status }),
      resetDevice: () => set({ entryId: null, name: null, avatar: null, recoveryCode: null, isRegistered: false, hasSubmitted: false }),
    }),
    {
      name: 'fifa-prediction-entry',
      partialize: (state) => ({ entryId: state.entryId }), // Only persist entryId in localStorage
    }
  )
);
