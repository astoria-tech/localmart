"use client"

import React, { createContext, useContext, ReactNode, useEffect, useState } from 'react';
import { FeatureFlag, loadFeatureFlags, defaultFeatureFlags } from '@/pocketbase/featureFlags';

const FeatureFlagsContext = createContext<FeatureFlag | undefined>(undefined);

interface FeatureFlagsProviderProps {
  children: ReactNode;
  initialFlags?: FeatureFlag;
}

export const FeatureFlagsProvider: React.FC<FeatureFlagsProviderProps> = ({
  children,
  initialFlags,
}) => {
  const [flags, setFlags] = useState<FeatureFlag>(initialFlags || defaultFeatureFlags);

  useEffect(() => {
    if (!initialFlags) {
      const loadFlags = async () => {
        try {
          const loadedFlags = await loadFeatureFlags();
          setFlags(loadedFlags);
        } catch (error) {
          console.error('Failed to load feature flags:', error);
        }
      };

      loadFlags();
    }
  }, [initialFlags]);

  return (
    <FeatureFlagsContext.Provider value={flags}>
      {children}
    </FeatureFlagsContext.Provider>
  );
};

// Utility hook to check a specific feature flag
export const useFeatureFlag = (flagName: keyof FeatureFlag): boolean => {
  const context = useContext(FeatureFlagsContext);
  if (context === undefined) {
    throw new Error('useFeatureFlags must be used within a FeatureFlagsProvider');
  }
  return context[flagName];
};
