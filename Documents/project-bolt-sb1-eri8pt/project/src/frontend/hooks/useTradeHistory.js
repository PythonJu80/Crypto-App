import { useState, useCallback } from 'react';
import { useInfiniteQuery } from '@tanstack/react-query';

export const useTradeHistory = (userId, filters = {}) => {
  const [activeFilters, setActiveFilters] = useState(filters);

  const fetchTrades = async ({ pageParam = 0 }) => {
    const params = new URLSearchParams({
      offset: pageParam,
      limit: 20,
      ...activeFilters
    });

    const response = await fetch(`/api/trades/user/${userId}?${params}`);
    if (!response.ok) throw new Error('Failed to fetch trades');
    
    const data = await response.json();
    return {
      trades: data.data,
      nextPage: data.data.length === 20 ? pageParam + 20 : undefined
    };
  };

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    isError,
    error
  } = useInfiniteQuery({
    queryKey: ['tradeHistory', userId, activeFilters],
    queryFn: fetchTrades,
    getNextPageParam: (lastPage) => lastPage.nextPage,
    staleTime: 30000
  });

  const updateFilters = useCallback((newFilters) => {
    setActiveFilters(prev => ({ ...prev, ...newFilters }));
  }, []);

  const trades = data?.pages.flatMap(page => page.trades) ?? [];

  return {
    trades,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    isError,
    error,
    activeFilters,
    updateFilters
  };
};