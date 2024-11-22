import React from 'react';
import PropTypes from 'prop-types';

const ErrorAlert = ({ message, onRetry }) => (
  <div className="rounded-lg bg-pepe-dark/90 p-6 border-2 border-pepe-error animate-usb-pulse" role="alert">
    <div className="flex">
      <div className="flex-shrink-0">
        <svg
          className="h-6 w-6 text-pepe-error"
          viewBox="0 0 20 20"
          fill="currentColor"
          aria-hidden="true"
        >
          <path
            fillRule="evenodd"
            d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
            clipRule="evenodd"
          />
        </svg>
      </div>
      <div className="ml-4">
        <h3 className="text-lg font-['Press_Start_2P'] text-pepe-error">
          Error
        </h3>
        <p className="mt-2 text-pepe-light">{message}</p>
        {onRetry && (
          <button
            onClick={onRetry}
            className="mt-4 pepe-button"
            aria-label="Try again"
          >
            Try again
          </button>
        )}
      </div>
    </div>
  </div>
);

ErrorAlert.propTypes = {
  message: PropTypes.string.isRequired,
  onRetry: PropTypes.func
};

ErrorAlert.defaultProps = {
  onRetry: null
};

export default ErrorAlert;