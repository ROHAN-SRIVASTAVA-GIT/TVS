import React from 'react';
import { useLoading } from '../context/LoadingContext';
import './GlobalLoader.css';

const GlobalLoader = () => {
  const { isLoading } = useLoading();

  if (!isLoading) return null;

  return (
    <div className="global-loader-overlay">
      <div className="global-loader-spinner"></div>
      <p>Processing...</p>
    </div>
  );
};

export default GlobalLoader;
