import { create } from "zustand";
import {
  getPartyCurrent,
  getPartyInvitesMine,
  type PartyDto,
  type PartyInviteMine,
} from "../utils/api";

type PartyState = {
  party: PartyDto | null;
  invites: PartyInviteMine[];
  loading: boolean;
  refreshParty: () => Promise<void>;
  refreshInvites: () => Promise<void>;
  bootstrap: () => Promise<void>;
  clear: () => void;
};

export type { PartyDto, PartyInviteMine };

export const usePartyStore = create<PartyState>((set, get) => ({
  party: null,
  invites: [],
  loading: false,

  refreshParty: async () => {
    try {
      const r = await getPartyCurrent();
      if (r.ok) set({ party: r.party });
    } catch {
      /* offline / 401 */
    }
  },

  refreshInvites: async () => {
    try {
      const r = await getPartyInvitesMine();
      if (r.ok) set({ invites: r.invites });
    } catch {
      /* */
    }
  },

  bootstrap: async () => {
    set({ loading: true });
    try {
      await Promise.all([get().refreshParty(), get().refreshInvites()]);
    } finally {
      set({ loading: false });
    }
  },

  clear: () => set({ party: null, invites: [], loading: false }),
}));
