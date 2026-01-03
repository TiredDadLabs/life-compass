import React, { createContext, useContext, useState, ReactNode } from 'react';

// Simplified context - only provides onboarding state
// All data operations are handled by useHorizonData hook

interface HorizonContextType {
  isOnboarding: boolean;
  setIsOnboarding: (value: boolean) => void;
}

const HorizonContext = createContext<HorizonContextType | undefined>(undefined);

export function HorizonProvider({ children }: { children: ReactNode }) {
  const [isOnboarding, setIsOnboarding] = useState(false);

  return (
    <HorizonContext.Provider
      value={{
        isOnboarding,
        setIsOnboarding,
      }}
    >
      {children}
    </HorizonContext.Provider>
  );
}

export function useHorizon() {
  const context = useContext(HorizonContext);
  if (context === undefined) {
    throw new Error('useHorizon must be used within a HorizonProvider');
  }
  return context;
}
