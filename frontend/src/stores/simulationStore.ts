import { create } from "zustand";

interface SimulationState {
  running: boolean;
  lastTickAt: string | null;
  setLive: (running: boolean, lastTickAt: string | null) => void;
}

export const useSimulationStore = create<SimulationState>((set) => ({
  running: false,
  lastTickAt: null,
  setLive: (running, lastTickAt) => set({ running, lastTickAt }),
}));
