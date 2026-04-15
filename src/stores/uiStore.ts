// Design Ref: §5 — UI state for game HUD interactions

import { create } from "zustand";
import type { TowerId } from "@/types/tower";
import type { Position } from "@/types/common";

interface UIStoreState {
  readonly selectedTowerId: TowerId | null;
  readonly selectedPlacedTowerId: string | null;
  readonly hoveredSlot: Position | null;
  readonly showResult: boolean;

  selectTowerToBuild: (towerId: TowerId | null) => void;
  selectPlacedTower: (towerId: string | null) => void;
  setHoveredSlot: (slot: Position | null) => void;
  setShowResult: (show: boolean) => void;
  clearSelection: () => void;
}

export const useUIStore = create<UIStoreState>((set) => ({
  selectedTowerId: null,
  selectedPlacedTowerId: null,
  hoveredSlot: null,
  showResult: false,

  selectTowerToBuild: (towerId) =>
    set({ selectedTowerId: towerId, selectedPlacedTowerId: null }),
  selectPlacedTower: (towerId) =>
    set({ selectedPlacedTowerId: towerId, selectedTowerId: null }),
  setHoveredSlot: (slot) => set({ hoveredSlot: slot }),
  setShowResult: (show) => set({ showResult: show }),
  clearSelection: () =>
    set({ selectedTowerId: null, selectedPlacedTowerId: null, hoveredSlot: null }),
}));
