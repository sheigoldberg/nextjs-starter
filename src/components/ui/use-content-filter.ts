'use client';

import { useEffect, useState } from 'react';

export function useContentFilter() {
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);

  // Debounce search to avoid too many API calls
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const clearSearch = () => {
    setSearchQuery('');
    setDebouncedSearch('');
  };

  const toggleTag = (tagSlug: string) => {
    setSelectedTags((prev) =>
      prev.includes(tagSlug) ? prev.filter((t) => t !== tagSlug) : [...prev, tagSlug]
    );
  };

  const clearFilters = () => {
    setSelectedTags([]);
    setSearchQuery('');
    setDebouncedSearch('');
  };

  return {
    searchQuery,
    setSearchQuery,
    debouncedSearch,
    selectedTags,
    clearSearch,
    toggleTag,
    clearFilters,
  };
}
