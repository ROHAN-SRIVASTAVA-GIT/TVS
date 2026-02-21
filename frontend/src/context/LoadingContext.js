import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';

const LoadingContext = createContext();

export const LoadingProvider = ({ children }) => {
  const [loadingCount, setLoadingCount] = useState(0);

  useEffect(() => {
    const handleStart = () => {
      setLoadingCount(prev => prev + 1);
    };
    const handleEnd = () => {
      setLoadingCount(prev => Math.max(0, prev - 1));
    };

    window.addEventListener('api-request-start', handleStart);
    window.addEventListener('api-request-end', handleEnd);

    return () => {
      window.removeEventListener('api-request-start', handleStart);
      window.removeEventListener('api-request-end', handleEnd);
    };
  }, []);

  const isLoading = loadingCount > 0;

  return (
    <LoadingContext.Provider value={{ isLoading }}>
      {children}
    </LoadingContext.Provider>
  );
};

export const useLoading = () => {
  const context = useContext(LoadingContext);
  if (!context) {
    throw new Error('useLoading must be used within LoadingProvider');
  }
  return context;
};

export default LoadingContext;
