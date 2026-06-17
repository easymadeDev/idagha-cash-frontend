import { createContext, useContext } from 'react';

export type SessionMember = {
  _id: string;
  name: string;
  nickname?: string;
  photo?: string;
  position?: string;
};

export const GateContext = createContext<{
  cleared: boolean;
  setCleared: (v: boolean) => void;
  member: SessionMember | null;
  setMember: (m: SessionMember | null) => void;
}>({ cleared: false, setCleared: () => {}, member: null, setMember: () => {} });

export const useGate = () => useContext(GateContext);
