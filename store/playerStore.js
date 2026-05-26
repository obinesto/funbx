import { create } from "zustand";

const playerStore = create((set) => ({
  activePlayerId: null,
  setActivePlayer: (videoId) => set({ activePlayerId: videoId }),
  clearActivePlayer: (videoIdToClear) =>
    set((state) => ({
      activePlayerId:
        state.activePlayerId === videoIdToClear ? null : state.activePlayerId,
    })),
}));

export default playerStore;