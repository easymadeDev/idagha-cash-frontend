import { createContext, useContext } from 'react';

export const GateContext = createContext<{
  cleared: boolean;
  setCleared: (v: boolean) => void;
}>({ cleared: false, setCleared: () => {} });

export const useGate = () => useContext(GateContext);
