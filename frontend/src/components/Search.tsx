"use client";

import { useState, useEffect, useRef } from "react";
import { useSearch } from "@/app/contexts/search";
import { SearchItem } from "@/app/contexts/search";
import { config } from "@/config";

export function Search() {
  const { setSearchItems, setIsLoading, isLoading } = useSearch();
  const [query, setQuery] = useState("");
  const [isFocused, setIsFocused] = useState(false);
  const searchTimeout = useRef<NodeJS.Timeout | null>(null);
  const productIndex = "products";

  const handleSearch = async (searchQuery: string) => {
    try {
      setIsLoading(true);
      const response = await fetch(
        `${config.searchUrl}/api/search?query=${encodeURIComponent(
          searchQuery,
        )}&index=${productIndex}`,
      );
      const { hits } = await response.json();
      setSearchItems(hits as SearchItem[]);
    } catch (error) {
      console.error("Search failed:", error);
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
    <div className="mt-8">
      <div className="relative w-full max-w-xl mx-auto">
        <div
          className={`flex items-center px-4 py-2 bg-white rounded-lg border transition-all duration-200 ${
            isFocused
              ? "border-blue-500 shadow-lg ring-2 ring-blue-100"
              : "border-gray-200 shadow-sm"
          }`}
        >
          <svg
            className={`w-5 h-5 transition-colors duration-200 ${
              isFocused ? "text-blue-500" : "text-gray-400"
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
              onClick={() => setQuery("")}
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
        {(query || isLoading) && (
          <div className="absolute w-full mt-2 bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden z-50">
            <SearchResults />
          </div>
        )}
      </div>
    </div>
  );
}

const SearchResults = () => {
  const { searchItems, isLoading } = useSearch();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-4">
        <svg className="w-5 h-5 mr-2 text-gray-400 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2c-.823 0-1.378-.876 0-1.803m-3.227 2.94c-.825 0-2.189-.627-2.823-1.53m-7.13 2.94c-.825 0-2.189-.627-2.823-1.53m-3.227 2.94c-.825 0-2.189-.627-2.823-1.53m15.356-.5c-.226 0-.45-.07-.678-.22m-4.95-.5c-.226 0-.45-.07-.678-.22m-4.95-.5c-.226 0-.45-.07-.678-.22m-4.95-.5c-.226 0-.45-.07-.678-.22" />
        </svg>
        <span>Loading...</span>
      </div>
    );
  }

  if (!searchItems.length) {
    return (
      <div className="flex items-center justify-center p-4">
        <span>No results found.</span>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {searchItems.map((item) => (
        <div
          key={item.id}
          className="flex items-center p-2 bg-white rounded-lg border border-gray-200"
        >
          <img className="w-12 h-12 mr-4" src={item.imageUrl} alt={item.name} />
          <div>
            <h3 className="text-sm font-semibold">{item.name}</h3>
            <p className="text-sm text-gray-600">{item.description}</p>
          </div>
        </div>
      ))}
    </div>
  );
};
