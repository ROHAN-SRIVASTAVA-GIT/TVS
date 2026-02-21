import React from 'react';

const LoadingButton = ({ 
  children, 
  loading = false, 
  disabled = false,
  type = 'submit',
  className = '',
  onClick,
  ...props 
}) => {
  return (
    <button
      type={type}
      className={`loading-btn ${className} ${loading ? 'loading' : ''}`}
      disabled={loading || disabled}
      onClick={onClick}
      {...props}
    >
      {loading ? (
        <>
          <span className="btn-spinner"></span>
          <span className="btn-text">Loading...</span>
        </>
      ) : (
        children
      )}
    </button>
  );
};

export default LoadingButton;
