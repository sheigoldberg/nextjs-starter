'use client';

import { ReactNode, createContext, useContext, useState } from 'react';

import { Loader } from './loader';

interface LoadingContextType {
  isLoading: boolean;
  loadingMessage: string;
  loadingSubmessage: string;
  showLoading: (message?: string, submessage?: string) => void;
  hideLoading: () => void;
}

const LoadingContext = createContext<LoadingContextType | undefined>(undefined);

interface LoadingProviderProps {
  children: ReactNode;
}

export function LoadingProvider({ children }: LoadingProviderProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('Loading...');
  const [loadingSubmessage, setLoadingSubmessage] = useState('We will be with you shortly');

  const showLoading = (message = 'Loading...', submessage = 'We will be with you shortly') => {
    setLoadingMessage(message);
    setLoadingSubmessage(submessage);
    setIsLoading(true);
  };

  const hideLoading = () => {
    setIsLoading(false);
  };

  return (
    <LoadingContext.Provider
      value={{
        isLoading,
        loadingMessage,
        loadingSubmessage,
        showLoading,
        hideLoading,
      }}
    >
      {children}
      {isLoading && (
        <Loader message={loadingMessage} submessage={loadingSubmessage} showAfterMs={0} />
      )}
    </LoadingContext.Provider>
  );
}

export function useLoading() {
  const context = useContext(LoadingContext);
  if (context === undefined) {
    throw new Error('useLoading must be used within a LoadingProvider');
  }
  return context;
}
