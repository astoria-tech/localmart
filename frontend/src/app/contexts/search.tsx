'use client';

import { createContext, useContext, ReactNode, useState } from 'react';

interface SearchItemAttributes {
  bean_type: string;
  origin: string;
  packaging_type: string;
  processing_method: string;
  roast_level: string;
  variety: string;
}

export interface SearchItem {
  id: number;
  name: string;
  description: string;
  price: number;
  quantity: number;
  rating: number;
  imageUrl: string;
  attributes: SearchItemAttributes;
  tags: string[];
}

interface SearchContextType {
  searchItems: SearchItem[];
  setSearchItems: (items: SearchItem[]) => void;
  selectedItem: SearchItem | null;
  setSelectedItem: (item: SearchItem | null) => void;
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
}

const SearchContext = createContext<SearchContextType | undefined>(undefined);

export function SearchProvider({ children }: { children: ReactNode }) {
  const [searchItems, setSearchItems] = useState<SearchItem[]>([]);
  const [selectedItem, setSelectedItem] = useState<SearchItem | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  return (
    <SearchContext.Provider
      value={{
        searchItems,
        setSearchItems,
        selectedItem,
        setSelectedItem,
        isLoading,
        setIsLoading,
      }}
    >
      {children}
    </SearchContext.Provider>
  );
}

export function useSearch() {
  const context = useContext(SearchContext);
  if (context === undefined) {
    throw new Error('useSearch must be used within a SearchProvider');
  }
  return context;
}
