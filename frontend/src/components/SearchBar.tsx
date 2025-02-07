'use client';

import { useState, useEffect, useRef } from 'react';
import { useSearch } from '../app/contexts/search';
import { SearchItem } from '../app/contexts/search';

export function SearchBar() {
  const { setSearchItems, setIsLoading } = useSearch();
  const [query, setQuery] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const searchTimeout = useRef<NodeJS.Timeout | null>(null);
  const baseAPIUrl = 'http://localhost:4100';
  const productIndex = 'products';

  const handleSearch = async (searchQuery: string) => {
    try {
      setIsLoading(true);
      const response = await fetch(`${baseAPIUrl}/api/search?query=${encodeURIComponent(searchQuery)}&index=${productIndex}`);

      const { hits } = await response.json();

      console.log('Search results:', hits);
      setSearchItems(hits as SearchItem[]);
    } catch (error) {
      console.error('Search failed:', error);
      setSearchItems([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (query.trim()) {
      // Debounce search requests
      if (searchTimeout.current) {
        clearTimeout(searchTimeout.current);
      }
      searchTimeout.current = setTimeout(() => {
        handleSearch(query);
      }, 300);
    } else {
      setSearchItems([]);
    }

    return () => {
      if (searchTimeout.current) {
        clearTimeout(searchTimeout.current);
      }
    };
  }, [query]);

  return (
    <div className="relative w-full max-w-xl mx-auto">
      <div
        className={`flex items-center px-4 py-2 bg-white rounded-lg border transition-all duration-200 ${
          isFocused
            ? 'border-blue-500 shadow-lg ring-2 ring-blue-100'
            : 'border-gray-200 shadow-sm'
        }`}
      >
        <svg
          className={`w-5 h-5 transition-colors duration-200 ${
            isFocused ? 'text-blue-500' : 'text-gray-400'
          }`}
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          placeholder="Search for coffee..."
          className="w-full px-3 py-1 text-gray-700 bg-transparent outline-none placeholder-gray-400"
          aria-label="Search"
        />
        {query && (
          <button
            onClick={() => setQuery('')}
            className="p-1 text-gray-400 hover:text-gray-600 focus:outline-none"
            aria-label="Clear search"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>
    </div>
  );
}
