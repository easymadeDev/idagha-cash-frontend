import { createContext, useContext } from 'react';

export type SessionMember = {
  _id: string;
  name: string;
  nickname?: string;
  photo?: string;
  position?: string;
  whatsappSubscribed?: boolean;
};

export const GateContext = createContext<{
  cleared: boolean;
  setCleared: (v: boolean) => void;
  member: SessionMember | null;
  setMember: (m: SessionMember | null) => void;
  ready: boolean;
  // PIN / verify popup — opened from the public landing page or after a gated redirect
  gateOpen: boolean;
  setGateOpen: (v: boolean) => void;
}>({
  cleared: false, setCleared: () => {}, member: null, setMember: () => {}, ready: false,
  gateOpen: false, setGateOpen: () => {},
});

export const useGate = () => useContext(GateContext);
