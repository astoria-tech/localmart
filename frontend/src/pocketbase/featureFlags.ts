import pb from './index';

export interface FeatureFlag {
  [key: string]: boolean;
}

export const defaultFeatureFlags: FeatureFlag = {
  "product_search": false,
};

// Function to load feature flags from the database
export const loadFeatureFlags = async (): Promise<FeatureFlag> => {
  try {
    const flags = { ...defaultFeatureFlags };

    // Fetch feature flags from the database
    const results = await pb.collection('feature_flags').getFullList();

    // Convert the database flags into our FeatureFlags format
    results.forEach((flag) => {
      flags[flag.name] = flag.enabled;
    });

    console.log('Loaded feature flags:', flags);
    return flags;
  } catch (error) {
    console.error('Failed to load feature flags:', error);
    return defaultFeatureFlags;
  }
};
